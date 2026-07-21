import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  getPreprocessingStages,
  preprocess,
  preprocessToText,
  tokenize,
} from "../src/services/textPreprocessing.js";

test("cleanText mengubah lowercase dan menghapus tanda baca", () => {
  assert.equal(
    cleanText("Bagaimana CARA membayar biaya kuliah?"),
    "bagaimana cara membayar biaya kuliah",
  );
});

test("tokenize memecah teks berdasarkan spasi", () => {
  assert.deepEqual(tokenize("Semester 8 dimulai kapan?"), [
    "semester",
    "8",
    "dimulai",
    "kapan",
  ]);
});

test("preprocess mempertahankan angka, menghapus stopword, dan melakukan stemming", () => {
  assert.deepEqual(
    preprocess("Bagaimana cara membayar biaya kuliah semester 8?"),
    ["bayar", "biaya", "kuliah", "semester", "8"],
  );
});

test("preprocessToText menghasilkan teks siap dipakai model", () => {
  assert.equal(
    preprocessToText("Apa itu Seminar Proposal?"),
    "seminar proposal",
  );
});

test("preprocess aman untuk nilai kosong", () => {
  assert.deepEqual(preprocess(null), []);

  assert.deepEqual(preprocess(undefined), []);
});

test("getPreprocessingStages mengembalikan seluruh tahapan", () => {
  const stages = getPreprocessingStages("Apa itu Tugas Akhir?");

  assert.equal(stages.lowercase, "apa itu tugas akhir?");

  assert.equal(stages.cleaned, "apa itu tugas akhir");

  assert.deepEqual(stages.tokens, ["apa", "itu", "tugas", "akhir"]);

  assert.deepEqual(stages.filteredTokens, ["tugas", "akhir"]);

  assert.deepEqual(stages.stemmedTokens, ["tugas", "akhir"]);

  assert.equal(stages.result, "tugas akhir");
});

test("preprocess mempertahankan angka Romawi untuk nomor bab", () => {
  assert.deepEqual(preprocess("Apa saja isi BAB IV Tugas Akhir?"), [
    "saja",
    "isi",
    "bab",
    "iv",
    "tugas",
    "akhir",
  ]);
});
