import test from "node:test";
import assert from "node:assert/strict";

import { getAllFaqs, getBotReply } from "../src/services/nlpService.js";

test("getAllFaqs tetap mengembalikan seluruh FAQ", () => {
  assert.equal(getAllFaqs().length, 300);
});

test("getBotReply tetap menghasilkan struktur respons chatbot", () => {
  const result = getBotReply("Apa itu Tugas Akhir?");

  assert.equal(typeof result.answer, "string");

  assert.ok(result.answer.length > 0);

  assert.equal(typeof result.matchedQuestion, "string");

  assert.equal(typeof result.category, "string");

  assert.equal(typeof result.confidence, "number");

  assert.ok(Number.isFinite(result.confidence));

  assert.ok(Array.isArray(result.suggestions));

  assert.equal(result.suggestions.length, 3);
});
