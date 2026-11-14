#!/usr/bin/env python3
"""Validate local input structure and write a public-safe metadata manifest.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import argparse
from datetime import datetime
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from observatory.sources import inspect_all_sources


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--ingested-at",
        help="Explicit ISO-8601 timestamp, required with --output for reproducible manifests",
    )
    args = parser.parse_args()
    if args.output and not args.ingested_at:
        parser.error("--ingested-at is required with --output")
    if args.ingested_at:
        try:
            datetime.fromisoformat(args.ingested_at.replace("Z", "+00:00"))
        except ValueError as error:
            parser.error(f"invalid --ingested-at ISO-8601 timestamp: {error}")
    sources = inspect_all_sources(args.raw_dir)
    manifest = {
        "schema_version": "0.1.0",
        "ingested_at": args.ingested_at,
        "source_dates": {
            "doaj_export_utc": "2026-11-14",
            "sinta_snapshot": "2026-11-15",
        },
        "sources": [source.public_dict() for source in sources],
    }
    rendered = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print("Validated source contracts: " + ", ".join(
        f"{source.dataset}={source.row_count}" for source in sources
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
