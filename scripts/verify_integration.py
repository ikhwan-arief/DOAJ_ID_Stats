#!/usr/bin/env python3
"""Rebuild and independently reconcile every published analytical metric.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections import Counter
import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from observatory.engine import DataEngine, RANKS


ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / "data/public/v1"
FRONTEND = ROOT / "public/data/v1"
RANK_BUCKETS = (*RANKS, "unmatched", "ambiguous")


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def verify_payloads_against_pipeline(skip_source_rebuild: bool) -> dict[str, object]:
    filenames = load(CANONICAL / "manifest_public.json")["outputs"]
    committed = {filename: load(CANONICAL / filename) for filename in filenames}
    if not skip_source_rebuild:
        rebuilt = DataEngine(ROOT / "data/raw").build()
        rebuilt.pop("_source_metadata")
        for filename, payload in rebuilt.items():
            require(committed[filename] == payload, f"committed export differs from source pipeline: {filename}")
    return committed


def verify_frontend_copy_and_manifest() -> None:
    manifest = load(CANONICAL / "manifest_public.json")
    for filename, expected_hash in manifest["outputs"].items():
        canonical_bytes = (CANONICAL / filename).read_bytes()
        frontend_bytes = (FRONTEND / filename).read_bytes()
        require(canonical_bytes == frontend_bytes, f"frontend export copy differs: {filename}")
        require(hashlib.sha256(canonical_bytes).hexdigest() == expected_hash, f"manifest hash mismatch: {filename}")


def verify_kpis(payloads: dict[str, object]) -> None:
    rejected = payloads["fact_rejected_public.json"]
    withdrawn = payloads["fact_withdrawn_public.json"]
    sinta = payloads["sinta_snapshot_public.json"]
    doaj_current = payloads["fact_doaj_current_public.json"]
    histories = payloads["rejection_history_public.json"]
    summary = payloads["summary_public.json"]
    intersections = payloads["intersections_public.json"]

    require(summary["source_record_counts"]["rejected"] == len(rejected), "rejected source-record KPI mismatch")
    require(summary["source_record_counts"]["withdrawn"] == len(withdrawn), "withdrawn source-record KPI mismatch")
    require(summary["source_record_counts"]["sinta"] == len(sinta), "sinta source-record KPI mismatch")
    require(summary["source_record_counts"]["doaj_current_indonesia"] == len(doaj_current), "doaj_current source-record KPI mismatch")
    require(len(doaj_current) == 2733, "doaj_current indonesia count must be 2733")

    require(summary["strict_match_status_counts"] == dict(sorted(Counter(
        record["strict_match_status"] for record in rejected + withdrawn
    ).items())), "strict match KPI mismatch")
    require(summary["extended_match_status_counts"] == dict(sorted(Counter(
        record["extended_match_status"] for record in rejected + withdrawn
    ).items())), "extended match KPI mismatch")

    rank_sources = Counter(record["sinta_rank"] for record in sinta)
    require(summary["sinta_rank_source_record_counts"] == {
        rank: rank_sources.get(rank, 0) for rank in RANKS
    }, "SINTA source rank distribution mismatch")
    rejected_rank_sources = Counter(record["sinta_rank"] for record in rejected)
    require(summary["rejected_rank_source_record_counts"] == {
        rank: rejected_rank_sources.get(rank, 0) for rank in RANK_BUCKETS
    }, "rejected source rank distribution mismatch")
    rejected_rank_journals = Counter()
    seen = set()
    for record in rejected:
        if record["sinta_rank"] in RANKS and record["journal_id"] not in seen:
            seen.add(record["journal_id"])
            rejected_rank_journals[record["sinta_rank"]] += 1
    require(summary["rejected_rank_unique_journal_counts"] == {
        rank: rejected_rank_journals.get(rank, 0) for rank in (*RANKS, "ambiguous")
    }, "rejected unique-journal rank distribution mismatch")

    resolved_histories = [history for history in histories if history["identity_status"] == "resolved"]
    histogram = Counter(history["source_record_count"] for history in resolved_histories)
    require(summary["repeat_record_histogram"] == {
        str(count): histogram[count] for count in sorted(histogram)
    }, "repeat-record histogram mismatch")
    require(summary["repeat_record_journals"] == sum(item["source_record_count"] >= 2 for item in resolved_histories), "repeat-record KPI mismatch")
    require(summary["repeat_date_journals"] == sum(item["distinct_event_day_count"] >= 2 for item in resolved_histories), "repeat-date KPI mismatch")
    require(summary["repeat_year_journals"] == sum(item["distinct_event_year_count"] >= 2 for item in resolved_histories), "repeat-year KPI mismatch")

    regions = intersections["venn_regions"]
    require(regions == intersections["upset_aggregates"], "Venn and UpSet payloads differ")
    require(len(regions) == 7, "intersection output must have seven regions")
    require(sum(region["count"] for region in regions) == summary["intersection_universe_count"], "intersection universe mismatch")
    for region in regions:
        require(region["count"] == len(region["journal_ids"]), f"intersection membership mismatch: {region['region']}")
    for key in "RWS":
        marginal = sum(region["count"] for region in regions if region[key])
        expected = {
            "R": summary["identity_counts"]["rejected_resolved_journals"],
            "W": summary["identity_counts"]["withdrawn_resolved_journals"],
            "S": summary["identity_counts"]["sinta_journals"],
        }[key]
        require(marginal == expected, f"intersection marginal mismatch: {key}")

    # Current DOAJ x SINTA coverage reconciliation
    cur = summary["current_doaj_summary"]
    require(cur["total_source_records"] == 23733, "doaj_current total source records mismatch")
    require(cur["indonesia_source_records"] == 2733, "doaj_current indonesia records mismatch")
    require(cur["unique_resolved_journals"] == 2731, "doaj_current unique resolved journals mismatch")
    require(cur["sinta_matched_journals"] == 2500, "doaj_current sinta matched mismatch")
    require(cur["doaj_only_journals"] == 231, "doaj_current doaj only mismatch")
    require(cur["sinta_only_journals"] == 14120, "doaj_current sinta only mismatch")
    require(cur["total_two_set_universe"] == 16851, "doaj_current 2-set universe mismatch")


def verify_filter_partitions(payloads: dict[str, object]) -> None:
    for filename, year_field in (
        ("fact_rejected_public.json", "event_year"),
        ("fact_withdrawn_public.json", "last_withdrawn_year"),
    ):
        records = payloads[filename]
        for mode, rank_field in (("strict", "sinta_rank"), ("extended", "extended_sinta_rank")):
            for year in range(2022, 2027):
                year_records = [record for record in records if record[year_field] == year]
                partition_total = sum(
                    sum(record[rank_field] == rank for record in year_records)
                    for rank in RANK_BUCKETS
                )
                require(partition_total == len(year_records), f"{filename} {mode} {year} rank filters do not partition rows")
        require(sum(record[year_field] is not None for record in records) == len(records), f"{filename} has unparsed event years")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-source-rebuild", action="store_true", help="Use in public CI where ignored raw inputs are unavailable")
    args = parser.parse_args()
    payloads = verify_payloads_against_pipeline(args.skip_source_rebuild)
    verify_frontend_copy_and_manifest()
    verify_kpis(payloads)
    verify_filter_partitions(payloads)
    reinstated = sum(bool(record["last_reinstated_date_raw"]) for record in payloads["fact_withdrawn_public.json"])
    print(
        "Integration verification passed: "
        f"{len(payloads['fact_rejected_public.json'])} rejected, "
        f"{len(payloads['fact_withdrawn_public.json'])} withdrawn, "
        f"{len(payloads['fact_doaj_current_public.json'])} current DOAJ (Indonesia), "
        f"{len(payloads['sinta_snapshot_public.json'])} SINTA rows; "
        f"{reinstated} recorded reinstatement date"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
