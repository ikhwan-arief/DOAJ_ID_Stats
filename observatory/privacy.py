"""Public-field construction and privacy validation.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections.abc import Mapping
import re
from urllib.parse import parse_qsl, urlsplit

from .contracts import PUBLIC_FIELD_ALLOWLISTS


FORBIDDEN_SOURCE_FIELDS = frozenset({"Owner", "Account Name", "Account Email"})
EMAIL_PATTERN = re.compile(r"(?i)(?<![\w.+-])[\w.+-]+@[\w.-]+\.[a-z]{2,}(?![\w.-])")
SENSITIVE_QUERY_KEYS = frozenset(
    {"access_token", "api_key", "apikey", "auth", "key", "password", "secret", "token"}
)
INTERNAL_DOAJ_SEGMENTS = ("admin", "application")


class PrivacyError(ValueError):
    """Raised when a value is not eligible for public output."""


def _safe_http_url(value: object) -> str | None:
    if value is None or str(value).strip() == "":
        return None
    candidate = str(value).strip()
    parsed = urlsplit(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise PrivacyError("URL must use HTTP(S) and have a public hostname")
    if parsed.username or parsed.password:
        raise PrivacyError("URL credentials are forbidden")
    if parsed.hostname.lower() in {"localhost", "127.0.0.1", "::1"}:
        raise PrivacyError("local URLs are forbidden")
    query_keys = {key.lower() for key, _ in parse_qsl(parsed.query, keep_blank_values=True)}
    if query_keys & SENSITIVE_QUERY_KEYS:
        raise PrivacyError("credential-like URL query parameter is forbidden")
    return candidate


def safe_public_url(value: object) -> str | None:
    return _safe_http_url(value)


def safe_doaj_profile_url(value: object) -> str | None:
    candidate = _safe_http_url(value)
    if candidate is None:
        return None
    parsed = urlsplit(candidate)
    path_segments = tuple(segment.lower() for segment in parsed.path.split("/") if segment)
    if path_segments[:2] == INTERNAL_DOAJ_SEGMENTS:
        raise PrivacyError("internal DOAJ application route is forbidden")
    if parsed.scheme != "https" or parsed.hostname.lower() != "doaj.org":
        raise PrivacyError("DOAJ profile must use https://doaj.org")
    if not path_segments or path_segments[0] != "toc":
        raise PrivacyError("DOAJ profile must use the public journal-profile route")
    return candidate


def validate_public_record(dataset: str, record: Mapping[str, object]) -> None:
    allowed = PUBLIC_FIELD_ALLOWLISTS[dataset]
    unexpected = set(record) - allowed
    if unexpected:
        raise PrivacyError(f"fields are not public-allowlisted: {sorted(unexpected)!r}")
    for key, value in record.items():
        if EMAIL_PATTERN.search(str(value)):
            raise PrivacyError(f"email-shaped content in public field {key!r}")
        if key.endswith("_url") and value not in {None, ""}:
            if key == "doaj_profile_url":
                safe_doaj_profile_url(value)
            else:
                safe_public_url(value)
