from __future__ import annotations

import csv
import json
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
import sys
from typing import Any, Callable


SCRIPT_BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(SCRIPT_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_BACKEND_DIR))


from app import create_app
from config import BASE_DIR, Config
from src.services.log_analyzer import analyze_conversation_log


PROJECT_ROOT = BASE_DIR.parent
REPORT_DIRECTORY = BASE_DIR / "reports"
REPORT_JSON_PATH = REPORT_DIRECTORY / "final_verification.json"
REPORT_MARKDOWN_PATH = REPORT_DIRECTORY / "final_verification.md"


@dataclass
class CheckResult:
    name: str
    status: str
    details: str


class VerificationContext:
    def __init__(self) -> None:
        self.results: list[CheckResult] = []

    def check(
        self,
        name: str,
        callback: Callable[[], str],
    ) -> None:
        try:
            details = callback()

        except Exception as error:
            self.results.append(
                CheckResult(
                    name=name,
                    status="failed",
                    details=f"{type(error).__name__}: {error}",
                )
            )

            return

        self.results.append(
            CheckResult(
                name=name,
                status="passed",
                details=details,
            )
        )

    @property
    def passed(self) -> int:
        return sum(
            result.status == "passed"
            for result in self.results
        )

    @property
    def failed(self) -> int:
        return sum(
            result.status == "failed"
            for result in self.results
        )


def _load_json(
    path: Path,
) -> dict[str, Any] | list[Any]:
    if not path.exists():
        raise FileNotFoundError(path)

    return json.loads(
        path.read_text(
            encoding="utf-8",
        )
    )


def _find_existing_path(
    candidates: list[Path],
) -> Path:
    for path in candidates:
        if path.exists():
            return path

    joined = "\n".join(
        f"- {path}"
        for path in candidates
    )

    raise FileNotFoundError(
        f"Tidak ada file yang ditemukan dari kandidat:\n{joined}"
    )


def _check_runtime_assets() -> str:
    required = [
        Config.FAQ_DATA_PATH,
        Config.RUNTIME_ASSETS_PATH,
        Config.INTENT_MODEL_PATH,
    ]

    missing = [
        path
        for path in required
        if not path.exists()
    ]

    if missing:
        raise FileNotFoundError(
            "Asset runtime tidak lengkap: "
            + ", ".join(
                str(path)
                for path in missing
            ),
        )

    faqs = _load_json(
        Config.FAQ_DATA_PATH
    )

    runtime_assets = _load_json(
        Config.RUNTIME_ASSETS_PATH
    )

    model = _load_json(
        Config.INTENT_MODEL_PATH
    )

    if not isinstance(faqs, list) or len(faqs) < 1:
        raise ValueError(
            "Dataset FAQ JSON kosong atau tidak valid."
        )

    if not isinstance(runtime_assets, dict):
        raise ValueError(
            "runtime_assets.json tidak valid."
        )

    if runtime_assets.get("faqCount") != len(faqs):
        raise ValueError(
            "Jumlah FAQ pada runtime assets tidak sesuai."
        )

    labels = (
        model.get("classifier", {})
        .get("wrapper", {})
        .get("classifier", {})
        .get("classifications", [])
    )

    if len(labels) < 4:
        raise ValueError(
            "Model memiliki kurang dari empat intent."
        )

    return (
        f"{len(faqs)} FAQ dan "
        f"{len(labels)} intent tersedia."
    )


def _check_intent_dataset() -> str:
    csv_candidates = [
        PROJECT_ROOT
        / "backend-node"
        / "data"
        / "intent_dataset.csv",

        BASE_DIR
        / "data"
        / "intent_dataset.csv",
    ]

    existing_csv = next(
        (
            path
            for path in csv_candidates
            if path.exists()
        ),
        None,
    )

    if existing_csv:
        with existing_csv.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:
            rows = list(
                csv.DictReader(file)
            )

        if len(rows) < 200:
            raise ValueError(
                f"Dataset hanya memiliki {len(rows)} utterance."
            )

        intent_values = {
            str(
                row.get(
                    "intent",
                    "",
                )
            ).strip()
            for row in rows
            if str(
                row.get(
                    "intent",
                    "",
                )
            ).strip()
        }

        if len(intent_values) < 4:
            raise ValueError(
                "Dataset memiliki kurang dari empat intent."
            )

        return (
            f"{len(rows)} utterance dan "
            f"{len(intent_values)} intent "
            f"divalidasi dari {existing_csv}."
        )

    model = _load_json(
        Config.INTENT_MODEL_PATH
    )

    metadata = (
        model.get("metadata", {})
        if isinstance(model, dict)
        else {}
    )

    dataset_size = int(
        metadata.get(
            "datasetSize",
            0,
        )
    )

    labels = metadata.get(
        "labels",
        [],
    )

    if dataset_size < 200 or len(labels) < 4:
        raise FileNotFoundError(
            "intent_dataset.csv tidak ditemukan dan metadata model "
            "tidak cukup untuk memverifikasi persyaratan dataset."
        )

    return (
        f"{dataset_size} utterance dan "
        f"{len(labels)} intent "
        "divalidasi melalui metadata model."
    )


