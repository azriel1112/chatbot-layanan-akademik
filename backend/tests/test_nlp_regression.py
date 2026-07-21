from __future__ import annotations

import json
from pathlib import Path

import pytest

from config import Config

from src.services.faq_retrieval import (
    FaqRetrievalService,
)

from src.services.intent_classifier import (
    IntentClassifier,
)

from src.services.nlp_service import (
    NlpService,
)


@pytest.fixture(
    scope="module"
)
def nlp() -> NlpService:
    return NlpService(
        IntentClassifier(
            Config.INTENT_MODEL_PATH
        ),

        FaqRetrievalService(
            Config.FAQ_DATA_PATH,
            Config.RUNTIME_ASSETS_PATH,
        ),
    )


def test_flask_port_matches_node_baseline(
    nlp: NlpService,
):
    fixture_path = (
        Path(__file__).parent
        / "fixtures"
        / "node_baseline.json"
    )

    baseline = json.loads(
        fixture_path.read_text(
            encoding="utf-8",
        )
    )

    for expected in baseline:
        actual = nlp.get_bot_reply(
            expected["query"]
        )

        assert (
            actual["answer"]
            == expected["answer"]
        ), expected["query"]

        assert (
            actual.get(
                "matchedQuestion"
            )
            == expected[
                "matchedQuestion"
            ]
        ), expected["query"]

        assert (
            actual.get(
                "category"
            )
            == expected[
                "category"
            ]
        ), expected["query"]

        assert (
            actual.get(
                "intent"
            )
            == expected[
                "intent"
            ]
        ), expected["query"]

        assert (
            actual.get(
                "slots",
                {},
            )
            == expected[
                "slots"
            ]
        ), expected["query"]

        actual_suggestions = [
            item["id"]

            for item in actual.get(
                "suggestions",
                [],
            )
        ]

        assert (
            actual_suggestions
            == expected[
                "suggestionIds"
            ]
        ), expected["query"]

        assert actual.get(
            "confidence",
            0,
        ) == pytest.approx(
            expected[
                "confidence"
            ],

            abs=0.03,
        ), expected["query"]