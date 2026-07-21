import path from "node:path";

import { fileURLToPath } from "node:url";

import { faqs } from "../data/faqs.js";

import { rankFaqs, toFaqSuggestions } from "./faqRetrievalService.js";

import { loadIntentClassifier } from "./intentClassifierService.js";

import { extractSlots } from "./slotFillingService.js";

const currentFile = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFile);

export const DEFAULT_INTENT_MODEL_PATH = path.resolve(
  currentDirectory,
  "../../models/intent_classifier.json",
);

export const NLP_THRESHOLDS = Object.freeze({
  minimumIntentConfidence: 0.1,

  minimumIntentMargin: 0.01,

  minimumFaqScore: 0.18,

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

  if (!intentDecision.accepted || !intentBest) {
    return {
      ranking: globalRanking,

      retrievalMode: "global_fallback",
    };
  }

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
          "Gagal memuat intent classifier dari " +
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
   * Slot filling dilakukan satu kali
   * untuk setiap pesan pengguna.
   */
  const slotResult = extractSlots(normalizedMessage);

  const intentPrediction = await classifyIntent(normalizedMessage);

  const intentDecision = getIntentDecision(intentPrediction);

  /*
   * Slot yang sudah diekstrak
   * diberikan ke proses ranking FAQ.
   */
  const globalRanking = rankFaqs(normalizedMessage, {
    slots: slotResult.slots,
  });

  const intentRanking = intentDecision.accepted
    ? rankFaqs(normalizedMessage, {
        intent: intentPrediction.intent,

        slots: slotResult.slots,
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

    slots: slotResult.slots,

    slotDetails: slotResult.details,

    slotCount: slotResult.detectedCount,

    retrievalMode,

    suggestions,
  };

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

      matchedSlotTypes: [],

      ...commonMetadata,

      retrievalMode: "no_match",
    };
  }

  return {
    answer: best.answer,

    confidence: Number(best.score.toFixed(3)),

    matchedQuestion: best.question,

    category: best.category,

    matchedFaqId: best.id,

    matchedIntent: best.intent,

    matchedSlotTypes: best.matchedSlotTypes,

    slotScore: roundScore(best.slotScore),

    ...commonMetadata,
  };
}

export function getAllFaqs() {
  return faqs;
}
