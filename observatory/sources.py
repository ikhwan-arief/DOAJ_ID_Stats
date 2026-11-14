"""Deterministic, non-destructive CSV inspection and row projection.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from collections.abc import Iterator, Mapping
import csv
from dataclasses import asdict, dataclass
import hashlib
from pathlib import Path

from .contracts import SOURCE_CONTRACTS, SourceContract
from .issn import parse_issn


class SourceValidationError(ValueError):
    """Raised when a required local source violates its contract."""


@dataclass(frozen=True)
class SourceMetadata:
    dataset: str
    filename: str
    sha256: str
    encoding: str
    row_count: int
    column_count: int
    headers: tuple[str, ...]

    def public_dict(self) -> dict[str, object]:
        value = asdict(self)
        value["source_name"] = value.pop("dataset")
        value.pop("filename")
        header_bytes = "\0".join(self.headers).encode("utf-8")
        value["header_sha256"] = hashlib.sha256(header_bytes).hexdigest()
        value.pop("headers")
        return value


def source_record_id(dataset: str, one_based_data_row_index: int) -> str:
    if one_based_data_row_index < 1:
        raise ValueError("source row index must be one-based and positive")
    return f"{dataset}:{one_based_data_row_index:08d}"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_source(raw_dir: Path, contract: SourceContract) -> SourceMetadata:
    path = raw_dir / contract.filename
    if not path.is_file():
        raise SourceValidationError(f"required source is missing: {contract.filename}")
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.reader(stream)
        try:
            headers = tuple(next(reader))
        except StopIteration as error:
            raise SourceValidationError(f"source is empty: {contract.filename}") from error
        row_count = sum(1 for _ in reader)
    missing = sorted(contract.required_columns - set(headers))
    failures = []
    if missing:
        failures.append(f"missing required headers: {missing!r}")
    if len(headers) != contract.expected_columns:
        failures.append(f"columns {len(headers)} != expected {contract.expected_columns}")
    if row_count != contract.expected_rows:
        failures.append(f"rows {row_count} != expected {contract.expected_rows}")
    if failures:
        raise SourceValidationError(f"{contract.filename}: " + "; ".join(failures))
    return SourceMetadata(
        dataset=contract.dataset,
        filename=contract.filename,
        sha256=_sha256(path),
        encoding="utf-8-sig",
        row_count=row_count,
        column_count=len(headers),
        headers=headers,
    )


def inspect_all_sources(raw_dir: Path) -> list[SourceMetadata]:
    present = {path.name for path in raw_dir.glob("*.csv")}
    expected = {contract.filename for contract in SOURCE_CONTRACTS}
    obsolete = sorted(
        name for name in present if "15092026" in name or "ISSN_cleaned" in name
    )
    if obsolete:
        raise SourceValidationError(f"obsolete source file(s) are not permitted: {obsolete!r}")
    missing = sorted(expected - present)
    if missing:
        raise SourceValidationError(f"required source file(s) missing: {missing!r}")
    return [inspect_source(raw_dir, contract) for contract in SOURCE_CONTRACTS]


def iter_lossless_rows(raw_dir: Path, contract: SourceContract) -> Iterator[dict[str, object]]:
    """Yield every row in original order, including exact raw ISSN strings."""
    path = raw_dir / contract.filename
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        for index, row in enumerate(reader, start=1):
            p_issn = parse_issn(row[contract.p_issn_column])
            e_issn = parse_issn(row[contract.e_issn_column])
            yield {
                "source_dataset": contract.dataset,
                "source_record_id": source_record_id(contract.dataset, index),
                "source_row_index": index,
                "source_row": row,
                "p_issn_raw": p_issn.raw,
                "e_issn_raw": e_issn.raw,
                "p_issn_normalized": p_issn.normalized,
                "e_issn_normalized": e_issn.normalized,
                "p_issn_quality": p_issn.quality,
                "e_issn_quality": e_issn.quality,
            }


def assert_row_conservation(rows: Iterator[Mapping[str, object]], expected: int) -> None:
    count = sum(1 for _ in rows)
    if count != expected:
        raise SourceValidationError(f"row conservation failed: {count} != {expected}")
