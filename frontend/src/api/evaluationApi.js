import { apiClient, buildApiUrl, executeRequest } from "./apiClient.js";

function extractData(response) {
  const data = response?.data?.data;

  if (data === undefined) {
    throw new Error("Response API evaluasi tidak memiliki properti data.");
  }

  return data;
}

export async function getEvaluationSummary() {
  const response = await executeRequest(() =>
    apiClient.get("/evaluation/summary"),
  );

  return extractData(response);
}

export async function getConfusionMatrix() {
  const response = await executeRequest(() =>
    apiClient.get("/evaluation/confusion-matrix"),
  );

  return extractData(response);
}

export async function getMisclassifications(limit = 20) {
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;

  const response = await executeRequest(() =>
    apiClient.get("/evaluation/misclassifications", {
      params: {
        limit: safeLimit,
      },
    }),
  );

  return extractData(response);
}

export async function getLogSummary() {
  const response = await executeRequest(() => apiClient.get("/logs/summary"));

  return extractData(response);
}

export async function getSystemStatus() {
  const response = await executeRequest(() => apiClient.get("/system/status"));

  return extractData(response);
}

export function getArtifactUrl(filename) {
  const normalizedFilename = String(filename ?? "").trim();

  if (!normalizedFilename) {
    throw new Error("Nama artefak evaluasi tidak boleh kosong.");
  }

  return buildApiUrl(
    "/evaluation/artifacts/" + encodeURIComponent(normalizedFilename),
  );
}
