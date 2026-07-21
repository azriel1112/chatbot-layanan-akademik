from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _resolve_path(value: str, default: str) -> Path:
    raw = value or default
    path = Path(raw)

    return path if path.is_absolute() else BASE_DIR / path


class Config:
    PORT = int(
        os.getenv(
            "PORT",
            "5000",
        )
    )

    CLIENT_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CLIENT_ORIGINS",
            (
                "http://localhost:5173,"
                "https://chatbot-layanan-akademik.vercel.app"
            ),
        ).split(",")
        if origin.strip()
    ]

    FAQ_DATA_PATH = _resolve_path(
        os.getenv(
            "FAQ_DATA_PATH",
            "",
        ),
        "data/faqs.json",
    )

    RUNTIME_ASSETS_PATH = _resolve_path(
        os.getenv(
            "RUNTIME_ASSETS_PATH",
            "",
        ),
        "data/runtime_assets.json",
    )

    INTENT_MODEL_PATH = _resolve_path(
        os.getenv(
            "INTENT_MODEL_PATH",
            "",
        ),
        "models/intent_classifier.json",
    )

    CONVERSATION_LOG_PATH = _resolve_path(
        os.getenv(
            "CONVERSATION_LOG_PATH",
            "",
        ),
        "logs/conversations.jsonl",
    )

    SESSION_TTL_SECONDS = int(
        os.getenv(
            "SESSION_TTL_SECONDS",
            "1800",
        )
    )

    MAX_SESSIONS = int(
        os.getenv(
            "MAX_SESSIONS",
            "1000",
        )
    )

    JSON_SORT_KEYS = False