def _check_model_evaluation() -> str:
    metrics_path = _find_existing_path(
        [
            BASE_DIR
            / "reports"
            / "model-evaluation"
            / "model_metrics.json",

            PROJECT_ROOT
            / "backend-node"
            / "analysis"
            / "model_metrics.json",
        ]
    )

    confusion_path = _find_existing_path(
        [
            BASE_DIR
            / "reports"
            / "model-evaluation"
            / "confusion_matrix.csv",

            PROJECT_ROOT
            / "backend-node"
            / "analysis"
            / "confusion_matrix.csv",
        ]
    )

    metrics = _load_json(
        metrics_path
    )

    if not isinstance(metrics, dict):
        raise ValueError(
            "model_metrics.json tidak valid."
        )

    required_metrics = [
        metrics.get("accuracy"),
        metrics.get(
            "macroAverage",
            {},
        ).get("precision"),
        metrics.get(
            "macroAverage",
            {},
        ).get("recall"),
        metrics.get(
            "macroAverage",
            {},
        ).get("f1Score"),
    ]

    if any(
        value is None
        for value in required_metrics
    ):
        raise ValueError(
            "Accuracy, precision, recall, atau F1 belum lengkap."
        )

    if (
        not confusion_path.exists()
        or confusion_path.stat().st_size == 0
    ):
        raise ValueError(
            "Confusion matrix tidak tersedia."
        )

    return (
        f"Accuracy {float(required_metrics[0]) * 100:.2f}% "
        f"dan macro F1 "
        f"{float(required_metrics[3]) * 100:.2f}% tersedia."
    )


def _create_test_app(
    log_path: Path,
):
    class VerificationConfig(Config):
        TESTING = True
        CONVERSATION_LOG_PATH = log_path
        CLIENT_ORIGINS = [
            "http://localhost:5173",
        ]

    return create_app(
        VerificationConfig
    )


def _assert_success(
    response,
    expected_status: int = 200,
) -> dict[str, Any]:
    if response.status_code != expected_status:
        raise AssertionError(
            f"HTTP {response.status_code}, "
            f"seharusnya {expected_status}: "
            f"{response.get_data(as_text=True)}",
        )

    payload = response.get_json()

    if not isinstance(payload, dict):
        raise AssertionError(
            "Response bukan JSON object."
        )

    return payload


def _check_health(client) -> str:
    payload = _assert_success(
        client.get(
            "/api/health"
        )
    )

    data = payload["data"]

    if data.get("framework") != "Flask":
        raise AssertionError(
            "Framework pada health endpoint bukan Flask."
        )

    if data.get("intentCount", 0) < 4:
        raise AssertionError(
            "Health endpoint melaporkan intent kurang dari empat."
        )

    return (
        f"HTTP 200; {data.get('faqCount')} FAQ, "
        f"{data.get('intentCount')} intent, framework Flask."
    )


def _check_direct_answer(client) -> str:
    payload = _assert_success(
        client.post(
            "/api/chat",
            json={
                "message": "bagaimana cara bayar uang kuliah",
            },
        )
    )

    data = payload["data"]

    if data.get("intent") != "pembayaran_dan_biaya":
        raise AssertionError(
            f"Intent salah: {data.get('intent')}"
        )

    if not data.get("matchedQuestion"):
        raise AssertionError(
            "FAQ tidak ditemukan."
        )

    if data.get("dialog", {}).get("turnType") != "direct_answer":
        raise AssertionError(
            "Turn langsung tidak berstatus direct_answer."
        )

    return (
        f"FAQ pembayaran ditemukan: "
        f"{data['matchedQuestion']}"
    )


def _check_out_of_domain(client) -> str:
    payload = _assert_success(
        client.post(
            "/api/chat",
            json={
                "message": "cara membuat nasi goreng",
            },
        )
    )

    data = payload["data"]

    if data.get("matchedQuestion") is not None:
        raise AssertionError(
            "Pertanyaan luar domain dipaksakan menjadi FAQ."
        )

    if data.get("retrievalMode") != "no_match":
        raise AssertionError(
            "Pertanyaan luar domain tidak berstatus no_match."
        )

    return (
        "Pertanyaan luar domain ditolak dengan aman."
    )


