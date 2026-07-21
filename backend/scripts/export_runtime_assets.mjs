import {
  mkdir,
  writeFile,
} from "node:fs/promises";

import path
  from "node:path";

import {
  pathToFileURL,
} from "node:url";

const backendNodePath =
  path.resolve(
    process.argv[2] ??
      "../backend-node",
  );

const outputPath =
  path.resolve(
    process.argv[3] ??
      "data/runtime_assets.json",
  );

async function load(
  relativePath,
) {
  const url =
    pathToFileURL(
      path.join(
        backendNodePath,
        relativePath,
      ),
    ).href;

  return import(
    `${url}?assetsAt=${Date.now()}`
  );
}

const [
  {
    faqs,
  },

  {
    preprocess,
  },

  {
    getIntentForFaqCategory,
  },

  {
    extractSlots,
  },
] = await Promise.all([
  load(
    "src/data/faqs.js",
  ),

  load(
    "src/services/textPreprocessing.js",
  ),

  load(
    "src/data/intentConfig.js",
  ),

  load(
    "src/services/slotFillingService.js",
  ),
]);

function buildDocument(
  faq,
) {
  return [
    faq.category,
    faq.question,
    faq.answer,
    ...(faq.keywords ?? []),
  ].join(" ");
}

function buildSlotDocument(
  faq,
) {
  return [
    faq.category,
    faq.question,
    ...(faq.keywords ?? []),
  ].join(" ");
}

function rawTokens(
  text,
) {
  return String(
    text ?? "",
  )
    .toLowerCase()
    .replace(
      /[^a-zA-Z0-9\s]/g,
      " ",
    )
    .split(/\s+/)
    .filter(Boolean);
}

const documents =
  faqs.map(
    (faq) => ({
      id:
        faq.id,

      intent:
        getIntentForFaqCategory(
          faq.category,
        ),

      tokens:
        preprocess(
          buildDocument(
            faq,
          ),
        ),

      slots:
        extractSlots(
          buildSlotDocument(
            faq,
          ),
        ).slots,
    }),
  );

const documentFrequency =
  {};

for (
  const document
  of documents
) {
  for (
    const token
    of new Set(
      document.tokens,
    )
  ) {
    documentFrequency[
      token
    ] =
      (
        documentFrequency[
          token
        ] ?? 0
      ) + 1;
  }
}

const totalDocuments =
  documents.length;

const faqIndex =
  documents.map(
    (document) => {
      const counts =
        {};

      for (
        const token
        of document.tokens
      ) {
        counts[token] =
          (
            counts[token] ??
            0
          ) + 1;
      }

      const vector =
        {};

      for (
        const [
          term,
          frequency,
        ]
        of Object.entries(
          counts,
        )
      ) {
        const idf =
          Math.log(
            (
              totalDocuments +
              1
            ) /
              (
                (
                  documentFrequency[
                    term
                  ] ?? 0
                ) + 1
              ),
          ) + 1;

        vector[term] =
          frequency *
          idf;
      }

      return {
        id:
          document.id,

        intent:
          document.intent,

        slots:
          document.slots,

        vector,
      };
    },
  );

const lexiconTokens =
  new Set();

for (
  const faq
  of faqs
) {
  for (
    const token
    of rawTokens(
      buildDocument(
        faq,
      ),
    )
  ) {
    lexiconTokens.add(
      token,
    );
  }
}

const lexicon =
  {};

for (
  const token
  of [
    ...lexiconTokens,
  ].sort()
) {
  const processed =
    preprocess(
      token,
    );

  lexicon[token] =
    processed.length === 1
      ? processed[0]
      : null;
}

const payload = {
  version:
    1,

  source:
    "Node.js Stage 8 runtime",

  faqCount:
    faqs.length,

  lexicon,

  documentFrequency,

  faqIndex,
};

await mkdir(
  path.dirname(
    outputPath,
  ),

  {
    recursive: true,
  },
);

await writeFile(
  outputPath,

  `${JSON.stringify(
    payload,
    null,
    2,
  )}\n`,

  "utf8",
);

console.log(
  `Runtime assets berhasil dibuat untuk ${faqs.length} FAQ.`,
);

console.log(
  `Lexicon: ${Object.keys(lexicon).length} token mentah.`,
);

console.log(
  `Output : ${outputPath}`,
);