import { faqs } from "./faqs.js";
import { getIntentForFaqCategory } from "./intentConfig.js";
import {
  SUPPLEMENTAL_SOURCE_CATEGORY,
  SUPPLEMENTAL_SOURCE_TYPE,
  supplementalIntentUtterances,
} from "./supplementalIntentUtterances.js";

export const DATASET_SOURCE_TYPES = Object.freeze({
  FAQ: "faq",
  MANUAL_AUGMENTATION: SUPPLEMENTAL_SOURCE_TYPE,
});

const faqIntentRows = faqs.map((faq) => {
  const intent = getIntentForFaqCategory(faq.category);

  if (!intent) {
    throw new Error(
      `Kategori FAQ belum memiliki pemetaan intent: ${faq.category}`,
    );
  }

  return Object.freeze({
    id: `utt-${faq.id}`,
    text: faq.question.trim(),
    intent,
    sourceType: DATASET_SOURCE_TYPES.FAQ,
    sourceCategory: faq.category,
    faqId: faq.id,
  });
});

const supplementalRows = supplementalIntentUtterances.map((row) =>
  Object.freeze({
    id: row.id,
    text: row.text.trim(),
    intent: row.intent,
    sourceType: DATASET_SOURCE_TYPES.MANUAL_AUGMENTATION,
    sourceCategory: SUPPLEMENTAL_SOURCE_CATEGORY,
    faqId: null,
  }),
);

export const intentDataset = Object.freeze([
  ...faqIntentRows,
  ...supplementalRows,
]);
