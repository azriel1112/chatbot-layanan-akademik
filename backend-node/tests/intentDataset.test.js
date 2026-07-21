import test from "node:test";
import assert from "node:assert/strict";
import { faqs } from "../src/data/faqs.js";
import {
  DATASET_SOURCE_TYPES,
  intentDataset,
} from "../src/data/intentDataset.js";
import { INTENTS } from "../src/data/intentConfig.js";
import { supplementalIntentUtterances } from "../src/data/supplementalIntentUtterances.js";

const MINIMUM_UTTERANCES_PER_INTENT = 20;

test("dataset menggabungkan FAQ dan utterance augmentasi", () => {
  const expectedTotal = faqs.length + supplementalIntentUtterances.length;

  assert.equal(intentDataset.length, expectedTotal);

  assert.equal(faqs.length, 300);

  assert.equal(supplementalIntentUtterances.length, 27);

  assert.equal(intentDataset.length, 327);
});

test("dataset mempertahankan seluruh data FAQ", () => {
  const faqRows = intentDataset.filter(
    (row) => row.sourceType === DATASET_SOURCE_TYPES.FAQ,
  );

  assert.equal(faqRows.length, faqs.length);

  assert.equal(new Set(faqRows.map((row) => row.faqId)).size, faqs.length);
});

test("data augmentasi tidak menggunakan faqId", () => {
  const supplementalRows = intentDataset.filter(
    (row) => row.sourceType === DATASET_SOURCE_TYPES.MANUAL_AUGMENTATION,
  );

  assert.equal(supplementalRows.length, supplementalIntentUtterances.length);

  assert.ok(supplementalRows.every((row) => row.faqId === null));
});

test("setiap intent memiliki minimal dua puluh utterance", () => {
  const counts = intentDataset.reduce((result, row) => {
    result[row.intent] = (result[row.intent] ?? 0) + 1;

    return result;
  }, {});

  assert.equal(Object.keys(counts).length, Object.values(INTENTS).length);

  for (const intent of Object.values(INTENTS)) {
    assert.ok(
      counts[intent] >= MINIMUM_UTTERANCES_PER_INTENT,
      `${intent} hanya memiliki ${counts[intent] ?? 0} utterance`,
    );
  }
});

test("seluruh ID utterance bersifat unik", () => {
  const ids = intentDataset.map((row) => row.id);

  assert.equal(new Set(ids).size, ids.length);
});
