from __future__ import annotations

import copy
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any, Callable

IDLE = "idle"
AWAITING_SLOT = "awaiting_slot"
AWAITING_CONFIRMATION = (
    "awaiting_confirmation"
)

DIRECT_ANSWER = "direct_answer"
SLOT_PROMPT = "slot_prompt"
CONFIRMATION_PROMPT = (
    "confirmation_prompt"
)
CONFIRMATION_RETRY = (
    "confirmation_retry"
)
FINAL_ANSWER = "final_answer"
CANCELLED = "cancelled"
NO_MATCH = "no_match"

_SESSION_PATTERN = re.compile(
    r"^[a-zA-Z0-9_-]{8,100}$"
)

_CANCEL_PATTERN = re.compile(
    (
        r"^(?:batal|batalkan|cancel|"
        r"reset|mulai\s+ulang|"
        r"ulang\s+dari\s+awal)$"
    ),
    re.IGNORECASE,
)

_YES_PATTERN = re.compile(
    (
        r"^(?:ya|iya|yap|yes|benar|"
        r"betul|boleh|oke|ok|lanjut|"
        r"setuju|tampilkan|"
        r"ya\s+tampilkan|"
        r"iya\s+tampilkan)$"
    ),
    re.IGNORECASE,
)

_NO_PATTERN = re.compile(
    (
        r"^(?:tidak|nggak|enggak|gak|"
        r"ga|no|bukan|salah|jangan|ubah|"
        r"tidak\s+jadi|nggak\s+jadi)$"
    ),
    re.IGNORECASE,
)


@dataclass(frozen=True)
class DialogRule:
    id: str
    required_slots: tuple[str, ...]
    prompts: dict[str, dict[str, Any]]
    matcher: Callable[
        [
            str,
            dict[str, Any],
        ],
        bool,
    ]

    confirmation_builder: Callable[
        [
            dict[str, Any],
            dict[str, Any],
        ],
        str,
    ]


def _normalize(
    text: object,
) -> str:
    cleaned = re.sub(
        r"[^a-z0-9\s]",
        " ",
        str(text or "").lower(),
    )

    return re.sub(
        r"\s+",
        " ",
        cleaned,
    ).strip()


def _slot_label(
    slot: str,
    value: Any,
) -> str:
    labels = {
        "documentType": {
            "mahasiswa_aktif":
                "Surat Keterangan "
                "Mahasiswa Aktif",

            "keterangan_lulus":
                "Surat Keterangan Lulus",

            "mengundurkan_diri":
                "Surat Mengundurkan Diri",

            "mutasi":
                "Surat Mutasi",

            "putus_studi":
                "Surat Putus Studi/"
                "Drop Out",
        },

        "campus": {
            "meruya":
                "Kampus Meruya",

            "menteng":
                "Kampus Menteng",

            "warung_buncit":
                "Kampus Warung Buncit",
        },

        "studyProgram": {
            "teknik_informatika":
                "Teknik Informatika",

            "sistem_informasi":
                "Sistem Informasi",

            "sains_data":
                "Sains Data",
        },

        "classProgram": {
            "reguler_1":
                "Reguler 1",

            "reguler_2":
                "Reguler 2/Karyawan",
        },
    }

    if isinstance(
        value,
        list,
    ):
        return " dan ".join(
            _slot_label(
                slot,
                item,
            )
            for item in value
        )

    return (
        labels
        .get(
            slot,
            {},
        )
        .get(
            value,
            str(value),
        )
    )


def _surat_match(
    message: str,
    result: dict[str, Any],
) -> bool:
    normalized = _normalize(
        message
    )

    return bool(
        result.get(
            "slots",
            {},
        ).get(
            "service"
        )
        == "surat_keterangan"

        or result.get(
            "category"
        )
        == "Surat Keterangan"

        or re.search(
            (
                r"\bsurat\s+(?:keterangan|"
                r"mahasiswa\s+aktif|"
                r"keterangan\s+lulus)\b"
            ),
            normalized,
        )
    )


