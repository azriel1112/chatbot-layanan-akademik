from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

NUMBER_WORDS = {
    "satu": 1,
    "dua": 2,
    "tiga": 3,
    "empat": 4,
    "lima": 5,
    "enam": 6,
    "tujuh": 7,
    "delapan": 8,
    "sembilan": 9,
    "sepuluh": 10,
    "sebelas": 11,
    "dua belas": 12,
    "tiga belas": 13,
    "empat belas": 14,
}

ROMAN_NUMERALS = {
    "i": 1,
    "ii": 2,
    "iii": 3,
    "iv": 4,
    "v": 5,
    "vi": 6,
    "vii": 7,
    "viii": 8,
    "ix": 9,
    "x": 10,
    "xi": 11,
    "xii": 12,
    "xiii": 13,
    "xiv": 14,
}

SLOT_MATCH_WEIGHTS = {
    "semester": {
        "match": 0.35,
        "mismatch": -0.25,
    },

    "semesterPeriod": {
        "match": 0.14,
        "mismatch": -0.09,
    },

    "academicYear": {
        "match": 0.24,
        "mismatch": -0.16,
    },

    "curriculumYear": {
        "match": 0.24,
        "mismatch": -0.16,
    },

    "studyProgram": {
        "match": 0.25,
        "mismatch": -0.18,
    },

    "campus": {
        "match": 0.25,
        "mismatch": -0.18,
    },

    "classProgram": {
        "match": 0.22,
        "mismatch": -0.15,
    },

    "service": {
        "match": 0.10,
        "mismatch": -0.06,
    },

    "documentType": {
        "match": 0.25,
        "mismatch": -0.18,
    },

    "requestType": {
        "match": 0.16,
        "mismatch": -0.10,
    },
}


@dataclass(frozen=True)
class PatternDefinition:
    slot_type: str
    value: str
    label: str
    pattern: re.Pattern[str]
    priority: int


def _definition(
    slot_type: str,
    value: str,
    label: str,
    pattern: str,
    priority: int,
) -> PatternDefinition:
    return PatternDefinition(
        slot_type=slot_type,
        value=value,
        label=label,

        pattern=re.compile(
            pattern,
            re.IGNORECASE,
        ),

        priority=priority,
    )


