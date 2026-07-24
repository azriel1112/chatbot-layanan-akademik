from __future__ import annotations

import csv
import json

from pathlib import Path
from typing import Any


class EvaluationService:
    ALLOWED_ARTIFACTS = {
        "classification_report.md",
        "confusion_matrix.csv",
        "confusion_matrix.svg",
        "dataset_report.md",
        "dataset_summary.json",
        "intent_dataset_preprocessed.csv",
        "intent_distribution.csv",
        "intent_distribution.svg",
        "misclassified_examples.csv",
        "model_metrics.json",
        "model_split.json",
        "preprocessing_examples.csv",
    }

    DEFAULT_LIMITATIONS = [
        (
            "Evaluasi menggunakan satu stratified train-test split "
            "sehingga nilai metrik dapat berubah pada pembagian data lain."
        ),
        (
            "Dataset berisi pertanyaan FAQ yang relatif formal "
            "sehingga variasi bahasa percakapan nyata masih terbatas."
        ),
        (
            "Dataset belum memiliki kelas khusus pertanyaan di luar domain; "
            "penolakan unknown dilakukan melalui threshold retrieval."
        ),
        (
            "Nilai confidence berasal dari normalisasi skor one-vs-rest "
            "Logistic Regression dan belum dikalibrasi sebagai probabilitas."
        ),
        (
            "Session dialog disimpan di memory proses dan akan kembali "
            "kosong ketika backend direstart."
        ),
    ]

    def __init__(
        self,
        artifacts_directory: Path,
    ):
        self.artifacts_directory = (
            artifacts_directory
        )

    def _path(
        self,
        filename: str,
    ) -> Path:
        if (
            filename
            not in self.ALLOWED_ARTIFACTS
        ):
            raise ValueError(
                "Nama artefak evaluasi "
                "tidak diizinkan."
            )

        path = (
            self.artifacts_directory
            / filename
        )

        if not path.exists():
            raise FileNotFoundError(
                "Artefak evaluasi "
                f"belum tersedia: {filename}"
            )

        return path

    def _read_json(
        self,
        filename: str,
    ) -> dict[
        str,
        Any,
    ]:
        payload = json.loads(
            self
            ._path(filename)
            .read_text(
                encoding="utf-8",
            )
        )

        if not isinstance(
            payload,
            dict,
        ):
            raise ValueError(
                f"{filename} harus berupa "
                "JSON object."
            )

        return payload

    def _read_csv(
        self,
        filename: str,
    ) -> list[
        dict[
            str,
            str,
        ]
    ]:
        with self._path(
            filename
        ).open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:
            return list(
                csv.DictReader(
                    file
                )
            )

    def is_ready(
        self,
    ) -> bool:
        required = {
            "model_metrics.json",
            "confusion_matrix.csv",
            "misclassified_examples.csv",
        }

        return all(
            (
                self.artifacts_directory
                / filename
            ).exists()

            for filename
            in required
        )

    @staticmethod
    def _percent(
        value: Any,
    ) -> float:
        return round(
            float(
                value or 0
            )
            * 100,
            2,
        )

    def summary(
        self,
    ) -> dict[
        str,
        Any,
    ]:
        metrics = self._read_json(
            "model_metrics.json"
        )

        metadata = (
            metrics.get(
                "modelMetadata"
            )
            or {}
        )

        macro = (
            metrics.get(
                "macroAverage"
            )
            or {}
        )

        weighted = (
            metrics.get(
                "weightedAverage"
            )
            or {}
        )

        per_intent = (
            metrics.get(
                "perIntent"
            )
            or []
        )

        normalized_per_intent = [
            {
                "intent":
                    row.get(
                        "intent"
                    ),

                "precision":
                    self._percent(
                        row.get(
                            "precision"
                        )
                    ),

                "recall":
                    self._percent(
                        row.get(
                            "recall"
                        )
                    ),

                "f1Score":
                    self._percent(
                        row.get(
                            "f1Score"
                        )
                    ),

                "support":
                    int(
                        row.get(
                            "support"
                        )
                        or 0
                    ),

                "truePositive":
                    int(
                        row.get(
                            "truePositive"
                        )
                        or 0
                    ),

                "falsePositive":
                    int(
                        row.get(
                            "falsePositive"
                        )
                        or 0
                    ),

                "falseNegative":
                    int(
                        row.get(
                            "falseNegative"
                        )
                        or 0
                    ),
            }

            for row
            in per_intent
        ]

        worst_intents = sorted(
            normalized_per_intent,

            key=lambda row: (
                row[
                    "f1Score"
                ],

                row[
                    "recall"
                ],

                str(
                    row[
                        "intent"
                    ]
                ),
            ),
        )[:5]

        confusion_pairs: list[
            dict[
                str,
                Any,
            ]
        ] = []

        matrix = (
            metrics.get(
                "confusionMatrix"
            )
            or {}
        )

        for (
            actual,
            predictions,
        ) in matrix.items():
            if not isinstance(
                predictions,
                dict,
            ):
                continue

            for (
                predicted,
                count,
            ) in predictions.items():
                numeric_count = int(
                    count or 0
                )

                if (
                    actual
                    == predicted

                    or numeric_count
                    <= 0
                ):
                    continue

                confusion_pairs.append({
                    "actualIntent":
                        actual,

                    "predictedIntent":
                        predicted,

                    "count":
                        numeric_count,
                })

        confusion_pairs.sort(
            key=lambda row: (
                -row[
                    "count"
                ],

                row[
                    "actualIntent"
                ],

                row[
                    "predictedIntent"
                ],
            )
        )

        return {
            "model": {
                "algorithm":
                    metadata.get(
                        "algorithm"
                    ),

                "datasetSize":
                    int(
                        metadata.get(
                            "datasetSize"
                        )
                        or 0
                    ),

                "trainingSize":
                    int(
                        metadata.get(
                            "trainingSize"
                        )
                        or 0
                    ),

                "testSize":
                    int(
                        metadata.get(
                            "testSize"
                        )
                        or 0
                    ),

                "testRatio":
                    float(
                        metadata.get(
                            "testRatio"
                        )
                        or 0
                    ),

                "randomSeed":
                    metadata.get(
                        "randomSeed"
                    ),

                "vocabularySize":
                    int(
                        metadata.get(
                            "vocabularySize"
                        )
                        or 0
                    ),

                "intentCount":
                    len(
                        metadata.get(
                            "labels"
                        )
                        or []
                    ),

                "correctPredictions":
                    int(
                        metrics.get(
                            "correctPredictions"
                        )
                        or 0
                    ),

                "incorrectPredictions":
                    int(
                        metrics.get(
                            "incorrectPredictions"
                        )
                        or 0
                    ),
            },

            "metrics": {
                "accuracy":
                    self._percent(
                        metrics.get(
                            "accuracy"
                        )
                    ),

                "macroPrecision":
                    self._percent(
                        macro.get(
                            "precision"
                        )
                    ),

                "macroRecall":
                    self._percent(
                        macro.get(
                            "recall"
                        )
                    ),

                "macroF1Score":
                    self._percent(
                        macro.get(
                            "f1Score"
                        )
                    ),

                "weightedPrecision":
                    self._percent(
                        weighted.get(
                            "precision"
                        )
                    ),

                "weightedRecall":
                    self._percent(
                        weighted.get(
                            "recall"
                        )
                    ),

                "weightedF1Score":
                    self._percent(
                        weighted.get(
                            "f1Score"
                        )
                    ),
            },

            "perIntent":
                normalized_per_intent,

            "worstIntents":
                worst_intents,

            "confusionPairs":
                confusion_pairs,

            "limitations":
                list(
                    self.DEFAULT_LIMITATIONS
                ),

            "artifacts": {
                "confusionMatrixSvg":
                    (
                        "/api/evaluation/artifacts/"
                        "confusion_matrix.svg"
                    ),

                "confusionMatrixCsv":
                    (
                        "/api/evaluation/artifacts/"
                        "confusion_matrix.csv"
                    ),

                "classificationReport":
                    (
                        "/api/evaluation/artifacts/"
                        "classification_report.md"
                    ),

                "misclassifiedExamples":
                    (
                        "/api/evaluation/artifacts/"
                        "misclassified_examples.csv"
                    ),

                "intentDistributionSvg":
                    (
                        "/api/evaluation/artifacts/"
                        "intent_distribution.svg"
                    ),

                "preprocessingExamples":
                    (
                        "/api/evaluation/artifacts/"
                        "preprocessing_examples.csv"
                    ),
            },
        }

    def confusion_matrix(
        self,
    ) -> dict[
        str,
        Any,
    ]:
        rows = self._read_csv(
            "confusion_matrix.csv"
        )

        if not rows:
            return {
                "labels": [],
                "rows": [],
            }

        labels = [
            key

            for key
            in rows[0].keys()

            if key
            != "actual_intent"
        ]

        matrix_rows = [
            {
                "actualIntent":
                    row.get(
                        "actual_intent"
                    ),

                "values": [
                    int(
                        row.get(
                            label
                        )
                        or 0
                    )

                    for label
                    in labels
                ],
            }

            for row
            in rows
        ]

        return {
            "labels":
                labels,

            "rows":
                matrix_rows,
        }

    def misclassifications(
        self,
        limit: int = 20,
    ) -> list[
        dict[
            str,
            Any,
        ]
    ]:
        safe_limit = max(
            1,
            min(
                int(limit),
                100,
            ),
        )

        rows = self._read_csv(
            "misclassified_examples.csv"
        )

        return [
            {
                "id":
                    row.get(
                        "id"
                    ),

                "text":
                    row.get(
                        "text"
                    ),

                "actualIntent":
                    row.get(
                        "actual_intent"
                    ),

                "predictedIntent":
                    row.get(
                        "predicted_intent"
                    ),

                "confidence":
                    round(
                        float(
                            row.get(
                                "confidence"
                            )
                            or 0
                        )
                        * 100,
                        2,
                    ),

                "topPredictions":
                    row.get(
                        "top_3_predictions"
                    ),
            }

            for row
            in rows[
                :safe_limit
            ]
        ]

    def artifact_path(
        self,
        filename: str,
    ) -> Path:
        return self._path(
            filename
        )