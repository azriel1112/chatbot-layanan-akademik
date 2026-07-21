import { faqs } from "../data/faqs.js";

import { getIntentForFaqCategory } from "../data/intentConfig.js";

import { calculateSlotMatch, extractSlots } from "./slotFillingService.js";

import { preprocess } from "./textPreprocessing.js";

function buildDocument(faq) {
  return [faq.category, faq.question, faq.answer, ...(faq.keywords ?? [])].join(
    " ",
  );
}

function buildSlotDocument(faq) {
  return [faq.category, faq.question, ...(faq.keywords ?? [])].join(" ");
}

function termFrequency(tokens) {
  const frequencies = new Map();

  for (const token of tokens) {
    frequencies.set(
      token,

      (frequencies.get(token) ?? 0) + 1,
    );
  }

  return frequencies;
}

function cosineSimilarity(vectorA, vectorB) {
  const terms = new Set([...vectorA.keys(), ...vectorB.keys()]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of terms) {
    const valueA = vectorA.get(term) ?? 0;

    const valueB = vectorB.get(term) ?? 0;

    dotProduct += valueA * valueB;

    magnitudeA += valueA * valueA;

    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function normalizeForExactMatch(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateQuestionCoverage(userTokens, questionTokens) {
  const uniqueUserTokens = new Set(userTokens);

  const uniqueQuestionTokens = new Set(questionTokens);

  if (uniqueUserTokens.size === 0) {
    return 0;
  }

  let matchedTokens = 0;

  for (const token of uniqueUserTokens) {
    if (uniqueQuestionTokens.has(token)) {
      matchedTokens += 1;
    }
  }

  return matchedTokens / uniqueUserTokens.size;
}

function clampScore(score) {
  return Math.max(0, Math.min(1, score));
}

const documents = faqs.map((faq) => {
  const intent = getIntentForFaqCategory(faq.category);

  if (!intent) {
    throw new Error(
      "Kategori FAQ belum " + "memiliki pemetaan intent: " + faq.category,
    );
  }

  return {
    faq,
    intent,

    tokens: preprocess(buildDocument(faq)),

    slots: extractSlots(buildSlotDocument(faq)).slots,
  };
});

const documentFrequency = new Map();

for (const document of documents) {
  for (const token of new Set(document.tokens)) {
    documentFrequency.set(
      token,

      (documentFrequency.get(token) ?? 0) + 1,
    );
  }
}

function createTfidfVector(tokens) {
  const frequencies = termFrequency(tokens);

  const vector = new Map();

  const totalDocuments = documents.length;

  for (const [term, frequency] of frequencies.entries()) {
    const documentsWithTerm = documentFrequency.get(term) ?? 0;

    const inverseDocumentFrequency =
      Math.log((totalDocuments + 1) / (documentsWithTerm + 1)) + 1;

    vector.set(
      term,

      frequency * inverseDocumentFrequency,
    );
  }

  return vector;
}

const faqVectors = documents.map((document) => ({
  faq: document.faq,
  intent: document.intent,
  slots: document.slots,

  vector: createTfidfVector(document.tokens),
}));

export function rankFaqs(message, { intent = null, slots = null } = {}) {
  const userTokens = preprocess(message);

  const userVector = createTfidfVector(userTokens);

  const userSlots = slots ?? extractSlots(message).slots;

  const normalizedMessage = normalizeForExactMatch(message);

  return faqVectors
    .filter((item) => !intent || item.intent === intent)
    .map(({ faq, intent: faqIntent, slots: faqSlots, vector }) => {
      let score = cosineSimilarity(userVector, vector);

      const normalizedQuestion = normalizeForExactMatch(faq.question);

      if (normalizedMessage === normalizedQuestion) {
        score += 0.45;
      } else {
        const questionCoverage = calculateQuestionCoverage(
          userTokens,

          preprocess(faq.question),
        );

        score += questionCoverage * 0.08;
      }

      const slotMatch = calculateSlotMatch(userSlots, faqSlots);

      score += slotMatch.score;

      return {
        ...faq,
        intent: faqIntent,

        score: clampScore(score),

        slotScore: slotMatch.score,

        matchedSlotTypes: slotMatch.matches,

        mismatchedSlotTypes: slotMatch.mismatches,
      };
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.slotScore - first.slotScore ||
        first.id - second.id,
    );
}

export function toFaqSuggestions(rankedFaqs, limit = 3) {
  return rankedFaqs.slice(0, limit).map((faq) => ({
    id: faq.id,

    question: faq.question,

    category: faq.category,

    intent: faq.intent,

    score: Number(faq.score.toFixed(3)),
  }));
}
