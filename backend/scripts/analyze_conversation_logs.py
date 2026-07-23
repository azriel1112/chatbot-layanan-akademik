from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys
from typing import Any


SCRIPT_BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(SCRIPT_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_BACKEND_DIR))


from config import Config
from src.services.log_analyzer import analyze_conversation_log


def _flatten_summary(
    summary: dict[str, Any],
) -> list[tuple[str, str, Any]]:
    rows: list[tuple[str, str, Any]] = []

    simple_keys = [
        "logPath",
        "totalTurns",
        "uniqueSessions",
        "malformedLines",
        "firstTimestampUtc",
        "lastTimestampUtc",
        "noMatchTurns",
        "noMatchRate",
        "confirmedTurns",
        "confirmationRate",
        "cancelledTurns",
        "cancellationRate",
        "averageProcessingMs",
        "p95ProcessingMs",
    ]

    for key in simple_keys:
        rows.append(
            (
                "summary",
                key,
                summary.get(key),
            )
        )

    counter_keys = [
        "intentCounts",
        "categoryCounts",
        "retrievalModeCounts",
        "dialogTurnTypeCounts",
    ]

    for section in counter_keys:
        values = summary.get(section, {})

        for key, value in values.items():
            rows.append(
                (
                    section,
                    key,
                    value,
                )
            )

    return rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analisis log percakapan chatbot berformat JSONL.",
    )

    parser.add_argument(
        "--input",
        type=Path,
        default=Config.CONVERSATION_LOG_PATH,
        help="Lokasi conversations.jsonl.",
    )

    parser.add_argument(
        "--json-output",
        type=Path,
        default=Path("reports/conversation_log_summary.json"),
        help="Lokasi output ringkasan JSON.",
    )

    parser.add_argument(
        "--csv-output",
        type=Path,
        default=Path("reports/conversation_log_summary.csv"),
        help="Lokasi output ringkasan CSV.",
    )

    args = parser.parse_args()

    summary = analyze_conversation_log(args.input)

    args.json_output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    args.csv_output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    args.json_output.write_text(
        json.dumps(
            summary,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    with args.csv_output.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as file:
        writer = csv.writer(file)

        writer.writerow(
            [
                "section",
                "key",
                "value",
            ]
        )

        writer.writerows(
            _flatten_summary(summary)
        )

    print("Analisis log percakapan berhasil dibuat.")
    print(f"Total turn       : {summary['totalTurns']}")
    print(f"Unique session   : {summary['uniqueSessions']}")
    print(f"No-match rate    : {summary['noMatchRate'] * 100:.2f}%")
    print(f"Rata-rata proses : {summary['averageProcessingMs']:.3f} ms")
    print(f"JSON output      : {args.json_output}")
    print(f"CSV output       : {args.csv_output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())