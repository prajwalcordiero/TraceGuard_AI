"""
Builds a test dropper APK by taking an "outer" APK and embedding an
"inner" APK inside its assets/ folder, disguised with a non-.apk
extension (as real droppers do to evade naive extension-based scans).

This lets you verify your nested_apk_detector.py + dropper_analysis.py
pipeline actually works end-to-end, using two harmless real APKs you
already have, before ever relying on it against a real sample.

Usage:
    python build_test_dropper.py <outer.apk> <inner.apk> <output.apk>

Example:
    python build_test_dropper.py "BMI Calculator.apk" "icici.apk" test_dropper.apk
"""

import sys
import zipfile
import shutil


def build_test_dropper(outer_path, inner_path, output_path):
    # Start from a copy of the outer APK so we don't modify the original
    shutil.copy(outer_path, output_path)

    with open(inner_path, "rb") as f:
        inner_bytes = f.read()

    # Append the inner APK into assets/, disguised as .dat — this is
    # exactly the pattern real droppers use to slip past extension
    # based scanning while still being a perfectly valid embedded zip.
    disguised_name = "assets/update_config.dat"

    with zipfile.ZipFile(output_path, "a", zipfile.ZIP_DEFLATED) as z:
        z.writestr(disguised_name, inner_bytes)

    print(f"[*] Built test dropper: {output_path}")
    print(f"    Outer APK: {outer_path}")
    print(f"    Inner APK embedded at: {disguised_name} ({len(inner_bytes)} bytes)")
    print(f"\nNow test detection with:")
    print(f'    python nested_apk_detector.py "{output_path}"')
    print(f"\nOr run the full dropper pipeline with:")
    print(f'    python dropper_analysis.py "{output_path}"')


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python build_test_dropper.py <outer.apk> <inner.apk> <output.apk>")
        sys.exit(1)

    build_test_dropper(sys.argv[1], sys.argv[2], sys.argv[3])