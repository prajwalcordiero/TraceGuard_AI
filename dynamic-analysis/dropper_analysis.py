"""
Dropper analysis pipeline:
  1. Scan the outer APK for a nested payload APK.
  2. If found, alert clearly (this is a strong dropper indicator on
     its own, even before execution).
  3. Extract the nested payload to a real .apk file.
  4. Install and launch THAT payload in the emulator — this is the
     actual malicious code the dropper was hiding, not the harmless
     wrapper — while the kill switch watches for dangerous behavior
     and cuts it off immediately if triggered.

Run from the dynamic-analysis/ folder:
    python dropper_analysis.py path\\to\\outer_sample.apk
"""

import sys
import os
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from nested_apk_detector import find_nested_apks, extract_nested_apk

from emulator_controller import (
    start_emulator, install_apk, launch_app,
    simulate_interaction, stop_emulator, get_package_name,
)
from kill_switch import KillSwitchMonitor

AVD_NAME = "dynamic-analysis-clean"
CAPTURE_SECONDS = 45
EXTRACTED_PAYLOAD_PATH = "extracted_payload.apk"
PCAP_PATH = "dropper_capture.pcap"


def run_dropper_analysis(outer_apk_path):
    print("=== STEP 1: SCANNING FOR NESTED PAYLOAD ===")
    nested = find_nested_apks(outer_apk_path)

    if not nested:
        print("✅ No nested APK found. This does not appear to be a dropper.")
        return {"is_dropper": False, "nested_apks": []}

    print(f"\n🚨 ALERT: Found {len(nested)} nested APK(s) inside this sample.")
    for n in nested:
        flag = " [DISGUISED EXTENSION — strong dropper indicator]" if n["disguised"] else ""
        print(f"   - {n['path_inside_outer_apk']} ({n['size_bytes']} bytes){flag}")

    # Take the first nested APK found as the payload to detonate
    target = nested[0]
    print(f"\n=== STEP 2: EXTRACTING PAYLOAD ({target['path_inside_outer_apk']}) ===")
    extract_nested_apk(outer_apk_path, target["path_inside_outer_apk"], EXTRACTED_PAYLOAD_PATH)
    print(f"[*] Extracted to {EXTRACTED_PAYLOAD_PATH}")

    print("\n=== STEP 3: DETONATING PAYLOAD UNDER MONITORING ===")
    package_name = get_package_name(EXTRACTED_PAYLOAD_PATH)
    emu_proc = start_emulator(AVD_NAME, PCAP_PATH)

    kill_switch_result = {"triggered": False, "reason": None}

    def on_danger(pattern, line):
        kill_switch_result["triggered"] = True
        kill_switch_result["reason"] = f"{pattern} — {line}"
        print(f"\n🚨 KILL SWITCH TRIGGERED: {pattern}")
        print(f"   {line}")
        print("   Stopping emulator immediately.")

    try:
        install_apk(EXTRACTED_PAYLOAD_PATH)
        launch_app(package_name)
        simulate_interaction(taps=5, delay=2)

        monitor = KillSwitchMonitor(on_trigger=on_danger)
        monitor.start()

        print(f"[*] Payload running, watching for danger (up to {CAPTURE_SECONDS}s)...")
        waited = 0
        while waited < CAPTURE_SECONDS and not kill_switch_result["triggered"]:
            time.sleep(1)
            waited += 1

        monitor.stop()

        if kill_switch_result["triggered"]:
            print(f"\n⛔ Payload execution stopped early due to: {kill_switch_result['reason']}")
        else:
            print(f"\n[*] Full {CAPTURE_SECONDS}s window completed with no kill-switch trigger.")

    finally:
        stop_emulator(emu_proc)
        time.sleep(3)

    return {
        "is_dropper": True,
        "nested_apks": nested,
        "payload_package": package_name,
        "kill_switch": kill_switch_result,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python dropper_analysis.py <path_to_outer_apk>")
        sys.exit(1)

    result = run_dropper_analysis(sys.argv[1])
    print("\n=== FINAL RESULT ===")
    import json
    print(json.dumps(result, indent=2, default=str))