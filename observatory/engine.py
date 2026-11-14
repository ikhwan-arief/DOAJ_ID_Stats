"""Deterministic journal reconciliation, matching, and analytical exports.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
import hashlib
import json
from pathlib import Path
from typing import Any

from .contracts import SOURCE_CONTRACTS
from .privacy import EMAIL_PATTERN, PrivacyError, safe_doaj_profile_url, safe_public_url
from .sources import inspect_all_sources, iter_lossless_rows


SCHEMA_VERSION = "1.0.0"
RANKS = ("S1", "S2", "S3", "S4", "S5", "S6", "NA")
USABLE_ISSN_QUALITIES = frozenset({"checksum_valid", "format_only"})


@dataclass(frozen=True)
class MatchResult:
    status: str
    method: str
    journal_id: str | None
    candidate_count: int


def _stable_id(prefix: str, parts: tuple[str, ...]) -> str:
    digest = hashlib.sha256("\0".join(parts).encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{digest}"


def _usable(row: dict[str, Any], medium: str) -> str | None:
    quality = row[f"{medium}_issn_quality"]
    return row[f"{medium}_issn_normalized"] if quality in USABLE_ISSN_QUALITIES else None


def _identity_signature(row: dict[str, Any]) -> tuple[str, ...] | None:
    p_issn, e_issn = _usable(row, "p"), _usable(row, "e")
    if p_issn and e_issn:
        return ("pair", p_issn, e_issn)
    if e_issn:
        return ("e", e_issn)
    if p_issn:
        return ("p", p_issn)
    return None


def _safe_text(value: object) -> str | None:
    text = "" if value is None else str(value).strip()
    if not text or EMAIL_PATTERN.search(text):
        return None
    return text


def _optional_url(value: object, *, doaj_profile: bool = False) -> str | None:
    try:
        return safe_doaj_profile_url(value) if doaj_profile else safe_public_url(value)
    except PrivacyError:
        return None


def _date_parts(raw: object) -> dict[str, Any]:
    value = "" if raw is None else str(raw).strip()
    result: dict[str, Any] = {"raw": value or None, "day": None, "month": None, "year": None}
    if not value:
        return result
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return result
    result.update(day=parsed.date().isoformat(), month=parsed.strftime("%Y-%m"), year=parsed.year)
    return result


def _sinta_rank(value: object) -> str:
    rank = str(value).strip().upper()
    return rank if rank in RANKS else "NA"


class DataEngine:
    def __init__(self, raw_dir: Path):
        self.raw_dir = raw_dir

    def build(self) -> dict[str, Any]:
        metadata = inspect_all_sources(self.raw_dir)
        contracts = {contract.dataset: contract for contract in SOURCE_CONTRACTS}
        rows = {
            name: list(iter_lossless_rows(self.raw_dir, contracts[name]))
            for name in ("rejected", "withdrawn", "sinta")
        }

        sinta_signature_to_id: dict[tuple[str, ...], str] = {}
        sinta_row_journal: dict[str, str] = {}
        sinta_e_index: dict[str, set[str]] = defaultdict(set)
        sinta_p_index: dict[str, set[str]] = defaultdict(set)
        for row in rows["sinta"]:
            signature = _identity_signature(row)
            journal_id = (
                sinta_signature_to_id.setdefault(signature, _stable_id("sinta", signature))
                if signature
                else f"sinta-row:{row['source_record_id'].split(':')[1]}"
            )
            sinta_row_journal[row["source_record_id"]] = journal_id
            if (e_issn := _usable(row, "e")):
                sinta_e_index[e_issn].add(journal_id)
            if (p_issn := _usable(row, "p")):
                sinta_p_index[p_issn].add(journal_id)

        def match(row: dict[str, Any], extended: bool = False) -> MatchResult:
            e_issn, p_issn = _usable(row, "e"), _usable(row, "p")
            if not extended:
                if e_issn:
                    candidates, method = sinta_e_index[e_issn], "e_to_e"
                elif p_issn:
                    candidates, method = sinta_p_index[p_issn], "p_to_p_fallback"
                else:
                    return MatchResult("unmatched", "no_usable_issn", None, 0)
            else:
                candidates = set()
                strict = match(row, extended=False)
                if strict.status in {"matched", "ambiguous"}:
                    return strict
                methods = []
                if e_issn:
                    candidates |= sinta_p_index[e_issn]
                    methods.append("e_to_p")
                if p_issn:
                    candidates |= sinta_e_index[p_issn]
                    methods.append("p_to_e")
                method = "+".join(methods) if methods else "no_usable_issn"
            if len(candidates) == 1:
                return MatchResult("matched", method, next(iter(candidates)), 1)
            if len(candidates) > 1:
                return MatchResult("ambiguous", method, None, len(candidates))
            return MatchResult("unmatched", method, None, 0)

        doaj_signature_to_id: dict[tuple[str, ...], str] = {}
        fact_rejected, fact_withdrawn, audits = [], [], []
        journal_titles: dict[str, str | None] = {}

        def reconcile_doaj(row: dict[str, Any]) -> tuple[str, MatchResult, MatchResult, bool]:
            strict, extended = match(row), match(row, extended=True)
            unresolved = strict.status == "ambiguous"
            if strict.journal_id:
                journal_id = strict.journal_id
            elif unresolved:
                journal_id = f"unresolved:{row['source_record_id'].replace(':', '-') }"
            elif (signature := _identity_signature(row)):
                journal_id = doaj_signature_to_id.setdefault(signature, _stable_id("doaj", signature))
            else:
                journal_id = f"doaj-row:{row['source_record_id'].replace(':', '-') }"
            return journal_id, strict, extended, unresolved

        for dataset in ("rejected", "withdrawn"):
            for row in rows[dataset]:
                source = row["source_row"]
                journal_id, strict, extended, unresolved = reconcile_doaj(row)
                title = _safe_text(source.get("Journal title"))
                journal_titles.setdefault(journal_id, title)
                base = {
                    "source_dataset": dataset,
                    "source_record_id": row["source_record_id"],
                    "journal_id": journal_id,
                    "identity_status": "unresolved" if unresolved else "resolved",
                    "journal_title": title,
                    "journal_url": _optional_url(source.get("Journal URL")),
                    "p_issn_raw": row["p_issn_raw"],
                    "e_issn_raw": row["e_issn_raw"],
                    "p_issn_normalized": row["p_issn_normalized"],
                    "e_issn_normalized": row["e_issn_normalized"],
                    "p_issn_quality": row["p_issn_quality"],
                    "e_issn_quality": row["e_issn_quality"],
                    "strict_match_status": strict.status,
                    "strict_match_method": strict.method,
                    "extended_match_status": extended.status,
                    "extended_match_method": extended.method,
                    "extended_journal_id": extended.journal_id,
                    "extended_sinta_rank": "ambiguous" if extended.status == "ambiguous" else "unmatched",
                    "sinta_rank": "ambiguous" if strict.status == "ambiguous" else "unmatched",
                }
                audits.append(
                    {
                        "source_record_id": row["source_record_id"],
                        "journal_id": journal_id,
                        "strict_status": strict.status,
                        "strict_method": strict.method,
                        "strict_candidate_count": strict.candidate_count,
                        "extended_status": extended.status,
                        "extended_method": extended.method,
                        "extended_candidate_count": extended.candidate_count,
                    }
                )
                if dataset == "rejected":
                    event = _date_parts(source.get("Date Rejected"))
                    base.update(
                        event_at_raw=event["raw"], event_day=event["day"],
                        event_month=event["month"], event_year=event["year"],
                    )
                    fact_rejected.append(base)
                else:
                    withdrawn = _date_parts(source.get("Last Withdrawn Date"))
                    reinstated = _date_parts(source.get("Last Reinstated Date"))
                    applied = _date_parts(source.get("Date Applied"))
                    base.update(
                        doaj_profile_url=_optional_url(source.get("URL in DOAJ"), doaj_profile=True),
                        date_applied_raw=applied["raw"],
                        last_withdrawn_date_raw=withdrawn["raw"],
                        last_withdrawn_day=withdrawn["day"],
                        last_withdrawn_year=withdrawn["year"],
                        last_reinstated_date_raw=reinstated["raw"],
                        last_reinstated_day=reinstated["day"],
                    )
                    fact_withdrawn.append(base)

        sinta_records, journal_ranks = [], defaultdict(set)
        for row in rows["sinta"]:
            source = row["source_row"]
            journal_id = sinta_row_journal[row["source_record_id"]]
            rank = _sinta_rank(source.get("Accreditation"))
            journal_ranks[journal_id].add(rank)
            title = _safe_text(source.get("Journal Name"))
            journal_titles.setdefault(journal_id, title)
            sinta_records.append(
                {
                    "source_dataset": "sinta",
                    "source_record_id": row["source_record_id"],
                    "journal_id": journal_id,
                    "journal_title": title,
                    "p_issn_raw": row["p_issn_raw"],
                    "e_issn_raw": row["e_issn_raw"],
                    "p_issn_normalized": row["p_issn_normalized"],
                    "e_issn_normalized": row["e_issn_normalized"],
                    "p_issn_quality": row["p_issn_quality"],
                    "e_issn_quality": row["e_issn_quality"],
                    "sinta_rank": rank,
                    "accreditation_raw": _safe_text(source.get("Accreditation")),
                    "subject_area": _safe_text(source.get("Subject Area")),
                    "subject_area_inferred": _safe_text(source.get("Subject Area (Inferred)")),
                    "sinta_url": _optional_url(source.get("Sinta URL")),
                    "website_url": _optional_url(source.get("Website URL")),
                    "editor_url": _optional_url(source.get("Editor URL")),
                }
            )

        resolved_rank = {
            journal_id: (next(iter(ranks)) if len(ranks) == 1 else "ambiguous")
            for journal_id, ranks in journal_ranks.items()
        }
        for record in fact_rejected + fact_withdrawn:
            if record["strict_match_status"] == "matched":
                record["sinta_rank"] = resolved_rank.get(record["journal_id"], "NA")
            if record["extended_match_status"] == "matched" and record["extended_journal_id"]:
                record["extended_sinta_rank"] = resolved_rank.get(record["extended_journal_id"], "NA")

        histories_by_journal: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for record in fact_rejected:
            histories_by_journal[record["journal_id"]].append(record)
        histories = []
        for journal_id in sorted(histories_by_journal):
            records = histories_by_journal[journal_id]
            days = sorted({record["event_day"] for record in records if record["event_day"]})
            years = sorted({record["event_year"] for record in records if record["event_year"]})
            gaps = [
                (datetime.fromisoformat(right) - datetime.fromisoformat(left)).days
                for left, right in zip(days, days[1:])
            ]
            histories.append(
                {
                    "journal_id": journal_id,
                    "identity_status": records[0]["identity_status"],
                    "source_record_count": len(records),
                    "distinct_event_day_count": len(days),
                    "distinct_event_year_count": len(years),
                    "event_days": days,
                    "event_years": years,
                    "consecutive_day_gaps": gaps,
                    "source_record_ids": [record["source_record_id"] for record in records],
                }
            )

        unresolved_ids = {
            record["journal_id"] for record in fact_rejected + fact_withdrawn
            if record["identity_status"] == "unresolved"
        }
        r_set = {record["journal_id"] for record in fact_rejected} - unresolved_ids
        w_set = {record["journal_id"] for record in fact_withdrawn} - unresolved_ids
        s_set = set(sinta_row_journal.values())
        regions = []
        for in_r, in_w, in_s in (
            (True, False, False), (False, True, False), (False, False, True),
            (True, True, False), (True, False, True), (False, True, True), (True, True, True),
        ):
            universe = r_set | w_set | s_set
            members = sorted(
                journal_id for journal_id in universe
                if (journal_id in r_set) == in_r and (journal_id in w_set) == in_w and (journal_id in s_set) == in_s
            )
            region = "".join(letter for letter, included in zip("RWS", (in_r, in_w, in_s)) if included)
            regions.append({"region": region, "R": in_r, "W": in_w, "S": in_s, "count": len(members), "journal_ids": members})

        rank_source_counts = Counter(record["sinta_rank"] for record in sinta_records)
        rank_journal_counts = Counter(resolved_rank.values())
        rejected_rank_counts = Counter(record["sinta_rank"] for record in fact_rejected)
        rejected_journal_rank_counts = Counter(
            resolved_rank[journal_id]
            for journal_id in r_set & s_set
            if journal_id in resolved_rank
        )
        repeat_histogram = Counter(history["source_record_count"] for history in histories if history["identity_status"] == "resolved")
        summary = {
            "schema_version": SCHEMA_VERSION,
            "as_of": {"sinta_snapshot": "2026-11-15", "doaj_export_utc": "2026-11-14"},
            "source_record_counts": {name: len(value) for name, value in rows.items()},
            "identity_counts": {
                "rejected_resolved_journals": len(r_set),
                "withdrawn_resolved_journals": len(w_set),
                "sinta_journals": len(s_set),
                "unresolved_doaj_source_records": sum(1 for audit in audits if audit["strict_status"] == "ambiguous"),
            },
            "strict_match_status_counts": dict(sorted(Counter(audit["strict_status"] for audit in audits).items())),
            "extended_match_status_counts": dict(sorted(Counter(audit["extended_status"] for audit in audits).items())),
            "sinta_rank_source_record_counts": {rank: rank_source_counts.get(rank, 0) for rank in RANKS},
            "sinta_rank_unique_journal_counts": {rank: rank_journal_counts.get(rank, 0) for rank in (*RANKS, "ambiguous")},
            "rejected_rank_source_record_counts": {
                rank: rejected_rank_counts.get(rank, 0)
                for rank in (*RANKS, "unmatched", "ambiguous")
            },
            "rejected_rank_unique_journal_counts": {
                rank: rejected_journal_rank_counts.get(rank, 0)
                for rank in (*RANKS, "ambiguous")
            },
            "repeat_record_histogram": {str(key): repeat_histogram[key] for key in sorted(repeat_histogram)},
            "repeat_record_journals": sum(history["source_record_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "repeat_date_journals": sum(history["distinct_event_day_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "repeat_year_journals": sum(history["distinct_event_year_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "venn_regions": [{key: value for key, value in region.items() if key != "journal_ids"} for region in regions],
            "intersection_universe_count": len(r_set | w_set | s_set),
        }

        dim_journals = [
            {
                "journal_id": journal_id,
                "display_title": journal_titles.get(journal_id),
                "in_rejected": journal_id in r_set,
                "in_withdrawn": journal_id in w_set,
                "in_sinta": journal_id in s_set,
                "sinta_rank": resolved_rank.get(journal_id, "unmatched"),
            }
            for journal_id in sorted((r_set | w_set | s_set) | unresolved_ids)
        ]
        placeholder_ids = [
            record["source_record_id"]
            for record in fact_rejected + fact_withdrawn + sinta_records
            if "placeholder" in {record["p_issn_quality"], record["e_issn_quality"]}
        ]
        cross_medium_ids = [
            audit["source_record_id"] for audit in audits
            if audit["strict_status"] == "unmatched" and audit["extended_status"] in {"matched", "ambiguous"}
        ]
        repeated_timestamp_ids = []
        for records in histories_by_journal.values():
            day_counts = Counter(record["event_day"] for record in records if record["event_day"])
            repeated_timestamp_ids.extend(
                record["source_record_id"] for record in records
                if record["event_day"] and day_counts[record["event_day"]] > 1
            )
        data_quality = {
            "schema_version": SCHEMA_VERSION,
            "review_samples_are_source_ids_only": True,
            "quality_counts": {
                "placeholder_source_records": len(placeholder_ids),
                "cross_medium_candidate_records": len(cross_medium_ids),
                "same_day_rejected_records": len(repeated_timestamp_ids),
                "strict_ambiguous_records": sum(audit["strict_status"] == "ambiguous" for audit in audits),
                "extended_ambiguous_records": sum(audit["extended_status"] == "ambiguous" for audit in audits),
            },
            "deterministic_review_samples": {
                "strict_matches": [audit["source_record_id"] for audit in audits if audit["strict_status"] == "matched"][:10],
                "placeholder_records": placeholder_ids[:10],
                "cross_medium_candidates": cross_medium_ids[:10],
                "same_day_rejected_records": repeated_timestamp_ids[:10],
            },
            "limitations": [
                "Record identity is not evidence of a distinct application or decision.",
                "Cross-medium matches are excluded from strict headline metrics.",
                "Placeholder-only ISSNs never establish journal identity.",
                "SINTA ranks describe the 2026-11-15 snapshot, not historical rank.",
            ],
        }
        return {
            "fact_rejected_public.json": fact_rejected,
            "fact_withdrawn_public.json": fact_withdrawn,
            "sinta_snapshot_public.json": sinta_records,
            "dim_journals_public.json": dim_journals,
            "match_audit_public.json": audits,
            "rejection_history_public.json": histories,
            "intersections_public.json": {"venn_regions": regions, "upset_aggregates": regions, "unresolved_journal_ids": sorted(unresolved_ids)},
            "data_quality_public.json": data_quality,
            "summary_public.json": summary,
            "_source_metadata": [item.public_dict() for item in metadata],
        }


def write_exports(payloads: dict[str, Any], output_dir: Path, etl_commit: str) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    hashes = {}
    source_metadata = payloads.pop("_source_metadata")
    for filename in sorted(payloads):
        rendered = json.dumps(payloads[filename], ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n"
        path = output_dir / filename
        path.write_text(rendered, encoding="utf-8")
        hashes[filename] = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "etl_commit": etl_commit,
        "source_dates": {"doaj_export_utc": "2026-11-14", "sinta_snapshot": "2026-11-15"},
        "sources": source_metadata,
        "outputs": hashes,
    }
    rendered = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    (output_dir / "manifest_public.json").write_text(rendered, encoding="utf-8")
    hashes["manifest_public.json"] = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    return hashes
