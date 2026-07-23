from __future__ import annotations

import json
from pathlib import Path

import pytest

from src.services.log_analyzer import analyze_conversation_log


def test_log_analyzer_handles_summary_and_malformed_lines(
    tmp_path: Path,
):
    log_path = (
        tmp_path
        / "conversations.jsonl"
    )

    records = [
        {
            "timestampUtc": "2026-07-21T10:00:00+00:00",
            "sessionId": "session_0001",
            "intent": "pembayaran_dan_biaya",
            "category": "Pembayaran dan Biaya Kuliah",
            "retrievalMode": "intent_filtered",
            "dialogTurnType": "direct_answer",
            "confirmed": False,
            "cancelled": False,
            "processingMs": 10.0,
        },
        {
            "timestampUtc": "2026-07-21T10:01:00+00:00",
            "sessionId": "session_0002",
            "intent": None,
            "category": None,
            "retrievalMode": "no_match",
            "dialogTurnType": "no_match",
            "confirmed": False,
            "cancelled": False,
            "processingMs": 20.0,
        },
        {
            "timestampUtc": "2026-07-21T10:02:00+00:00",
            "sessionId": "session_0002",
            "intent": "surat_dan_legalisir",
            "category": "Surat Keterangan",
            "retrievalMode": "intent_filtered",
            "dialogTurnType": "final_answer",
            "confirmed": True,
            "cancelled": False,
            "processingMs": 30.0,
        },
    ]

    content = "\n".join(
        json.dumps(record)
        for record in records
    )

    log_path.write_text(
        content + "\n{not-json}\n",
        encoding="utf-8",
    )

    summary = analyze_conversation_log(
        log_path
    )

    assert summary["totalTurns"] == 3
    assert summary["uniqueSessions"] == 2
    assert summary["malformedLines"] == 1
    assert summary["noMatchTurns"] == 1

    assert summary["noMatchRate"] == pytest.approx(
        1 / 3,
        abs=1e-6,
    )

    assert summary["confirmedTurns"] == 1

    assert summary["confirmationRate"] == pytest.approx(
        1 / 3,
        abs=1e-6,
    )

    assert summary["averageProcessingMs"] == 20.0
    assert summary["p95ProcessingMs"] == 29.0

    assert (
        summary["intentCounts"]["pembayaran_dan_biaya"]
        == 1
    )

    assert (
        summary["dialogTurnTypeCounts"]["final_answer"]
        == 1
    )


def test_log_analyzer_returns_zero_summary_for_missing_file(
    tmp_path: Path,
):
    summary = analyze_conversation_log(
        tmp_path
        / "missing.jsonl"
    )

    assert summary["totalTurns"] == 0
    assert summary["uniqueSessions"] == 0
    assert summary["malformedLines"] == 0
    assert summary["averageProcessingMs"] == 0.0
    assert summary["intentCounts"] == {}