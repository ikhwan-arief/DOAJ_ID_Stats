"""Application cohort export invariants over authorized local sources.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections import Counter
from pathlib import Path
import unittest

from observatory.engine import APPLICATION_PUBLIC_FIELDS, DataEngine


class ApplicationCohortTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        raw_dir = Path("data/raw")
        if not raw_dir.exists():
            raise unittest.SkipTest("authorized local sources are unavailable")
        cls.records = DataEngine(raw_dir).build()["fact_applications_public.json"]

    def test_rows_conserved_and_outcomes_counted(self) -> None:
        self.assertEqual(len(self.records), 11_292)
        self.assertEqual(len({r["source_record_id"] for r in self.records}), 11_292)
        self.assertEqual(Counter(r["outcome"] for r in self.records), {"rejected": 9_343, "not_rejected": 1_949})

    def test_only_minimal_public_fields(self) -> None:
        for record in self.records:
            self.assertEqual(tuple(record), APPLICATION_PUBLIC_FIELDS)

    def test_submission_precedes_rejection(self) -> None:
        for record in self.records:
            self.assertIsNotNone(record["submitted_day"])
            if record["outcome"] == "rejected":
                self.assertLessEqual(record["submitted_day"], record["rejected_day"])
            else:
                self.assertIsNone(record["rejected_day"])


if __name__ == "__main__":
    unittest.main()
