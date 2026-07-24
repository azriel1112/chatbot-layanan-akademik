from __future__ import annotations

import json
import threading
import uuid

from datetime import (
    datetime,
    timezone,
)

from pathlib import Path
from typing import Any, Protocol

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    select,
)

from sqlalchemy.engine import Engine

from .log_analyzer import (
    analyze_conversation_log,
    analyze_records,
)


class ConversationLogStore(
    Protocol
):
    storage_name: str

    def append(
        self,
        *,
        session_id: str,
        user_message: str,
        reply: dict[
            str,
            Any,
        ],
        processing_ms: float,
        client_ip:
            str | None,
        user_agent:
            str | None,
    ) -> dict[
        str,
        Any,
    ]:
        ...

    def summary(
        self,
    ) -> dict[
        str,
        Any,
    ]:
        ...

    def ping(
        self,
    ) -> bool:
        ...


def _build_record(
    *,
    session_id: str,
    user_message: str,
    reply: dict[
        str,
        Any,
    ],
    processing_ms: float,
    client_ip:
        str | None,
    user_agent:
        str | None,
) -> dict[
    str,
    Any,
]:
    dialog = (
        reply.get(
            "dialog"
        )
        or {}
    )

    return {
        "logId":
            str(
                uuid.uuid4()
            ),

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


class ConversationLogger:
    """
    Penyimpanan JSONL untuk
    development lokal dan bukti UAS.
    """

    storage_name = "jsonl"

    def __init__(
        self,
        log_path: Path,
    ):
        self.log_path = (
            log_path
        )

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
        reply: dict[
            str,
            Any,
        ],
        processing_ms: float,
        client_ip:
            str | None,
        user_agent:
            str | None,
    ) -> dict[
        str,
        Any,
    ]:
        record = _build_record(
            session_id=
                session_id,

            user_message=
                user_message,

            reply=
                reply,

            processing_ms=
                processing_ms,

            client_ip=
                client_ip,

            user_agent=
                user_agent,
        )

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
                file.write(
                    line
                )

        return record

    def summary(
        self,
    ) -> dict[
        str,
        Any,
    ]:
        return (
            analyze_conversation_log(
                self.log_path
            )
        )

    def ping(
        self,
    ) -> bool:
        self.log_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        return (
            self.log_path
            .parent
            .exists()
        )


