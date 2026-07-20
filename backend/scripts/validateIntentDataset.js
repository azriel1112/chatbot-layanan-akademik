import { faqs } from "../src/data/faqs.js";
import {
  DATASET_SOURCE_TYPES,
  intentDataset,
} from "../src/data/intentDataset.js";
import { FAQ_CATEGORY_TO_INTENT, INTENTS } from "../src/data/intentConfig.js";
import { supplementalIntentUtterances } from "../src/data/supplementalIntentUtterances.js";
import {
  cleanText,
  preprocessToText,
} from "../src/services/textPreprocessing.js";

const MINIMUM_UTTERANCES = 200;
const MINIMUM_INTENTS = 4;
const MINIMUM_UTTERANCES_PER_INTENT = 20;

let validationFailed = false;

function fail(message) {
  console.error(`VALIDASI GAGAL: ${message}`);
  validationFailed = true;
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

function findDuplicateGroups(rows, valueSelector) {
  const groupedRows = new Map();

  for (const row of rows) {
    const value = valueSelector(row);

    if (!value) {
      continue;
    }

    if (!groupedRows.has(value)) {
      groupedRows.set(value, []);
    }

    groupedRows.get(value).push(row);
  }

  return [...groupedRows.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([value, group]) => ({
      value,
      group,
    }));
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

if (intentDataset.length < MINIMUM_UTTERANCES) {
  fail(
    `Dataset hanya memiliki ${intentDataset.length} utterance; minimal ${MINIMUM_UTTERANCES}.`,
  );
}

const duplicateIds = findDuplicates(intentDataset.map((row) => row.id));

if (duplicateIds.length > 0) {
  fail(`ID utterance duplikat: ${duplicateIds.join(", ")}`);
}

const intentNames = Object.values(INTENTS);

const validIntentSet = new Set(intentNames);

const validSourceTypeSet = new Set(Object.values(DATASET_SOURCE_TYPES));

for (const row of intentDataset) {
  if (!row.id || !row.text || !row.intent || !row.sourceType) {
    fail(`Data tidak lengkap pada utterance ${row.id || "tanpa ID"}.`);

    continue;
  }

  if (!validIntentSet.has(row.intent)) {
    fail(`Intent tidak dikenal pada ${row.id}: ${row.intent}`);
  }

  if (!validSourceTypeSet.has(row.sourceType)) {
    fail(`Source type tidak dikenal pada ${row.id}: ${row.sourceType}`);
  }
}

const faqRows = intentDataset.filter(
  (row) => row.sourceType === DATASET_SOURCE_TYPES.FAQ,
);

const supplementalRows = intentDataset.filter(
  (row) => row.sourceType === DATASET_SOURCE_TYPES.MANUAL_AUGMENTATION,
);

if (faqRows.length !== faqs.length) {
  fail(
    `Jumlah data sumber FAQ (${faqRows.length}) berbeda dari jumlah FAQ (${faqs.length}).`,
  );
}

if (supplementalRows.length !== supplementalIntentUtterances.length) {
  fail(
    `Jumlah data augmentasi (${supplementalRows.length}) berbeda dari sumber augmentasi (${supplementalIntentUtterances.length}).`,
  );
}

const faqRowIds = faqRows.map((row) => row.faqId);

const duplicateFaqIds = findDuplicates(faqRowIds);

if (duplicateFaqIds.length > 0) {
  fail(`FAQ ID duplikat pada dataset: ${duplicateFaqIds.join(", ")}`);
}

const expectedFaqIds = new Set(faqs.map((faq) => faq.id));

const actualFaqIds = new Set(faqRowIds);

const missingFaqIds = [...expectedFaqIds].filter((id) => !actualFaqIds.has(id));

const unknownFaqIds = [...actualFaqIds].filter((id) => !expectedFaqIds.has(id));

if (missingFaqIds.length > 0) {
  fail(`FAQ belum masuk ke dataset: ${missingFaqIds.join(", ")}`);
}

if (unknownFaqIds.length > 0) {
  fail(`FAQ ID tidak dikenal pada dataset: ${unknownFaqIds.join(", ")}`);
}

for (const row of faqRows) {
  if (!row.sourceCategory || row.faqId === null || row.faqId === undefined) {
    fail(`Metadata sumber FAQ tidak lengkap pada ${row.id}.`);
  }
}

for (const row of supplementalRows) {
  if (row.faqId !== null) {
    fail(`Data augmentasi ${row.id} tidak boleh memiliki faqId.`);
  }

  if (!row.sourceCategory) {
    fail(`Data augmentasi ${row.id} tidak memiliki sourceCategory.`);
  }
}

const exactTextDuplicates = findDuplicateGroups(intentDataset, (row) =>
  cleanText(row.text),
);

if (exactTextDuplicates.length > 0) {
  fail(
    `Terdapat teks duplikat setelah normalisasi: ${exactTextDuplicates
      .map(
        ({ value, group }) =>
          `${value} [${group.map((row) => row.id).join(", ")}]`,
      )
      .join("; ")}`,
  );
}

const preprocessedDuplicates = findDuplicateGroups(intentDataset, (row) =>
  preprocessToText(row.text),
);

if (preprocessedDuplicates.length > 0) {
  fail(
    `Terdapat hasil preprocessing duplikat: ${preprocessedDuplicates
      .map(
        ({ value, group }) =>
          `${value} [${group.map((row) => row.id).join(", ")}]`,
      )
      .join("; ")}`,
  );
}

const counts = intentDataset.reduce((result, row) => {
  result[row.intent] = (result[row.intent] ?? 0) + 1;

  return result;
}, {});

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

if (validationFailed) {
  process.exitCode = 1;
} else {
  console.log("Validasi dataset intent berhasil.");

  console.log(`Total utterance : ${intentDataset.length}`);

  console.log(`Data FAQ        : ${faqRows.length}`);

  console.log(`Data augmentasi : ${supplementalRows.length}`);

  console.log(`Total intent    : ${Object.keys(counts).length}`);

  console.table(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([intent, total]) => ({
        intent,
        total,
      })),
  );
}
