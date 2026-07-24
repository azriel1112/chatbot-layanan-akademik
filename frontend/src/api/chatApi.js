import { ApiError, apiClient, executeRequest } from "./apiClient";

const SESSION_STORAGE_KEY = "academic_chatbot_session_id";

export function getStoredSessionId() {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeSessionId(sessionId) {
  if (!sessionId) {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    /*
     * Chat tetap dapat berjalan
     * tanpa localStorage.
     */
  }
}

export function clearStoredSessionId() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /*
     * Reset UI tetap berjalan
     * tanpa localStorage.
     */
  }
}

export async function checkBackendHealth() {
  const response = await executeRequest(() => apiClient.get("/health"));

  const result = response.data?.data;

  if (!result || !["healthy", "degraded"].includes(result.status)) {
    throw new ApiError(
      "Status backend Flask tidak valid.",

      {
        code: "UNHEALTHY_BACKEND",

        retryable: true,
      },
    );
  }

  return result;
}

export async function getFaqs() {
  const response = await executeRequest(() => apiClient.get("/faqs"));

  const result = response.data?.data;

  if (!Array.isArray(result)) {
    throw new ApiError(
      "Response FAQ dari backend tidak valid.",

      {
        code: "INVALID_FAQ_RESPONSE",

        retryable: true,
      },
    );
  }

  return result;
}

export async function sendMessage(message, sessionId = null) {
  const response = await executeRequest(() =>
    apiClient.post(
      "/chat",

      {
        message,

        sessionId: sessionId || undefined,
      },
    ),
  );

  const result = response.data?.data;

  if (!result || typeof result.answer !== "string") {
    throw new ApiError(
      "Response chat dari backend tidak valid.",

      {
        code: "INVALID_CHAT_RESPONSE",

        retryable: true,
      },
    );
  }

  if (result.sessionId) {
    storeSessionId(result.sessionId);
  }

  return result;
}

export async function resetChatSession(sessionId = null) {
  const activeSessionId = sessionId || getStoredSessionId();

  try {
    if (activeSessionId) {
      await executeRequest(() =>
        apiClient.delete(
          "/chat/session/" + encodeURIComponent(activeSessionId),
        ),
      );
    }
  } finally {
    clearStoredSessionId();
  }
}
