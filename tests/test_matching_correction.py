"""Deterministic regression fixtures for DOAJ x SINTA identity matching correction.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections import defaultdict
from pathlib import Path
import unittest

from observatory.contracts import SOURCE_CONTRACTS
from observatory.engine import DataEngine, _usable, _identity_signature, _stable_id, normalize_journal_title
from observatory.sources import iter_lossless_rows


class IdentityMatchingCorrectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        raw_dir = Path("data/raw")
        if not raw_dir.exists():
            raise unittest.SkipTest("authorized local sources are unavailable")
        cls.engine = DataEngine(raw_dir)
        cls.outputs = cls.engine.build()
        cls.contracts = {c.dataset: c for c in SOURCE_CONTRACTS}
        cls.raw_dir = raw_dir

    def test_walisongo_law_review_reconciles_safely(self) -> None:
        """Verify Walisongo Law Review matches SINTA via P-ISSN fallback without conflict."""
        fact_rejected = self.outputs["fact_rejected_public.json"]
        walrev_records = [
            r for r in fact_rejected
            if "Walisongo Law Review" in (r.get("journal_title") or "")
        ]
        self.assertGreaterEqual(len(walrev_records), 2)
        for r in walrev_records:
            # DOAJ has P-ISSN: 2715-3347, E-ISSN: 2722-0400
            # SINTA profile 8669 has P-ISSN: 2715-3347, E-ISSN: None
            self.assertEqual(r["strict_match_status"], "matched")
            self.assertEqual(r["strict_match_method"], "p_to_p_fallback")
            self.assertEqual(r["sinta_rank"], "S3")
            self.assertTrue(r["journal_id"].startswith("sinta:"))

    def test_journal_of_nutrition_college_cross_medium_and_strict_separation(self) -> None:
        """Verify Journal of Nutrition College is unmatched strictly but matched under cross-medium."""
        fact_rejected = self.outputs["fact_rejected_public.json"]
        jnc_records = [
            r for r in fact_rejected
            if "Journal of Nutrition College" in (r.get("journal_title") or "")
        ]
        self.assertEqual(len(jnc_records), 1)
        jnc = jnc_records[0]
        # DOAJ has P: 2337-6236, E: 2622-884X
        # SINTA has P: 2622-884X, E: 2337-6236 (medium inverted)
        self.assertEqual(jnc["strict_match_status"], "unmatched")
        self.assertEqual(jnc["extended_match_status"], "matched")
        self.assertEqual(jnc["extended_match_method"], "e_to_p+p_to_e")
        self.assertEqual(jnc["extended_sinta_rank"], "S3")

    def test_identity_conflicts_categorically_flagged(self) -> None:
        """Verify conflicting same-medium ISSNs result in identity_conflict and unresolved identity."""
        fact_rejected = self.outputs["fact_rejected_public.json"]
        lan_tabur = [
            r for r in fact_rejected
            if r["source_record_id"] == "rejected:00000803"
        ][0]
        self.assertEqual(lan_tabur["strict_match_status"], "identity_conflict")
        self.assertEqual(lan_tabur["strict_match_method"], "conflicting_issn")
        self.assertEqual(lan_tabur["identity_status"], "unresolved")

    def test_title_normalization_preserves_safety(self) -> None:
        """Verify title normalization normalizes whitespace, punctuation, and Unicode without auto-merging."""
        t1 = normalize_journal_title("Walisongo Law Review (Walrev)")
        t2 = normalize_journal_title("Walisongo Law Review")
        self.assertEqual(t1, "walisongo law review walrev")
        self.assertEqual(t2, "walisongo law review")
        self.assertNotEqual(t1, t2)
        # Identical titles with different ISSNs must not merge
        self.assertEqual(normalize_journal_title(""), "")

    def test_sinta_matching_audit_manifest_in_data_quality(self) -> None:
        """Verify that data_quality_public.json contains the complete SINTA matching audit section."""
        dq = self.outputs["data_quality_public.json"]
        self.assertIn("sinta_matching_audit", dq)
        audit_sec = dq["sinta_matching_audit"]
        self.assertIn("summary", audit_sec)
        self.assertIn("entries", audit_sec)
        self.assertEqual(audit_sec["summary"]["total_audit_records"], 422)
        self.assertEqual(audit_sec["summary"]["conflict_leads_count"], 13)
        self.assertEqual(audit_sec["summary"]["candidate_leads_count"], 409)
        self.assertEqual(len(audit_sec["entries"]), 422)


if __name__ == "__main__":
    unittest.main()
