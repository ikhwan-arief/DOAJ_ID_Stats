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
            for name in ("rejected", "accepted", "withdrawn", "sinta", "doaj_current")
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
        fact_rejected, fact_accepted, fact_withdrawn, audits = [], [], [], []
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

        # Filter DOAJ Current to publisher country Indonesia
        doaj_current_id_rows = [
            row for row in rows["doaj_current"]
            if (row["source_row"].get("Country of publisher") or "").strip().lower() == "indonesia"
        ]

        # Reconcile historical rejected, accepted & withdrawn
        for dataset in ("rejected", "accepted", "withdrawn"):
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
                elif dataset == "accepted":
                    added = _date_parts(source.get("Added on Date"))
                    updated = _date_parts(source.get("Last updated Date"))
                    base.update(
                        added_on_raw=added["raw"],
                        added_day=added["day"],
                        added_year=added["year"],
                        last_updated_raw=updated["raw"],
                        last_updated_day=updated["day"],
                        last_updated_year=updated["year"],
                        decision_date_verified=False,
                    )
                    fact_accepted.append(base)
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

        # Reconcile DOAJ Current (Indonesia)
        fact_doaj_current = []
        current_resolved_jids: set[str] = set()
        current_unresolved_jids: set[str] = set()
        current_journal_details: dict[str, dict[str, Any]] = {}

        for row in doaj_current_id_rows:
            source = row["source_row"]
            journal_id, strict, extended, unresolved = reconcile_doaj(row)
            title = _safe_text(source.get("Journal title"))
            journal_titles.setdefault(journal_id, title)
            doaj_profile = _optional_url(source.get("URL in DOAJ"), doaj_profile=True)
            publisher = _safe_text(source.get("Publisher"))

            if unresolved:
                current_unresolved_jids.add(journal_id)
            else:
                current_resolved_jids.add(journal_id)
                current_journal_details.setdefault(
                    journal_id,
                    {"doaj_profile_url": doaj_profile, "publisher": publisher},
                )

            record = {
                "source_dataset": "doaj_current",
                "source_record_id": row["source_record_id"],
                "journal_id": journal_id,
                "identity_status": "unresolved" if unresolved else "resolved",
                "journal_title": title,
                "journal_url": _optional_url(source.get("Journal URL")),
                "doaj_profile_url": doaj_profile,
                "p_issn_raw": row["p_issn_raw"],
                "e_issn_raw": row["e_issn_raw"],
                "p_issn_normalized": row["p_issn_normalized"],
                "e_issn_normalized": row["e_issn_normalized"],
                "p_issn_quality": row["p_issn_quality"],
                "e_issn_quality": row["e_issn_quality"],
                "publisher": publisher,
                "country_of_publisher": _safe_text(source.get("Country of publisher")),
                "subjects": [s.strip() for s in (source.get("Subjects") or "").split("|") if s.strip()],
                "added_on_raw": _safe_text(source.get("Added on Date")),
                "last_updated_raw": _safe_text(source.get("Last updated Date")),
                "sinta_match_status": strict.status,
                "sinta_match_method": strict.method,
                "extended_match_status": extended.status,
                "extended_match_method": extended.method,
                "extended_journal_id": extended.journal_id,
                "sinta_rank": "ambiguous" if strict.status == "ambiguous" else "unmatched",
            }
            fact_doaj_current.append(record)

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
        for record in fact_rejected + fact_accepted + fact_withdrawn + fact_doaj_current:
            if record.get("strict_match_status") == "matched" or record.get("sinta_match_status") == "matched":
                record["sinta_rank"] = resolved_rank.get(record["journal_id"], "NA")
            if record.get("extended_match_status") == "matched" and record.get("extended_journal_id"):
                record["extended_sinta_rank"] = resolved_rank.get(record["extended_journal_id"], "NA")

        # Assign current DOAJ status to fact records
        for record in fact_rejected + fact_accepted + fact_withdrawn:
            jid = record["journal_id"]
            if record["identity_status"] == "unresolved" or jid in current_unresolved_jids:
                record["current_doaj_status"] = "requires_review"
            elif jid in current_resolved_jids:
                record["current_doaj_status"] = "currently_indexed"
            else:
                record["current_doaj_status"] = "not_found"

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
            record["journal_id"] for record in fact_rejected + fact_accepted + fact_withdrawn
            if record["identity_status"] == "unresolved"
        }
        r_set = {record["journal_id"] for record in fact_rejected} - unresolved_ids
        a_set = {record["journal_id"] for record in fact_accepted} - unresolved_ids
        w_set = {record["journal_id"] for record in fact_withdrawn} - unresolved_ids
        s_set = set(sinta_row_journal.values())

        # Conserved 3-set RWS Venn (Historical baseline)
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

        # 2-set Current DOAJ x SINTA Venn
        both_ds = current_resolved_jids & s_set
        doaj_only_d = current_resolved_jids - s_set
        sinta_only_s = s_set - current_resolved_jids
        current_sinta_venn = [
            {"region": "D", "in_doaj": True, "in_sinta": False, "count": len(doaj_only_d), "journal_ids": sorted(doaj_only_d)},
            {"region": "S", "in_doaj": False, "in_sinta": True, "count": len(sinta_only_s), "journal_ids": sorted(sinta_only_s)},
            {"region": "DS", "in_doaj": True, "in_sinta": True, "count": len(both_ds), "journal_ids": sorted(both_ds)},
        ]

        # Lifecycle overlap calculations
        rejected_and_accepted = r_set & a_set
        accepted_and_current = a_set & current_resolved_jids
        accepted_and_withdrawn = a_set & w_set
        rejected_and_current = r_set & current_resolved_jids
        withdrawn_and_current = w_set & current_resolved_jids
        rejected_and_withdrawn = r_set & w_set
        rejected_accepted_current = r_set & a_set & current_resolved_jids

        # Rejection frequency outcomes
        rej_by_jid = defaultdict(list)
        for r in fact_rejected:
            rej_by_jid[r["journal_id"]].append(r)
        
        freq_outcome_buckets = ["1", "2", "3", "4", "5", "6+"]
        freq_outcome_data = {b: {"total": 0, "currently_indexed": 0, "accepted_overlap": 0, "withdrawn_overlap": 0} for b in freq_outcome_buckets}
        for jid in r_set:
            count = len(rej_by_jid[jid])
            b = str(count) if count < 6 else "6+"
            freq_outcome_data[b]["total"] += 1
            if jid in current_resolved_jids:
                freq_outcome_data[b]["currently_indexed"] += 1
            if jid in a_set:
                freq_outcome_data[b]["accepted_overlap"] += 1
            if jid in w_set:
                freq_outcome_data[b]["withdrawn_overlap"] += 1

        # SINTA rank coverage in current DOAJ
        rank_source_counts = Counter(record["sinta_rank"] for record in sinta_records)
        rank_journal_counts = Counter(resolved_rank.values())
        current_doaj_rank_counts = Counter(resolved_rank.get(jid, "unmatched") for jid in both_ds)
        current_doaj_coverage_pct = {
            rank: round((current_doaj_rank_counts[rank] / rank_journal_counts[rank] * 100), 2)
            if rank_journal_counts.get(rank, 0) > 0 else 0.0
            for rank in RANKS
        }

        # Status counts for rejected, accepted and withdrawn journals
        rejected_current_status_counts = Counter(
            "requires_review" if jid in current_unresolved_jids else ("currently_indexed" if jid in current_resolved_jids else "not_found")
            for jid in r_set
        )
        accepted_current_status_counts = Counter(
            "requires_review" if jid in current_unresolved_jids else ("currently_indexed" if jid in current_resolved_jids else "not_found")
            for jid in a_set
        )
        withdrawn_current_status_counts = Counter(
            "requires_review" if jid in current_unresolved_jids else ("currently_indexed" if jid in current_resolved_jids else "not_found")
            for jid in w_set
        )

        rejected_rank_counts = Counter(record["sinta_rank"] for record in fact_rejected)
        rejected_journal_rank_counts = Counter(
            resolved_rank[journal_id]
            for journal_id in r_set & s_set
            if journal_id in resolved_rank
        )
        repeat_histogram = Counter(history["source_record_count"] for history in histories if history["identity_status"] == "resolved")

        min_rej_date = min((r["event_at_raw"] for r in fact_rejected if r["event_at_raw"]), default=None)
        max_rej_date = max((r["event_at_raw"] for r in fact_rejected if r["event_at_raw"]), default=None)

        summary = {
            "schema_version": SCHEMA_VERSION,
            "as_of": {
                "sinta_snapshot": "2026-11-15",
                "doaj_export_utc": "2026-11-15",
                "doaj_current_snapshot": "2026-11-15",
                "rejection_min_date": min_rej_date,
                "rejection_max_date": max_rej_date,
            },
            "source_record_counts": {
                "rejected": len(rows["rejected"]),
                "accepted": len(rows["accepted"]),
                "withdrawn": len(rows["withdrawn"]),
                "sinta": len(rows["sinta"]),
                "doaj_current_total": len(rows["doaj_current"]),
                "doaj_current_indonesia": len(doaj_current_id_rows),
            },
            "identity_counts": {
                "rejected_resolved_journals": len(r_set),
                "accepted_resolved_journals": len(a_set),
                "withdrawn_resolved_journals": len(w_set),
                "sinta_journals": len(s_set),
                "current_doaj_unique_journals": len(current_resolved_jids),
                "unresolved_doaj_source_records": sum(1 for audit in audits if audit["strict_status"] == "ambiguous"),
                "unresolved_current_doaj_records": len(current_unresolved_jids),
            },
            "lifecycle_summary": {
                "rejected_journals_total": len(r_set),
                "accepted_journals_total": len(a_set),
                "withdrawn_journals_total": len(w_set),
                "current_indexed_journals_total": len(current_resolved_jids),
                "rejected_and_accepted_journals": len(rejected_and_accepted),
                "accepted_and_currently_indexed": len(accepted_and_current),
                "accepted_and_withdrawn": len(accepted_and_withdrawn),
                "rejected_and_currently_indexed": len(rejected_and_current),
                "withdrawn_and_currently_indexed": len(withdrawn_and_current),
                "rejected_and_withdrawn": len(rejected_and_withdrawn),
                "rejected_accepted_and_indexed": len(rejected_accepted_current),
                "rejection_frequency_outcomes": freq_outcome_data,
            },
            "current_doaj_summary": {
                "total_source_records": len(rows["doaj_current"]),
                "indonesia_source_records": len(doaj_current_id_rows),
                "unique_resolved_journals": len(current_resolved_jids),
                "sinta_matched_journals": len(both_ds),
                "doaj_only_journals": len(doaj_only_d),
                "sinta_only_journals": len(sinta_only_s),
                "total_two_set_universe": len(both_ds | doaj_only_d | sinta_only_s),
                "ambiguous_records": len(current_unresolved_jids),
                "rank_coverage_counts": {rank: current_doaj_rank_counts.get(rank, 0) for rank in RANKS},
                "rank_coverage_percentages": current_doaj_coverage_pct,
                "rejected_journals_current_status": dict(rejected_current_status_counts),
                "accepted_journals_current_status": dict(accepted_current_status_counts),
                "withdrawn_journals_current_status": dict(withdrawn_current_status_counts),
            },
            "strict_match_status_counts": dict(sorted(Counter(audit["strict_status"] for audit in audits).items())),
            "extended_match_status_counts": dict(sorted(Counter(audit["extended_status"] for audit in audits).items())),
            "sinta_rank_source_record_counts": {rank: rank_source_counts.get(rank, 0) for rank in RANKS},
            "sinta_rank_unique_journal_counts": {rank: rank_journal_counts.get(rank, 0) for rank in RANKS},
            "rejected_rank_source_record_counts": {
                rank: rejected_rank_counts.get(rank, 0) for rank in (*RANKS, "unmatched", "ambiguous")
            },
            "rejected_rank_unique_journal_counts": {
                rank: rejected_journal_rank_counts.get(rank, 0) for rank in (*RANKS, "ambiguous")
            },
            "repeat_record_histogram": {str(key): repeat_histogram[key] for key in sorted(repeat_histogram)},
            "repeat_record_journals": sum(history["source_record_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "repeat_date_journals": sum(history["distinct_event_day_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "repeat_year_journals": sum(history["distinct_event_year_count"] >= 2 for history in histories if history["identity_status"] == "resolved"),
            "venn_regions": [{key: value for key, value in region.items() if key != "journal_ids"} for region in regions],
            "intersection_universe_count": len(r_set | w_set | s_set),
        }

        dim_journals = []
        all_jids = sorted((r_set | a_set | w_set | s_set | current_resolved_jids) | unresolved_ids | current_unresolved_jids)
        for journal_id in all_jids:
            cur_status = (
                "requires_review" if journal_id in current_unresolved_jids
                else ("currently_indexed" if journal_id in current_resolved_jids else "not_found")
            )
            details = current_journal_details.get(journal_id, {})
            dim_journals.append(
                {
                    "journal_id": journal_id,
                    "display_title": journal_titles.get(journal_id),
                    "in_rejected": journal_id in r_set,
                    "in_accepted": journal_id in a_set,
                    "in_withdrawn": journal_id in w_set,
                    "in_sinta": journal_id in s_set,
                    "in_current_doaj": journal_id in current_resolved_jids,
                    "sinta_rank": resolved_rank.get(journal_id, "unmatched"),
                    "current_doaj_status": cur_status,
                    "current_doaj_profile_url": details.get("doaj_profile_url"),
                    "current_doaj_publisher": details.get("publisher"),
                }
            )

        placeholder_ids = [
            record["source_record_id"]
            for record in fact_rejected + fact_accepted + fact_withdrawn + sinta_records + fact_doaj_current
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
                "authoritative_rejected_records": len(rows["rejected"]),
                "accepted_source_records": len(rows["accepted"]),
                "current_doaj_total_source_records": len(rows["doaj_current"]),
                "current_doaj_indonesia_records": len(doaj_current_id_rows),
                "current_doaj_non_indonesia_filtered": len(rows["doaj_current"]) - len(doaj_current_id_rows),
                "current_doaj_ambiguous_records": len(current_unresolved_jids),
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
                "Accepted export decision dates are unverified; Added on Date represents database creation, not acceptance decision.",
                "SINTA ranks describe the 2026-11-15 snapshot, not historical rank.",
                "Current DOAJ snapshot describes indexing status on 2026-11-15.",
            ],
        }
        return {
            "fact_rejected_public.json": fact_rejected,
            "fact_accepted_public.json": fact_accepted,
            "fact_withdrawn_public.json": fact_withdrawn,
            "fact_doaj_current_public.json": fact_doaj_current,
            "sinta_snapshot_public.json": sinta_records,
            "dim_journals_public.json": dim_journals,
            "match_audit_public.json": audits,
            "rejection_history_public.json": histories,
            "intersections_public.json": {
                "venn_regions": regions,
                "upset_aggregates": regions,
                "unresolved_journal_ids": sorted(unresolved_ids),
                "current_sinta_venn": [
                    {k: v for k, v in item.items() if k != "journal_ids"}
                    for item in current_sinta_venn
                ],
            },
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
        "source_dates": {
            "doaj_export_utc": "2026-11-15",
            "sinta_snapshot": "2026-11-15",
            "doaj_current_snapshot": "2026-11-15",
        },
        "sources": source_metadata,
        "outputs": hashes,
    }
    rendered = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    (output_dir / "manifest_public.json").write_text(rendered, encoding="utf-8")
    hashes["manifest_public.json"] = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    return hashes
