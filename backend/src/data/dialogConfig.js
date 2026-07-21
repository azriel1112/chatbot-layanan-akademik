export const DIALOG_STATES = Object.freeze({
  IDLE: "idle",
  AWAITING_SLOT: "awaiting_slot",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
});

export const DIALOG_TURN_TYPES = Object.freeze({
  DIRECT_ANSWER: "direct_answer",
  SLOT_PROMPT: "slot_prompt",
  CONFIRMATION_PROMPT: "confirmation_prompt",
  CONFIRMATION_RETRY: "confirmation_retry",
  FINAL_ANSWER: "final_answer",
  CANCELLED: "cancelled",
  NO_MATCH: "no_match",
});

export const CONFIRMATION_VALUES = Object.freeze({
  AFFIRMATIVE: "affirmative",
  NEGATIVE: "negative",
  UNKNOWN: "unknown",
});

const SLOT_VALUE_LABELS = Object.freeze({
  documentType: Object.freeze({
    mahasiswa_aktif: "Surat Keterangan Mahasiswa Aktif",
    keterangan_lulus: "Surat Keterangan Lulus",
    mengundurkan_diri: "Surat Mengundurkan Diri",
    mutasi: "Surat Mutasi",
    putus_studi: "Surat Putus Studi/Drop Out",
  }),

  campus: Object.freeze({
    meruya: "Kampus Meruya",
    menteng: "Kampus Menteng",
    warung_buncit: "Kampus Warung Buncit",
  }),

  studyProgram: Object.freeze({
    teknik_informatika: "Teknik Informatika",
    sistem_informasi: "Sistem Informasi",
    sains_data: "Sains Data",
  }),

  classProgram: Object.freeze({
    reguler_1: "Reguler 1",
    reguler_2: "Reguler 2/Karyawan",
  }),
});

const CANCELLATION_PATTERN =
  /^(?:batal|batalkan|cancel|reset|mulai\s+ulang|ulang\s+dari\s+awal)$/i;

const AFFIRMATIVE_PATTERN =
  /^(?:ya|iya|yap|yes|benar|betul|boleh|oke|ok|lanjut|setuju|tampilkan|ya\s+tampilkan|iya\s+tampilkan)$/i;

const NEGATIVE_PATTERN =
  /^(?:tidak|nggak|enggak|gak|ga|no|bukan|salah|jangan|ubah|tidak\s+jadi|nggak\s+jadi)$/i;

