"""Synthetic source validation and conservation tests.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import csv
from pathlib import Path
import tempfile
import unittest

from observatory.contracts import SourceContract
from observatory.sources import (
    SourceValidationError,
    inspect_source,
    iter_lossless_rows,
    source_record_id,
)


def synthetic_contract() -> SourceContract:
    return SourceContract(
        dataset="rejected",
        filename="synthetic.csv",
        expected_rows=2,
        expected_columns=3,
        required_columns=frozenset({"title", "print", "online"}),
        p_issn_column="print",
        e_issn_column="online",
    )


def write_source(path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["title", "print", "online"])
        writer.writerow(["First", "XXXX-XXXX", "0000-0XXX"])
        writer.writerow(["First", "XXXX-XXXX", "0000-0XXX"])


class SourceTests(unittest.TestCase):
    def test_inspection_and_iteration_preserve_duplicate_rows_and_placeholders(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_source(root / "synthetic.csv")
            contract = synthetic_contract()
            metadata = inspect_source(root, contract)
            rows = list(iter_lossless_rows(root, contract))
        self.assertEqual(metadata.row_count, 2)
        public_metadata = metadata.public_dict()
        self.assertNotIn("filename", public_metadata)
        self.assertNotIn("headers", public_metadata)
        self.assertEqual(len(public_metadata["header_sha256"]), 64)
        self.assertEqual(len(rows), 2)
        self.assertEqual(
            [row["source_record_id"] for row in rows],
            ["rejected:00000001", "rejected:00000002"],
        )
        self.assertTrue(all(row["p_issn_raw"] == "XXXX-XXXX" for row in rows))
        self.assertTrue(all(row["e_issn_raw"] == "0000-0XXX" for row in rows))
        self.assertEqual(rows[0]["source_row"], rows[1]["source_row"])

    def test_source_record_id_is_deterministic_and_one_based(self) -> None:
        self.assertEqual(source_record_id("sinta", 42), "sinta:00000042")
        with self.assertRaises(ValueError):
            source_record_id("sinta", 0)

    def test_schema_drift_fails_without_dropping_rows(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "synthetic.csv").write_text("title,print\nFirst,XXXX-XXXX\n", encoding="utf-8")
            with self.assertRaisesRegex(SourceValidationError, "missing required headers"):
                inspect_source(root, synthetic_contract())


if __name__ == "__main__":
    unittest.main()
