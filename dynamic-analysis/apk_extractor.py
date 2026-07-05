from androguard.misc import AnalyzeAPK
import re
import phonenumbers
from phonenumbers import geocoder, carrier
from cryptography import x509
from cryptography.hazmat.backends import default_backend
import hashlib

IOC_PATTERNS = {
    "ip": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "url": r"https?://[^\s\"'<>]+",
    "domain": r"\b[a-zA-Z0-9-]+\.(?:com|net|org|io|xyz|ru|cn)\b",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "phone": r"\+?\d{10,13}",
}

DANGEROUS_PERMISSIONS = {
    "android.permission.READ_SMS", "android.permission.SEND_SMS",
    "android.permission.RECORD_AUDIO", "android.permission.CAMERA",
    "android.permission.READ_CONTACTS", "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.READ_CALL_LOG", "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_INSTALL_PACKAGES",
}


def enrich_phone_numbers(raw_numbers, default_region="IN"):
    enriched = []
    for raw in raw_numbers:
        try:
            num = phonenumbers.parse(raw, default_region)
            if not phonenumbers.is_valid_number(num):
                continue
            enriched.append({
                "number": raw,
                "valid": True,
                "region": geocoder.description_for_number(num, "en") or "Unknown",
                "carrier": carrier.name_for_number(num, "en") or "Unknown",
                "country_code": phonenumbers.region_code_for_number(num),
            })
        except phonenumbers.NumberParseException:
            enriched.append({"number": raw, "valid": False})
    return enriched


def extract_certificate_details(apk_obj):
    """Parses the APK's signing certificate(s) for investigator-relevant
    identity fields: who signed it, when, and a fingerprint that can be
    checked against known-malware or known-legitimate signer databases."""
    details = []
    try:
        certs = apk_obj.get_certificates_der_v3() or apk_obj.get_certificates_der_v2() or apk_obj.get_certificates_der_v1()
    except Exception:
        certs = None

    if not certs:
        return details

    for der_bytes in certs:
        try:
            cert = x509.load_der_x509_certificate(der_bytes, default_backend())
            sha256_fp = hashlib.sha256(der_bytes).hexdigest()
            details.append({
                "subject": cert.subject.rfc4514_string(),
                "issuer": cert.issuer.rfc4514_string(),
                "serial_number": str(cert.serial_number),
                "valid_from": cert.not_valid_before_utc.isoformat(),
                "valid_until": cert.not_valid_after_utc.isoformat(),
                "signature_algorithm": cert.signature_algorithm_oid._name,
                "sha256_fingerprint": sha256_fp,
                "is_self_signed": cert.subject == cert.issuer,
            })
        except Exception as e:
            details.append({"error": f"Could not parse certificate: {e}"})

    return details


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

    phone_details = enrich_phone_numbers(iocs["phone"])
    certificate_details = extract_certificate_details(a)

    return {
        "package_name": a.get_package(),
        "version": a.get_androidversion_name(),
        "signature": a.get_signature_names(),
        "certificate_details": certificate_details,
        "permissions_all": permissions,
        "permissions_flagged": flagged_permissions,
        "iocs": {k: sorted(v) for k, v in iocs.items() if k != "phone"},
        "phone_number_details": phone_details,
    }