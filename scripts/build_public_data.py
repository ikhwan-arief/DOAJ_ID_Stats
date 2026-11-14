#!/usr/bin/env python3
"""Build deterministic, versioned public analytical exports.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from observatory.engine import DataEngine, write_exports


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--output-dir", type=Path, default=Path("data/public/v1"))
    parser.add_argument("--etl-commit", required=True)
    args = parser.parse_args()
    payloads = DataEngine(args.raw_dir).build()
    hashes = write_exports(payloads, args.output_dir, args.etl_commit)
    print(f"Built {len(hashes)} privacy-safe files in {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
