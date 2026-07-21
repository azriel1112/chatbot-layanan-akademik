from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from .preprocessing import preprocess


class IntentClassifier:
    def __init__(
        self,
        model_path: Path,
    ):
        payload = json.loads(
            model_path.read_text(
                encoding="utf-8",
            )
        )

        if (
            payload.get(
                "formatVersion"
            )
            != 1
        ):
            raise ValueError(
                "Format intent classifier "
                "tidak didukung."
            )

        vectorizer = payload.get(
            "vectorizer",
            {},
        )

        classifier = (
            payload
            .get(
                "classifier",
                {},
            )
            .get(
                "wrapper",
                {},
            )
            .get(
                "classifier",
                {},
            )
        )

        self.metadata: dict[
            str,
            Any,
        ] = payload.get(
            "metadata",
            {},
        )

        self.vocabulary: list[str] = (
            vectorizer.get(
                "vocabulary",
                [],
            )
        )

        self.idf: list[float] = (
            vectorizer.get(
                "idf",
                [],
            )
        )

        self.labels: list[str] = (
            classifier.get(
                "classifications",
                [],
            )
        )

        self.theta: list[
            list[float]
        ] = [
            row.get(
                "elements",
                [],
            )
            for row in classifier.get(
                "theta",
                [],
            )
        ]

        self.index = {
            token: index
            for index, token
            in enumerate(
                self.vocabulary
            )
        }

        if (
            not self.vocabulary
            or len(
                self.vocabulary
            )
            != len(self.idf)
        ):
            raise ValueError(
                "Vocabulary atau IDF "
                "intent classifier tidak valid."
            )

        if (
            len(self.labels)
            != len(self.theta)
        ):
            raise ValueError(
                "Label dan bobot Logistic "
                "Regression tidak sesuai."
            )

        if any(
            len(row)
            != len(
                self.vocabulary
            )
            for row in self.theta
        ):
            raise ValueError(
                "Dimensi bobot Logistic "
                "Regression tidak sesuai."
            )

    def _vectorize(
        self,
        tokens: list[str],
    ) -> list[float]:
        counts: dict[int, int] = {}

        for token in tokens:
            index = self.index.get(
                token
            )

            if index is not None:
                counts[index] = (
                    counts.get(
                        index,
                        0,
                    )
                    + 1
                )

        vector = [
            0.0
        ] * len(
            self.vocabulary
        )

        for (
            index,
            count,
        ) in counts.items():
            vector[index] = (
                1.0
                + math.log(count)
            ) * self.idf[index]

        magnitude = math.sqrt(
            sum(
                value * value
                for value in vector
            )
        )

        if magnitude == 0:
            return vector

        return [
            value / magnitude
            for value in vector
        ]

    @staticmethod
    def _sigmoid(
        value: float,
    ) -> float:
        if value >= 0:
            exp_value = math.exp(
                -value
            )

            return (
                1.0
                / (
                    1.0
                    + exp_value
                )
            )

        exp_value = math.exp(
            value
        )

        return (
            exp_value
            / (
                1.0
                + exp_value
            )
        )

    def predict(
        self,
        text: str,
        top_k: int = 3,
    ) -> dict[str, Any]:
        tokens = preprocess(text)

        vector = self._vectorize(
            tokens
        )

        if not any(
            value != 0
            for value in vector
        ):
            return {
                "intent": None,
                "confidence": 0,
                "isUnknown": True,
                "tokens": tokens,
                "classifications": [],
            }

        scored: list[
            dict[
                str,
                float | str,
            ]
        ] = []

        for (
            label,
            theta,
        ) in zip(
            self.labels,
            self.theta,
            strict=True,
        ):
            dot = sum(
                value * weight
                for value, weight
                in zip(
                    vector,
                    theta,
                    strict=True,
                )
            )

            scored.append({
                "intent": label,
                "rawScore":
                    self._sigmoid(dot),
            })

        total = sum(
            float(
                item["rawScore"]
            )
            for item in scored
        )

        for item in scored:
            item["confidence"] = (
                float(
                    item["rawScore"]
                )
                / total
                if total
                else 0.0
            )

        scored.sort(
            key=lambda item:
                float(
                    item["confidence"]
                ),
            reverse=True,
        )

        best = (
            scored[0]
            if scored
            else None
        )

        classifications = [
            {
                "intent":
                    str(
                        item["intent"]
                    ),

                "confidence":
                    round(
                        float(
                            item[
                                "confidence"
                            ]
                        ),
                        6,
                    ),

                "rawScore":
                    round(
                        float(
                            item[
                                "rawScore"
                            ]
                        ),
                        6,
                    ),
            }
            for item in scored[
                :max(
                    1,
                    top_k,
                )
            ]
        ]

        return {
            "intent":
                str(
                    best["intent"]
                )
                if best
                else None,

            "confidence":
                round(
                    float(
                        best[
                            "confidence"
                        ]
                    ),
                    6,
                )
                if best
                else 0,

            "isUnknown":
                best is None,

            "tokens":
                tokens,

            "classifications":
                classifications,
        }