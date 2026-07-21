import test from "node:test";
import assert from "node:assert/strict";
import { stratifiedSplit } from "../src/ml/datasetSplit.js";
import { TfidfVectorizer } from "../src/ml/tfidfVectorizer.js";
import { IntentClassifierService } from "../src/services/intentClassifierService.js";

test("stratifiedSplit deterministik dan mempertahankan seluruh data", () => {
  const rows = [
    { id: "a-1", text: "alpha satu", intent: "alpha" },
    { id: "a-2", text: "alpha dua", intent: "alpha" },
    { id: "a-3", text: "alpha tiga", intent: "alpha" },
    { id: "a-4", text: "alpha empat", intent: "alpha" },
    { id: "b-1", text: "beta satu", intent: "beta" },
    { id: "b-2", text: "beta dua", intent: "beta" },
    { id: "b-3", text: "beta tiga", intent: "beta" },
    { id: "b-4", text: "beta empat", intent: "beta" },
  ];

  const first = stratifiedSplit(rows, { testRatio: 0.25, seed: 42 });
  const second = stratifiedSplit(rows, { testRatio: 0.25, seed: 42 });

  assert.deepEqual(
    first.testRows.map((row) => row.id),
    second.testRows.map((row) => row.id),
  );
  assert.equal(first.trainRows.length + first.testRows.length, rows.length);
  assert.equal(
    new Set([...first.trainRows, ...first.testRows].map((row) => row.id)).size,
    rows.length,
  );
  assert.equal(first.distribution.alpha.test, 1);
  assert.equal(first.distribution.beta.test, 1);
});

test("TfidfVectorizer menghasilkan vector dengan panjang vocabulary", () => {
  const vectorizer = new TfidfVectorizer();
  vectorizer.fit([
    ["bayar", "kuliah"],
    ["jadwal", "kuliah"],
  ]);

  const vector = vectorizer.transform(["bayar", "kuliah"]);

  assert.equal(vector.length, vectorizer.vocabulary.length);
  assert.ok(vector.some((value) => value > 0));
  assert.ok(vector.every((value) => Number.isFinite(value)));
});

test("intent classifier dapat dilatih, diprediksi, dan dipulihkan dari JSON", () => {
  const trainingRows = [
    { id: "p-1", text: "cek pembayaran kuliah", intent: "pembayaran" },
    { id: "p-2", text: "tagihan biaya semester", intent: "pembayaran" },
    { id: "p-3", text: "konfirmasi uang kuliah", intent: "pembayaran" },
    { id: "s-1", text: "jadwal seminar proposal", intent: "seminar" },
    { id: "s-2", text: "pendaftaran sidang sempro", intent: "seminar" },
    { id: "s-3", text: "revisi seminar proposal", intent: "seminar" },
  ];

  const model = IntentClassifierService.train(trainingRows);
  const paymentPrediction = model.predict("bagaimana cek tagihan kuliah");
  const seminarPrediction = model.predict("kapan jadwal sidang sempro");

  assert.equal(paymentPrediction.intent, "pembayaran");
  assert.equal(seminarPrediction.intent, "seminar");
  assert.ok(paymentPrediction.confidence > 0);
  assert.ok(seminarPrediction.confidence > 0);

  const restored = IntentClassifierService.fromJSON(model.toJSON());
  assert.deepEqual(
    restored.predict("kapan jadwal sidang sempro"),
    seminarPrediction,
  );
});

test("intent classifier menandai input tanpa vocabulary sebagai unknown", () => {
  const model = IntentClassifierService.train([
    { id: "a-1", text: "jadwal kuliah", intent: "akademik" },
    { id: "a-2", text: "kalender semester", intent: "akademik" },
    { id: "b-1", text: "biaya kuliah", intent: "pembayaran" },
    { id: "b-2", text: "tagihan semester", intent: "pembayaran" },
  ]);

  const result = model.predict("xyzabc qwerty");

  assert.equal(result.intent, null);
  assert.equal(result.confidence, 0);
  assert.equal(result.isUnknown, true);
});
