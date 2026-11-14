"""Lossless ISSN normalization and quality classification.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

from dataclasses import dataclass
import re


ISSN_SHAPE = re.compile(r"^[0-9X]{4}-[0-9X]{4}$")
PLACEHOLDER = re.compile(r"X", re.IGNORECASE)


@dataclass(frozen=True)
class IssnValue:
    raw: str
    normalized: str | None
    quality: str


def _checksum_valid(compact: str) -> bool:
    total = 0
    for index, character in enumerate(compact):
        value = 10 if character == "X" else int(character)
        total += value * (8 - index)
    return total % 11 == 0


def parse_issn(value: object) -> IssnValue:
    """Return lossless raw text plus conservative normalized/quality fields."""
    raw = "" if value is None else str(value)
    stripped = raw.strip().upper()
    if not stripped:
        return IssnValue(raw=raw, normalized=None, quality="missing")

    compact = stripped.replace("-", "").replace(" ", "")
    normalized = f"{compact[:4]}-{compact[4:]}" if len(compact) == 8 else None
    if normalized is None or not ISSN_SHAPE.fullmatch(normalized):
        return IssnValue(raw=raw, normalized=normalized, quality="invalid_format")
    if PLACEHOLDER.search(normalized[:-1]):
        return IssnValue(raw=raw, normalized=normalized, quality="placeholder")
    if not re.fullmatch(r"[0-9]{7}[0-9X]", compact):
        return IssnValue(raw=raw, normalized=normalized, quality="format_only")
    quality = "checksum_valid" if _checksum_valid(compact) else "format_only"
    return IssnValue(raw=raw, normalized=normalized, quality=quality)
