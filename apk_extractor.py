from androguard.misc import AnalyzeAPK
import re

IOC_PATTERNS = {
    "ip": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "url": r"https?://[^\s\"'<>]+",
    "domain": r"\b[a-zA-Z0-9-]+\.(?:com|net|org|io|xyz|ru|cn)\b",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
}

DANGEROUS_PERMISSIONS = {
    "android.permission.READ_SMS", "android.permission.SEND_SMS",
    "android.permission.RECORD_AUDIO", "android.permission.CAMERA",
    "android.permission.READ_CONTACTS", "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.READ_CALL_LOG", "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_INSTALL_PACKAGES",
}

def analyze_apk(apk_path):
    a, d, dx = AnalyzeAPK(apk_path)

    permissions = a.get_permissions()
    flagged_permissions = [p for p in permissions if p in DANGEROUS_PERMISSIONS]

    all_strings = set()
    for dex in d:
        all_strings.update(dex.get_strings())

    iocs = {key: set() for key in IOC_PATTERNS}
    for s in all_strings:
        for key, pattern in IOC_PATTERNS.items():
            for match in re.findall(pattern, s):
                iocs[key].add(match)

    return {
        "package_name": a.get_package(),
        "version": a.get_androidversion_name(),
        "signature": a.get_signature_names(),
        "permissions_all": permissions,
        "permissions_flagged": flagged_permissions,
        "iocs": {k: sorted(v) for k, v in iocs.items()},
    }