PATTERNS = [
    _definition(
        "studyProgram",
        "teknik_informatika",
        "Teknik Informatika",
        r"\bteknik\s+informatika\b",
        120,
    ),

    _definition(
        "studyProgram",
        "teknik_informatika",
        "Teknik Informatika",
        r"\bprodi\s+informatika\b",
        115,
    ),

    _definition(
        "studyProgram",
        "teknik_informatika",
        "Teknik Informatika",
        r"\binformatika\b",
        70,
    ),

    _definition(
        "studyProgram",
        "sistem_informasi",
        "Sistem Informasi",
        r"\bsistem\s+informasi\b",
        120,
    ),

    _definition(
        "studyProgram",
        "sains_data",
        "Sains Data",
        r"\b(?:magister\s+)?sains\s+data\b",
        125,
    ),

    _definition(
        "campus",
        "meruya",
        "Kampus Meruya",
        r"\bkampus\s+meruya\b",
        120,
    ),

    _definition(
        "campus",
        "meruya",
        "Kampus Meruya",
        r"\bmeruya\b",
        80,
    ),

    _definition(
        "campus",
        "menteng",
        "Kampus Menteng",
        r"\bkampus\s+menteng\b",
        120,
    ),

    _definition(
        "campus",
        "menteng",
        "Kampus Menteng",
        r"\bmenteng\b",
        80,
    ),

    _definition(
        "campus",
        "warung_buncit",
        "Kampus Warung Buncit",
        r"\b(?:kampus\s+)?warung\s+buncit\b",
        130,
    ),

    _definition(
        "campus",
        "warung_buncit",
        "Kampus Warung Buncit",
        r"\bbuncit\b",
        70,
    ),

    _definition(
        "classProgram",
        "reguler_1",
        "Reguler 1",
        r"\b(?:kelas\s+|program\s+)?reg(?:u|o)ler\s*1\b",
        125,
    ),

    _definition(
        "classProgram",
        "reguler_2",
        "Reguler 2/Karyawan",
        r"\b(?:kelas\s+|program\s+)?reg(?:u|o)ler\s*2\b",
        125,
    ),

    _definition(
        "classProgram",
        "reguler_2",
        "Reguler 2/Karyawan",
        r"\b(?:kelas\s+|program\s+)?karyawan\b",
        120,
    ),

    _definition(
        "semesterPeriod",
        "ganjil",
        "Semester Ganjil",
        r"\b(?:semester\s+)?ganjil\b",
        120,
    ),

    _definition(
        "semesterPeriod",
        "genap",
        "Semester Genap",
        r"\b(?:semester\s+)?genap\b",
        120,
    ),

    _definition(
        "semesterPeriod",
        "antara",
        "Semester Antara",
        r"\bsemester\s+antara\b",
        120,
    ),

    _definition(
        "service",
        "aktif_kembali",
        "Aktif Kembali dari Cuti",
        r"\baktif\s+kembali(?:\s+dari)?\s+cuti\b",
        170,
    ),

    _definition(
        "service",
        "pindah_program_perkuliahan",
        "Pindah Program Perkuliahan",
        r"\bpindah\s+(?:program\s+perkuliahan|kelas)\b",
        170,
    ),

    _definition(
        "service",
        "pindah_program_studi",
        "Pindah Program Studi",
        r"\bpindah\s+(?:program\s+studi|prodi)\b",
        170,
    ),

    _definition(
        "service",
        "pindah_kampus",
        "Pindah Lokasi Kampus",
        r"\bpindah\s+(?:lokasi\s+)?kampus\b",
        170,
    ),

    _definition(
        "service",
        "buka_blok_krs",
        "Buka Blok KRS",
        (
            r"\b(?:buka\s+blok\s+krs|"
            r"krs\s+terblokir|"
            r"blokir?\s+krs)\b"
        ),
        170,
    ),

    _definition(
        "service",
        "magang_mandiri",
        "Magang Mandiri",
        r"\bmagang\s+mandiri\b",
        165,
    ),

    _definition(
        "service",
        "kerja_praktek",
        "Kerja Praktek",
        r"\b(?:kerja\s+prakt(?:e|i)k|kp)\b",
        160,
    ),

    _definition(
        "service",
        "seminar_proposal",
        "Seminar Proposal",
        r"\b(?:seminar\s+proposal|sempro|mpti)\b",
        165,
    ),

    _definition(
        "service",
        "tugas_akhir",
        "Tugas Akhir",
        r"\btugas\s+akhir\b",
        165,
    ),

    _definition(
        "service",
        "tugas_akhir",
        "Tugas Akhir",
        r"\bta\b(?!\s*20\d{2}\s*[/-])",
        100,
    ),

    _definition(
        "service",
        "cuti",
        "Pengajuan Cuti",
        r"\b(?:pengajuan\s+cuti|cuti\s+kuliah|cuti)\b",
        150,
    ),

    _definition(
        "service",
        "legalisir",
        "Legalisir",
        r"\b(?:legalisir|legalisasi\s+dokumen)\b",
        130,
    ),

    _definition(
        "service",
        "turnitin",
        "Cek Turnitin",
        r"\b(?:turnitin|cek\s+plagiasi|cek\s+similarity)\b",
        130,
    ),

    _definition(
        "service",
        "surat_keterangan",
        "Surat Keterangan",
        r"\bsurat\s+keterangan\b",
        120,
    ),

    _definition(
        "service",
        "pembayaran",
        "Pembayaran dan Biaya Kuliah",
        (
            r"\b(?:pembayaran\s+(?:biaya\s+)?kuliah|"
            r"biaya\s+kuliah|uang\s+kuliah|"
            r"tagihan\s+kuliah)\b"
        ),
        140,
    ),

    _definition(
        "service",
        "elearning",
        "E-Learning",
        r"\b(?:e[\s-]?learning|fast\s+learning|moodle)\b",
        130,
    ),

    _definition(
        "service",
        "absensi",
        "Absensi",
        r"\b(?:absensi|kehadiran)\b",
        125,
    ),

    _definition(
        "service",
        "akreditasi",
        "Akreditasi",
        r"\bakreditasi\b",
        125,
    ),

    _definition(
        "service",
        "perpustakaan",
        "Perpustakaan dan Jurnal",
        r"\b(?:perpustakaan|jurnal|proquest|emerald)\b",
        125,
    ),

    _definition(
        "requestType",
        "procedure",
        "Prosedur/Cara",
        (
            r"\b(?:bagaimana\s+cara|prosedur|"
            r"alur|langkah(?:-langkah)?)\b"
        ),
        150,
    ),

    _definition(
        "requestType",
        "definition",
        "Definisi/Pengertian",
        r"\b(?:apa\s+itu|pengertian)\b",
        140,
    ),

    _definition(
        "requestType",
        "requirements",
        "Syarat/Berkas",
        (
            r"\b(?:apa\s+saja\s+syarat|syarat|"
            r"dokumen\s+apa|berkas)\b"
        ),
        150,
    ),

    _definition(
        "requestType",
        "schedule",
        "Jadwal/Waktu",
        r"\b(?:kapan|jadwal|tanggal)\b",
        120,
    ),

    _definition(
        "requestType",
        "contact",
        "Kontak/Penanggung Jawab",
        (
            r"\b(?:kontak|hubungi|"
            r"siapa\s+yang\s+bisa\s+dihubungi)\b"
        ),
        145,
    ),

    _definition(
        "requestType",
        "location",
        "Lokasi/Tempat",
        r"\b(?:di\s+mana|dimana|lokasi)\b",
        125,
    ),

    _definition(
        "documentType",
        "mahasiswa_aktif",
        "Surat Keterangan Mahasiswa Aktif",
        (
            r"\b(?:surat\s+keterangan\s+mahasiswa\s+aktif|"
            r"surat\s+mahasiswa\s+aktif|"
            r"mahasiswa\s+aktif)\b"
        ),
        170,
    ),

    _definition(
        "documentType",
        "keterangan_lulus",
        "Surat Keterangan Lulus",
        r"\b(?:surat\s+keterangan\s+lulus|skl)\b",
        170,
    ),

    _definition(
        "documentType",
        "mengundurkan_diri",
        "Surat Mengundurkan Diri",
        (
            r"\b(?:surat\s+(?:keterangan\s+)?"
            r"mengundurkan\s+diri|"
            r"mengundurkan\s+diri)\b"
        ),
        170,
    ),

    _definition(
        "documentType",
        "mutasi",
        "Surat Mutasi",
        r"\bsurat\s+(?:keterangan\s+)?mutasi\b",
        170,
    ),

    _definition(
        "documentType",
        "putus_studi",
        "Surat Putus Studi/Drop Out",
        (
            r"\b(?:surat\s+(?:keterangan\s+)?"
            r"putus\s+studi|drop\s*out)\b"
        ),
        170,
    ),
]


