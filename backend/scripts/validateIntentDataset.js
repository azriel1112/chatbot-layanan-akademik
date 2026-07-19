import { faqs } from "../src/data/faqs.js";
import { intentDataset } from "../src/data/intentDataset.js";

import { FAQ_CATEGORY_TO_INTENT, INTENTS } from "../src/data/intentConfig.js";

const MINIMUM_UTTERANCES = 200;
const MINIMUM_INTENTS = 4;
const MINIMUM_UTTERANCES_PER_INTENT = 8;

function fail(message) {
  console.error(`VALIDASI GAGAL: ${message}`);
  process.exitCode = 1;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

const faqCategories = [...new Set(faqs.map((faq) => faq.category))];

const mappedCategories = Object.keys(FAQ_CATEGORY_TO_INTENT);

const unmappedCategories = faqCategories.filter(
  (category) => !FAQ_CATEGORY_TO_INTENT[category],
);

const unusedMappings = mappedCategories.filter(
  (category) => !faqCategories.includes(category),
);

if (unmappedCategories.length > 0) {
  fail(`Kategori FAQ tanpa intent: ${unmappedCategories.join(", ")}`);
}

if (unusedMappings.length > 0) {
  fail(`Pemetaan kategori tidak digunakan: ${unusedMappings.join(", ")}`);
}

if (intentDataset.length !== faqs.length) {
  fail(
    `Jumlah dataset (${intentDataset.length}) berbeda dari jumlah FAQ (${faqs.length}).`,
  );
}

if (intentDataset.length < MINIMUM_UTTERANCES) {
  fail(
    `Dataset hanya memiliki ${intentDataset.length} utterance; minimal ${MINIMUM_UTTERANCES}.`,
  );
}

const duplicateIds = findDuplicates(intentDataset.map((row) => row.id));

if (duplicateIds.length > 0) {
  fail(`ID utterance duplikat: ${duplicateIds.join(", ")}`);
}

const duplicateFaqIds = findDuplicates(intentDataset.map((row) => row.faqId));

if (duplicateFaqIds.length > 0) {
  fail(`FAQ ID duplikat: ${duplicateFaqIds.join(", ")}`);
}

for (const row of intentDataset) {
  if (!row.id || !row.text || !row.intent || !row.sourceCategory) {
    fail(`Data tidak lengkap pada FAQ ID ${row.faqId}.`);
  }
}

const counts = intentDataset.reduce((result, row) => {
  result[row.intent] = (result[row.intent] ?? 0) + 1;

  return result;
}, {});

const intentNames = Object.values(INTENTS);

if (intentNames.length < MINIMUM_INTENTS) {
  fail(
    `Jumlah intent hanya ${intentNames.length}; minimal ${MINIMUM_INTENTS}.`,
  );
}

const missingIntents = intentNames.filter((intent) => !counts[intent]);

if (missingIntents.length > 0) {
  fail(`Intent tanpa utterance: ${missingIntents.join(", ")}`);
}

const undersizedIntents = Object.entries(counts).filter(
  ([, count]) => count < MINIMUM_UTTERANCES_PER_INTENT,
);

if (undersizedIntents.length > 0) {
  fail(
    `Intent di bawah ${MINIMUM_UTTERANCES_PER_INTENT} utterance: ${undersizedIntents
      .map(([intent, count]) => `${intent} (${count})`)
      .join(", ")}`,
  );
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Validasi dataset intent berhasil.");
console.log(`Total utterance : ${intentDataset.length}`);
console.log(`Total intent    : ${Object.keys(counts).length}`);

console.table(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, total]) => ({
      intent,
      total,
    })),
);
