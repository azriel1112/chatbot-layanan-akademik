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
      "../backend-node/src/data/faqs.js",
  );

const outputPath =
  path.resolve(
    process.argv[3] ??
      "data/faqs.json",
  );

const moduleUrl =
  pathToFileURL(
    sourcePath,
  ).href;

const module =
  await import(
    `${moduleUrl}?exportedAt=${Date.now()}`
  );

if (
  !Array.isArray(
    module.faqs,
  ) ||
  module.faqs.length === 0
) {
  throw new Error(
    "Export faqs pada file sumber " +
      "tidak ditemukan atau kosong.",
  );
}

const ids =
  module.faqs.map(
    (faq) => faq.id,
  );

if (
  new Set(ids).size !==
  ids.length
) {
  throw new Error(
    "Dataset FAQ memiliki id duplikat.",
  );
}

for (
  const faq
  of module.faqs
) {
  if (
    !Number.isInteger(
      faq.id,
    ) ||

    !String(
      faq.category ?? "",
    ).trim() ||

    !String(
      faq.question ?? "",
    ).trim() ||

    !String(
      faq.answer ?? "",
    ).trim() ||

    !Array.isArray(
      faq.keywords,
    )
  ) {
    throw new Error(
      `Struktur FAQ tidak valid pada id ${faq.id ?? "unknown"}.`,
    );
  }
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
    module.faqs,
    null,
    2,
  )}\n`,

  "utf8",
);

console.log(
  `FAQ berhasil diekspor: ${module.faqs.length} data`,
);

console.log(
  `Sumber : ${sourcePath}`,
);

console.log(
  `Output : ${outputPath}`,
);