def _select_non_overlapping(
    candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    prioritized = sorted(
        candidates,

        key=lambda item: (
            -item["priority"],
            -(
                item["end"]
                - item["start"]
            ),
            item["start"],
        ),
    )

    selected: list[
        dict[str, Any]
    ] = []

    for candidate in prioritized:
        overlaps = any(
            candidate["start"]
            < item["end"]

            and item["start"]
            < candidate["end"]

            for item in selected
        )

        if not overlaps:
            selected.append(
                candidate
            )

    return sorted(
        selected,

        key=lambda item: (
            item["start"],
            item["type"],
            -item["priority"],
        ),
    )


def extract_slots(
    message: object,
) -> dict[str, Any]:
    text = str(
        message or ""
    ).lower()

    if not text.strip():
        return {
            "slots": {},
            "details": [],
            "detectedCount": 0,
        }

    details: list[
        dict[str, Any]
    ] = []

    semester_candidates: list[
        dict[str, Any]
    ] = []

    numeric_pattern = (
        r"\b(?:semester|sem|smt)"
        r"\s*(?:ke[\s-]*)?"
        r"(1[0-4]|[1-9])\b"
    )

    for match in re.finditer(
        numeric_pattern,
        text,
        re.IGNORECASE,
    ):
        value = int(
            match.group(1)
        )

        semester_candidates.append({
            "type": "semester",
            "value": value,
            "label":
                f"Semester {value}",
            "raw":
                match.group(0),
            "start":
                match.start(),
            "end":
                match.end(),
            "method":
                "regex_numeric",
            "priority":
                150,
        })

    word_pattern = (
        r"\b(?:semester|sem|smt)"
        r"\s*(?:ke[\s-]*)?"
        r"(satu|dua|tiga|empat|"
        r"lima|enam|tujuh|delapan|"
        r"sembilan|sepuluh|sebelas|"
        r"dua\s+belas|tiga\s+belas|"
        r"empat\s+belas)\b"
    )

    for match in re.finditer(
        word_pattern,
        text,
        re.IGNORECASE,
    ):
        key = re.sub(
            r"\s+",
            " ",
            match.group(1).lower(),
        )

        value = NUMBER_WORDS[key]

        semester_candidates.append({
            "type": "semester",
            "value": value,
            "label":
                f"Semester {value}",
            "raw":
                match.group(0),
            "start":
                match.start(),
            "end":
                match.end(),
            "method":
                "regex_number_word",
            "priority":
                145,
        })

    roman_pattern = (
        r"\b(?:semester|sem|smt)"
        r"\s*(?:ke[\s-]*)?"
        r"(xiv|xiii|xii|xi|x|ix|"
        r"viii|vii|vi|v|iv|iii|ii|i)\b"
    )

    for match in re.finditer(
        roman_pattern,
        text,
        re.IGNORECASE,
    ):
        value = ROMAN_NUMERALS[
            match
            .group(1)
            .lower()
        ]

        semester_candidates.append({
            "type": "semester",
            "value": value,
            "label":
                f"Semester {value}",
            "raw":
                match.group(0),
            "start":
                match.start(),
            "end":
                match.end(),
            "method":
                "regex_roman",
            "priority":
                140,
        })

    details.extend(
        _select_non_overlapping(
            semester_candidates
        )
    )

    academic_year_pattern = (
        r"\b(?:tahun\s+akademik\s+|"
        r"ta\s+)?"
        r"(20\d{2})\s*[/-]\s*"
        r"(20\d{2})\b"
    )

    for match in re.finditer(
        academic_year_pattern,
        text,
        re.IGNORECASE,
    ):
        start_year = int(
            match.group(1)
        )

        end_year = int(
            match.group(2)
        )

        if (
            end_year >= start_year
            and end_year
            - start_year
            <= 2
        ):
            details.append({
                "type":
                    "academicYear",

                "value":
                    (
                        f"{start_year}/"
                        f"{end_year}"
                    ),

                "label":
                    (
                        "Tahun Akademik "
                        f"{start_year}/"
                        f"{end_year}"
                    ),

                "raw":
                    match.group(0),

                "start":
                    match.start(),

                "end":
                    match.end(),

                "method":
                    "regex_academic_year",

                "priority":
                    150,
            })

    for match in re.finditer(
        r"\bkurikulum\s+(20\d{2})\b",
        text,
        re.IGNORECASE,
    ):
        value = int(
            match.group(1)
        )

        details.append({
            "type":
                "curriculumYear",

            "value":
                value,

            "label":
                f"Kurikulum {value}",

            "raw":
                match.group(0),

            "start":
                match.start(),

            "end":
                match.end(),

            "method":
                "regex_curriculum_year",

            "priority":
                150,
        })

    by_type: dict[
        str,
        list[dict[str, Any]],
    ] = {}

    for definition in PATTERNS:
        for match in (
            definition
            .pattern
            .finditer(text)
        ):
            by_type.setdefault(
                definition.slot_type,
                [],
            ).append({
                "type":
                    definition.slot_type,

                "value":
                    definition.value,

                "label":
                    definition.label,

                "raw":
                    match.group(0),

                "start":
                    match.start(),

                "end":
                    match.end(),

                "method":
                    "pattern_dictionary",

                "priority":
                    definition.priority,
            })

    for candidates in (
        by_type.values()
    ):
        details.extend(
            _select_non_overlapping(
                candidates
            )
        )

    details.sort(
        key=lambda item: (
            item["start"],
            item["type"],
            -item["priority"],
        )
    )

    values_by_type: dict[
        str,
        list[Any],
    ] = {}

    for detail in details:
        values = (
            values_by_type
            .setdefault(
                detail["type"],
                [],
            )
        )

        if (
            detail["value"]
            not in values
        ):
            values.append(
                detail["value"]
            )

    slots = {
        slot_type:
            values[0]
            if len(values) == 1
            else values

        for slot_type, values
        in values_by_type.items()
    }

    public_details = [
        {
            key: value
            for key, value
            in detail.items()
            if key != "priority"
        }
        for detail in details
    ]

    return {
        "slots":
            slots,

        "details":
            public_details,

        "detectedCount":
            len(details),
    }


def _as_list(
    value: Any,
) -> list[Any]:
    if value is None:
        return []

    if isinstance(
        value,
        list,
    ):
        return value

    return [value]


def calculate_slot_match(
    user_slots: dict[str, Any],
    faq_slots: dict[str, Any],
) -> dict[str, Any]:
    score = 0.0

    matches: list[str] = []
    mismatches: list[str] = []

    for (
        slot_type,
        weight,
    ) in (
        SLOT_MATCH_WEIGHTS
        .items()
    ):
        if (
            slot_type
            not in user_slots
            or slot_type
            not in faq_slots
        ):
            continue

        faq_values = set(
            _as_list(
                faq_slots[
                    slot_type
                ]
            )
        )

        matched = any(
            value in faq_values
            for value in _as_list(
                user_slots[
                    slot_type
                ]
            )
        )

        if matched:
            score += weight[
                "match"
            ]

            matches.append(
                slot_type
            )
        else:
            score += weight[
                "mismatch"
            ]

            mismatches.append(
                slot_type
            )

    return {
        "score":
            round(
                score,
                6,
            ),

        "matches":
            matches,

        "mismatches":
            mismatches,
    }