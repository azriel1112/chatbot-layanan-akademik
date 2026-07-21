import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { intentDataset } from "../src/data/intentDataset.js";
import { INTENTS } from "../src/data/intentConfig.js";
import { evaluateIntentClassifier } from "../src/ml/modelEvaluation.js";
import { preprocess } from "../src/services/textPreprocessing.js";
import { loadIntentClassifier } from "../src/services/intentClassifierService.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const analysisDirectory = path.resolve(currentDirectory, "../analysis");
const modelPath = path.resolve(
  currentDirectory,
  "../models/intent_classifier.json",
);
const splitPath = path.join(analysisDirectory, "model_split.json");

function escapeCsv(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function createCsv(header, rows) {
  return (
    [
      header.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n") + "\n"
  );
}

function toPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createConfusionMatrixSvg(labels, matrix) {
  const cellSize = 52;
  const leftPadding = 365;
  const topPadding = 365;
  const rightPadding = 80;
  const bottomPadding = 110;
  const width = leftPadding + labels.length * cellSize + rightPadding;
  const height = topPadding + labels.length * cellSize + bottomPadding;
  const maxValue = Math.max(
    1,
    ...labels.flatMap((actual) =>
      labels.map((predicted) => matrix[actual][predicted]),
    ),
  );

  const cells = [];

  labels.forEach((actual, rowIndex) => {
    labels.forEach((predicted, columnIndex) => {
      const value = matrix[actual][predicted];
      const opacity = 0.08 + (value / maxValue) * 0.82;
      const x = leftPadding + columnIndex * cellSize;
      const y = topPadding + rowIndex * cellSize;

      cells.push(`
        <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#2563eb" fill-opacity="${opacity.toFixed(3)}" stroke="#cbd5e1" />
        <text x="${x + cellSize / 2}" y="${y + 32}" text-anchor="middle" font-size="15" font-weight="600">${value}</text>`);
    });
  });

  const rowLabels = labels
    .map((label, index) => {
      const y = topPadding + index * cellSize + 32;
      return `<text x="${leftPadding - 14}" y="${y}" text-anchor="end" font-size="13">${xmlEscape(label)}</text>`;
    })
    .join("");

  const columnLabels = labels
    .map((label, index) => {
      const x = leftPadding + index * cellSize + 31;
      const y = topPadding - 14;
      return `<text x="${x}" y="${y}" text-anchor="start" font-size="13" transform="rotate(-55 ${x} ${y})">${xmlEscape(label)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white" />
  <text x="${width / 2}" y="42" text-anchor="middle" font-size="24" font-weight="700">Confusion Matrix Intent Classifier</text>
  <text x="${width / 2}" y="72" text-anchor="middle" font-size="14">Baris = intent aktual, kolom = intent prediksi</text>
  ${rowLabels}
  ${columnLabels}
  ${cells.join("")}
  <text x="${leftPadding + (labels.length * cellSize) / 2}" y="${height - 32}" text-anchor="middle" font-size="16" font-weight="600">Predicted Intent</text>
  <text x="38" y="${topPadding + (labels.length * cellSize) / 2}" text-anchor="middle" font-size="16" font-weight="600" transform="rotate(-90 38 ${topPadding + (labels.length * cellSize) / 2})">Actual Intent</text>
</svg>
`;
}

function getTopTermsByIntent(rows, limit = 12) {
  const countsByIntent = new Map();

  for (const row of rows) {
    if (!countsByIntent.has(row.intent)) {
      countsByIntent.set(row.intent, new Map());
    }

    const counts = countsByIntent.get(row.intent);
    for (const token of new Set(preprocess(row.text))) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return Object.fromEntries(
    [...countsByIntent.entries()].map(([intent, counts]) => [
      intent,
      [...counts.entries()]
        .sort(
          ([tokenA, totalA], [tokenB, totalB]) =>
            totalB - totalA || tokenA.localeCompare(tokenB),
        )
        .slice(0, limit)
        .map(([token]) => token),
    ]),
  );
}

function createMarkdownReport({
  metrics,
  labels,
  splitManifest,
  topTermsByIntent,
}) {
  const perIntentRows = metrics.perIntent
    .map(
      (row) =>
        `| \`${row.intent}\` | ${toPercent(row.precision)} | ${toPercent(row.recall)} | ${toPercent(row.f1Score)} | ${row.support} |`,
    )
    .join("\n");

  const confusionRows = metrics.confusionPairs.length
    ? metrics.confusionPairs
        .slice(0, 10)
        .map(
          (row, index) =>
            `| ${index + 1} | \`${row.actualIntent}\` | \`${row.predictedIntent}\` | ${row.total} |`,
        )
        .join("\n")
    : "| 1 | - | - | 0 |";

  const errorRows =
    metrics.predictions
      .filter((row) => !row.correct)
      .slice(0, 15)
      .map(
        (row, index) =>
          `| ${index + 1} | ${row.text.replaceAll("|", "\\|")} | \`${row.actualIntent}\` | \`${row.predictedIntent}\` | ${toPercent(row.confidence)} |`,
      )
      .join("\n") ||
    "| 1 | Tidak ada kesalahan pada data testing. | - | - | - |";

  const topConfusion = metrics.confusionPairs[0] ?? null;
  let confusionAnalysis =
    "Tidak ditemukan pasangan intent yang tertukar pada data testing.";

  if (topConfusion) {
    const actualTerms = new Set(
      topTermsByIntent[topConfusion.actualIntent] ?? [],
    );
    const sharedTerms = (
      topTermsByIntent[topConfusion.predictedIntent] ?? []
    ).filter((token) => actualTerms.has(token));
    const overlapText = sharedTerms.length
      ? `Kedua intent memiliki kata dominan yang beririsan, yaitu: ${sharedTerms.map((token) => `\`${token}\``).join(", ")}.`
      : "Tidak ditemukan irisan kuat pada kata dominan; kesalahan kemungkinan berasal dari kalimat yang pendek atau terlalu umum.";

    confusionAnalysis = `Kesalahan terbanyak terjadi saat \`${topConfusion.actualIntent}\` diprediksi sebagai \`${topConfusion.predictedIntent}\` sebanyak **${topConfusion.total}** data. ${overlapText}`;
  }

  return `# Evaluasi Intent Classifier

## Konfigurasi

- Algoritma: **TF-IDF + Logistic Regression**
- Teknik pembagian data: **stratified train-test split**
- Random seed: **${splitManifest.randomSeed}**
- Rasio testing: **${Math.round(splitManifest.testRatio * 100)}%**
- Data training: **${splitManifest.trainSize}**
- Data testing: **${splitManifest.testSize}**
- Jumlah intent: **${labels.length}**

## Ringkasan Metrik

- Accuracy: **${toPercent(metrics.accuracy)}**
- Macro Precision: **${toPercent(metrics.macroAverage.precision)}**
- Macro Recall: **${toPercent(metrics.macroAverage.recall)}**
- Macro F1-Score: **${toPercent(metrics.macroAverage.f1Score)}**
- Weighted F1-Score: **${toPercent(metrics.weightedAverage.f1Score)}**
- Prediksi benar: **${metrics.correctPredictions}**
- Prediksi salah: **${metrics.incorrectPredictions}**

## Metrik per Intent

| Intent | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
${perIntentRows}

## Pasangan Intent yang Tertukar

| No. | Intent Aktual | Diprediksi Menjadi | Jumlah |
|---:|---|---|---:|
${confusionRows}

## Contoh Kesalahan Prediksi

| No. | Utterance | Aktual | Prediksi | Confidence |
|---:|---|---|---|---:|
${errorRows}

## Analisis Awal Kesalahan

${confusionAnalysis}

Analisis overlap kata di atas bersifat indikasi otomatis. Penyebab akhir tetap perlu diperiksa dari contoh utterance yang salah pada file \`misclassified_examples.csv\`.

## Keterbatasan Model

1. Evaluasi menggunakan satu stratified train-test split, sehingga nilai metrik dapat berubah pada pembagian data lain.
2. Dataset berisi 327 utterance dan sebagian besar berasal dari pertanyaan FAQ yang relatif formal; variasi bahasa percakapan nyata masih terbatas.
3. Dataset belum memiliki kelas khusus untuk pertanyaan di luar domain, sehingga kemampuan mendeteksi unknown intent belum dievaluasi.
4. Nilai confidence berasal dari normalisasi skor one-vs-rest Logistic Regression dan belum melalui probability calibration.
5. Model hanya menentukan intent. Pemilihan jawaban FAQ, slot filling, dan dialog multi-turn akan diintegrasikan pada tahap berikutnya.
`;
}

const [model, splitContent] = await Promise.all([
  loadIntentClassifier(modelPath),
  readFile(splitPath, "utf8"),
]);
const splitManifest = JSON.parse(splitContent);

if (splitManifest.version !== 1 || !Array.isArray(splitManifest.testIds)) {
  throw new Error("Format model_split.json tidak valid.");
}

const rowsById = new Map(intentDataset.map((row) => [row.id, row]));
const testRows = splitManifest.testIds.map((id) => {
  const row = rowsById.get(id);
  if (!row)
    throw new Error(
      `Data testing ${id} tidak ditemukan pada dataset saat ini.`,
    );
  return row;
});
const trainRows = splitManifest.trainIds.map((id) => {
  const row = rowsById.get(id);
  if (!row)
    throw new Error(
      `Data training ${id} tidak ditemukan pada dataset saat ini.`,
    );
  return row;
});

if (
  new Set([...splitManifest.trainIds, ...splitManifest.testIds]).size !==
  intentDataset.length
) {
  throw new Error(
    "Manifest train-test split tidak mencakup seluruh dataset secara tepat.",
  );
}

const labels = Object.values(INTENTS).sort();
const metrics = evaluateIntentClassifier(model, testRows, labels);
const topTermsByIntent = getTopTermsByIntent(trainRows);

const metricsPayload = {
  modelMetadata: model.metadata,
  split: {
    randomSeed: splitManifest.randomSeed,
    testRatio: splitManifest.testRatio,
    trainSize: splitManifest.trainSize,
    testSize: splitManifest.testSize,
  },
  ...metrics,
};

const confusionMatrixCsv = createCsv(
  ["actual_intent", ...labels],
  labels.map((actualIntent) => [
    actualIntent,
    ...labels.map(
      (predictedIntent) =>
        metrics.confusionMatrix[actualIntent][predictedIntent],
    ),
  ]),
);

const misclassifiedCsv = createCsv(
  [
    "id",
    "text",
    "actual_intent",
    "predicted_intent",
    "confidence",
    "top_3_predictions",
  ],
  metrics.predictions
    .filter((row) => !row.correct)
    .map((row) => [
      row.id,
      row.text,
      row.actualIntent,
      row.predictedIntent,
      row.confidence,
      row.alternatives
        .map((item) => `${item.intent}:${item.confidence}`)
        .join(" | "),
    ]),
);

await mkdir(analysisDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(analysisDirectory, "model_metrics.json"),
    `${JSON.stringify(metricsPayload, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    path.join(analysisDirectory, "confusion_matrix.csv"),
    confusionMatrixCsv,
    "utf8",
  ),
  writeFile(
    path.join(analysisDirectory, "confusion_matrix.svg"),
    createConfusionMatrixSvg(labels, metrics.confusionMatrix),
    "utf8",
  ),
  writeFile(
    path.join(analysisDirectory, "misclassified_examples.csv"),
    misclassifiedCsv,
    "utf8",
  ),
  writeFile(
    path.join(analysisDirectory, "classification_report.md"),
    createMarkdownReport({ metrics, labels, splitManifest, topTermsByIntent }),
    "utf8",
  ),
]);

console.log("Evaluasi intent classifier berhasil dibuat.");
console.log(`Accuracy        : ${toPercent(metrics.accuracy)}`);
console.log(`Macro Precision : ${toPercent(metrics.macroAverage.precision)}`);
console.log(`Macro Recall    : ${toPercent(metrics.macroAverage.recall)}`);
console.log(`Macro F1-Score  : ${toPercent(metrics.macroAverage.f1Score)}`);
console.log(`Prediksi salah  : ${metrics.incorrectPredictions}`);
console.log(`Output analisis : ${analysisDirectory}`);
