"""Synthetic ISSN regression tests.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import unittest

from observatory.issn import parse_issn


class IssnTests(unittest.TestCase):
    def test_valid_issn_checksum_and_normalization(self) -> None:
        value = parse_issn(" 0378 5955 ")
        self.assertEqual(value.raw, " 0378 5955 ")
        self.assertEqual(value.normalized, "0378-5955")
        self.assertEqual(value.quality, "checksum_valid")

    def test_placeholders_are_preserved_verbatim(self) -> None:
        for placeholder in ("XXXX-XXXX", "0000-0XXX"):
            with self.subTest(placeholder=placeholder):
                value = parse_issn(placeholder)
                self.assertEqual(value.raw, placeholder)
                self.assertEqual(value.normalized, placeholder)
                self.assertEqual(value.quality, "placeholder")

    def test_invalid_checksum_is_format_only_not_discarded(self) -> None:
        value = parse_issn("1234-5678")
        self.assertEqual(value.raw, "1234-5678")
        self.assertEqual(value.normalized, "1234-5678")
        self.assertEqual(value.quality, "format_only")

    def test_missing_and_invalid_values_remain_distinct(self) -> None:
        self.assertEqual(parse_issn("").quality, "missing")
        value = parse_issn("not-an-issn")
        self.assertEqual(value.raw, "not-an-issn")
        self.assertEqual(value.quality, "invalid_format")


if __name__ == "__main__":
    unittest.main()
