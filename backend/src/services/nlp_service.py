from __future__ import annotations

from typing import Any

from .faq_retrieval import (
    FaqRetrievalService,
)

from .intent_classifier import (
    IntentClassifier,
)

from .slot_filling import (
    extract_slots,
)


class NlpService:
    MINIMUM_INTENT_CONFIDENCE = 0.10
    MINIMUM_INTENT_MARGIN = 0.01
    MINIMUM_FAQ_SCORE = 0.12
    GLOBAL_OVERRIDE_MARGIN = 0.12

    def __init__(
        self,
        classifier:
            IntentClassifier,
        retrieval:
            FaqRetrievalService,
    ):
        self.classifier = classifier
        self.retrieval = retrieval

    @staticmethod
    def _round(
        value:
            float
            | int
            | None,
    ) -> float:
        return round(
            float(value or 0),
            6,
        )

    def get_bot_reply(
        self,
        message: str,
    ) -> dict[str, Any]:
        normalized = str(
            message or ""
        ).strip()

        if not normalized:
            raise ValueError(
                "Pesan tidak boleh kosong."
            )

        slot_result = (
            extract_slots(
                normalized
            )
        )

        prediction = (
            self.classifier.predict(
                normalized,
                top_k=3,
            )
        )

        classifications = (
            prediction.get(
                "classifications",
                [],
            )
        )

        first = (
            classifications[0]
            if classifications
            else None
        )

        second = (
            classifications[1]
            if len(
                classifications
            ) > 1
            else None
        )

        margin = (
            first.get(
                "confidence",
                0,
            )
            if first
            else 0
        ) - (
            second.get(
                "confidence",
                0,
            )
            if second
            else 0
        )

        accepted = bool(
            prediction.get(
                "intent"
            )

            and not prediction.get(
                "isUnknown"
            )

            and prediction.get(
                "confidence",
                0,
            )
            >= self
            .MINIMUM_INTENT_CONFIDENCE

            and margin
            >= self
            .MINIMUM_INTENT_MARGIN
        )

        global_ranking = (
            self.retrieval.rank(
                normalized,

                slots=
                    slot_result[
                        "slots"
                    ],
            )
        )

        intent_ranking = (
            self.retrieval.rank(
                normalized,

                intent=
                    prediction[
                        "intent"
                    ],

                slots=
                    slot_result[
                        "slots"
                    ],
            )

            if accepted
            else []
        )

        global_best = (
            global_ranking[0]
            if global_ranking
            else None
        )

        intent_best = (
            intent_ranking[0]
            if intent_ranking
            else None
        )

        if (
            not accepted
            or not intent_best
        ):
            ranking = (
                global_ranking
            )

            retrieval_mode = (
                "global_fallback"
            )

        elif (
            global_best

            and global_best[
                "intent"
            ]
            != intent_best[
                "intent"
            ]

            and global_best[
                "score"
            ]
            >= intent_best[
                "score"
            ]
            + self
            .GLOBAL_OVERRIDE_MARGIN
        ):
            ranking = (
                global_ranking
            )

            retrieval_mode = (
                "global_override"
            )

        else:
            ranking = (
                intent_ranking
            )

            retrieval_mode = (
                "intent_filtered"
            )

        best = (
            ranking[0]
            if ranking
            else None
        )

        common = {
            "intent":
                prediction.get(
                    "intent"
                ),

            "intentConfidence":
                self._round(
                    prediction.get(
                        "confidence"
                    )
                ),

            "intentMargin":
                self._round(
                    margin
                ),

            "intentAccepted":
                accepted,

            "intentAlternatives":
                prediction.get(
                    "classifications",
                    [],
                ),

            "slots":
                slot_result[
                    "slots"
                ],

            "slotDetails":
                slot_result[
                    "details"
                ],

            "slotCount":
                slot_result[
                    "detectedCount"
                ],

            "retrievalMode":
                retrieval_mode,

            "suggestions":
                self.retrieval
                .suggestions(
                    ranking
                ),
        }

        if (
            not best
            or best["score"]
            < self.MINIMUM_FAQ_SCORE
        ):
            return {
                "answer":
                    (
                        "Maaf, saya belum menemukan "
                        "jawaban yang cukup sesuai. "
                        "Coba gunakan kata kunci "
                        "akademik yang lebih spesifik, "
                        "misalnya KRS, biaya kuliah, "
                        "cuti, kerja praktek, seminar "
                        "proposal, tugas akhir, atau "
                        "surat mahasiswa aktif."
                    ),

                "confidence":
                    0,

                "matchedQuestion":
                    None,

                "category":
                    None,

                "matchedSlotTypes":
                    [],

                **common,

                "retrievalMode":
                    "no_match",
            }

        return {
            "answer":
                best["answer"],

            "confidence":
                round(
                    best["score"],
                    3,
                ),

            "matchedQuestion":
                best["question"],

            "category":
                best["category"],

            "matchedFaqId":
                best["id"],

            "matchedIntent":
                best["intent"],

            "matchedSlotTypes":
                best[
                    "matchedSlotTypes"
                ],

            "slotScore":
                self._round(
                    best[
                        "slotScore"
                    ]
                ),

            **common,
        }