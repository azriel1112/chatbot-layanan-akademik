from __future__ import annotations

import json
import threading
import uuid
from datetime import (
    datetime,
    timezone,
)
from pathlib import Path
from typing import Any


class ConversationLogger:
    def __init__(
        self,
        log_path: Path,
    ):
        self.log_path = log_path

        self.log_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._lock = (
            threading.Lock()
        )

    def append(
        self,
        *,
        session_id: str,
        user_message: str,
        reply: dict[str, Any],
        processing_ms: float,
        client_ip:
            str | None,
        user_agent:
            str | None,
    ) -> dict[str, Any]:
        dialog = (
            reply.get(
                "dialog"
            )
            or {}
        )

        record = {
            "logId":
                str(uuid.uuid4()),

            "timestampUtc":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "sessionId":
                session_id,

            "userMessage":
                user_message,

            "botAnswer":
                reply.get(
                    "answer"
                ),

            "intent":
                reply.get(
                    "intent"
                ),

            "intentConfidence":
                reply.get(
                    "intentConfidence",

                    reply.get(
                        "confidence",
                        0,
                    ),
                ),

            "category":
                reply.get(
                    "category"
                ),

            "matchedFaqId":
                reply.get(
                    "matchedFaqId"
                ),

            "matchedQuestion":
                reply.get(
                    "matchedQuestion"
                ),

            "retrievalMode":
                reply.get(
                    "retrievalMode"
                ),

            "slots":
                reply.get(
                    "slots",
                    {},
                ),

            "dialogState":
                dialog.get(
                    "state"
                ),

            "dialogTurnType":
                dialog.get(
                    "turnType"
                ),

            "confirmed":
                bool(
                    dialog.get(
                        "confirmed"
                    )
                ),

            "cancelled":
                bool(
                    dialog.get(
                        "cancelled"
                    )
                ),

            "processingMs":
                round(
                    processing_ms,
                    3,
                ),

            "clientIp":
                client_ip,

            "userAgent":
                user_agent,
        }

        line = (
            json.dumps(
                record,
                ensure_ascii=False,
                separators=(
                    ",",
                    ":",
                ),
            )
            + "\n"
        )

        with self._lock:
            with self.log_path.open(
                "a",
                encoding="utf-8",
                newline="",
            ) as file:
                file.write(line)

        return record