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
    class TestConfig(
        Config
    ):
        TESTING = True

        CONVERSATION_LOG_PATH = (
            tmp_path
            / "conversations.jsonl"
        )

        CLIENT_ORIGINS = [
            "http://localhost:5173",
        ]

    return create_app(
        TestConfig
    )


@pytest.fixture()
def client(
    app,
):
    return app.test_client()


def test_health_and_faq_endpoints(
    client,
):
    health = client.get(
        "/api/health"
    )

    assert (
        health.status_code
        == 200
    )

    health_data = (
        health
        .get_json()[
            "data"
        ]
    )

    assert (
        health_data[
            "framework"
        ]
        == "Flask"
    )

    assert (
        health_data[
            "faqCount"
        ]
        > 0
    )

    assert (
        health_data[
            "intentCount"
        ]
        == 13
    )

    faqs = client.get(
        "/api/faqs"
    )

    assert (
        faqs.status_code
        == 200
    )

    assert (
        len(
            faqs
            .get_json()[
                "data"
            ]
        )
        == health_data[
            "faqCount"
        ]
    )


def test_chat_validation(
    client,
):
    response = client.post(
        "/api/chat",

        json={
            "message": "   ",
        },
    )

    assert (
        response.status_code
        == 400
    )

    assert (
        response
        .get_json()[
            "success"
        ]
        is False
    )


def test_direct_chat_and_jsonl_log(
    client,
    app,
):
    response = client.post(
        "/api/chat",

        json={
            "message":
                (
                    "bagaimana cara "
                    "bayar uang kuliah"
                ),
        },

        headers={
            "User-Agent":
                "pytest-agent",
        },
    )

    assert (
        response.status_code
        == 200
    )

    result = (
        response
        .get_json()[
            "data"
        ]
    )

    assert result[
        "sessionId"
    ]

    assert (
        result["intent"]
        == "pembayaran_dan_biaya"
    )

    assert (
        result["category"]
        == (
            "Pembayaran dan "
            "Biaya Kuliah"
        )
    )

    assert (
        result[
            "matchedQuestion"
        ]
        is not None
    )

    log_path = app.config[
        "CONVERSATION_LOG_PATH"
    ]

    lines = (
        log_path
        .read_text(
            encoding="utf-8"
        )
        .splitlines()
    )

    assert len(lines) == 1

    record = json.loads(
        lines[0]
    )

    assert (
        record[
            "sessionId"
        ]
        == result[
            "sessionId"
        ]
    )

    assert (
        record[
            "userMessage"
        ]
        == (
            "bagaimana cara bayar "
            "uang kuliah"
        )
    )

    assert (
        record["intent"]
        == "pembayaran_dan_biaya"
    )

    assert (
        record[
            "userAgent"
        ]
        == "pytest-agent"
    )

    assert (
        record[
            "processingMs"
        ]
        >= 0
    )


def test_multi_turn_dialog_and_reset(
    client,
):
    first = (
        client.post(
            "/api/chat",

            json={
                "message":
                    (
                        "Saya ingin mengajukan "
                        "surat keterangan"
                    ),
            },
        )
        .get_json()[
            "data"
        ]
    )

    assert (
        first[
            "dialog"
        ][
            "state"
        ]
        == "awaiting_slot"
    )

    assert (
        first[
            "dialog"
        ][
            "awaitingSlot"
        ]
        == "documentType"
    )

    second = (
        client.post(
            "/api/chat",

            json={
                "sessionId":
                    first[
                        "sessionId"
                    ],

                "message":
                    (
                        "Surat mahasiswa "
                        "aktif"
                    ),
            },
        )
        .get_json()[
            "data"
        ]
    )

    assert (
        second[
            "dialog"
        ][
            "awaitingSlot"
        ]
        == "campus"
    )

    third = (
        client.post(
            "/api/chat",

            json={
                "sessionId":
                    first[
                        "sessionId"
                    ],

                "message":
                    "Kampus Menteng",
            },
        )
        .get_json()[
            "data"
        ]
    )

    assert (
        third[
            "dialog"
        ][
            "state"
        ]
        == (
            "awaiting_confirmation"
        )
    )

    fourth = (
        client.post(
            "/api/chat",

            json={
                "sessionId":
                    first[
                        "sessionId"
                    ],

                "message":
                    "Ya, tampilkan",
            },
        )
        .get_json()[
            "data"
        ]
    )

    assert (
        fourth[
            "dialog"
        ][
            "turnType"
        ]
        == "final_answer"
    )

    assert (
        fourth[
            "dialog"
        ][
            "confirmed"
        ]
        is True
    )

    assert (
        fourth[
            "matchedQuestion"
        ]
        is not None
    )

    reset = client.delete(
        "/api/chat/session/"
        + first[
            "sessionId"
        ]
    )

    assert (
        reset.status_code
        == 200
    )

    assert (
        reset
        .get_json()[
            "data"
        ][
            "sessionId"
        ]
        == first[
            "sessionId"
        ]
    )