import assert from "node:assert/strict";

import test from "node:test";

import {
  calculateSlotMatch,
  extractSlots,
} from "../src/services/slotFillingService.js";

test("mengekstrak semester numerik, prodi, kurikulum, dan layanan", () => {
  const result = extractSlots(
    "Apa mata kuliah semester 6 Teknik Informatika kurikulum 2025?",
  );

  assert.deepEqual(result.slots, {
    semester: 6,

    studyProgram: "teknik_informatika",

    curriculumYear: 2025,
  });

  assert.equal(result.detectedCount, 3);
});

test("mengekstrak semester dalam bentuk kata dan angka Romawi", () => {
  const wordResult = extractSlots("Saya sekarang semester delapan");

  const romanResult = extractSlots("Mata kuliah semester VIII apa saja?");

  assert.equal(wordResult.slots.semester, 8);

  assert.equal(romanResult.slots.semester, 8);
});

test("mengekstrak tahun akademik, periode semester, kampus, dan program kelas", () => {
  const result = extractSlots(
    "Pengambilan KTM Reguler 1 semester ganjil " +
      "tahun akademik 2025/2026 di Kampus Meruya",
  );

  assert.equal(result.slots.academicYear, "2025/2026");

  assert.equal(result.slots.semesterPeriod, "ganjil");

  assert.equal(result.slots.campus, "meruya");

  assert.equal(result.slots.classProgram, "reguler_1");
});

test("mendukung lebih dari satu nilai untuk jenis slot yang sama", () => {
  const result = extractSlots("Saya ingin pindah dari Reguler 1 ke Reguler 2");

  assert.deepEqual(result.slots.classProgram, ["reguler_1", "reguler_2"]);

  assert.equal(result.slots.service, "pindah_program_perkuliahan");
});

test("memprioritaskan pola layanan yang lebih spesifik", () => {
  const activeResult = extractSlots("Bagaimana aktif kembali dari cuti?");

  const moveResult = extractSlots(
    "Prosedur pindah program studi ke Informatika",
  );

  assert.equal(activeResult.slots.service, "aktif_kembali");

  assert.equal(moveResult.slots.service, "pindah_program_studi");

  assert.equal(
    moveResult.slots.studyProgram,

    "teknik_informatika",
  );
});

test("mengekstrak jenis dokumen akademik", () => {
  const result = extractSlots(
    "Bagaimana mengajukan surat keterangan " +
      "mahasiswa aktif di kampus Menteng?",
  );

  assert.equal(result.slots.documentType, "mahasiswa_aktif");

  assert.equal(result.slots.service, "surat_keterangan");

  assert.equal(result.slots.campus, "menteng");
});

test("singkatan TA untuk tahun akademik tidak dianggap Tugas Akhir", () => {
  const result = extractSlots("Kalender TA 2025/2026 semester genap");

  assert.equal(result.slots.academicYear, "2025/2026");

  assert.equal(result.slots.service, undefined);
});

test("calculateSlotMatch memberi bonus pada slot sama dan penalti pada slot berbeda", () => {
  const matched = calculateSlotMatch(
    {
      semester: 6,

      studyProgram: "teknik_informatika",
    },

    {
      semester: 6,

      studyProgram: "teknik_informatika",
    },
  );

  const mismatched = calculateSlotMatch(
    {
      semester: 6,
      campus: "menteng",
    },

    {
      semester: 5,
      campus: "meruya",
    },
  );

  assert.equal(matched.score, 0.6);

  assert.deepEqual(matched.matches, ["semester", "studyProgram"]);

  assert.ok(mismatched.score < 0);

  assert.deepEqual(mismatched.mismatches, ["semester", "campus"]);
});
