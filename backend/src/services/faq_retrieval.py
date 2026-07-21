from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import Any

from .preprocessing import preprocess

from .slot_filling import (
    calculate_slot_match,
    extract_slots,
)

CATEGORY_TO_INTENT = {
    "Akreditasi":
        "akreditasi",

    "E-Learning dan Absensi":
        "elearning_dan_absensi",

    "Kalender Akademik":
        "kalender_dan_pengumuman",

    "Pengumuman Kampus":
        "kalender_dan_pengumuman",

    "Surat Edaran dan Kebijakan Kampus":
        "kebijakan_kampus",

    "Kerja Praktek":
        "kerja_praktek_dan_magang",

    "Magang Mandiri":
        "kerja_praktek_dan_magang",

    "Kurikulum":
        "kurikulum_dan_mata_kuliah",

    "Ekuivalensi Mata Kuliah":
        "kurikulum_dan_mata_kuliah",

    "Kurikulum Informatika":
        "kurikulum_dan_mata_kuliah",

    "Kurikulum Sistem Informasi":
        "kurikulum_dan_mata_kuliah",

    "Layanan Akademik dan Pelaporan":
        "layanan_akademik_dan_kontak",

    "Pelaporan Akademik":
        "layanan_akademik_dan_kontak",

    "BAK":
        "layanan_akademik_dan_kontak",

    "Kontak Penting":
        "layanan_akademik_dan_kontak",

    "Pembayaran dan Biaya Kuliah":
        "pembayaran_dan_biaya",

    "Perpustakaan dan Jurnal":
        "perpustakaan_dan_jurnal",

    "Seminar Proposal":
        "seminar_proposal",

    "Perubahan Status Mahasiswa":
        "status_dan_perpindahan_mahasiswa",

    "Pengajuan Cuti":
        "status_dan_perpindahan_mahasiswa",

    "Aktif Kembali dari Cuti":
        "status_dan_perpindahan_mahasiswa",

    "Pindah Program Studi":
        "status_dan_perpindahan_mahasiswa",

    "Pindah Lokasi Kampus":
        "status_dan_perpindahan_mahasiswa",

    "Pindah Program Perkuliahan":
        "status_dan_perpindahan_mahasiswa",

    "Surat Keterangan":
        "surat_dan_legalisir",

    "Legalisir":
        "surat_dan_legalisir",

    "Turnitin":
        "surat_dan_legalisir",

    "Buka Blok KRS":
        "surat_dan_legalisir",

    "Tugas Akhir":
        "tugas_akhir",
}


def _normalize_exact(
    text: object,
) -> str:
    normalized = re.sub(
        r"[^a-z0-9\s]",
        " ",
        str(text or "").lower(),
    )

    return re.sub(
        r"\s+",
        " ",
        normalized,
    ).strip()


def _cosine(
    vector_a: dict[str, float],
    vector_b: dict[str, float],
) -> float:
    terms = (
        set(vector_a)
        | set(vector_b)
    )

    dot = sum(
        vector_a.get(
            term,
            0.0,
        )
        * vector_b.get(
            term,
            0.0,
        )
        for term in terms
    )

    magnitude_a = math.sqrt(
        sum(
            value * value
            for value
            in vector_a.values()
        )
    )

    magnitude_b = math.sqrt(
        sum(
            value * value
            for value
            in vector_b.values()
        )
    )

    if (
        magnitude_a == 0
        or magnitude_b == 0
    ):
        return 0.0

    return (
        dot
        / (
            magnitude_a
            * magnitude_b
        )
    )


