from __future__ import annotations

import time
from typing import Any

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
)

from ..services.dialog_manager import (
    is_valid_session_id,
)

chat_blueprint = Blueprint(
    "chat",
    __name__,
)


def _services() -> dict[
    str,
    Any,
]:
    return current_app.extensions[
        "chatbot_services"
    ]


@chat_blueprint.get(
    "/faqs"
)
def get_faqs():
    return jsonify({
        "success":
            True,

        "data":
            _services()[
                "retrieval"
            ].faqs,
    })


@chat_blueprint.post(
    "/chat"
)
def post_chat():
    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    message = str(
        payload.get(
            "message"
        )
        or ""
    ).strip()

    session_id = (
        str(
            payload.get(
                "sessionId"
            )
            or ""
        ).strip()
        or None
    )

    if not message:
        return (
            jsonify({
                "success":
                    False,

                "message":
                    (
                        "Pesan tidak "
                        "boleh kosong."
                    ),
            }),
            400,
        )

    if (
        session_id
        and not is_valid_session_id(
            session_id
        )
    ):
        return (
            jsonify({
                "success":
                    False,

                "message":
                    (
                        "Format sessionId tidak valid. "
                        "Muat ulang halaman untuk "
                        "membuat sesi baru."
                    ),
            }),
            400,
        )

    started = (
        time.perf_counter()
    )

    reply = _services()[
        "dialog"
    ].process_turn(
        message=message,
        session_id=session_id,
    )

    processing_ms = (
        time.perf_counter()
        - started
    ) * 1000

    _services()[
        "logger"
    ].append(
        session_id=
            reply["sessionId"],

        user_message=
            message,

        reply=
            reply,

        processing_ms=
            processing_ms,

        client_ip=
            request.headers.get(
                "X-Forwarded-For",

                request.remote_addr,
            ),

        user_agent=
            request.headers.get(
                "User-Agent"
            ),
    )

    return jsonify({
        "success":
            True,

        "data":
            reply,
    })


@chat_blueprint.delete(
    "/chat/session/<session_id>"
)
def delete_session(
    session_id: str,
):
    if not is_valid_session_id(
        session_id
    ):
        return (
            jsonify({
                "success":
                    False,

                "message":
                    (
                        "Format sessionId "
                        "tidak valid."
                    ),
            }),
            400,
        )

    removed = _services()[
        "dialog"
    ].reset_session(
        session_id
    )

    return jsonify({
        "success":
            True,

        "data": {
            "sessionId":
                session_id,

            "removed":
                removed,
        },
    })