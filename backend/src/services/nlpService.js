import path from "node:path";

import { fileURLToPath } from "node:url";

import { faqs } from "../data/faqs.js";

import { loadIntentClassifier } from "./intentClassifierService.js";

import { rankFaqs, toFaqSuggestions } from "./faqRetrievalService.js";

const currentFile = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFile);

export const DEFAULT_INTENT_MODEL_PATH = path.resolve(
  currentDirectory,
  "../../models/intent_classifier.json",
);

export const NLP_THRESHOLDS = Object.freeze({
  /*
   * Confidence intent classifier
   * pada package natural tidak
   * sama dengan probabilitas tunggal.
   * Karena ada 13 intent, nilainya
   * cenderung berada sekitar
   * 0.10 sampai 0.25.
   */
  minimumIntentConfidence: 0.1,

  /*
   * Selisih minimal antara prediksi
   * pertama dan prediksi kedua.
   */
  minimumIntentMargin: 0.01,

  /*
   * Jawaban FAQ di bawah nilai ini
   * dianggap tidak cukup relevan.
   */
  minimumFaqScore: 0.18,

  /*
   * Pencarian global hanya boleh
   * mengambil alih hasil intent
   * apabila skornya jauh lebih tinggi.
   */
  globalOverrideMargin: 0.12,
});

let classifierPromise = null;

let loadedModelPath = null;

function roundScore(value) {
  return Number(Number(value ?? 0).toFixed(6));
}

function getIntentDecision(prediction) {
  const first = prediction.classifications?.[0] ?? null;

  const second = prediction.classifications?.[1] ?? null;

  const margin = first ? first.confidence - (second?.confidence ?? 0) : 0;

  const accepted = Boolean(
    prediction.intent &&
    !prediction.isUnknown &&
    prediction.confidence >= NLP_THRESHOLDS.minimumIntentConfidence &&
    margin >= NLP_THRESHOLDS.minimumIntentMargin,
  );

  return {
    accepted,

    margin: roundScore(margin),
  };
}

function selectFaqRanking({ globalRanking, intentRanking, intentDecision }) {
  const globalBest = globalRanking[0] ?? null;

  const intentBest = intentRanking[0] ?? null;

  /*
   * Jika intent tidak cukup meyakinkan,
   * pencarian kembali dilakukan pada
   * semua FAQ.
   */
  if (!intentDecision.accepted || !intentBest) {
    return {
      ranking: globalRanking,

      retrievalMode: "global_fallback",
    };
  }

  /*
   * Pengaman apabila classifier salah.
   * Hasil global hanya menggantikan
   * hasil intent apabila selisih
   * skornya cukup besar.
   */
  const shouldOverrideWithGlobal = Boolean(
    globalBest &&
    globalBest.intent !== intentBest.intent &&
    globalBest.score >= intentBest.score + NLP_THRESHOLDS.globalOverrideMargin,
  );

  if (shouldOverrideWithGlobal) {
    return {
      ranking: globalRanking,

      retrievalMode: "global_override",
    };
  }

  return {
    ranking: intentRanking,

    retrievalMode: "intent_filtered",
  };
}

export async function initializeNlpService({
  modelPath = DEFAULT_INTENT_MODEL_PATH,

  forceReload = false,
} = {}) {
  const resolvedModelPath = path.resolve(modelPath);

  if (
    forceReload ||
    !classifierPromise ||
    loadedModelPath !== resolvedModelPath
  ) {
    loadedModelPath = resolvedModelPath;

    classifierPromise = loadIntentClassifier(resolvedModelPath).catch(
      (error) => {
        classifierPromise = null;

        loadedModelPath = null;

        throw new Error(
          "Gagal memuat intent " +
            "classifier dari " +
            `${resolvedModelPath}: ` +
            error.message,
          {
            cause: error,
          },
        );
      },
    );
  }

  return classifierPromise;
}

export async function classifyIntent(message) {
  const classifier = await initializeNlpService();

  return classifier.predict(message, {
    topK: 3,
  });
}

export async function getBotReply(message) {
  const normalizedMessage = String(message ?? "").trim();

  if (!normalizedMessage) {
    throw new Error("Pesan tidak boleh kosong.");
  }

  /*
   * Tahap pertama:
   * prediksi intent.
   */
  const intentPrediction = await classifyIntent(normalizedMessage);

  const intentDecision = getIntentDecision(intentPrediction);

  /*
   * Ranking global tetap dihitung
   * sebagai fallback dan pengaman.
   */
  const globalRanking = rankFaqs(normalizedMessage);

  /*
   * Ranking berbasis intent hanya
   * dilakukan ketika prediksi intent
   * memenuhi threshold.
   */
  const intentRanking = intentDecision.accepted
    ? rankFaqs(normalizedMessage, {
        intent: intentPrediction.intent,
      })
    : [];

  const { ranking, retrievalMode } = selectFaqRanking({
    globalRanking,
    intentRanking,
    intentDecision,
  });

  const best = ranking[0] ?? null;

  const suggestions = toFaqSuggestions(ranking);

  const commonMetadata = {
    intent: intentPrediction.intent,

    intentConfidence: roundScore(intentPrediction.confidence),

    intentMargin: intentDecision.margin,

    intentAccepted: intentDecision.accepted,

    intentAlternatives: intentPrediction.classifications,

    retrievalMode,

    suggestions,
  };

  /*
   * Tidak memberikan jawaban apabila
   * skor FAQ terlalu rendah.
   * Ini mencegah pertanyaan di luar
   * domain dipaksakan menjadi FAQ.
   */
  if (!best || best.score < NLP_THRESHOLDS.minimumFaqScore) {
    return {
      answer:
        "Maaf, saya belum menemukan jawaban yang cukup sesuai. " +
        "Coba gunakan kata kunci akademik yang lebih spesifik, " +
        "misalnya KRS, biaya kuliah, cuti, kerja praktek, " +
        "seminar proposal, tugas akhir, atau surat mahasiswa aktif.",

      confidence: 0,
      matchedQuestion: null,
      category: null,

      ...commonMetadata,

      retrievalMode: "no_match",
    };
  }

  return {
    answer: best.answer,

    /*
     * confidence tetap berisi skor
     * kecocokan FAQ supaya frontend
     * lama tetap kompatibel.
     */
    confidence: Number(best.score.toFixed(3)),

    matchedQuestion: best.question,

    category: best.category,

    matchedFaqId: best.id,

    matchedIntent: best.intent,

    ...commonMetadata,
  };
}

export function getAllFaqs() {
  return faqs;
}