class FaqRetrievalService:
    def __init__(
        self,
        data_path: Path,
        runtime_assets_path:
            Path | None = None,
    ):
        self.faqs: list[
            dict[str, Any]
        ] = json.loads(
            data_path.read_text(
                encoding="utf-8",
            )
        )

        if (
            not isinstance(
                self.faqs,
                list,
            )
            or not self.faqs
        ):
            raise ValueError(
                "Dataset FAQ JSON "
                "tidak boleh kosong."
            )

        self.faq_by_id = {
            faq["id"]: faq
            for faq in self.faqs
        }

        assets = None

        if (
            runtime_assets_path
            and runtime_assets_path.exists()
        ):
            assets = json.loads(
                runtime_assets_path
                .read_text(
                    encoding="utf-8",
                )
            )

            if (
                assets.get(
                    "version"
                )
                != 1
                or assets.get(
                    "faqCount"
                )
                != len(self.faqs)
            ):
                raise ValueError(
                    "Runtime assets FAQ "
                    "tidak sesuai dengan "
                    "dataset JSON."
                )

        if assets:
            self.document_frequency = (
                Counter(
                    assets[
                        "documentFrequency"
                    ]
                )
            )

            self.total_documents = (
                len(self.faqs)
            )

            self.documents = []

            for item in assets[
                "faqIndex"
            ]:
                faq = self.faq_by_id.get(
                    item["id"]
                )

                if not faq:
                    raise ValueError(
                        "FAQ id "
                        f"{item['id']} "
                        "pada runtime assets "
                        "tidak ditemukan."
                    )

                self.documents.append({
                    "faq":
                        faq,

                    "intent":
                        item["intent"],

                    "slots":
                        item["slots"],

                    "vector": {
                        key: float(value)

                        for key, value
                        in item[
                            "vector"
                        ].items()
                    },
                })

            return

        self.documents = []

        document_frequency: Counter[
            str
        ] = Counter()

        prepared: list[
            dict[str, Any]
        ] = []

        for faq in self.faqs:
            intent = (
                CATEGORY_TO_INTENT
                .get(
                    faq.get(
                        "category"
                    )
                )
            )

            if not intent:
                raise ValueError(
                    "Kategori FAQ belum "
                    "memiliki pemetaan intent: "
                    f"{faq.get('category')}"
                )

            tokens = preprocess(
                " ".join([
                    str(
                        faq.get(
                            "category",
                            "",
                        )
                    ),

                    str(
                        faq.get(
                            "question",
                            "",
                        )
                    ),

                    str(
                        faq.get(
                            "answer",
                            "",
                        )
                    ),

                    *[
                        str(item)
                        for item
                        in faq.get(
                            "keywords",
                            [],
                        )
                    ],
                ])
            )

            for token in set(tokens):
                document_frequency[
                    token
                ] += 1

            slot_text = " ".join([
                str(
                    faq.get(
                        "category",
                        "",
                    )
                ),

                str(
                    faq.get(
                        "question",
                        "",
                    )
                ),

                *[
                    str(item)
                    for item
                    in faq.get(
                        "keywords",
                        [],
                    )
                ],
            ])

            prepared.append({
                "faq":
                    faq,

                "intent":
                    intent,

                "tokens":
                    tokens,

                "slots":
                    extract_slots(
                        slot_text
                    )["slots"],
            })

        self.document_frequency = (
            document_frequency
        )

        self.total_documents = (
            len(prepared)
        )

        self.documents = []

        for item in prepared:
            tokens = item.pop(
                "tokens"
            )

            self.documents.append({
                **item,

                "vector":
                    self._tfidf(
                        tokens
                    ),
            })

    def _tfidf(
        self,
        tokens: list[str],
    ) -> dict[str, float]:
        frequencies = Counter(
            tokens
        )

        return {
            term:
                frequency
                * (
                    math.log(
                        (
                            self.total_documents
                            + 1
                        )
                        / (
                            self.document_frequency
                            .get(
                                term,
                                0,
                            )
                            + 1
                        )
                    )
                    + 1
                )

            for term, frequency
            in frequencies.items()
        }

    @staticmethod
    def _question_coverage(
        user_tokens: list[str],
        question_tokens: list[str],
    ) -> float:
        unique_user = set(
            user_tokens
        )

        if not unique_user:
            return 0.0

        return (
            len(
                unique_user
                & set(
                    question_tokens
                )
            )
            / len(unique_user)
        )

    def rank(
        self,
        message: str,
        *,
        intent: str | None = None,
        slots:
            dict[str, Any]
            | None = None,
    ) -> list[dict[str, Any]]:
        user_tokens = preprocess(
            message
        )

        user_vector = self._tfidf(
            user_tokens
        )

        user_slots = (
            slots
            if slots is not None
            else extract_slots(
                message
            )["slots"]
        )

        normalized_message = (
            _normalize_exact(
                message
            )
        )

        ranked: list[
            dict[str, Any]
        ] = []

        for document in (
            self.documents
        ):
            if (
                intent
                and document[
                    "intent"
                ]
                != intent
            ):
                continue

            faq = document["faq"]

            score = _cosine(
                user_vector,
                document["vector"],
            )

            if (
                normalized_message
                == _normalize_exact(
                    faq.get(
                        "question",
                        "",
                    )
                )
            ):
                score += 0.45
            else:
                score += (
                    self
                    ._question_coverage(
                        user_tokens,

                        preprocess(
                            faq.get(
                                "question",
                                "",
                            )
                        ),
                    )
                    * 0.08
                )

            slot_match = (
                calculate_slot_match(
                    user_slots,
                    document["slots"],
                )
            )

            score += slot_match[
                "score"
            ]

            ranked.append({
                **faq,

                "intent":
                    document[
                        "intent"
                    ],

                "score":
                    max(
                        0.0,
                        min(
                            1.0,
                            score,
                        ),
                    ),

                "slotScore":
                    slot_match[
                        "score"
                    ],

                "matchedSlotTypes":
                    slot_match[
                        "matches"
                    ],

                "mismatchedSlotTypes":
                    slot_match[
                        "mismatches"
                    ],
            })

        ranked.sort(
            key=lambda item: (
                -item["score"],
                -item["slotScore"],
                item["id"],
            )
        )

        return ranked

    @staticmethod
    def suggestions(
        ranked:
            list[dict[str, Any]],
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        return [
            {
                "id":
                    faq["id"],

                "question":
                    faq["question"],

                "category":
                    faq["category"],

                "intent":
                    faq["intent"],

                "score":
                    round(
                        faq["score"],
                        3,
                    ),
            }

            for faq in ranked[:limit]
        ]