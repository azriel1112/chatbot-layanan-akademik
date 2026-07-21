import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { intentDataset } from "../src/data/intentDataset.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const outputDirectory = path.resolve(currentDirectory, "../data");
const outputPath = path.join(outputDirectory, "intent_dataset.csv");

function escapeCsv(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  const header = [
    "id",
    "text",
    "intent",
    "source_type",
    "source_category",
    "faq_id",
  ];

  const body = rows.map((row) =>
    [
      row.id,
      row.text,
      row.intent,
      row.sourceType,
      row.sourceCategory,
      row.faqId,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [header.join(","), ...body].join("\n") + "\n";
}

await mkdir(outputDirectory, {
  recursive: true,
});

await writeFile(outputPath, toCsv(intentDataset), "utf8");

console.log(
  `Dataset intent berhasil dibuat: ${outputPath} (${intentDataset.length} utterance)`,
);