def _check_multi_turn(
    client,
) -> tuple[str, str]:
    first = _assert_success(
        client.post(
            "/api/chat",
            json={
                "message": "Saya ingin mengajukan surat keterangan",
            },
        )
    )["data"]

    session_id = first.get(
        "sessionId"
    )

    if (
        first.get(
            "dialog",
            {},
        ).get("awaitingSlot")
        != "documentType"
    ):
        raise AssertionError(
            "Turn pertama tidak meminta documentType."
        )

    second = _assert_success(
        client.post(
            "/api/chat",
            json={
                "sessionId": session_id,
                "message": "Surat mahasiswa aktif",
            },
        )
    )["data"]

    if (
        second.get(
            "dialog",
            {},
        ).get("awaitingSlot")
        != "campus"
    ):
        raise AssertionError(
            "Turn kedua tidak meminta campus."
        )

    third = _assert_success(
        client.post(
            "/api/chat",
            json={
                "sessionId": session_id,
                "message": "Kampus Menteng",
            },
        )
    )["data"]

    if (
        third.get(
            "dialog",
            {},
        ).get("state")
        != "awaiting_confirmation"
    ):
        raise AssertionError(
            "Turn ketiga tidak meminta konfirmasi."
        )

    fourth = _assert_success(
        client.post(
            "/api/chat",
            json={
                "sessionId": session_id,
                "message": "Ya, tampilkan",
            },
        )
    )["data"]

    if (
        fourth.get(
            "dialog",
            {},
        ).get("turnType")
        != "final_answer"
    ):
        raise AssertionError(
            "Turn terakhir bukan final_answer."
        )

    if (
        fourth.get(
            "dialog",
            {},
        ).get("confirmed")
        is not True
    ):
        raise AssertionError(
            "Konfirmasi tidak tercatat sebagai true."
        )

    return (
        session_id,
        "Empat turn berhasil sampai final_answer terkonfirmasi.",
    )


def _check_reset(
    client,
    session_id: str,
) -> str:
    payload = _assert_success(
        client.delete(
            f"/api/chat/session/{session_id}"
        )
    )

    if (
        payload.get(
            "data",
            {},
        ).get("sessionId")
        != session_id
    ):
        raise AssertionError(
            "Session ID reset tidak sesuai."
        )

    return (
        "Endpoint reset session mengembalikan HTTP 200."
    )


def _check_logging(
    log_path: Path,
) -> str:
    summary = analyze_conversation_log(
        log_path
    )

    if summary["totalTurns"] < 6:
        raise AssertionError(
            f"Hanya ada {summary['totalTurns']} turn pada log verifikasi.",
        )

    if summary["uniqueSessions"] < 3:
        raise AssertionError(
            "Jumlah session log kurang dari tiga."
        )

    if summary["noMatchTurns"] < 1:
        raise AssertionError(
            "Log tidak merekam skenario no-match."
        )

    if summary["confirmedTurns"] < 1:
        raise AssertionError(
            "Log tidak merekam konfirmasi pengguna."
        )

    if summary["malformedLines"] != 0:
        raise AssertionError(
            "Log verifikasi memiliki baris rusak."
        )

    return (
        f"{summary['totalTurns']} turn, "
        f"{summary['uniqueSessions']} session, "
        f"no-match {summary['noMatchTurns']}, "
        f"confirmed {summary['confirmedTurns']}."
    )


def _check_merge_markers() -> str:
    excluded_directories = {
        ".git",
        ".venv",
        "node_modules",
        "dist",
        "build",
        "logs",
    }

    supported_suffixes = {
        ".py",
        ".js",
        ".mjs",
        ".jsx",
        ".css",
        ".html",
        ".json",
        ".md",
        ".txt",
        ".yml",
        ".yaml",
    }

    markers = (
        "<<<<<<<",
        "=======",
        ">>>>>>>",
    )

    findings: list[str] = []

    for path in PROJECT_ROOT.rglob("*"):
        if (
            not path.is_file()
            or path.suffix.lower()
            not in supported_suffixes
        ):
            continue

        if any(
            part in excluded_directories
            for part in path.parts
        ):
            continue

        try:
            lines = path.read_text(
                encoding="utf-8",
            ).splitlines()

        except UnicodeDecodeError:
            continue

        for line_number, line in enumerate(
            lines,
            start=1,
        ):
            stripped = line.lstrip()

            if stripped.startswith(markers):
                findings.append(
                    f"{path.relative_to(PROJECT_ROOT)}:{line_number}",
                )

    if findings:
        raise ValueError(
            "Git merge marker masih ditemukan: "
            + ", ".join(findings[:20]),
        )

    return (
        "Tidak ditemukan marker konflik Git pada source code."
    )


