function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function roundMetric(value) {
  return Number(value.toFixed(6));
}

function createEmptyMatrix(labels) {
  return Object.fromEntries(
    labels.map((actual) => [
      actual,
      Object.fromEntries(labels.map((predicted) => [predicted, 0])),
    ]),
  );
}

export function evaluateIntentClassifier(model, rows, labels) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Data testing untuk evaluasi tidak boleh kosong.");
  }

  if (!Array.isArray(labels) || labels.length === 0) {
    throw new Error("Daftar label evaluasi tidak boleh kosong.");
  }

  const labelSet = new Set(labels);
  const confusionMatrix = createEmptyMatrix(labels);
  const predictions = [];

  for (const row of rows) {
    if (!labelSet.has(row.intent)) {
      throw new Error(`Label aktual tidak dikenal: ${row.intent}`);
    }

    const prediction = model.predict(row.text, { topK: 3 });

    if (!prediction.intent || !labelSet.has(prediction.intent)) {
      throw new Error(
        `Model tidak menghasilkan label valid untuk data ${row.id}.`,
      );
    }

    confusionMatrix[row.intent][prediction.intent] += 1;
    predictions.push({
      id: row.id,
      text: row.text,
      actualIntent: row.intent,
      predictedIntent: prediction.intent,
      confidence: prediction.confidence,
      correct: row.intent === prediction.intent,
      alternatives: prediction.classifications,
    });
  }

  const correctPredictions = predictions.filter((row) => row.correct).length;
  const accuracy = safeDivide(correctPredictions, predictions.length);

  const perIntent = labels.map((intent) => {
    const truePositive = confusionMatrix[intent][intent];
    const falsePositive = labels.reduce(
      (sum, actual) =>
        actual === intent ? sum : sum + confusionMatrix[actual][intent],
      0,
    );
    const falseNegative = labels.reduce(
      (sum, predicted) =>
        predicted === intent ? sum : sum + confusionMatrix[intent][predicted],
      0,
    );
    const support = labels.reduce(
      (sum, predicted) => sum + confusionMatrix[intent][predicted],
      0,
    );
    const precision = safeDivide(truePositive, truePositive + falsePositive);
    const recall = safeDivide(truePositive, truePositive + falseNegative);
    const f1Score = safeDivide(2 * precision * recall, precision + recall);

    return {
      intent,
      precision: roundMetric(precision),
      recall: roundMetric(recall),
      f1Score: roundMetric(f1Score),
      support,
      truePositive,
      falsePositive,
      falseNegative,
    };
  });

  const macroAverage = {
    precision: roundMetric(
      perIntent.reduce((sum, row) => sum + row.precision, 0) / perIntent.length,
    ),
    recall: roundMetric(
      perIntent.reduce((sum, row) => sum + row.recall, 0) / perIntent.length,
    ),
    f1Score: roundMetric(
      perIntent.reduce((sum, row) => sum + row.f1Score, 0) / perIntent.length,
    ),
  };

  const totalSupport = perIntent.reduce((sum, row) => sum + row.support, 0);
  const weightedAverage = {
    precision: roundMetric(
      safeDivide(
        perIntent.reduce((sum, row) => sum + row.precision * row.support, 0),
        totalSupport,
      ),
    ),
    recall: roundMetric(
      safeDivide(
        perIntent.reduce((sum, row) => sum + row.recall * row.support, 0),
        totalSupport,
      ),
    ),
    f1Score: roundMetric(
      safeDivide(
        perIntent.reduce((sum, row) => sum + row.f1Score * row.support, 0),
        totalSupport,
      ),
    ),
  };

  const confusionPairs = [];

  for (const actualIntent of labels) {
    for (const predictedIntent of labels) {
      if (actualIntent === predictedIntent) continue;

      const total = confusionMatrix[actualIntent][predictedIntent];
      if (total > 0) {
        confusionPairs.push({ actualIntent, predictedIntent, total });
      }
    }
  }

  confusionPairs.sort(
    (a, b) =>
      b.total - a.total ||
      a.actualIntent.localeCompare(b.actualIntent) ||
      a.predictedIntent.localeCompare(b.predictedIntent),
  );

  return {
    totalTestRows: predictions.length,
    correctPredictions,
    incorrectPredictions: predictions.length - correctPredictions,
    accuracy: roundMetric(accuracy),
    macroAverage,
    weightedAverage,
    perIntent,
    confusionMatrix,
    confusionPairs,
    predictions,
  };
}
