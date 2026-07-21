import assert from "node:assert/strict";

import path from "node:path";

import { before, test } from "node:test";

import { fileURLToPath } from "node:url";

import {
  getBotReply,
  initializeNlpService,
} from "../src/services/nlpService.js";

const currentFile = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFile);

const modelPath = path.resolve(
  currentDirectory,
  "../models/intent_classifier.json",
);

before(async () => {
  await initializeNlpService({
    modelPath,
    forceReload: true,
  });
});

test("classifier membatasi pencarian FAQ ke intent pembayaran", async () => {
  const result = await getBotReply("bagaimana cara bayar uang kuliah");

  assert.equal(result.intent, "pembayaran_dan_biaya");

  assert.equal(result.intentAccepted, true);

  assert.equal(result.retrievalMode, "intent_filtered");

  assert.equal(result.category, "Pembayaran dan Biaya Kuliah");

  assert.match(result.matchedQuestion, /membayar biaya kuliah/i);

  assert.ok(result.confidence >= 0.18);
});

test("pertanyaan tugas akhir menghasilkan intent dan FAQ yang selaras", async () => {
  const result = await getBotReply(
    "Apa saja syarat pendaftaran sidang Tugas Akhir?",
  );

  assert.equal(result.intent, "tugas_akhir");

  assert.equal(result.matchedIntent, "tugas_akhir");

  assert.equal(result.category, "Tugas Akhir");

  assert.match(
    result.matchedQuestion,
    /syarat pendaftaran sidang tugas akhir/i,
  );

  assert.equal(result.slots.service, "tugas_akhir");

  assert.ok(result.intentConfidence > 0);
});

test("pertanyaan FAQ yang sama persis memilih pertanyaan tersebut", async () => {
  const result = await getBotReply("Apa saja syarat mengikuti Magang Mandiri?");

  assert.equal(result.intent, "kerja_praktek_dan_magang");

  assert.equal(result.category, "Magang Mandiri");

  assert.equal(
    result.matchedQuestion,

    "Apa saja syarat mengikuti Magang Mandiri?",
  );

  assert.equal(result.slots.service, "magang_mandiri");

  assert.ok(result.confidence >= 0.9);
});

test("slot semester, prodi, dan kurikulum mengarahkan FAQ ke semester yang tepat", async () => {
  const result = await getBotReply(
    "Apa mata kuliah semester 6 Informatika kurikulum 2025?",
  );

  assert.equal(result.slots.semester, 6);

  assert.equal(
    result.slots.studyProgram,

    "teknik_informatika",
  );

  assert.equal(
    result.slots.curriculumYear,

    2025,
  );

  assert.equal(result.category, "Kurikulum Informatika");

  assert.match(
    result.matchedQuestion,

    /semester 6 informatika kurikulum 2025/i,
  );

  assert.ok(result.matchedSlotTypes.includes("semester"));

  assert.ok(result.matchedSlotTypes.includes("studyProgram"));

  assert.ok(result.matchedSlotTypes.includes("curriculumYear"));
});

test("slot kampus memilih form surat keterangan untuk Kampus Menteng", async () => {
  const result = await getBotReply(
    "Form surat keterangan untuk Kampus Menteng yang mana?",
  );

  assert.equal(result.slots.campus, "menteng");

  assert.equal(result.slots.service, "surat_keterangan");

  assert.equal(result.category, "Surat Keterangan");

  assert.match(result.matchedQuestion, /kampus menteng/i);

  assert.ok(result.matchedSlotTypes.includes("campus"));
});

test("slot program kelas memilih prefix pembayaran Reguler 2", async () => {
  const result = await getBotReply(
    "Apa kode prefix pembayaran untuk kelas Reguler 2?",
  );

  assert.equal(
    result.slots.classProgram,

    "reguler_2",
  );

  assert.equal(
    result.category,

    "Pembayaran dan Biaya Kuliah",
  );

  assert.match(
    result.matchedQuestion,

    /reguler 2 atau kelas karyawan/i,
  );

  assert.ok(result.matchedSlotTypes.includes("classProgram"));
});

test("slot jenis dokumen memilih prosedur surat mahasiswa aktif", async () => {
  const result = await getBotReply(
    "Bagaimana cara mengajukan surat mahasiswa aktif?",
  );

  assert.equal(
    result.slots.documentType,

    "mahasiswa_aktif",
  );

  assert.equal(result.category, "Surat Keterangan");

  assert.match(
    result.matchedQuestion,

    /mengajukan surat keterangan mahasiswa aktif/i,
  );

  assert.ok(result.matchedSlotTypes.includes("documentType"));
});

test("input di luar domain tidak dipaksakan menjadi jawaban FAQ", async () => {
  const result = await getBotReply("cara membuat nasi goreng");

  assert.equal(result.confidence, 0);

  assert.equal(result.matchedQuestion, null);

  assert.equal(result.category, null);

  assert.equal(result.retrievalMode, "no_match");

  assert.deepEqual(result.slots, {});
});

test("input tanpa token vocabulary model tetap ditangani dengan aman", async () => {
  const result = await getBotReply("halo apa kabar");

  assert.equal(result.intent, null);

  assert.equal(result.intentAccepted, false);

  assert.equal(result.confidence, 0);

  assert.equal(result.retrievalMode, "no_match");
});
