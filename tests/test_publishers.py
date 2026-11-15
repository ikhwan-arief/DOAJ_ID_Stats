"""Publisher dimension reconciliation, normalization, and privacy tests.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from pathlib import Path
import unittest

from observatory.engine import normalize_publisher_name, publisher_entity_id


class PublisherTests(unittest.TestCase):
    def test_normalization_and_id_stability(self) -> None:
        raw_1 = "Universitas Airlangga"
        raw_2 = "universitas airlangga"
        raw_3 = "  Universitas   Airlangga  "
        self.assertEqual(normalize_publisher_name(raw_1).lower(), normalize_publisher_name(raw_2).lower())
        self.assertEqual(normalize_publisher_name(raw_1).lower(), normalize_publisher_name(raw_3).lower())
        self.assertEqual(publisher_entity_id(raw_1), publisher_entity_id(raw_2))
        self.assertEqual(publisher_entity_id(raw_1), publisher_entity_id(raw_3))

    def test_structural_entities_are_never_merged(self) -> None:
        parent = "Universitas Indonesia"
        faculty = "Fakultas Hukum Universitas Indonesia"
        press = "UI Press"
        pid_parent = publisher_entity_id(parent)
        pid_faculty = publisher_entity_id(faculty)
        pid_press = publisher_entity_id(press)
        self.assertNotEqual(pid_parent, pid_faculty)
        self.assertNotEqual(pid_parent, pid_press)
        self.assertNotEqual(pid_faculty, pid_press)

    def test_unicode_and_punctuation_handling(self) -> None:
        raw_1 = "Lembaga Penelitian \u2013 Universitas Gadjah Mada"
        raw_2 = "Lembaga Penelitian - Universitas Gadjah Mada"
        self.assertEqual(normalize_publisher_name(raw_1), normalize_publisher_name(raw_2))
        self.assertEqual(publisher_entity_id(raw_1), publisher_entity_id(raw_2))


if __name__ == "__main__":
    unittest.main()
