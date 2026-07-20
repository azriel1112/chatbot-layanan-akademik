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

  assert.ok(result.confidence >= 0.9);
});

test("input di luar domain tidak dipaksakan menjadi jawaban FAQ", async () => {
  const result = await getBotReply("cara membuat nasi goreng");

  assert.equal(result.confidence, 0);

  assert.equal(result.matchedQuestion, null);

  assert.equal(result.category, null);

  assert.equal(result.retrievalMode, "no_match");
});

test("input tanpa token vocabulary model tetap ditangani dengan aman", async () => {
  const result = await getBotReply("halo apa kabar");

  assert.equal(result.intent, null);

  assert.equal(result.intentAccepted, false);

  assert.equal(result.confidence, 0);

  assert.equal(result.retrievalMode, "no_match");
});
