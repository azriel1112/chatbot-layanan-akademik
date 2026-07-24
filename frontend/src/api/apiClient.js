import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message,
    {
      code = "API_ERROR",

      status = null,

      retryable = false,
    } = {},
  ) {
    super(message);

    this.name = "ApiError";

    this.code = code;

    this.status = status;

    this.retryable = retryable;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,

  timeout: 20000,

  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan " + "yang tidak diketahui.",
    );
  }

  if (error.code === "ECONNABORTED") {
    return new ApiError(
      "Backend terlalu lama merespons. " + "Coba kembali beberapa saat lagi.",
      {
        code: "TIMEOUT",

        retryable: true,
      },
    );
  }

  if (!error.response) {
    return new ApiError(
      "Frontend tidak dapat terhubung ke backend Flask. " +
        "Pastikan backend berjalan dan VITE_API_URL sudah benar.",
      {
        code: "NETWORK_ERROR",

        retryable: true,
      },
    );
  }

  const status = error.response.status;

  const backendMessage = error.response?.data?.message;

  return new ApiError(
    backendMessage ||
      (status >= 500
        ? "Backend mengalami kesalahan " + "saat memproses permintaan."
        : "Permintaan ditolak " + `dengan status ${status}.`),
    {
      code: status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR",

      status,

      retryable: status >= 500,
    },
  );
}

export async function executeRequest(requestFactory) {
  if (typeof requestFactory !== "function") {
    throw new TypeError("requestFactory harus berupa function.");
  }

  try {
    return await requestFactory();
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function buildApiUrl(relativePath) {
  const normalizedPath = String(relativePath ?? "")
    .trim()
    .replace(/^\/+/, "");

  if (!normalizedPath) {
    return API_BASE_URL;
  }

  return `${API_BASE_URL}/` + normalizedPath;
}
