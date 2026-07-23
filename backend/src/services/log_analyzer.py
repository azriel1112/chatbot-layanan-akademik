from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path
from typing import Any


def _safe_rate(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0

    return round(numerator / denominator, 6)


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0

    ordered = sorted(values)

    if len(ordered) == 1:
        return round(ordered[0], 3)

    position = (len(ordered) - 1) * percentile
    lower_index = math.floor(position)
    upper_index = math.ceil(position)

    if lower_index == upper_index:
        return round(ordered[lower_index], 3)

    lower_value = ordered[lower_index]
    upper_value = ordered[upper_index]
    fraction = position - lower_index

    return round(
        lower_value + (upper_value - lower_value) * fraction,
        3,
    )


def _sorted_counter(counter: Counter[str]) -> dict[str, int]:
    return {
        key: counter[key]
        for key in sorted(
            counter,
            key=lambda item: (-counter[item], item),
        )
    }


def analyze_conversation_log(log_path: Path) -> dict[str, Any]:
    """Menganalisis log JSONL tanpa menghentikan proses saat ada baris rusak."""

    records: list[dict[str, Any]] = []
    malformed_lines = 0

    if log_path.exists():
        for raw_line in log_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()

            if not line:
                continue

            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                malformed_lines += 1
                continue

            if not isinstance(payload, dict):
                malformed_lines += 1
                continue

            records.append(payload)

    sessions = {
        str(record.get("sessionId"))
        for record in records
        if record.get("sessionId")
    }

    intent_counts: Counter[str] = Counter(
        str(record["intent"])
        for record in records
        if record.get("intent")
    )

    category_counts: Counter[str] = Counter(
        str(record["category"])
        for record in records
        if record.get("category")
    )

    retrieval_mode_counts: Counter[str] = Counter(
        str(record["retrievalMode"])
        for record in records
        if record.get("retrievalMode")
    )

    dialog_turn_counts: Counter[str] = Counter(
        str(record["dialogTurnType"])
        for record in records
        if record.get("dialogTurnType")
    )

    no_match_turns = sum(
        1
        for record in records
        if record.get("retrievalMode") == "no_match"
        or record.get("dialogTurnType") == "no_match"
    )

    confirmed_turns = sum(
        1
        for record in records
        if bool(record.get("confirmed"))
    )

    cancelled_turns = sum(
        1
        for record in records
        if bool(record.get("cancelled"))
    )

    processing_values = [
        float(record["processingMs"])
        for record in records
        if isinstance(record.get("processingMs"), (int, float))
        and float(record["processingMs"]) >= 0
    ]

    timestamps = sorted(
        str(record["timestampUtc"])
        for record in records
        if record.get("timestampUtc")
    )

    total_turns = len(records)

    return {
        "logPath": str(log_path),
        "totalTurns": total_turns,
        "uniqueSessions": len(sessions),
        "malformedLines": malformed_lines,
        "firstTimestampUtc": timestamps[0] if timestamps else None,
        "lastTimestampUtc": timestamps[-1] if timestamps else None,
        "noMatchTurns": no_match_turns,
        "noMatchRate": _safe_rate(no_match_turns, total_turns),
        "confirmedTurns": confirmed_turns,
        "confirmationRate": _safe_rate(confirmed_turns, total_turns),
        "cancelledTurns": cancelled_turns,
        "cancellationRate": _safe_rate(cancelled_turns, total_turns),
        "averageProcessingMs": round(
            sum(processing_values) / len(processing_values),
            3,
        )
        if processing_values
        else 0.0,
        "p95ProcessingMs": _percentile(processing_values, 0.95),
        "intentCounts": _sorted_counter(intent_counts),
        "categoryCounts": _sorted_counter(category_counts),
        "retrievalModeCounts": _sorted_counter(retrieval_mode_counts),
        "dialogTurnTypeCounts": _sorted_counter(dialog_turn_counts),
    }