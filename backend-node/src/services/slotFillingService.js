import {
  CATEGORICAL_SLOT_DEFINITIONS,
  NUMBER_WORDS,
  ROMAN_NUMERALS,
  SLOT_MATCH_WEIGHTS,
  SLOT_TYPES,
} from "../data/slotConfig.js";

function normalizeText(text) {
  return String(text ?? "").toLowerCase();
}

function createGlobalRegex(regex) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;

  return new RegExp(regex.source, flags);
}

function rangesOverlap(first, second) {
  return first.start < second.end && second.start < first.end;
}

function selectNonOverlappingCandidates(candidates) {
  const prioritized = [...candidates].sort(
    (first, second) =>
      second.priority - first.priority ||
      second.raw.length - first.raw.length ||
      first.start - second.start,
  );

  const selected = [];

  for (const candidate of prioritized) {
    const overlaps = selected.some((item) => rangesOverlap(item, candidate));

    if (!overlaps) {
      selected.push(candidate);
    }
  }

  return selected.sort(
    (first, second) =>
      first.start - second.start || second.priority - first.priority,
  );
}

function addRegexMatches(
  { text, regex, type, value, label, priority, method },
  target,
) {
  const globalRegex = createGlobalRegex(regex);

  for (const match of text.matchAll(globalRegex)) {
    const raw = match[0];

    target.push({
      type,
      value,
      label,
      raw,
      start: match.index,
      end: match.index + raw.length,
      method,
      priority,
    });
  }
}

function extractSemesterCandidates(text) {
  const candidates = [];

  const numericPattern =
    /\b(?:semester|sem|smt)\s*(?:ke[\s-]*)?(1[0-4]|[1-9])\b/gi;

  for (const match of text.matchAll(numericPattern)) {
    const value = Number(match[1]);

    candidates.push({
      type: SLOT_TYPES.SEMESTER,
      value,
      label: `Semester ${value}`,
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      method: "regex_numeric",
      priority: 150,
    });
  }

  const wordPattern =
    /\b(?:semester|sem|smt)\s*(?:ke[\s-]*)?(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|dua\s+belas|tiga\s+belas|empat\s+belas)\b/gi;

  for (const match of text.matchAll(wordPattern)) {
    const key = match[1].replace(/\s+/g, "_").toLowerCase();

    const value = NUMBER_WORDS[key];

    if (!value) {
      continue;
    }

    candidates.push({
      type: SLOT_TYPES.SEMESTER,
      value,
      label: `Semester ${value}`,
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      method: "regex_number_word",
      priority: 145,
    });
  }

  const romanPattern =
    /\b(?:semester|sem|smt)\s*(?:ke[\s-]*)?(xiv|xiii|xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/gi;

  for (const match of text.matchAll(romanPattern)) {
    const value = ROMAN_NUMERALS[match[1].toLowerCase()];

    if (!value) {
      continue;
    }

    candidates.push({
      type: SLOT_TYPES.SEMESTER,
      value,
      label: `Semester ${value}`,
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      method: "regex_roman",
      priority: 140,
    });
  }

  return selectNonOverlappingCandidates(candidates);
}

function extractAcademicYearCandidates(text) {
  const candidates = [];

  const pattern =
    /\b(?:tahun\s+akademik\s+|ta\s+)?(20\d{2})\s*[\/-]\s*(20\d{2})\b/gi;

  for (const match of text.matchAll(pattern)) {
    const startYear = Number(match[1]);

    const endYear = Number(match[2]);

    if (endYear < startYear || endYear - startYear > 2) {
      continue;
    }

    candidates.push({
      type: SLOT_TYPES.ACADEMIC_YEAR,

      value: `${startYear}/${endYear}`,

      label: `Tahun Akademik ${startYear}/${endYear}`,

      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,

      method: "regex_academic_year",

      priority: 150,
    });
  }

  return selectNonOverlappingCandidates(candidates);
}

function extractCurriculumYearCandidates(text) {
  const candidates = [];

  const pattern = /\bkurikulum\s+(20\d{2})\b/gi;

  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1]);

    candidates.push({
      type: SLOT_TYPES.CURRICULUM_YEAR,

      value,

      label: `Kurikulum ${value}`,

      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,

      method: "regex_curriculum_year",

      priority: 150,
    });
  }

  return selectNonOverlappingCandidates(candidates);
}

function extractCategoricalCandidates(text) {
  const result = [];

  for (const definition of CATEGORICAL_SLOT_DEFINITIONS) {
    const candidates = [];

    for (const item of definition.values) {
      for (const pattern of item.patterns) {
        addRegexMatches(
          {
            text,
            regex: pattern.regex,
            type: definition.type,
            value: item.value,
            label: item.label,
            priority: pattern.priority,
            method: "pattern_dictionary",
          },
          candidates,
        );
      }
    }

    result.push(...selectNonOverlappingCandidates(candidates));
  }

  return result;
}

function aggregateSlotDetails(details) {
  const valuesByType = new Map();

  for (const detail of details) {
    if (!valuesByType.has(detail.type)) {
      valuesByType.set(detail.type, []);
    }

    const values = valuesByType.get(detail.type);

    if (!values.some((value) => value === detail.value)) {
      values.push(detail.value);
    }
  }

  return Object.fromEntries(
    [...valuesByType.entries()].map(([type, values]) => [
      type,

      values.length === 1 ? values[0] : values,
    ]),
  );
}

export function extractSlots(message) {
  const text = normalizeText(message);

  if (!text.trim()) {
    return {
      slots: {},
      details: [],
      detectedCount: 0,
    };
  }

  const details = [
    ...extractSemesterCandidates(text),

    ...extractAcademicYearCandidates(text),

    ...extractCurriculumYearCandidates(text),

    ...extractCategoricalCandidates(text),
  ].sort(
    (first, second) =>
      first.start - second.start ||
      first.type.localeCompare(second.type) ||
      second.priority - first.priority,
  );

  return {
    slots: aggregateSlotDetails(details),

    details: details.map(({ priority, ...detail }) => detail),

    detectedCount: details.length,
  };
}

export function toSlotValueArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function compareSlotValues(firstValue, secondValue) {
  const firstValues = toSlotValueArray(firstValue);

  const secondValues = new Set(toSlotValueArray(secondValue));

  return firstValues.some((value) => secondValues.has(value));
}

export function calculateSlotMatch(userSlots = {}, faqSlots = {}) {
  let score = 0;

  const matches = [];
  const mismatches = [];

  for (const [type, weight] of Object.entries(SLOT_MATCH_WEIGHTS)) {
    const userValue = userSlots[type];

    const faqValue = faqSlots[type];

    if (userValue === undefined || faqValue === undefined) {
      continue;
    }

    if (compareSlotValues(userValue, faqValue)) {
      score += weight.match;
      matches.push(type);
    } else {
      score += weight.mismatch;

      mismatches.push(type);
    }
  }

  return {
    score: Number(score.toFixed(6)),

    matches,
    mismatches,
  };
}
