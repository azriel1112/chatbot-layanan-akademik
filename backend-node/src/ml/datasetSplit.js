function createSeededRandom(seed) {
  let state = Number(seed) >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [result[index], result[targetIndex]] = [result[targetIndex], result[index]];
  }

  return result;
}

function assertDatasetRow(row, index) {
  if (!row || typeof row !== "object") {
    throw new TypeError(`Data pada indeks ${index} harus berupa object.`);
  }

  if (!String(row.id ?? "").trim()) {
    throw new Error(`Data pada indeks ${index} tidak memiliki id.`);
  }

  if (!String(row.intent ?? "").trim()) {
    throw new Error(`Data ${row.id} tidak memiliki intent.`);
  }
}

export function stratifiedSplit(rows, { testRatio = 0.2, seed = 2026 } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Dataset untuk stratified split tidak boleh kosong.");
  }

  if (!(testRatio > 0 && testRatio < 1)) {
    throw new RangeError(
      "testRatio harus lebih besar dari 0 dan lebih kecil dari 1.",
    );
  }

  rows.forEach(assertDatasetRow);

  const random = createSeededRandom(seed);
  const groupedRows = new Map();

  for (const row of rows) {
    if (!groupedRows.has(row.intent)) {
      groupedRows.set(row.intent, []);
    }

    groupedRows.get(row.intent).push(row);
  }

  const trainRows = [];
  const testRows = [];
  const distribution = {};

  for (const intent of [...groupedRows.keys()].sort()) {
    const intentRows = shuffle(groupedRows.get(intent), random);

    if (intentRows.length < 2) {
      throw new Error(
        `Intent ${intent} hanya memiliki ${intentRows.length} data; minimal 2 untuk train-test split.`,
      );
    }

    const testCount = Math.min(
      intentRows.length - 1,
      Math.max(1, Math.round(intentRows.length * testRatio)),
    );

    const intentTestRows = intentRows.slice(0, testCount);
    const intentTrainRows = intentRows.slice(testCount);

    testRows.push(...intentTestRows);
    trainRows.push(...intentTrainRows);

    distribution[intent] = {
      total: intentRows.length,
      train: intentTrainRows.length,
      test: intentTestRows.length,
    };
  }

  return {
    trainRows: shuffle(trainRows, random),
    testRows: shuffle(testRows, random),
    distribution,
    seed,
    testRatio,
  };
}