def _check_documentation() -> str:
    required = [
        PROJECT_ROOT / "README.md",
        PROJECT_ROOT / "docs" / "API.md",
        PROJECT_ROOT / "docs" / "DEMO_SCENARIOS.md",
        PROJECT_ROOT / "docs" / "UAS_COMPLIANCE.md",
    ]

    missing = [
        path
        for path in required
        if not path.exists()
    ]

    if missing:
        raise FileNotFoundError(
            "Dokumentasi belum lengkap: "
            + ", ".join(
                str(path)
                for path in missing
            ),
        )

    return (
        "README, dokumentasi API, skenario demo, "
        "dan checklist UAS tersedia."
    )


def _build_markdown(
    payload: dict[str, Any],
) -> str:
    status_text = (
        "LULUS"
        if payload["status"] == "passed"
        else "BELUM LULUS"
    )

    lines = [
        "# Final Verification Report",
        "",
        f"**Status akhir: {status_text}**",
        "",
        f"- Check lulus: **{payload['passed']}**",
        f"- Check gagal: **{payload['failed']}**",
        "",
        "## Hasil Pemeriksaan",
        "",
        "| No. | Pemeriksaan | Status | Detail |",
        "|---:|---|---|---|",
    ]

    for index, result in enumerate(
        payload["results"],
        start=1,
    ):
        icon = (
            "PASS"
            if result["status"] == "passed"
            else "FAIL"
        )

        details = (
            str(result["details"])
            .replace("|", "\\|")
            .replace("\n", "<br>")
        )

        lines.append(
            f"| {index} | "
            f"{result['name']} | "
            f"{icon} | "
            f"{details} |",
        )

    lines.extend(
        [
            "",
            "## Catatan",
            "",
            "Frontend production build diperiksa melalui script "
            "`scripts/verify_all.sh` atau `scripts/verify_all.ps1`, "
            "karena proses tersebut membutuhkan Node.js dan npm.",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    context = VerificationContext()

    context.check(
        "Runtime assets",
        _check_runtime_assets,
    )

    context.check(
        "Dataset intent",
        _check_intent_dataset,
    )

    context.check(
        "Evaluasi model",
        _check_model_evaluation,
    )

    context.check(
        "Git merge markers",
        _check_merge_markers,
    )

    context.check(
        "Dokumentasi final",
        _check_documentation,
    )

    with tempfile.TemporaryDirectory(
        prefix="chatbot-final-verification-"
    ) as temp_directory:
        log_path = (
            Path(temp_directory)
            / "verification-conversations.jsonl"
        )

        app = _create_test_app(
            log_path
        )

        client = app.test_client()

        context.check(
            "Health endpoint",
            lambda: _check_health(client),
        )

        context.check(
            "Direct FAQ answer",
            lambda: _check_direct_answer(client),
        )

        context.check(
            "Out-of-domain handling",
            lambda: _check_out_of_domain(client),
        )

        multi_turn_session: dict[
            str,
            str | None,
        ] = {
            "value": None,
        }

        def run_multi_turn() -> str:
            session_id, details = _check_multi_turn(
                client
            )

            multi_turn_session["value"] = session_id

            return details

        context.check(
            "Multi-turn dan konfirmasi",
            run_multi_turn,
        )

        def run_reset() -> str:
            session_id = multi_turn_session["value"]

            if not session_id:
                raise RuntimeError(
                    "Session multi-turn tidak tersedia untuk di-reset."
                )

            return _check_reset(
                client,
                session_id,
            )

        context.check(
            "Reset session",
            run_reset,
        )

        context.check(
            "Conversation logging",
            lambda: _check_logging(log_path),
        )

    payload = {
        "status": (
            "passed"
            if context.failed == 0
            else "failed"
        ),

        "passed": context.passed,
        "failed": context.failed,

        "results": [
            asdict(result)
            for result in context.results
        ],
    }

    REPORT_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    REPORT_JSON_PATH.write_text(
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    REPORT_MARKDOWN_PATH.write_text(
        _build_markdown(payload),
        encoding="utf-8",
    )

    print("Final verification selesai.")
    print(f"Lulus  : {context.passed}")
    print(f"Gagal  : {context.failed}")
    print(f"JSON   : {REPORT_JSON_PATH}")
    print(f"Report : {REPORT_MARKDOWN_PATH}")

    for result in context.results:
        prefix = (
            "PASS"
            if result.status == "passed"
            else "FAIL"
        )

        print(
            f"[{prefix}] "
            f"{result.name}: "
            f"{result.details}"
        )

    return (
        0
        if context.failed == 0
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())