def _surat_confirmation(
    slots: dict[str, Any],
    result: dict[str, Any],
) -> str:
    question = (
        result.get(
            "matchedQuestion"
        )
        or (
            "prosedur pengajuan "
            "surat tersebut"
        )
    )

    document = _slot_label(
        "documentType",
        slots["documentType"],
    )

    campus = _slot_label(
        "campus",
        slots["campus"],
    )

    return (
        "Saya menangkap bahwa Anda "
        f"membutuhkan {document} "
        f"untuk {campus}. "
        f"Saya menemukan FAQ “{question}”. "
        "Apakah Anda ingin menampilkan "
        "jawabannya?"
    )


def _course_match(
    message: str,
    result: dict[str, Any],
) -> bool:
    normalized = _normalize(
        message
    )

    return bool(
        re.search(
            r"\b(?:mata\s+kuliah|matkul)\b",
            normalized,
        )

        and (
            result.get(
                "intent"
            )
            == (
                "kurikulum_dan_"
                "mata_kuliah"
            )

            or "kurikulum"
            in str(
                result.get(
                    "category",
                    "",
                )
            ).lower()
        )
    )


def _course_confirmation(
    slots: dict[str, Any],
    result: dict[str, Any],
) -> str:
    program = _slot_label(
        "studyProgram",
        slots["studyProgram"],
    )

    semester = (
        f"Semester {slots['semester']}"
    )

    question = (
        result.get(
            "matchedQuestion"
        )
        or (
            f"daftar mata kuliah "
            f"{program} {semester}"
        )
    )

    return (
        "Anda ingin melihat mata kuliah "
        f"{program} {semester}. "
        f"Saya menemukan FAQ “{question}”. "
        "Apakah informasi tersebut yang "
        "ingin ditampilkan?"
    )


def _payment_match(
    message: str,
    result: dict[str, Any],
) -> bool:
    normalized = _normalize(
        message
    )

    return bool(
        re.search(
            (
                r"\b(?:prefix|"
                r"kode\s+pembayaran)\b"
            ),
            normalized,
        )

        and (
            result.get(
                "intent"
            )
            == "pembayaran_dan_biaya"

            or result.get(
                "category"
            )
            == (
                "Pembayaran dan "
                "Biaya Kuliah"
            )
        )
    )


def _payment_confirmation(
    slots: dict[str, Any],
    result: dict[str, Any],
) -> str:
    class_label = _slot_label(
        "classProgram",
        slots["classProgram"],
    )

    question = (
        result.get(
            "matchedQuestion"
        )
        or (
            "kode pembayaran "
            f"{class_label}"
        )
    )

    return (
        "Anda menanyakan kode pembayaran "
        f"untuk {class_label}. "
        f"Saya menemukan FAQ “{question}”. "
        "Apakah Anda ingin melihat "
        "jawabannya?"
    )


RULES = (
    DialogRule(
        id=(
            "surat_keterangan_"
            "terstruktur"
        ),

        required_slots=(
            "documentType",
            "campus",
        ),

        prompts={
            "documentType": {
                "text":
                    (
                        "Jenis surat apa yang ingin "
                        "Anda ajukan? Pilih salah satu "
                        "agar saya dapat mencari "
                        "prosedur yang tepat."
                    ),

                "quickReplies": [
                    "Surat mahasiswa aktif",
                    "Surat keterangan lulus",
                    "Surat mengundurkan diri",
                    "Surat mutasi",
                    "Surat putus studi",
                ],
            },

            "campus": {
                "text":
                    (
                        "Pengajuan tersebut ditujukan "
                        "untuk kampus mana?"
                    ),

                "quickReplies": [
                    "Kampus Meruya",
                    "Kampus Menteng",
                    "Kampus Warung Buncit",
                ],
            },
        },

        matcher=
            _surat_match,

        confirmation_builder=
            _surat_confirmation,
    ),

    DialogRule(
        id=(
            "kurikulum_mata_kuliah_"
            "terstruktur"
        ),

        required_slots=(
            "studyProgram",
            "semester",
        ),

        prompts={
            "studyProgram": {
                "text":
                    (
                        "Mata kuliah untuk program "
                        "studi apa?"
                    ),

                "quickReplies": [
                    "Teknik Informatika",
                    "Sistem Informasi",
                    "Sains Data",
                ],
            },

            "semester": {
                "text":
                    (
                        "Semester berapa yang ingin "
                        "Anda lihat?"
                    ),

                "quickReplies": [
                    f"Semester {number}"
                    for number
                    in range(1, 9)
                ],
            },
        },

        matcher=
            _course_match,

        confirmation_builder=
            _course_confirmation,
    ),

    DialogRule(
        id=(
            "prefix_pembayaran_"
            "terstruktur"
        ),

        required_slots=(
            "classProgram",
        ),

        prompts={
            "classProgram": {
                "text":
                    (
                        "Kode pembayaran tersebut "
                        "untuk program kelas yang mana?"
                    ),

                "quickReplies": [
                    "Reguler 1",
                    "Reguler 2/Karyawan",
                ],
            },
        },

        matcher=
            _payment_match,

        confirmation_builder=
            _payment_confirmation,
    ),
)

