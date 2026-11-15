"""WP3 and Unified Production Upgrade integration invariants over authorized local sources.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections import Counter
from pathlib import Path
import unittest

from observatory.engine import DataEngine, RANKS


class EngineIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        raw_dir = Path("data/raw")
        if not raw_dir.exists():
            raise unittest.SkipTest("authorized local sources are unavailable")
        cls.outputs = DataEngine(raw_dir).build()

    def test_source_rows_are_conserved_one_to_one(self) -> None:
        self.assertEqual(len(self.outputs["fact_rejected_public.json"]), 9_308)
        self.assertEqual(len(self.outputs["fact_withdrawn_public.json"]), 661)
        self.assertEqual(len(self.outputs["sinta_snapshot_public.json"]), 16_620)
        self.assertEqual(len(self.outputs["fact_doaj_current_public.json"]), 2_733)
        if "fact_accepted_public.json" in self.outputs:
            self.assertEqual(len(self.outputs["fact_accepted_public.json"]), 1_421)
        for filename in (
            "fact_rejected_public.json",
            "fact_withdrawn_public.json",
            "sinta_snapshot_public.json",
            "fact_doaj_current_public.json",
        ):
            records = self.outputs[filename]
            self.assertEqual(len(records), len({record["source_record_id"] for record in records}))

    def test_raw_issns_and_placeholders_are_retained(self) -> None:
        records = sum(
            (self.outputs[name] for name in (
                "fact_rejected_public.json", "fact_withdrawn_public.json", "sinta_snapshot_public.json"
            )),
            [],
        )
        required = {"XXXX-XXXX", "0000-0XXX"}
        occurrences = [
            (record[key], record[key.replace("_raw", "_quality")])
            for record in records
            for key in ("p_issn_raw", "e_issn_raw")
            if record[key] in required
        ]
        self.assertEqual(len(occurrences), 50)
        self.assertTrue(all(quality == "placeholder" for _, quality in occurrences))

    def test_rank_categories_and_source_denominator_reconcile(self) -> None:
        summary = self.outputs["summary_public.json"]
        counts = summary["sinta_rank_source_record_counts"]
        self.assertEqual(tuple(counts), RANKS)
        self.assertEqual(sum(counts.values()), 16_620)
        self.assertTrue(all(counts[rank] >= 0 for rank in RANKS))
        rejected_counts = summary["rejected_rank_source_record_counts"]
        self.assertEqual(tuple(rejected_counts), (*RANKS, "unmatched", "ambiguous"))
        self.assertEqual(sum(rejected_counts.values()), 9_308)
        rejected_journal_counts = summary["rejected_rank_unique_journal_counts"]
        self.assertEqual(tuple(rejected_journal_counts), (*RANKS, "ambiguous"))
        self.assertLessEqual(sum(rejected_journal_counts.values()), summary["identity_counts"]["rejected_resolved_journals"])

    def test_intersection_regions_are_exact_and_reconcile(self) -> None:
        data = self.outputs["intersections_public.json"]
        regions = data["venn_regions"]
        self.assertEqual(len(regions), 7)
        self.assertEqual({region["region"] for region in regions}, {"R", "W", "S", "RW", "RS", "WS", "RWS"})
        self.assertEqual(sum(region["count"] for region in regions), self.outputs["summary_public.json"]["intersection_universe_count"])
        self.assertEqual(regions, data["upset_aggregates"])
        for region in regions:
            self.assertEqual(region["count"], len(region["journal_ids"]))

    def test_current_doaj_summary_and_coverage_reconcile(self) -> None:
        summary = self.outputs["summary_public.json"]
        cur = summary["current_doaj_summary"]
        self.assertEqual(cur["total_source_records"], 23_733)
        self.assertEqual(cur["indonesia_source_records"], 2_733)
        self.assertEqual(cur["unique_resolved_journals"], 2_731)
        self.assertEqual(cur["sinta_matched_journals"], 2_500)
        self.assertEqual(cur["doaj_only_journals"], 231)
        self.assertEqual(cur["sinta_only_journals"], 14_120)
        self.assertEqual(cur["total_two_set_universe"], 16_851)
        self.assertEqual(sum(cur["rank_coverage_counts"].values()), 2_500)
        self.assertAlmostEqual(cur["rank_coverage_percentages"]["S1"], 62.60, places=1)

    def test_repeat_histogram_and_history_reconcile(self) -> None:
        histories = [
            value for value in self.outputs["rejection_history_public.json"]
            if value["identity_status"] == "resolved"
        ]
        histogram = Counter(value["source_record_count"] for value in histories)
        expected = {str(key): histogram[key] for key in sorted(histogram)}
        self.assertEqual(self.outputs["summary_public.json"]["repeat_record_histogram"], expected)
        self.assertEqual(
            sum(value["source_record_count"] for value in self.outputs["rejection_history_public.json"]),
            9_308,
        )

    def test_placeholder_only_rows_never_share_a_provisional_identity(self) -> None:
        records = self.outputs["fact_rejected_public.json"] + self.outputs["fact_withdrawn_public.json"]
        placeholder_only = [
            record for record in records
            if record["p_issn_quality"] in {"placeholder", "missing"}
            and record["e_issn_quality"] in {"placeholder", "missing"}
        ]
        self.assertEqual(len(placeholder_only), len({record["journal_id"] for record in placeholder_only}))

    def test_match_audit_is_one_to_one_with_doaj_rows(self) -> None:
        audits = self.outputs["match_audit_public.json"]
        accepted_count = len(self.outputs.get("fact_accepted_public.json", []))
        self.assertEqual(len(audits), 9_308 + 661 + accepted_count)
        self.assertEqual(len(audits), len({record["source_record_id"] for record in audits}))
        self.assertTrue(all(record["strict_method"] in {"e_to_e", "p_to_p_fallback", "no_usable_issn"} for record in audits))

    def test_data_quality_samples_contain_only_safe_record_ids(self) -> None:
        report = self.outputs["data_quality_public.json"]
        self.assertTrue(report["review_samples_are_source_ids_only"])
        for samples in report["deterministic_review_samples"].values():
            self.assertLessEqual(len(samples), 10)
            self.assertTrue(all(value.split(":", 1)[0] in {"rejected", "withdrawn", "sinta"} for value in samples))


if __name__ == "__main__":
    unittest.main()
