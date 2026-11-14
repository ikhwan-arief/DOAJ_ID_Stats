"""Synthetic public allowlist and URL privacy tests.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import unittest

from observatory.privacy import (
    PrivacyError,
    safe_doaj_profile_url,
    safe_public_url,
    validate_public_record,
)


class PrivacyTests(unittest.TestCase):
    def test_public_doaj_journal_profile_is_allowed(self) -> None:
        url = "https://doaj.org/toc/1234-567X"
        self.assertEqual(safe_doaj_profile_url(url), url)

    def test_internal_application_route_is_categorically_rejected(self) -> None:
        for mixed_case in (False, True):
            route = "/".join(("admin", "application", "fictional-id"))
            if mixed_case:
                route = route.upper()
            with self.subTest(mixed_case=mixed_case), self.assertRaisesRegex(PrivacyError, "internal"):
                safe_doaj_profile_url("https://doaj.org/" + route)

    def test_doaj_profile_rejects_other_hosts_and_routes(self) -> None:
        with self.assertRaises(PrivacyError):
            safe_doaj_profile_url("https://example.test/toc/1234-567X")
        with self.assertRaises(PrivacyError):
            safe_doaj_profile_url("https://doaj.org/search/journals")

    def test_public_url_rejects_credentials_tokens_and_unsafe_schemes(self) -> None:
        unsafe = (
            "javascript:alert(1)",
            "https://user:fictional@example.test/journal",
            "https://example.test/journal?token=fictional",
            "http://localhost/journal",
        )
        for url in unsafe:
            with self.subTest(url=url), self.assertRaises(PrivacyError):
                safe_public_url(url)

    def test_allowlist_rejects_unknown_or_email_shaped_values(self) -> None:
        with self.assertRaisesRegex(PrivacyError, "allowlisted"):
            validate_public_record("rejected", {"source_record_id": "rejected:00000001", "private": "x"})
        with self.assertRaisesRegex(PrivacyError, "email-shaped"):
            validate_public_record(
                "rejected",
                {"source_record_id": "rejected:00000001", "journal_title": "person@example.test"},
            )


if __name__ == "__main__":
    unittest.main()
