from __future__ import annotations

from config import Config

from src.services.intent_classifier import (
    IntentClassifier,
)

from src.services.slot_filling import (
    extract_slots,
)


def test_slot_filling_core_scenarios():
    result = extract_slots(
        (
            "Apa mata kuliah semester 6 "
            "Informatika kurikulum 2025?"
        )
    )

    assert (
        result[
            "slots"
        ][
            "semester"
        ]
        == 6
    )

    assert (
        result[
            "slots"
        ][
            "studyProgram"
        ]
        == "teknik_informatika"
    )

    assert (
        result[
            "slots"
        ][
            "curriculumYear"
        ]
        == 2025
    )

    campus = extract_slots(
        (
            "Form surat keterangan "
            "untuk Kampus Menteng"
        )
    )

    assert (
        campus[
            "slots"
        ][
            "campus"
        ]
        == "menteng"
    )

    assert (
        campus[
            "slots"
        ][
            "service"
        ]
        == "surat_keterangan"
    )


def test_natural_model_json_is_loaded_without_sklearn():
    classifier = IntentClassifier(
        Config.INTENT_MODEL_PATH
    )

    result = classifier.predict(
        (
            "bagaimana cara bayar "
            "uang kuliah"
        )
    )

    assert (
        classifier
        .metadata[
            "algorithm"
        ]
        == (
            "TF-IDF + "
            "Logistic Regression"
        )
    )

    assert (
        result["intent"]
        == "pembayaran_dan_biaya"
    )

    assert (
        result["confidence"]
        > 0
    )