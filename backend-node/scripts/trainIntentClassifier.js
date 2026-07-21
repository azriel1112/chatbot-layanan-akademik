import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { intentDataset } from "../src/data/intentDataset.js";
import { stratifiedSplit } from "../src/ml/datasetSplit.js";
import {
  IntentClassifierService,
  saveIntentClassifier,
} from "../src/services/intentClassifierService.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const modelDirectory = path.resolve(currentDirectory, "../models");
const analysisDirectory = path.resolve(currentDirectory, "../analysis");
const modelPath = path.join(modelDirectory, "intent_classifier.json");
const splitPath = path.join(analysisDirectory, "model_split.json");

const TEST_RATIO = 0.2;
const RANDOM_SEED = 2026;

const split = stratifiedSplit(intentDataset, {
  testRatio: TEST_RATIO,
  seed: RANDOM_SEED,
});

const model = IntentClassifierService.train(split.trainRows);
model.metadata = {
  ...model.metadata,
  datasetSize: intentDataset.length,
  testSize: split.testRows.length,
  testRatio: TEST_RATIO,
  randomSeed: RANDOM_SEED,
};

const splitManifest = {
  version: 1,
  randomSeed: RANDOM_SEED,
  testRatio: TEST_RATIO,
  totalRows: intentDataset.length,
  trainSize: split.trainRows.length,
  testSize: split.testRows.length,
  distribution: split.distribution,
  trainIds: split.trainRows.map((row) => row.id),
  testIds: split.testRows.map((row) => row.id),
};

await Promise.all([
  mkdir(modelDirectory, { recursive: true }),
  mkdir(analysisDirectory, { recursive: true }),
]);

await Promise.all([
  saveIntentClassifier(model, modelPath),
  writeFile(splitPath, `${JSON.stringify(splitManifest, null, 2)}\n`, "utf8"),
]);

console.log("Intent classifier berhasil dilatih.");
console.log(`Data training  : ${split.trainRows.length}`);
console.log(`Data testing   : ${split.testRows.length}`);
console.log(`Jumlah intent  : ${model.metadata.labels.length}`);
console.log(`Ukuran vocab   : ${model.metadata.vocabularySize}`);
console.log(`Model tersimpan: ${modelPath}`);
console.log(`Split tersimpan: ${splitPath}`);
