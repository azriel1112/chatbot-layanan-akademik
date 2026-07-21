import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
     * Chat tetap dapat digunakan
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
     * apabila storage tidak tersedia.
     */
  }
}

export async function sendMessage(message, sessionId = null) {
  const response = await axios.post(
    `${API_URL}/chat`,

    {
      message,

      sessionId: sessionId || undefined,
    },
  );

  const result = response.data.data;

  if (result?.sessionId) {
    storeSessionId(result.sessionId);
  }

  return result;
}

export async function resetChatSession(sessionId = null) {
  const activeSessionId = sessionId || getStoredSessionId();

  try {
    if (activeSessionId) {
      await axios.delete(
        `${API_URL}/chat/session/` + encodeURIComponent(activeSessionId),
      );
    }
  } finally {
    clearStoredSessionId();
  }
}

export async function getFaqs() {
  const response = await axios.get(`${API_URL}/faqs`);

  return response.data.data;
}
