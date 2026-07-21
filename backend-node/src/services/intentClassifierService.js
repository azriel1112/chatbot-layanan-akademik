import { readFile, writeFile } from "node:fs/promises";
import natural from "natural";
import { preprocess } from "./textPreprocessing.js";
import { TfidfVectorizer } from "../ml/tfidfVectorizer.js";

const MODEL_FORMAT_VERSION = 1;

function assertTrainingRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Data training intent classifier tidak boleh kosong.");
  }

  for (const [index, row] of rows.entries()) {
    if (!String(row?.text ?? "").trim()) {
      throw new Error(
        `Data training pada indeks ${index} tidak memiliki teks.`,
      );
    }

    if (!String(row?.intent ?? "").trim()) {
      throw new Error(
        `Data training pada indeks ${index} tidak memiliki intent.`,
      );
    }
  }
}

function normalizeScores(classifications) {
  const positiveScores = classifications.map((item) => ({
    label: item.label,
    score: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
  }));

  const total = positiveScores.reduce((sum, item) => sum + item.score, 0);

  return positiveScores.map((item) => ({
    intent: item.label,
    confidence: total > 0 ? item.score / total : 0,
    rawScore: item.score,
  }));
}

export class IntentClassifierService {
  constructor({ vectorizer, classifier, metadata = {} }) {
    if (!(vectorizer instanceof TfidfVectorizer)) {
      throw new TypeError("vectorizer harus berupa instance TfidfVectorizer.");
    }

    if (!classifier || typeof classifier.getClassifications !== "function") {
      throw new TypeError("classifier Logistic Regression tidak valid.");
    }

    this.vectorizer = vectorizer;
    this.classifier = classifier;
    this.metadata = { ...metadata };
  }

  static train(
    rows,
    { minimumDocumentFrequency = 1, maximumVocabularySize = 5000 } = {},
  ) {
    assertTrainingRows(rows);

    const processedRows = rows.map((row) => ({
      ...row,
      tokens: preprocess(row.text),
    }));

    const emptyRows = processedRows.filter((row) => row.tokens.length === 0);

    if (emptyRows.length > 0) {
      throw new Error(
        `Terdapat data training kosong setelah preprocessing: ${emptyRows
          .map((row) => row.id ?? row.text)
          .join(", ")}`,
      );
    }

    const vectorizer = new TfidfVectorizer({
      minimumDocumentFrequency,
      maximumVocabularySize,
    });
    const vectors = vectorizer.fitTransform(
      processedRows.map((row) => row.tokens),
    );

    const classifier = new natural.LogisticRegressionClassifier();

    processedRows.forEach((row, index) => {
      classifier.classifier.addExample(vectors[index], row.intent);
    });

    classifier.classifier.train();

    return new IntentClassifierService({
      vectorizer,
      classifier,
      metadata: {
        algorithm: "TF-IDF + Logistic Regression",
        trainingSize: rows.length,
        vocabularySize: vectorizer.vocabulary.length,
        labels: [...new Set(rows.map((row) => row.intent))].sort(),
      },
    });
  }

  predict(text, { topK = 3 } = {}) {
    const tokens = preprocess(text);
    const vector = this.vectorizer.transform(tokens);
    const hasKnownFeature = vector.some((value) => value !== 0);

    if (!hasKnownFeature) {
      return {
        intent: null,
        confidence: 0,
        isUnknown: true,
        tokens,
        classifications: [],
      };
    }

    const classifications = normalizeScores(
      this.classifier.classifier.getClassifications(vector),
    ).sort((a, b) => b.confidence - a.confidence);

    const best = classifications[0] ?? null;

    return {
      intent: best?.intent ?? null,
      confidence: best ? Number(best.confidence.toFixed(6)) : 0,
      isUnknown: !best,
      tokens,
      classifications: classifications
        .slice(0, Math.max(1, topK))
        .map((item) => ({
          intent: item.intent,
          confidence: Number(item.confidence.toFixed(6)),
          rawScore: Number(item.rawScore.toFixed(6)),
        })),
    };
  }

  toJSON() {
    return {
      formatVersion: MODEL_FORMAT_VERSION,
      metadata: this.metadata,
      vectorizer: this.vectorizer.toJSON(),
      classifier: {
        wrapper: {
          classifier: {
            classifications: [...this.classifier.classifier.classifications],
            theta: this.classifier.classifier.theta.map((vector) => ({
              elements: [...vector.elements],
            })),
          },
          docs: [],
          features: {},
          lastAdded: 0,
        },
      },
    };
  }

  static fromJSON(payload) {
    if (!payload || payload.formatVersion !== MODEL_FORMAT_VERSION) {
      throw new Error("Format intent classifier tidak didukung.");
    }

    if (
      !payload.classifier ||
      !payload.classifier.wrapper ||
      !payload.classifier.wrapper.classifier ||
      !Array.isArray(payload.classifier.wrapper.classifier.classifications) ||
      !Array.isArray(payload.classifier.wrapper.classifier.theta)
    ) {
      throw new Error("Parameter Logistic Regression pada model tidak valid.");
    }

    const classifier = natural.LogisticRegressionClassifier.restore({
      ...payload.classifier.wrapper,
      classifier: {
        ...payload.classifier.wrapper.classifier,
        classifications: [
          ...payload.classifier.wrapper.classifier.classifications,
        ],
        theta: payload.classifier.wrapper.classifier.theta.map((vector) => ({
          elements: [...vector.elements],
        })),
      },
    });

    return new IntentClassifierService({
      vectorizer: TfidfVectorizer.fromJSON(payload.vectorizer),
      classifier,
      metadata: payload.metadata ?? {},
    });
  }
}

export async function saveIntentClassifier(model, filePath) {
  if (!(model instanceof IntentClassifierService)) {
    throw new TypeError("Model yang akan disimpan tidak valid.");
  }

  await writeFile(
    filePath,
    `${JSON.stringify(model.toJSON(), null, 2)}\n`,
    "utf8",
  );
}

export async function loadIntentClassifier(filePath) {
  const content = await readFile(filePath, "utf8");
  return IntentClassifierService.fromJSON(JSON.parse(content));
}
