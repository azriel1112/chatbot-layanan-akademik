from __future__ import annotations

from typing import Any

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
    send_file,
)


evaluation_blueprint = Blueprint(
    "evaluation",
    __name__,
)


def _services() -> dict[str, Any]:
    return current_app.extensions[
        "chatbot_services"
    ]


@evaluation_blueprint.get(
    "/evaluation/summary"
)
def evaluation_summary():
    return jsonify(
        {
            "success": True,
            "data": _services()[
                "evaluation"
            ].summary(),
        }
    )


@evaluation_blueprint.get(
    "/evaluation/confusion-matrix"
)
def confusion_matrix():
    return jsonify(
        {
            "success": True,
            "data": _services()[
                "evaluation"
            ].confusion_matrix(),
        }
    )


@evaluation_blueprint.get(
    "/evaluation/misclassifications"
)
def misclassifications():
    limit = (
        request.args.get(
            "limit",
            default=20,
            type=int,
        )
        or 20
    )

    return jsonify(
        {
            "success": True,
            "data": _services()[
                "evaluation"
            ].misclassifications(
                limit
            ),
        }
    )


@evaluation_blueprint.get(
    "/evaluation/artifacts/<filename>"
)
def evaluation_artifact(
    filename: str,
):
    path = _services()[
        "evaluation"
    ].artifact_path(
        filename
    )

    return send_file(
        path,
        as_attachment=False,
        conditional=True,
    )


@evaluation_blueprint.get(
    "/logs/summary"
)
def log_summary():
    logger = _services()[
        "logger"
    ]

    return jsonify(
        {
            "success": True,
            "data": {
                **logger.summary(),
                "storage": logger.storage_name,
            },
        }
    )


@evaluation_blueprint.get(
    "/system/status"
)
def system_status():
    services = _services()

    logger = services[
        "logger"
    ]

    logger_ready = logger.ping()

    return jsonify(
        {
            "success": True,
            "data": {
                "status": (
                    "healthy"
                    if logger_ready
                    else "degraded"
                ),
                "framework": "Flask",
                "algorithm": services[
                    "classifier"
                ].metadata.get(
                    "algorithm"
                ),
                "faqCount": len(
                    services[
                        "retrieval"
                    ].faqs
                ),
                "intentCount": len(
                    services[
                        "classifier"
                    ].labels
                ),
                "evaluationReady": services[
                    "evaluation"
                ].is_ready(),
                "logStorage": logger.storage_name,
                "logStorageReady": logger_ready,
            },
        }
    )