from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import create_app
from config import Config


@pytest.fixture()
def app(
    tmp_path: Path,
):
    class TestConfig(Config):
        TESTING = True

        CONVERSATION_LOG_PATH = (
            tmp_path
            / "e2e-conversations.jsonl"
        )

        CLIENT_ORIGINS = [
            "http://localhost:5173",
        ]

    return create_app(
        TestConfig
    )


@pytest.fixture()
def client(app):
    return app.test_client()


def _post_chat(
    client,
    message: str,
    session_id: str | None = None,
):
    payload = {
        "message": message,
    }

    if session_id:
        payload["sessionId"] = session_id

    response = client.post(
        "/api/chat",
        json=payload,
    )

    assert response.status_code == 200

    return response.get_json()["data"]


def test_three_required_demo_scenarios(
    client,
    app,
):
    # Skenario 1:
    # Intent classification dan direct FAQ answer.
    direct = _post_chat(
        client,
        "bagaimana cara bayar uang kuliah",
    )

    assert (
        direct["intent"]
        == "pembayaran_dan_biaya"
    )

    assert (
        direct["category"]
        == "Pembayaran dan Biaya Kuliah"
    )

    assert (
        direct["matchedQuestion"]
        is not None
    )

    assert (
        direct["dialog"]["turnType"]
        == "direct_answer"
    )

    # Skenario 2:
    # Slot filling, multi-turn dialog, dan konfirmasi.
    first = _post_chat(
        client,
        "Saya ingin mengajukan surat keterangan",
    )

    assert (
        first["dialog"]["state"]
        == "awaiting_slot"
    )

    assert (
        first["dialog"]["awaitingSlot"]
        == "documentType"
    )

    second = _post_chat(
        client,
        "Surat mahasiswa aktif",
        first["sessionId"],
    )

    assert (
        second["slots"]["documentType"]
        == "mahasiswa_aktif"
    )

    assert (
        second["dialog"]["awaitingSlot"]
        == "campus"
    )

    third = _post_chat(
        client,
        "Kampus Menteng",
        first["sessionId"],
    )

    assert (
        third["slots"]["campus"]
        == "menteng"
    )

    assert (
        third["dialog"]["state"]
        == "awaiting_confirmation"
    )

    final = _post_chat(
        client,
        "Ya, tampilkan",
        first["sessionId"],
    )

    assert (
        final["dialog"]["turnType"]
        == "final_answer"
    )

    assert (
        final["dialog"]["confirmed"]
        is True
    )

    assert (
        final["matchedQuestion"]
        is not None
    )

    # Skenario 3:
    # Pertanyaan luar domain tidak dipaksakan.
    outside = _post_chat(
        client,
        "cara membuat nasi goreng",
    )

    assert (
        outside["matchedQuestion"]
        is None
    )

    assert (
        outside["retrievalMode"]
        == "no_match"
    )

    # Enam turn harus tercatat:
    # 1 direct + 4 multi-turn + 1 outside-domain.
    lines = app.config[
        "CONVERSATION_LOG_PATH"
    ].read_text(
        encoding="utf-8",
    ).splitlines()

    assert len(lines) == 6

    records = [
        json.loads(line)
        for line in lines
    ]

    assert any(
        record["confirmed"] is True
        for record in records
    )

    assert any(
        record["retrievalMode"] == "no_match"
        for record in records
    )


def test_session_reset_endpoint(
    client,
):
    first = _post_chat(
        client,
        "Saya ingin mengajukan surat keterangan",
    )

    response = client.delete(
        f"/api/chat/session/{first['sessionId']}"
    )

    assert response.status_code == 200

    assert (
        response.get_json()["data"]["sessionId"]
        == first["sessionId"]
    )