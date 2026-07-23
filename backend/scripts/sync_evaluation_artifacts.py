from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ARTIFACT_NAMES = (
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
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Menyalin artefak evaluasi dari backend Node.js lama "
            "ke folder laporan backend Flask."
        ),
    )

    parser.add_argument(
        "--source",
        type=Path,
        default=Path("../backend-node/analysis"),
        help="Folder analysis pada backend-node.",
    )

    parser.add_argument(
        "--destination",
        type=Path,
        default=Path("reports/model-evaluation"),
        help="Folder tujuan artefak evaluasi.",
    )

    args = parser.parse_args()

    if not args.source.exists():
        raise FileNotFoundError(
            f"Folder sumber tidak ditemukan: {args.source.resolve()}",
        )

    args.destination.mkdir(
        parents=True,
        exist_ok=True,
    )

    copied: list[str] = []
    missing: list[str] = []

    for name in ARTIFACT_NAMES:
        source_path = args.source / name

        if not source_path.exists():
            missing.append(name)
            continue

        shutil.copy2(
            source_path,
            args.destination / name,
        )

        copied.append(name)

    if not copied:
        raise RuntimeError(
            "Tidak ada artefak evaluasi yang berhasil disalin.",
        )

    print(f"Artefak tersalin : {len(copied)}")
    print(f"Artefak tidak ada: {len(missing)}")
    print(f"Tujuan           : {args.destination.resolve()}")

    if missing:
        print("File opsional yang tidak ditemukan:")

        for name in missing:
            print(f"- {name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())