RULE_LOOKUP = {
    rule.id: rule
    for rule in RULES
}


def is_valid_session_id(
    session_id: object,
) -> bool:
    return bool(
        _SESSION_PATTERN.fullmatch(
            str(session_id or "")
        )
    )


def _merge_slots(
    current:
        dict[str, Any]
        | None,

    new:
        dict[str, Any]
        | None,
) -> dict[str, Any]:
    merged = dict(
        current or {}
    )

    for key, value in (
        new or {}
    ).items():
        if value not in (
            None,
            "",
            [],
        ):
            merged[key] = value

    return merged


def _missing_slot(
    rule: DialogRule,
    slots: dict[str, Any],
) -> str | None:
    for slot in (
        rule.required_slots
    ):
        value = slots.get(
            slot
        )

        if value in (
            None,
            "",
            [],
        ):
            return slot

    return None


def _normalize_slot_answer(
    slot: str,
    answer: str,
) -> str:
    prefixes = {
        "documentType":
            "surat ",

        "campus":
            "kampus ",

        "studyProgram":
            "program studi ",

        "semester":
            "semester ",

        "classProgram":
            "kelas ",
    }

    prefix = prefixes.get(
        slot,
        "",
    )

    normalized = str(
        answer or ""
    ).strip()

    if (
        not prefix
        or normalized
        .lower()
        .startswith(
            prefix.strip()
        )
    ):
        return normalized

    return (
        f"{prefix}{normalized}"
    )


def _dialog_metadata(
    *,
    state: str,
    turn_type: str,

    awaiting_slot:
        str | None = None,

    requires_input:
        bool = False,

    quick_replies:
        list[str] | None = None,

    rule_id:
        str | None = None,

    confirmed:
        bool = False,

    cancelled:
        bool = False,

    context_slots:
        dict[str, Any]
        | None = None,
) -> dict[str, Any]:
    return {
        "state":
            state,

        "turnType":
            turn_type,

        "awaitingSlot":
            awaiting_slot,

        "requiresInput":
            requires_input,

        "quickReplies":
            list(
                quick_replies or []
            ),

        "ruleId":
            rule_id,

        "confirmed":
            confirmed,

        "cancelled":
            cancelled,

        "contextSlots":
            copy.deepcopy(
                context_slots or {}
            ),
    }


