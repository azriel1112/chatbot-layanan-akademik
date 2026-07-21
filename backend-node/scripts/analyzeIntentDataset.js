import { mkdir, writeFile } from "node:fs/promises";

import path from "node:path";

import { fileURLToPath } from "node:url";

import { intentDataset } from "../src/data/intentDataset.js";

import {
  getPreprocessingStages,
  preprocess,
} from "../src/services/textPreprocessing.js";

const currentFile = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFile);

const outputDirectory = path.resolve(currentDirectory, "../analysis");

const RECOMMENDED_MINIMUM_PER_INTENT = 20;

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

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countOriginalWords(text) {
  const trimmed = String(text ?? "").trim();

  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createDistributionChart(distribution) {
  const width = 1100;
  const leftPadding = 355;
  const rightPadding = 90;
  const topPadding = 70;
  const bottomPadding = 50;
  const rowHeight = 36;

  const height = topPadding + bottomPadding + distribution.length * rowHeight;

  const maxTotal = Math.max(...distribution.map((row) => row.total));

  const chartWidth = width - leftPadding - rightPadding;

  const bars = distribution
    .map((row, index) => {
      const y = topPadding + index * rowHeight;

      const barWidth = Math.max(1, (row.total / maxTotal) * chartWidth);

      return `
        <text
          x="${leftPadding - 12}"
          y="${y + 20}"
          text-anchor="end"
          font-size="14"
        >${xmlEscape(row.intent)}</text>

        <rect
          x="${leftPadding}"
          y="${y + 5}"
          width="${barWidth.toFixed(2)}"
          height="22"
          rx="4"
          fill="#64748b"
        />

        <text
          x="${(leftPadding + barWidth + 8).toFixed(2)}"
          y="${y + 21}"
          font-size="14"
        >${row.total}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>
  <rect
    width="100%"
    height="100%"
    fill="#ffffff"
  />

  <text
    x="${width / 2}"
    y="34"
    text-anchor="middle"
    font-size="22"
    font-weight="700"
  >Distribusi Dataset per Intent</text>

  <text
    x="${width / 2}"
    y="56"
    text-anchor="middle"
    font-size="13"
  >Total ${intentDataset.length} utterance</text>

${bars}
</svg>
`;
}

function createMarkdownReport(summary, distribution, examples) {
  const distributionRows = distribution
    .map(
      (row, index) =>
        `| ${index + 1} | \`${row.intent}\` | ${row.total} | ${row.percentage}% |`,
    )
    .join("\n");

  const exampleRows = examples
    .map(
      (row, index) =>
        `| ${index + 1} | \`${row.intent}\` | ${row.before.replaceAll(
          "|",
          "\\|",
        )} | ${row.after.replaceAll("|", "\\|")} |`,
    )
    .join("\n");

  const warningText =
    summary.lowDataIntents.length > 0
      ? summary.lowDataIntents
          .map((row) => `- \`${row.intent}\`: ${row.total} utterance`)
          .join("\n")
      : "Tidak ada intent di bawah batas rekomendasi.";

  return `# Hasil Analisis Dataset Intent

## Ringkasan

- Total utterance: **${summary.totalUtterances}**
- Total intent: **${summary.totalIntents}**
- Kosakata unik setelah preprocessing: **${summary.uniqueVocabulary}**
- Rata-rata kata sebelum preprocessing: **${summary.averageOriginalWords}**
- Rata-rata token setelah preprocessing: **${summary.averagePreprocessedTokens}**
- Intent terbesar: **${summary.largestIntent.intent} (${summary.largestIntent.total})**
- Intent terkecil: **${summary.smallestIntent.intent} (${summary.smallestIntent.total})**
- Rasio intent terbesar terhadap terkecil: **${summary.imbalanceRatio} : 1**
- Data kosong setelah preprocessing: **${summary.emptyAfterPreprocessing}**

## Distribusi Data

| No. | Intent | Jumlah | Persentase |
|---:|---|---:|---:|
${distributionRows}

## Intent yang Masih Perlu Ditambah

Batas rekomendasi yang digunakan pada analisis ini adalah ${RECOMMENDED_MINIMUM_PER_INTENT} utterance per intent.

${warningText}

## Contoh Sebelum dan Sesudah Preprocessing

| No. | Intent | Sebelum | Sesudah |
|---:|---|---|---|
${exampleRows}

## Tahapan Preprocessing

1. Mengubah teks menjadi lowercase.
2. Membersihkan tanda baca dan karakter selain huruf, angka, serta spasi.
3. Melakukan tokenisasi berdasarkan spasi.
4. Mempertahankan token angka dan token huruf dengan panjang lebih dari dua karakter.
5. Menghapus stopword Bahasa Indonesia yang telah ditentukan.
6. Melakukan stemming menggunakan Sastrawi.
7. Menggabungkan token hasil preprocessing menjadi teks bersih.

## Catatan

Analisis ini belum merupakan hasil evaluasi model. Accuracy, precision, recall, F1-score, dan confusion matrix baru dapat dihitung setelah classifier dilatih dan diuji.
`;
}

if (intentDataset.length === 0) {
  throw new Error(
    "Dataset intent kosong. Jalankan proses export dan validasi terlebih dahulu.",
  );
}

const intentCounts = intentDataset.reduce((counts, row) => {
  counts[row.intent] = (counts[row.intent] ?? 0) + 1;

  return counts;
}, {});

const sourceCounts = intentDataset.reduce((counts, row) => {
  counts[row.sourceType] = (counts[row.sourceType] ?? 0) + 1;

  return counts;
}, {});

const distribution = Object.entries(intentCounts)
  .map(([intent, total]) => ({
    intent,
    total,
    percentage: Number(((total / intentDataset.length) * 100).toFixed(2)),
  }))
  .sort((a, b) => b.total - a.total || a.intent.localeCompare(b.intent));

const preprocessedRows = intentDataset.map((row) => {
  const tokens = preprocess(row.text);

  return {
    ...row,
    tokens,
    textPreprocessed: tokens.join(" "),
  };
});

const uniqueVocabulary = new Set(preprocessedRows.flatMap((row) => row.tokens));

const emptyRows = preprocessedRows.filter((row) => !row.textPreprocessed);

if (emptyRows.length > 0) {
  throw new Error(
    `Terdapat ${emptyRows.length} utterance kosong setelah preprocessing: ${emptyRows
      .map((row) => row.id)
      .join(", ")}`,
  );
}

const examples = [];
const sampledIntents = new Set();

for (const row of intentDataset) {
  if (sampledIntents.has(row.intent)) {
    continue;
  }

  const stages = getPreprocessingStages(row.text);

  examples.push({
    id: row.id,
    intent: row.intent,
    before: row.text,
    lowercase: stages.lowercase,
    cleaned: stages.cleaned,
    tokens: stages.tokens.join(" | "),
    filteredTokens: stages.filteredTokens.join(" | "),
    stemmedTokens: stages.stemmedTokens.join(" | "),
    after: stages.result,
  });

  sampledIntents.add(row.intent);
}

const largestIntent = distribution[0];

const smallestIntent = distribution[distribution.length - 1];

const summary = {
  totalUtterances: intentDataset.length,

  totalIntents: distribution.length,

  uniqueVocabulary: uniqueVocabulary.size,

  sourceCounts,

  averageOriginalWords: Number(
    average(intentDataset.map((row) => countOriginalWords(row.text))).toFixed(
      2,
    ),
  ),

  averagePreprocessedTokens: Number(
    average(preprocessedRows.map((row) => row.tokens.length)).toFixed(2),
  ),

  emptyAfterPreprocessing: emptyRows.length,

  largestIntent,

  smallestIntent,

  imbalanceRatio: Number(
    (largestIntent.total / smallestIntent.total).toFixed(2),
  ),

  recommendedMinimumPerIntent: RECOMMENDED_MINIMUM_PER_INTENT,

  lowDataIntents: distribution
    .filter((row) => row.total < RECOMMENDED_MINIMUM_PER_INTENT)
    .map(({ intent, total }) => ({
      intent,
      total,
    })),
};

const distributionCsv = createCsv(
  ["intent", "total", "percentage"],
  distribution.map((row) => [row.intent, row.total, row.percentage]),
);

const examplesCsv = createCsv(
  [
    "id",
    "intent",
    "before",
    "lowercase",
    "cleaned",
    "tokens",
    "filtered_tokens",
    "stemmed_tokens",
    "after",
  ],
  examples.map((row) => [
    row.id,
    row.intent,
    row.before,
    row.lowercase,
    row.cleaned,
    row.tokens,
    row.filteredTokens,
    row.stemmedTokens,
    row.after,
  ]),
);

const preprocessedDatasetCsv = createCsv(
  [
    "id",
    "text",
    "text_preprocessed",
    "intent",
    "source_type",
    "source_category",
    "faq_id",
  ],
  preprocessedRows.map((row) => [
    row.id,
    row.text,
    row.textPreprocessed,
    row.intent,
    row.sourceType,
    row.sourceCategory,
    row.faqId,
  ]),
);

await mkdir(outputDirectory, {
  recursive: true,
});

await Promise.all([
  writeFile(
    path.join(outputDirectory, "intent_distribution.csv"),
    distributionCsv,
    "utf8",
  ),

  writeFile(
    path.join(outputDirectory, "preprocessing_examples.csv"),
    examplesCsv,
    "utf8",
  ),

  writeFile(
    path.join(outputDirectory, "intent_dataset_preprocessed.csv"),
    preprocessedDatasetCsv,
    "utf8",
  ),

  writeFile(
    path.join(outputDirectory, "dataset_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  ),

  writeFile(
    path.join(outputDirectory, "intent_distribution.svg"),
    createDistributionChart(distribution),
    "utf8",
  ),

  writeFile(
    path.join(outputDirectory, "dataset_report.md"),
    createMarkdownReport(summary, distribution, examples),
    "utf8",
  ),
]);

console.log("Analisis dataset intent berhasil dibuat.");

console.log(`Lokasi output : ${outputDirectory}`);

console.log(`Total data    : ${summary.totalUtterances}`);

console.log(`Total intent  : ${summary.totalIntents}`);

console.log(`Kosakata unik : ${summary.uniqueVocabulary}`);

console.log(`Rasio distribusi terbesar/terkecil: ${summary.imbalanceRatio}:1`);

if (summary.lowDataIntents.length > 0) {
  console.warn(
    `Peringatan: ${summary.lowDataIntents.length} intent masih di bawah ${RECOMMENDED_MINIMUM_PER_INTENT} utterance.`,
  );
}
