function assertTokenDocuments(tokenDocuments) {
  if (!Array.isArray(tokenDocuments) || tokenDocuments.length === 0) {
    throw new Error("Dokumen token untuk TF-IDF tidak boleh kosong.");
  }

  for (const [index, tokens] of tokenDocuments.entries()) {
    if (!Array.isArray(tokens)) {
      throw new TypeError(
        `Dokumen token pada indeks ${index} harus berupa array.`,
      );
    }
  }
}

function l2Normalize(vector) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export class TfidfVectorizer {
  constructor({
    minimumDocumentFrequency = 1,
    maximumVocabularySize = 5000,
  } = {}) {
    if (
      !Number.isInteger(minimumDocumentFrequency) ||
      minimumDocumentFrequency < 1
    ) {
      throw new RangeError("minimumDocumentFrequency minimal bernilai 1.");
    }

    if (!Number.isInteger(maximumVocabularySize) || maximumVocabularySize < 1) {
      throw new RangeError("maximumVocabularySize minimal bernilai 1.");
    }

    this.minimumDocumentFrequency = minimumDocumentFrequency;
    this.maximumVocabularySize = maximumVocabularySize;
    this.vocabulary = [];
    this.idf = [];
    this.vocabularyIndex = new Map();
    this.fitted = false;
  }

  fit(tokenDocuments) {
    assertTokenDocuments(tokenDocuments);

    const documentFrequency = new Map();

    for (const tokens of tokenDocuments) {
      for (const token of new Set(tokens)) {
        documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
      }
    }

    this.vocabulary = [...documentFrequency.entries()]
      .filter(([, frequency]) => frequency >= this.minimumDocumentFrequency)
      .sort(
        ([tokenA, frequencyA], [tokenB, frequencyB]) =>
          frequencyB - frequencyA || tokenA.localeCompare(tokenB),
      )
      .slice(0, this.maximumVocabularySize)
      .map(([token]) => token);

    if (this.vocabulary.length === 0) {
      throw new Error("Vocabulary TF-IDF kosong setelah proses fit.");
    }

    this.vocabularyIndex = new Map(
      this.vocabulary.map((token, index) => [token, index]),
    );

    const totalDocuments = tokenDocuments.length;
    this.idf = this.vocabulary.map((token) => {
      const frequency = documentFrequency.get(token) ?? 0;
      return Math.log((totalDocuments + 1) / (frequency + 1)) + 1;
    });

    this.fitted = true;
    return this;
  }

  transform(tokens) {
    if (!this.fitted) {
      throw new Error("TfidfVectorizer belum di-fit.");
    }

    if (!Array.isArray(tokens)) {
      throw new TypeError("Input transform harus berupa array token.");
    }

    const vector = Array(this.vocabulary.length).fill(0);
    const termCounts = new Map();

    for (const token of tokens) {
      const index = this.vocabularyIndex.get(token);

      if (index !== undefined) {
        termCounts.set(index, (termCounts.get(index) ?? 0) + 1);
      }
    }

    for (const [index, count] of termCounts.entries()) {
      const sublinearTermFrequency = 1 + Math.log(count);
      vector[index] = sublinearTermFrequency * this.idf[index];
    }

    return l2Normalize(vector);
  }

  transformMany(tokenDocuments) {
    if (!Array.isArray(tokenDocuments)) {
      throw new TypeError(
        "Input transformMany harus berupa array dokumen token.",
      );
    }

    return tokenDocuments.map((tokens) => this.transform(tokens));
  }

  fitTransform(tokenDocuments) {
    this.fit(tokenDocuments);
    return this.transformMany(tokenDocuments);
  }

  toJSON() {
    if (!this.fitted) {
      throw new Error(
        "TfidfVectorizer yang belum di-fit tidak dapat disimpan.",
      );
    }

    return {
      version: 1,
      minimumDocumentFrequency: this.minimumDocumentFrequency,
      maximumVocabularySize: this.maximumVocabularySize,
      vocabulary: this.vocabulary,
      idf: this.idf,
    };
  }

  static fromJSON(payload) {
    if (!payload || payload.version !== 1) {
      throw new Error("Format model TF-IDF tidak didukung.");
    }

    if (
      !Array.isArray(payload.vocabulary) ||
      !Array.isArray(payload.idf) ||
      payload.vocabulary.length !== payload.idf.length ||
      payload.vocabulary.length === 0
    ) {
      throw new Error("Data vocabulary atau IDF pada model tidak valid.");
    }

    const vectorizer = new TfidfVectorizer({
      minimumDocumentFrequency: payload.minimumDocumentFrequency,
      maximumVocabularySize: payload.maximumVocabularySize,
    });

    vectorizer.vocabulary = [...payload.vocabulary];
    vectorizer.idf = [...payload.idf];
    vectorizer.vocabularyIndex = new Map(
      vectorizer.vocabulary.map((token, index) => [token, index]),
    );
    vectorizer.fitted = true;

    return vectorizer;
  }
}
