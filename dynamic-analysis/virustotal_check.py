"""
Checks the APK's SHA256 hash against VirusTotal's database of
already-analyzed files. This is real signature-based detection —
if 40 other antivirus engines already flagged this exact file as
malware, that's a far stronger claim than any heuristic.

Requires a free VirusTotal API key: https://www.virustotal.com/gui/join-us
Free tier: 4 requests/minute, 500/day — plenty for a hackathon demo.

Set your key as an environment variable rather than hardcoding it:
    setx VT_API_KEY "your_key_here"     (Windows, permanent)
    $env:VT_API_KEY = "your_key_here"   (Windows, current session)
"""

import hashlib
import os
import requests

VT_API_KEY = os.environ.get("599ac442cf5cd00a7e6732d5e3b28371926cf8e7e5d12ab8fc130105b0c38300")
VT_URL = "https://www.virustotal.com/api/v3/files/{}"


def sha256_of_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def check_virustotal(apk_path):
    if not VT_API_KEY:
        return {"error": "VT_API_KEY environment variable not set"}

    file_hash = sha256_of_file(apk_path)
    headers = {"x-apikey": VT_API_KEY}

    resp = requests.get(VT_URL.format(file_hash), headers=headers)

    if resp.status_code == 404:
        return {
            "sha256": file_hash,
            "known_to_virustotal": False,
            "note": "File not previously seen by VirusTotal — not a clean bill of health, just unanalyzed.",
        }

    if resp.status_code != 200:
        return {"error": f"VirusTotal API error: {resp.status_code}", "sha256": file_hash}

    data = resp.json()
    stats = data["data"]["attributes"]["last_analysis_stats"]

    return {
        "sha256": file_hash,
        "known_to_virustotal": True,
        "malicious_detections": stats.get("malicious", 0),
        "suspicious_detections": stats.get("suspicious", 0),
        "total_engines": sum(stats.values()),
        "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values())}",
    }


if __name__ == "__main__":
    import sys, json
    if len(sys.argv) != 2:
        print("Usage: python virustotal_check.py <path_to_apk>")
        sys.exit(1)

    print(json.dumps(check_virustotal(sys.argv[1]), indent=2))