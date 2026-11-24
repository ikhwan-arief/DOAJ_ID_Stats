#!/usr/bin/env python3
"""Scan publishable artifacts or staged files for high-risk leakage.

Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
"""

import argparse
import json
from pathlib import Path
import re
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from observatory.privacy import EMAIL_PATTERN


INTERNAL_ROUTE = re.compile(r"(?i)/" + "admin" + "/" + "application" + "/")
INTERNAL_URL = re.compile(r"(?i)https?://[^\s\"']+" + "/" + "admin" + "/" + "application" + "/")
RAW_NAME = re.compile(
    r"(?i)(ID_-_(?:Rejected_applications|Rejected|Accepted|Applications|Last_Withdrawn).*\.csv|sinta_database_final_.*\.csv|doaj_journalcsv_.*\.csv)"
)
TEXT_SUFFIXES = {".csv", ".html", ".js", ".json", ".log", ".md", ".txt", ".xml"}
FORBIDDEN_FIELD_NAMES = ("Owner", "Account Name", "Account Email")
SECRET_PATTERNS = (
    re.compile(r"-----" + r"BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[opusr]_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
)


def scan_text(label: str, text: str, *, public_artifact: bool) -> list[str]:
    failures = []
    if (public_artifact and INTERNAL_ROUTE.search(text)) or (not public_artifact and INTERNAL_URL.search(text)):
        failures.append(f"{label}: contains the internal DOAJ application route")
    if public_artifact and EMAIL_PATTERN.search(text):
        failures.append(f"{label}: contains email-shaped content")
    if public_artifact and RAW_NAME.search(text):
        failures.append(f"{label}: contains a raw source filename")
    if public_artifact and not label.endswith(".json") and any(name in text for name in FORBIDDEN_FIELD_NAMES):
        failures.append(f"{label}: contains a forbidden account field name")
    if any(pattern.search(text) for pattern in SECRET_PATTERNS):
        failures.append(f"{label}: contains a credential or private-key pattern")
    if public_artifact and label.endswith(".json"):
        try:
            value = json.loads(text)
        except json.JSONDecodeError:
            failures.append(f"{label}: invalid JSON")
        else:
            forbidden = {"Owner", "Account Name", "Account Email"}

            def walk(item: object) -> None:
                if isinstance(item, dict):
                    overlap = forbidden & set(item)
                    if overlap:
                        failures.append(f"{label}: contains forbidden field name(s)")
                    for nested in item.values():
                        walk(nested)
                elif isinstance(item, list):
                    for nested in item:
                        walk(nested)

            walk(value)
    return failures


def scan_directories(paths: list[Path]) -> list[str]:
    failures = []
    for root in paths:
        if not root.exists():
            continue
        for path in sorted(item for item in root.rglob("*") if item.is_file()):
            if path.suffix.lower() in TEXT_SUFFIXES:
                failures.extend(
                    scan_text(str(path), path.read_text(encoding="utf-8", errors="replace"), public_artifact=True)
                )
    return failures


def scan_staged() -> list[str]:
    names = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()
    failures = []
    for name in names:
        if name.startswith(("data/raw/", "data/private_work/")):
            failures.append(f"{name}: private path is staged")
            continue
        if Path(name).suffix.lower() == ".csv" and RAW_NAME.search(Path(name).name):
            failures.append(f"{name}: raw source CSV is staged")
        content = subprocess.run(
            ["git", "show", f":{name}"], check=True, capture_output=True
        ).stdout.decode("utf-8", errors="replace")
        failures.extend(scan_text(name, content, public_artifact=False))
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="*", type=Path, default=[])
    parser.add_argument("--staged", action="store_true")
    args = parser.parse_args()
    paths = args.paths or [Path("data/public"), Path("public"), Path("dist")]
    failures = scan_directories(paths)
    if args.staged:
        failures.extend(scan_staged())
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("Privacy scan passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
