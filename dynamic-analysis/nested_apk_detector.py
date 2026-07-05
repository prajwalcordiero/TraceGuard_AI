"""
Detects nested APKs — a common malware dropper pattern where a
first-stage app carries a second payload APK inside its own assets
or resources, often with a disguised file extension to evade naive
extension-based scanning.

Detection strategy: don't trust file extensions. Check the actual
file signature (magic bytes) for the ZIP format APKs use, then
confirm it's specifically an APK (not just any zip) by checking for
AndroidManifest.xml inside.
"""

import zipfile
import io

ZIP_MAGIC = b"PK\x03\x04"


def is_apk_bytes(data):
    """Checks if raw bytes are a valid APK: a zip file containing
    AndroidManifest.xml at the root."""
    if not data.startswith(ZIP_MAGIC):
        return False
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            return "AndroidManifest.xml" in z.namelist()
    except zipfile.BadZipFile:
        return False


def find_nested_apks(apk_path):
    """Scans every file inside the given APK (regardless of its
    extension) and flags any that are themselves valid APKs."""
    findings = []

    with zipfile.ZipFile(apk_path) as outer:
        for name in outer.namelist():
            # Skip the obvious case (nothing to detect there) but
            # still verify it, since attackers could also name it
            # something else deliberately
            try:
                data = outer.read(name)
            except (KeyError, RuntimeError):
                continue

            if len(data) < 4:
                continue

            if is_apk_bytes(data):
                findings.append({
                    "path_inside_outer_apk": name,
                    "extension": name.split(".")[-1] if "." in name else "(none)",
                    "size_bytes": len(data),
                    "disguised": not name.lower().endswith(".apk"),
                })

    return findings


def extract_nested_apk(outer_apk_path, inner_path, output_path):
    """Pulls the nested APK's bytes out and writes them to disk as a
    real .apk file, regardless of its original disguised extension,
    so it can be installed and executed like any other APK."""
    with zipfile.ZipFile(outer_apk_path) as outer:
        data = outer.read(inner_path)
    with open(output_path, "wb") as f:
        f.write(data)
    return output_path
    import sys
    if len(sys.argv) != 2:
        print("Usage: python nested_apk_detector.py <path_to_apk>")
        sys.exit(1)

    results = find_nested_apks(sys.argv[1])
    if not results:
        print("No nested APKs found.")
    else:
        print(f"⚠ Found {len(results)} nested APK(s):")
        for r in results:
            flag = " [DISGUISED EXTENSION]" if r["disguised"] else ""
            print(f"  - {r['path_inside_outer_apk']} ({r['size_bytes']} bytes){flag}")