"""Synthetic recursive artifact scanner regression tests.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from pathlib import Path
import tempfile
import unittest

from scripts.validate_public import scan_directories


class PublicValidatorTests(unittest.TestCase):
    def test_recursive_scanner_accepts_safe_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "nested").mkdir()
            (root / "nested" / "safe.json").write_text('{"journal_title":"Synthetic"}', encoding="utf-8")
            self.assertEqual(scan_directories([root]), [])

    def test_recursive_scanner_rejects_internal_route_email_and_forbidden_key(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            route = "/".join(("admin", "application", "fictional-id"))
            (root / "unsafe.json").write_text(
                '{"Owner":"person@example.test","url":"https://doaj.org/' + route + '"}',
                encoding="utf-8",
            )
            failures = scan_directories([root])
            self.assertEqual(len(failures), 3)


if __name__ == "__main__":
    unittest.main()
