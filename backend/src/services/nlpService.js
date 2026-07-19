import { faqs } from "../data/faqs.js";
import { preprocess } from "./textPreprocessing.js";

function buildDocument(faq) {
  return [faq.category, faq.question, faq.answer, ...(faq.keywords || [])].join(
    " ",
  );
}

function termFrequency(tokens) {
  const tf = {};

  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1;
  });

  return tf;
}

function cosineSimilarity(vecA, vecB) {
  const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  terms.forEach((term) => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;

    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const documents = faqs.map((faq) => ({
  faq,
  tokens: preprocess(buildDocument(faq)),
}));

const totalDocs = documents.length;
const documentFrequency = {};

documents.forEach(({ tokens }) => {
  new Set(tokens).forEach((token) => {
    documentFrequency[token] = (documentFrequency[token] || 0) + 1;
  });
});

function tfidfVector(tokens) {
  const tf = termFrequency(tokens);
  const vector = {};

  Object.keys(tf).forEach((term) => {
    const idf =
      Math.log((totalDocs + 1) / ((documentFrequency[term] || 0) + 1)) + 1;

    vector[term] = tf[term] * idf;
  });

  return vector;
}

function extractSemester(text = "") {
  const normalized = text.toLowerCase();

  const matchNumber = normalized.match(/semester\s+(\d+)/);

  if (matchNumber) {
    return matchNumber[1];
  }

  const wordToNumber = {
    satu: "1",
    dua: "2",
    tiga: "3",
    empat: "4",
    lima: "5",
    enam: "6",
    tujuh: "7",
    delapan: "8",
  };

  for (const [word, number] of Object.entries(wordToNumber)) {
    if (normalized.includes(`semester ${word}`)) {
      return number;
    }
  }

  return null;
}

const faqVectors = documents.map((document) => ({
  faq: document.faq,
  vector: tfidfVector(document.tokens),
}));

export function getBotReply(message) {
  const userTokens = preprocess(message);
  const userVector = tfidfVector(userTokens);
  const userSemester = extractSemester(message);

  const ranked = faqVectors
    .map(({ faq, vector }) => {
      let score = cosineSimilarity(userVector, vector);

      const faqText = `${faq.question} ${(faq.keywords || []).join(
        " ",
      )}`.toLowerCase();

      const faqSemester = extractSemester(faqText);

      if (userSemester && faqSemester && userSemester === faqSemester) {
        score += 0.35;
      }

      if (userSemester && faqSemester && userSemester !== faqSemester) {
        score -= 0.25;
      }

      return {
        ...faq,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  const suggestions = ranked
    .slice(0, 3)
    .map(({ id, question, category, score }) => ({
      id,
      question,
      category,
      score: Number(score.toFixed(3)),
    }));

  if (!best || best.score < 0.12) {
    return {
      answer:
        "Maaf, saya belum menemukan jawaban yang sesuai. Coba gunakan kata kunci lain seperti KRS, UKT, nilai, cuti, skripsi, wisuda, atau surat aktif kuliah.",
      confidence: 0,
      matchedQuestion: null,
      suggestions,
    };
  }

  return {
    answer: best.answer,
    confidence: Number(best.score.toFixed(3)),
    matchedQuestion: best.question,
    category: best.category,
    suggestions,
  };
}

export function getAllFaqs() {
  return faqs;
}