class DatabaseConversationLogger:
    """
    Penyimpanan SQL untuk
    deployment production.
    """

    storage_name = "database"

    def __init__(
        self,
        database_url: str,
    ):
        if not (
            database_url
            .strip()
        ):
            raise ValueError(
                "DATABASE_URL wajib diisi "
                "ketika LOG_STORAGE=database."
            )

        self.engine = (
            self._create_engine(
                database_url
            )
        )

        self.metadata = (
            MetaData()
        )

        self.logs = Table(
            "conversation_logs",
            self.metadata,

            Column(
                "log_id",
                String(36),
                primary_key=True,
            ),

            Column(
                "timestamp_utc",
                DateTime(
                    timezone=True
                ),
                nullable=False,
            ),

            Column(
                "session_id",
                String(100),
                nullable=False,
                index=True,
            ),

            Column(
                "user_message",
                Text,
                nullable=False,
            ),

            Column(
                "bot_answer",
                Text,
            ),

            Column(
                "intent",
                String(120),
                index=True,
            ),

            Column(
                "intent_confidence",
                Float,
                nullable=False,
                default=0,
            ),

            Column(
                "category",
                String(180),
                index=True,
            ),

            Column(
                "matched_faq_id",
                String(50),
            ),

            Column(
                "matched_question",
                Text,
            ),

            Column(
                "retrieval_mode",
                String(50),
                index=True,
            ),

            Column(
                "slots_json",
                Text,
                nullable=False,
                default="{}",
            ),

            Column(
                "dialog_state",
                String(50),
            ),

            Column(
                "dialog_turn_type",
                String(50),
                index=True,
            ),

            Column(
                "confirmed",
                Boolean,
                nullable=False,
                default=False,
            ),

            Column(
                "cancelled",
                Boolean,
                nullable=False,
                default=False,
            ),

            Column(
                "processing_ms",
                Float,
                nullable=False,
                default=0,
            ),

            Column(
                "client_ip",
                String(255),
            ),

            Column(
                "user_agent",
                Text,
            ),
        )

        self.metadata.create_all(
            self.engine
        )

    @staticmethod
    def _create_engine(
        database_url: str,
    ) -> Engine:
        normalized = (
            database_url
            .strip()
        )

        if normalized.startswith(
            "postgres://"
        ):
            normalized = (
                "postgresql://"
                + normalized[
                    len(
                        "postgres://"
                    ):
                ]
            )

        if normalized.startswith(
            "postgresql://"
        ):
            normalized = (
                "postgresql+psycopg://"
                + normalized[
                    len(
                        "postgresql://"
                    ):
                ]
            )

        connect_args: dict[
            str,
            Any,
        ] = {}

        if normalized.startswith(
            "sqlite"
        ):
            connect_args[
                "check_same_thread"
            ] = False

        return create_engine(
            normalized,
            pool_pre_ping=True,
            connect_args=
                connect_args,
        )

    def append(
        self,
        *,
        session_id: str,
        user_message: str,
        reply: dict[
            str,
            Any,
        ],
        processing_ms: float,
        client_ip:
            str | None,
        user_agent:
            str | None,
    ) -> dict[
        str,
        Any,
    ]:
        record = _build_record(
            session_id=
                session_id,

            user_message=
                user_message,

            reply=
                reply,

            processing_ms=
                processing_ms,

            client_ip=
                client_ip,

            user_agent=
                user_agent,
        )

        timestamp = (
            datetime.fromisoformat(
                record[
                    "timestampUtc"
                ]
            )
        )

        with self.engine.begin() as connection:
            connection.execute(
                self.logs
                .insert()
                .values(
                    log_id=
                        record[
                            "logId"
                        ],

                    timestamp_utc=
                        timestamp,

                    session_id=
                        record[
                            "sessionId"
                        ],

                    user_message=
                        record[
                            "userMessage"
                        ],

                    bot_answer=
                        record[
                            "botAnswer"
                        ],

                    intent=
                        record[
                            "intent"
                        ],

                    intent_confidence=
                        float(
                            record[
                                "intentConfidence"
                            ]
                            or 0
                        ),

                    category=
                        record[
                            "category"
                        ],

                    matched_faq_id=
                        (
                            str(
                                record[
                                    "matchedFaqId"
                                ]
                            )
                            if record[
                                "matchedFaqId"
                            ]
                            is not None
                            else None
                        ),

                    matched_question=
                        record[
                            "matchedQuestion"
                        ],

                    retrieval_mode=
                        record[
                            "retrievalMode"
                        ],

                    slots_json=
                        json.dumps(
                            record[
                                "slots"
                            ],
                            ensure_ascii=False,
                            separators=(
                                ",",
                                ":",
                            ),
                        ),

                    dialog_state=
                        record[
                            "dialogState"
                        ],

                    dialog_turn_type=
                        record[
                            "dialogTurnType"
                        ],

                    confirmed=
                        record[
                            "confirmed"
                        ],

                    cancelled=
                        record[
                            "cancelled"
                        ],

                    processing_ms=
                        record[
                            "processingMs"
                        ],

                    client_ip=
                        record[
                            "clientIp"
                        ],

                    user_agent=
                        record[
                            "userAgent"
                        ],
                )
            )

        return record

    def summary(
        self,
    ) -> dict[
        str,
        Any,
    ]:
        statement = select(
            self.logs
            .c
            .timestamp_utc,

            self.logs
            .c
            .session_id,

            self.logs
            .c
            .intent,

            self.logs
            .c
            .category,

            self.logs
            .c
            .matched_question,

            self.logs
            .c
            .retrieval_mode,

            self.logs
            .c
            .dialog_turn_type,

            self.logs
            .c
            .confirmed,

            self.logs
            .c
            .cancelled,

            self.logs
            .c
            .processing_ms,
        )

        with self.engine.connect() as connection:
            rows = (
                connection
                .execute(
                    statement
                )
                .mappings()
                .all()
            )

        records = [
            {
                "timestampUtc":
                    (
                        row[
                            "timestamp_utc"
                        ].isoformat()
                        if row[
                            "timestamp_utc"
                        ]
                        else None
                    ),

                "sessionId":
                    row[
                        "session_id"
                    ],

                "intent":
                    row[
                        "intent"
                    ],

                "category":
                    row[
                        "category"
                    ],

                "matchedQuestion":
                    row[
                        "matched_question"
                    ],

                "retrievalMode":
                    row[
                        "retrieval_mode"
                    ],

                "dialogTurnType":
                    row[
                        "dialog_turn_type"
                    ],

                "confirmed":
                    row[
                        "confirmed"
                    ],

                "cancelled":
                    row[
                        "cancelled"
                    ],

                "processingMs":
                    row[
                        "processing_ms"
                    ],
            }

            for row in rows
        ]

        return analyze_records(
            records,
            source="database",
        )

    def ping(
        self,
    ) -> bool:
        with self.engine.connect() as connection:
            connection.execute(
                select(1)
            )

        return True


def create_conversation_logger(
    *,
    storage: str,
    log_path: Path,
    database_url: str,
) -> ConversationLogStore:
    normalized_storage = (
        storage
        .strip()
        .lower()
    )

    if (
        normalized_storage
        == "database"
    ):
        return (
            DatabaseConversationLogger(
                database_url
            )
        )

    if (
        normalized_storage
        == "jsonl"
    ):
        return (
            ConversationLogger(
                log_path
            )
        )

    raise ValueError(
        "LOG_STORAGE hanya mendukung "
        "nilai 'jsonl' atau 'database'."
    )