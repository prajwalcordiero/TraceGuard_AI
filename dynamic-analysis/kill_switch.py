"""
Runs alongside the emulator during dynamic analysis, tailing logcat
in real time. If it sees a signature of genuinely dangerous behavior
(not just "suspicious," but actively harmful — e.g. attempting to
send SMS, wipe data, or escalate privileges), it immediately kills
the emulator rather than waiting for the fixed capture window to end.

This is the difference between "record everything and review later"
and "cut it off the moment it turns dangerous."
"""

import subprocess
import threading
import time

ADB = r"C:\Android\platform-tools\adb.exe"

# Patterns that indicate active harmful behavior, not just presence.
# Kept narrow and specific on purpose — broad matches (e.g. just
# "permission") would trigger false-positive kills constantly.
DANGER_PATTERNS = [
    "SmsManager: sendTextMessage",       # attempting to send SMS
    "WipeData",                          # attempting factory reset / data wipe
    "DevicePolicyManager: wipeData",
    "su: not found",                     # attempted root escalation
    "Runtime: exec",                     # spawning shell commands
    "PackageInstaller: install",         # installing a second payload
]


class KillSwitchMonitor:
    def __init__(self, on_trigger):
        self.on_trigger = on_trigger
        self.triggered = False
        self._stop = False

    def start(self):
        subprocess.run([ADB, "logcat", "-c"], capture_output=True)  # clear old logs
        self._thread = threading.Thread(target=self._watch, daemon=True)
        self._thread.start()

    def _watch(self):
        proc = subprocess.Popen(
            [ADB, "logcat"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )

        for line in proc.stdout:
            if self._stop:
                break
            for pattern in DANGER_PATTERNS:
                if pattern in line:
                    self.triggered = True
                    self.on_trigger(pattern, line.strip())
                    proc.terminate()
                    return

    def stop(self):
        self._stop = True


# Example usage inside your existing pipeline:
if __name__ == "__main__":
    def handle_trigger(pattern, line):
        print(f"\n🚨 DANGEROUS BEHAVIOR DETECTED: {pattern}")
        print(f"   Log line: {line}")
        print("   Killing emulator NOW...")
        subprocess.run([ADB, "emu", "kill"], capture_output=True)

    monitor = KillSwitchMonitor(on_trigger=handle_trigger)
    monitor.start()

    print("Monitoring logcat for dangerous behavior... (Ctrl+C to stop)")
    try:
        while not monitor.triggered:
            time.sleep(1)
    except KeyboardInterrupt:
        monitor.stop()