function normalizeMessage(message) {
  return String(message ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSlotValue(slots, slotName) {
  const value = slots?.[slotName];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && value !== "";
}

function formatSlotValue(slotName, value) {
  if (Array.isArray(value)) {
    return value.map((item) => formatSlotValue(slotName, item)).join(" dan ");
  }

  return SLOT_VALUE_LABELS[slotName]?.[value] ?? String(value);
}

export const DIALOG_RULES = Object.freeze([
  Object.freeze({
    id: "surat_keterangan_terstruktur",

    requiredSlots: Object.freeze(["documentType", "campus"]),

    matches({ message, nlpResult }) {
      const normalized = normalizeMessage(message);

      return Boolean(
        nlpResult?.slots?.service === "surat_keterangan" ||
        nlpResult?.category === "Surat Keterangan" ||
        /\bsurat\s+(?:keterangan|mahasiswa\s+aktif|keterangan\s+lulus)\b/.test(
          normalized,
        ),
      );
    },

    slotPrompts: Object.freeze({
      documentType: Object.freeze({
        text: "Jenis surat apa yang ingin Anda ajukan? Pilih salah satu agar saya dapat mencari prosedur yang tepat.",

        quickReplies: Object.freeze([
          "Surat mahasiswa aktif",
          "Surat keterangan lulus",
          "Surat mengundurkan diri",
          "Surat mutasi",
          "Surat putus studi",
        ]),
      }),

      campus: Object.freeze({
        text: "Pengajuan tersebut ditujukan untuk kampus mana?",

        quickReplies: Object.freeze([
          "Kampus Meruya",
          "Kampus Menteng",
          "Kampus Warung Buncit",
        ]),
      }),
    }),

    buildConfirmation({ slots, nlpResult }) {
      const documentLabel = formatSlotValue("documentType", slots.documentType);

      const campusLabel = formatSlotValue("campus", slots.campus);

      const question =
        nlpResult?.matchedQuestion ?? "prosedur pengajuan surat tersebut";

      return (
        `Saya menangkap bahwa Anda membutuhkan ${documentLabel} ` +
        `untuk ${campusLabel}. ` +
        `Saya menemukan FAQ “${question}”. ` +
        "Apakah Anda ingin menampilkan jawabannya?"
      );
    },
  }),

  Object.freeze({
    id: "kurikulum_mata_kuliah_terstruktur",

    requiredSlots: Object.freeze(["studyProgram", "semester"]),

    matches({ message, nlpResult }) {
      const normalized = normalizeMessage(message);

      return Boolean(
        /\b(?:mata\s+kuliah|matkul)\b/.test(normalized) &&
        (nlpResult?.intent === "kurikulum_dan_mata_kuliah" ||
          String(nlpResult?.category ?? "")
            .toLowerCase()
            .includes("kurikulum")),
      );
    },

    slotPrompts: Object.freeze({
      studyProgram: Object.freeze({
        text: "Mata kuliah untuk program studi apa?",

        quickReplies: Object.freeze([
          "Teknik Informatika",
          "Sistem Informasi",
          "Sains Data",
        ]),
      }),

      semester: Object.freeze({
        text: "Semester berapa yang ingin Anda lihat?",

        quickReplies: Object.freeze([
          "Semester 1",
          "Semester 2",
          "Semester 3",
          "Semester 4",
          "Semester 5",
          "Semester 6",
          "Semester 7",
          "Semester 8",
        ]),
      }),
    }),

    buildConfirmation({ slots, nlpResult }) {
      const programLabel = formatSlotValue("studyProgram", slots.studyProgram);

      const semesterLabel = `Semester ${slots.semester}`;

      const question =
        nlpResult?.matchedQuestion ??
        `daftar mata kuliah ${programLabel} ${semesterLabel}`;

      return (
        `Anda ingin melihat mata kuliah ${programLabel} ` +
        `${semesterLabel}. ` +
        `Saya menemukan FAQ “${question}”. ` +
        "Apakah informasi tersebut yang ingin ditampilkan?"
      );
    },
  }),

  Object.freeze({
    id: "prefix_pembayaran_terstruktur",

    requiredSlots: Object.freeze(["classProgram"]),

    matches({ message, nlpResult }) {
      const normalized = normalizeMessage(message);

      return Boolean(
        /\b(?:prefix|kode\s+pembayaran)\b/.test(normalized) &&
        (nlpResult?.intent === "pembayaran_dan_biaya" ||
          nlpResult?.category === "Pembayaran dan Biaya Kuliah"),
      );
    },

    slotPrompts: Object.freeze({
      classProgram: Object.freeze({
        text: "Kode pembayaran tersebut untuk program kelas yang mana?",

        quickReplies: Object.freeze(["Reguler 1", "Reguler 2/Karyawan"]),
      }),
    }),

    buildConfirmation({ slots, nlpResult }) {
      const classLabel = formatSlotValue("classProgram", slots.classProgram);

      const question =
        nlpResult?.matchedQuestion ?? `kode pembayaran ${classLabel}`;

      return (
        `Anda menanyakan kode pembayaran untuk ${classLabel}. ` +
        `Saya menemukan FAQ “${question}”. ` +
        "Apakah Anda ingin melihat jawabannya?"
      );
    },
  }),
]);

export function findDialogRule({ message, nlpResult }) {
  return (
    DIALOG_RULES.find((rule) =>
      rule.matches({
        message,
        nlpResult,
      }),
    ) ?? null
  );
}

export function getNextMissingSlot(rule, slots = {}) {
  if (!rule) {
    return null;
  }

  return (
    rule.requiredSlots.find((slotName) => !hasSlotValue(slots, slotName)) ??
    null
  );
}

export function getSlotPrompt(rule, slotName) {
  const prompt = rule?.slotPrompts?.[slotName];

  if (!prompt) {
    throw new Error(
      `Prompt untuk slot ${slotName} pada rule ` +
        `${rule?.id ?? "unknown"} tidak tersedia.`,
    );
  }

  return {
    text: prompt.text,
    quickReplies: [...prompt.quickReplies],
  };
}

export function normalizeSlotAnswer(slotName, answer) {
  const normalizedAnswer = String(answer ?? "").trim();

  const prefixes = {
    documentType: "surat ",
    campus: "kampus ",
    studyProgram: "program studi ",
    semester: "semester ",
    classProgram: "kelas ",
  };

  const prefix = prefixes[slotName] ?? "";

  const lowerAnswer = normalizedAnswer.toLowerCase();

  if (prefix && !lowerAnswer.startsWith(prefix.trim())) {
    return `${prefix}${normalizedAnswer}`;
  }

  return normalizedAnswer;
}

export function classifyConfirmation(message) {
  const normalized = normalizeMessage(message);

  if (AFFIRMATIVE_PATTERN.test(normalized)) {
    return CONFIRMATION_VALUES.AFFIRMATIVE;
  }

  if (NEGATIVE_PATTERN.test(normalized)) {
    return CONFIRMATION_VALUES.NEGATIVE;
  }

  return CONFIRMATION_VALUES.UNKNOWN;
}

export function isCancellationMessage(message) {
  return CANCELLATION_PATTERN.test(normalizeMessage(message));
}

export function buildConfirmationText(rule, context) {
  if (typeof rule?.buildConfirmation === "function") {
    return rule.buildConfirmation(context);
  }

  const question =
    context?.nlpResult?.matchedQuestion ?? "informasi yang ditemukan";

  return (
    `Saya menemukan “${question}”. ` +
    "Apakah Anda ingin menampilkan jawabannya?"
  );
}
