import { faqs } from "./faqs.js";
import { getIntentForFaqCategory } from "./intentConfig.js";

export const intentDataset = Object.freeze(
  faqs.map((faq) => {
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
      sourceCategory: faq.category,
      faqId: faq.id,
    });
  }),
);
