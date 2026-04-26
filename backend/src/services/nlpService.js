import natural from 'natural';
import { faqs } from '../data/faqs.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Sastrawi = require("sastrawijs");

const stemmer = new Sastrawi.Stemmer();

const stopwords = [
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "atau",
  "pada", "adalah", "itu", "ini", "saya", "kami", "kamu", "bagaimana",
  "cara", "apa", "kapan", "dimana"
];

export function preprocess(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((token) => token && token.length > 2)
    .filter((token) => !stopwords.includes(token))
    .map((token) => stemmer.stem(token));
}

const tokenizer = new natural.WordTokenizer();


// const stopwords = new Set([
//   'yang','di','ke','dari','dan','atau','untuk','dengan','saya','aku','kami','kita','bagaimana','cara','apa','kapan','dimana','mengapa','adalah','itu','ini','pada','mau','ingin','tolong','mohon','dong','ya','kah'
// ]);

// export function preprocess(text) {
//   return text
//     .toLowerCase()
//     .replace(/[^a-zA-Z0-9\s]/g, "")
//     .split(" ")
//     .filter((token) => token.length > 2)
//     .map((token) => stemmer.stem(token));
// }
function normalize(text = '') {
  return text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
}
// function preprocess(text) {
//   return text
//     .toLowerCase()
//     .replace(/[^a-zA-Z0-9\s]/g, "")
//     .split(" ")
//     .filter((token) => token.length > 2)
//     .map((token) => stemmer.stem(token));
// }
// function preprocess(text = '') {
//   return tokenizer
//     .tokenize(normalize(text))
//     .filter((token) => token.length > 1 && !stopwords.has(token))
//     .map((token) => stemmer.stem(token));
// }

function buildDocument(faq) {
  return [faq.category, faq.question, faq.answer, ...(faq.keywords || [])].join(' ');
}

function termFrequency(tokens) {
  const tf = {};
  tokens.forEach((token) => { tf[token] = (tf[token] || 0) + 1; });
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
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const documents = faqs.map((faq) => ({
  faq,
  tokens: preprocess(buildDocument(faq))
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
    const idf = Math.log((totalDocs + 1) / ((documentFrequency[term] || 0) + 1)) + 1;
    vector[term] = tf[term] * idf;
  });
  return vector;
}

const faqVectors = documents.map((doc) => ({ faq: doc.faq, vector: tfidfVector(doc.tokens) }));

export function getBotReply(message) {
  const userTokens = preprocess(message);
  const userVector = tfidfVector(userTokens);

  const ranked = faqVectors
    .map(({ faq, vector }) => ({ ...faq, score: cosineSimilarity(userVector, vector) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const suggestions = ranked.slice(0, 3).map(({ id, question, category, score }) => ({ id, question, category, score: Number(score.toFixed(3)) }));

  if (!best || best.score < 0.12) {
    return {
      answer: 'Maaf, saya belum menemukan jawaban yang sesuai. Coba gunakan kata kunci lain seperti KRS, UKT, nilai, cuti, skripsi, wisuda, atau surat aktif kuliah.',
      confidence: 0,
      matchedQuestion: null,
      suggestions
    };
  }

  return {
    answer: best.answer,
    confidence: Number(best.score.toFixed(3)),
    matchedQuestion: best.question,
    category: best.category,
    suggestions
  };
}

export function getAllFaqs() {
  return faqs;
}
