import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Sastrawi = require("sastrawijs");

const stemmer = new Sastrawi.Stemmer();

export const STOPWORDS = Object.freeze([
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "atau",
  "pada",
  "adalah",
  "itu",
  "ini",
  "saya",
  "kami",
  "kamu",
  "bagaimana",
  "cara",
  "apa",
  "kapan",
  "dimana",
]);

const stopwordSet = new Set(STOPWORDS);

const romanNumeralSet = new Set([
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
]);

function normalizeInput(text) {
  return String(text ?? "");
}

export function lowercaseText(text = "") {
  return normalizeInput(text).toLowerCase();
}

export function cleanText(text = "") {
  return lowercaseText(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text = "") {
  const cleaned = cleanText(text);

  return cleaned ? cleaned.split(" ") : [];
}

function isNumberToken(token) {
  return /^\d+$/.test(token);
}

function isRomanNumeralToken(token) {
  return romanNumeralSet.has(token);
}

export function filterTokens(tokens = []) {
  return tokens.filter((token) => {
    if (!token) {
      return false;
    }

    if (isNumberToken(token) || isRomanNumeralToken(token)) {
      return true;
    }

    return token.length > 2 && !stopwordSet.has(token);
  });
}

export function stemTokens(tokens = []) {
  return tokens.map((token) =>
    isNumberToken(token) || isRomanNumeralToken(token)
      ? token
      : stemmer.stem(token),
  );
}

export function preprocess(text = "") {
  return stemTokens(filterTokens(tokenize(text)));
}

export function preprocessToText(text = "") {
  return preprocess(text).join(" ");
}

export function getPreprocessingStages(text = "") {
  const original = normalizeInput(text);
  const lowercase = lowercaseText(original);
  const cleaned = cleanText(original);
  const tokens = cleaned ? cleaned.split(" ") : [];

  const filteredTokens = filterTokens(tokens);

  const stemmedTokens = stemTokens(filteredTokens);

  return {
    original,
    lowercase,
    cleaned,
    tokens,
    filteredTokens,
    stemmedTokens,
    result: stemmedTokens.join(" "),
  };
}
