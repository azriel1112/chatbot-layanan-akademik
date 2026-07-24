from __future__ import annotations

from flask import (
    Flask,
    jsonify,
)

from flask_cors import CORS

from config import Config

from src.routes.chat_routes import (
    chat_blueprint,
)

from src.routes.evaluation_routes import (
    evaluation_blueprint,
)

from src.services.conversation_logger import (
    create_conversation_logger,
)

from src.services.dialog_manager import (
    DialogManager,
)

from src.services.evaluation_service import (
    EvaluationService,
)

from src.services.faq_retrieval import (
    FaqRetrievalService,
)

from src.services.intent_classifier import (
    IntentClassifier,
)

from src.services.nlp_service import (
    NlpService,
)


def create_app(
    config_object:
        type[Config] = Config,
) -> Flask:
    app = Flask(
        __name__
    )

    app.config.from_object(
        config_object
    )

    CORS(
        app,

        resources={
            r"/api/*": {
                "origins":
                    app.config[
                        "CLIENT_ORIGINS"
                    ],
            },
        },

        methods=[
            "GET",
            "POST",
            "DELETE",
            "OPTIONS",
        ],

        allow_headers=[
            "Content-Type",
            "Authorization",
        ],
    )

    classifier = IntentClassifier(
        app.config[
            "INTENT_MODEL_PATH"
        ]
    )

    retrieval = FaqRetrievalService(
        app.config[
            "FAQ_DATA_PATH"
        ],

        app.config[
            "RUNTIME_ASSETS_PATH"
        ],
    )

    nlp = NlpService(
        classifier,
        retrieval,
    )

    dialog = DialogManager(
        nlp.get_bot_reply,

        session_ttl_seconds=
            app.config[
                "SESSION_TTL_SECONDS"
            ],

        max_sessions=
            app.config[
                "MAX_SESSIONS"
            ],
    )

    logger = (
        create_conversation_logger(
            storage=
                app.config[
                    "LOG_STORAGE"
                ],

            log_path=
                app.config[
                    "CONVERSATION_LOG_PATH"
                ],

            database_url=
                app.config[
                    "DATABASE_URL"
                ],
        )
    )

    evaluation = EvaluationService(
        app.config[
            "EVALUATION_ARTIFACTS_DIR"
        ]
    )

    app.extensions[
        "chatbot_services"
    ] = {
        "classifier":
            classifier,

        "retrieval":
            retrieval,

        "nlp":
            nlp,

        "dialog":
            dialog,

        "logger":
            logger,

        "evaluation":
            evaluation,
    }

    @app.get("/")
    def root():
        return jsonify({
            "message":
                (
                    "API Chatbot FAQ "
                    "Akademik Flask aktif."
                ),

            "health":
                "/api/health",
        })

    @app.get(
        "/api/health"
    )
    def health():
        log_ready = (
            logger.ping()
        )

        return jsonify({
            "success":
                True,

            "data": {
                "status":
                    (
                        "healthy"
                        if log_ready
                        else "degraded"
                    ),

                "framework":
                    "Flask",

                "environment":
                    app.config[
                        "ENVIRONMENT"
                    ],

                "algorithm":
                    classifier
                    .metadata
                    .get(
                        "algorithm"
                    ),

                "faqCount":
                    len(
                        retrieval.faqs
                    ),

                "intentCount":
                    len(
                        classifier.labels
                    ),

                "evaluationReady":
                    evaluation
                    .is_ready(),

                "logStorage":
                    logger
                    .storage_name,

                "logStorageReady":
                    log_ready,
            },
        })

    app.register_blueprint(
        chat_blueprint,
        url_prefix="/api",
    )

    app.register_blueprint(
        evaluation_blueprint,
        url_prefix="/api",
    )

    @app.errorhandler(
        FileNotFoundError
    )
    def handle_file_not_found(
        error: FileNotFoundError,
    ):
        return (
            jsonify({
                "success":
                    False,

                "message":
                    str(error),
            }),
            404,
        )

    @app.errorhandler(
        ValueError
    )
    def handle_value_error(
        error: ValueError,
    ):
        return (
            jsonify({
                "success":
                    False,

                "message":
                    str(error),
            }),
            400,
        )

    @app.errorhandler(
        Exception
    )
    def handle_unexpected_error(
        error: Exception,
    ):
        app.logger.exception(
            "Kesalahan layanan chatbot",
            exc_info=error,
        )

        return (
            jsonify({
                "success":
                    False,

                "message":
                    (
                        "Terjadi kesalahan "
                        "pada layanan chatbot."
                    ),
            }),
            500,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",

        port=
            app.config[
                "PORT"
            ],

        debug=False,
    )