import {
  mkdir,
  writeFile,
} from "node:fs/promises";

import path
  from "node:path";

import {
  pathToFileURL,
} from "node:url";

const sourcePath =
  path.resolve(
    process.argv[2] ??
      "../backend-node/src/services/nlpService.js",
  );

const outputPath =
  path.resolve(
    process.argv[3] ??
      "tests/fixtures/node_baseline.json",
  );

const queries = [
  "bagaimana cara bayar uang kuliah",

  "Apa saja syarat pendaftaran sidang Tugas Akhir?",

  "Apa saja syarat mengikuti Magang Mandiri?",

  "Apa mata kuliah semester 6 Informatika kurikulum 2025?",

  "Form surat keterangan untuk Kampus Menteng yang mana?",

  "Apa kode prefix pembayaran untuk kelas Reguler 2?",

  "cara membuat nasi goreng",
];

const moduleUrl =
  pathToFileURL(
    sourcePath,
  ).href;

const {
  getBotReply,
} = await import(
  `${moduleUrl}?baselineAt=${Date.now()}`
);

const baseline =
  [];

for (
  const query
  of queries
) {
  const result =
    await getBotReply(
      query,
    );

  baseline.push({
    query,

    answer:
      result.answer,

    confidence:
      result.confidence,

    matchedQuestion:
      result.matchedQuestion,

    category:
      result.category ??
      null,

    intent:
      result.intent ??
      null,

    slots:
      result.slots ??
      {},

    suggestionIds:
      (
        result.suggestions ??
        []
      ).map(
        (item) =>
          item.id,
      ),
  });
}

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
    baseline,
    null,
    2,
  )}\n`,

  "utf8",
);

console.log(
  `Baseline Node berhasil dibuat: ${baseline.length} skenario`,
);

console.log(
  `Output: ${outputPath}`,
);