class DialogManager:
    def __init__(
        self,

        nlp_handler:
            Callable[
                [str],
                dict[str, Any],
            ],

        *,
        session_ttl_seconds:
            int = 1800,

        max_sessions:
            int = 1000,

        clock:
            Callable[
                [],
                float,
            ] = time.time,

        id_generator:
            Callable[
                [],
                str,
            ] = (
                lambda:
                    str(uuid.uuid4())
            ),
    ):
        self.nlp_handler = (
            nlp_handler
        )

        self.session_ttl_seconds = (
            session_ttl_seconds
        )

        self.max_sessions = (
            max_sessions
        )

        self.clock = clock
        self.id_generator = (
            id_generator
        )

        self.sessions: dict[
            str,
            dict[str, Any],
        ] = {}

    def cleanup_expired_sessions(
        self,
    ) -> int:
        now = self.clock()

        expired = [
            session_id

            for session_id, session
            in self.sessions.items()

            if (
                now
                - session["updatedAt"]
                > self.session_ttl_seconds
            )
        ]

        for session_id in expired:
            del self.sessions[
                session_id
            ]

        return len(expired)

    def _resolve_session(
        self,
        session_id:
            str | None,
    ) -> dict[str, Any]:
        self.cleanup_expired_sessions()

        if (
            session_id
            and not is_valid_session_id(
                session_id
            )
        ):
            raise ValueError(
                "Format sessionId "
                "tidak valid."
            )

        if (
            session_id
            and session_id
            in self.sessions
        ):
            return self.sessions[
                session_id
            ]

        if (
            len(self.sessions)
            >= self.max_sessions
        ):
            oldest = min(
                self.sessions.values(),

                key=lambda item:
                    item[
                        "updatedAt"
                    ],
            )

            del self.sessions[
                oldest["id"]
            ]

        generated = (
            session_id
            or self.id_generator()
        )

        if not is_valid_session_id(
            generated
        ):
            raise ValueError(
                "idGenerator menghasilkan "
                "sessionId yang tidak valid."
            )

        current_time = self.clock()

        session = {
            "id":
                generated,

            "state":
                IDLE,

            "context":
                None,

            "createdAt":
                current_time,

            "updatedAt":
                current_time,
        }

        self.sessions[
            generated
        ] = session

        return session

    def reset_session(
        self,
        session_id: str,
    ) -> bool:
        if not is_valid_session_id(
            session_id
        ):
            return False

        return (
            self.sessions.pop(
                session_id,
                None,
            )
            is not None
        )

    def _clear(
        self,
        session: dict[str, Any],
    ) -> None:
        session["state"] = IDLE
        session["context"] = None
        session["updatedAt"] = (
            self.clock()
        )

    def _slot_prompt(
        self,
        session: dict[str, Any],
        rule: DialogRule,
        slot: str,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        prompt = rule.prompts[
            slot
        ]

        session["state"] = (
            AWAITING_SLOT
        )

        session["updatedAt"] = (
            self.clock()
        )

        return {
            "sessionId":
                session["id"],

            "answer":
                prompt["text"],

            "confidence":
                result.get(
                    "confidence",
                    0,
                ),

            "matchedQuestion":
                None,

            "category":
                result.get(
                    "category"
                ),

            "intent":
                result.get(
                    "intent"
                ),

            "slots":
                copy.deepcopy(
                    session[
                        "context"
                    ]["slots"]
                ),

            "dialog":
                _dialog_metadata(
                    state=
                        AWAITING_SLOT,

                    turn_type=
                        SLOT_PROMPT,

                    awaiting_slot=
                        slot,

                    requires_input=
                        True,

                    quick_replies=
                        prompt[
                            "quickReplies"
                        ],

                    rule_id=
                        rule.id,

                    context_slots=
                        session[
                            "context"
                        ]["slots"],
                ),
        }

    def _confirmation(
        self,
        session: dict[str, Any],
        rule: DialogRule,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        session["state"] = (
            AWAITING_CONFIRMATION
        )

        session[
            "context"
        ][
            "pendingReply"
        ] = copy.deepcopy(
            result
        )

        session["updatedAt"] = (
            self.clock()
        )

        return {
            "sessionId":
                session["id"],

            "answer":
                rule
                .confirmation_builder(
                    session[
                        "context"
                    ]["slots"],

                    result,
                ),

            "confidence":
                result.get(
                    "confidence",
                    0,
                ),

            "matchedQuestion":
                result.get(
                    "matchedQuestion"
                ),

            "category":
                result.get(
                    "category"
                ),

            "intent":
                result.get(
                    "intent"
                ),

            "slots":
                copy.deepcopy(
                    session[
                        "context"
                    ]["slots"]
                ),

            "dialog":
                _dialog_metadata(
                    state=
                        AWAITING_CONFIRMATION,

                    turn_type=
                        CONFIRMATION_PROMPT,

                    requires_input=
                        True,

                    quick_replies=[
                        "Ya, tampilkan",
                        (
                            "Tidak, ubah "
                            "pertanyaan"
                        ),
                    ],

                    rule_id=
                        rule.id,

                    context_slots=
                        session[
                            "context"
                        ]["slots"],
                ),
        }

    def process_turn(
        self,
        *,
        message: str,
        session_id:
            str | None = None,
    ) -> dict[str, Any]:
        text = str(
            message or ""
        ).strip()

        if not text:
            raise ValueError(
                "Pesan tidak boleh kosong."
            )

        session = self._resolve_session(
            session_id
        )

        if (
            session["state"]
            != IDLE

            and _CANCEL_PATTERN
            .fullmatch(
                _normalize(text)
            )
        ):
            context = copy.deepcopy(
                session.get(
                    "context"
                )
                or {}
            )

            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                "answer":
                    (
                        "Baik, proses sebelumnya "
                        "dibatalkan. Silakan kirim "
                        "pertanyaan akademik baru."
                    ),

                "confidence":
                    0,

                "matchedQuestion":
                    None,

                "category":
                    None,

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            CANCELLED,

                        cancelled=
                            True,

                        rule_id=
                            context.get(
                                "ruleId"
                            ),

                        context_slots=
                            context.get(
                                "slots",
                                {},
                            ),
                    ),
            }

        if (
            session["state"]
            == AWAITING_CONFIRMATION
        ):
            return self._handle_confirmation(
                session,
                text,
            )

        if (
            session["state"]
            == AWAITING_SLOT
        ):
            return self._handle_slot(
                session,
                text,
            )

        return self._handle_idle(
            session,
            text,
        )

    def _handle_idle(
        self,
        session: dict[str, Any],
        message: str,
    ) -> dict[str, Any]:
        result = self.nlp_handler(
            message
        )

        rule = next(
            (
                item
                for item in RULES
                if item.matcher(
                    message,
                    result,
                )
            ),
            None,
        )

        if not rule:
            session["updatedAt"] = (
                self.clock()
            )

            return {
                "sessionId":
                    session["id"],

                **result,

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            DIRECT_ANSWER
                            if result.get(
                                "matchedQuestion"
                            )
                            else NO_MATCH,

                        context_slots=
                            result.get(
                                "slots",
                                {},
                            ),
                    ),
            }

        session["context"] = {
            "ruleId":
                rule.id,

            "baseMessage":
                message,

            "augmentedMessages":
                [],

            "slots":
                _merge_slots(
                    {},
                    result.get(
                        "slots"
                    ),
                ),

            "lastNlpResult":
                copy.deepcopy(
                    result
                ),

            "pendingReply":
                None,
        }

        missing = _missing_slot(
            rule,
            session[
                "context"
            ]["slots"],
        )

        if missing:
            return self._slot_prompt(
                session,
                rule,
                missing,
                result,
            )

        if not result.get(
            "matchedQuestion"
        ):
            slots = copy.deepcopy(
                result.get(
                    "slots",
                    {},
                )
            )

            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                **result,

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            NO_MATCH,

                        context_slots=
                            slots,
                    ),
            }

        return self._confirmation(
            session,
            rule,
            result,
        )

    def _handle_slot(
        self,
        session: dict[str, Any],
        message: str,
    ) -> dict[str, Any]:
        context = (
            session.get(
                "context"
            )
            or {}
        )

        rule = RULE_LOOKUP.get(
            context.get(
                "ruleId"
            )
        )

        if not rule:
            self._clear(
                session
            )

            return self._handle_idle(
                session,
                message,
            )

        current_slot = (
            _missing_slot(
                rule,
                context.get(
                    "slots",
                    {},
                ),
            )
        )

        if not current_slot:
            return self._confirmation(
                session,
                rule,
                context[
                    "lastNlpResult"
                ],
            )

        augmented_answer = (
            _normalize_slot_answer(
                current_slot,
                message,
            )
        )

        context[
            "augmentedMessages"
        ].append(
            augmented_answer
        )

        combined = " ".join([
            context[
                "baseMessage"
            ],

            *context[
                "augmentedMessages"
            ],
        ]).strip()

        result = self.nlp_handler(
            combined
        )

        context["slots"] = (
            _merge_slots(
                context.get(
                    "slots"
                ),

                result.get(
                    "slots"
                ),
            )
        )

        context[
            "lastNlpResult"
        ] = copy.deepcopy(
            result
        )

        session["updatedAt"] = (
            self.clock()
        )

        missing = _missing_slot(
            rule,
            context["slots"],
        )

        if missing:
            return self._slot_prompt(
                session,
                rule,
                missing,
                result,
            )

        if not result.get(
            "matchedQuestion"
        ):
            saved_slots = (
                copy.deepcopy(
                    context[
                        "slots"
                    ]
                )
            )

            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                **result,

                "answer":
                    (
                        "Informasi tambahan sudah "
                        "diterima, tetapi saya belum "
                        "menemukan FAQ yang cukup "
                        "sesuai. Silakan tulis ulang "
                        "kebutuhan Anda dengan lebih "
                        "spesifik."
                    ),

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            NO_MATCH,

                        context_slots=
                            saved_slots,
                    ),
            }

        return self._confirmation(
            session,
            rule,
            result,
        )

    def _handle_confirmation(
        self,
        session: dict[str, Any],
        message: str,
    ) -> dict[str, Any]:
        context = (
            session.get(
                "context"
            )
            or {}
        )

        pending = context.get(
            "pendingReply"
        )

        rule = RULE_LOOKUP.get(
            context.get(
                "ruleId"
            )
        )

        if (
            not pending
            or not rule
        ):
            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                "answer":
                    (
                        "Konteks percakapan sebelumnya "
                        "sudah tidak tersedia. Silakan "
                        "kirim ulang pertanyaan "
                        "akademik Anda."
                    ),

                "confidence":
                    0,

                "matchedQuestion":
                    None,

                "category":
                    None,

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            CANCELLED,

                        cancelled=
                            True,
                    ),
            }

        normalized = _normalize(
            message
        )

        if _YES_PATTERN.fullmatch(
            normalized
        ):
            final = copy.deepcopy(
                pending
            )

            slots = copy.deepcopy(
                context.get(
                    "slots",
                    {},
                )
            )

            rule_id = rule.id

            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                **final,

                "slots":
                    _merge_slots(
                        final.get(
                            "slots"
                        ),
                        slots,
                    ),

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            FINAL_ANSWER,

                        confirmed=
                            True,

                        rule_id=
                            rule_id,

                        context_slots=
                            slots,
                    ),
            }

        if _NO_PATTERN.fullmatch(
            normalized
        ):
            slots = copy.deepcopy(
                context.get(
                    "slots",
                    {},
                )
            )

            rule_id = rule.id

            self._clear(
                session
            )

            return {
                "sessionId":
                    session["id"],

                "answer":
                    (
                        "Baik, jawaban tersebut tidak "
                        "saya tampilkan. Silakan "
                        "jelaskan kembali kebutuhan "
                        "Anda atau pilih topik lain."
                    ),

                "confidence":
                    0,

                "matchedQuestion":
                    None,

                "category":
                    None,

                "slots":
                    slots,

                "dialog":
                    _dialog_metadata(
                        state=
                            IDLE,

                        turn_type=
                            CANCELLED,

                        cancelled=
                            True,

                        rule_id=
                            rule_id,

                        context_slots=
                            slots,
                    ),
            }

        session["updatedAt"] = (
            self.clock()
        )

        return {
            "sessionId":
                session["id"],

            "answer":
                (
                    "Mohon jawab dengan “Ya” untuk "
                    "menampilkan jawaban atau “Tidak” "
                    "untuk membatalkan dan mengubah "
                    "pertanyaan."
                ),

            "confidence":
                pending.get(
                    "confidence",
                    0,
                ),

            "matchedQuestion":
                pending.get(
                    "matchedQuestion"
                ),

            "category":
                pending.get(
                    "category"
                ),

            "slots":
                copy.deepcopy(
                    context.get(
                        "slots",
                        {},
                    )
                ),

            "dialog":
                _dialog_metadata(
                    state=
                        AWAITING_CONFIRMATION,

                    turn_type=
                        CONFIRMATION_RETRY,

                    requires_input=
                        True,

                    quick_replies=[
                        "Ya, tampilkan",
                        (
                            "Tidak, ubah "
                            "pertanyaan"
                        ),
                    ],

                    rule_id=
                        rule.id,

                    context_slots=
                        context.get(
                            "slots",
                            {},
                        ),
                ),
        }