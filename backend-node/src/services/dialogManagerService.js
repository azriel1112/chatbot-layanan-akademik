import { randomUUID } from "node:crypto";

import {
  CONFIRMATION_VALUES,
  DIALOG_RULES,
  DIALOG_STATES,
  DIALOG_TURN_TYPES,
  buildConfirmationText,
  classifyConfirmation,
  findDialogRule,
  getNextMissingSlot,
  getSlotPrompt,
  isCancellationMessage,
  normalizeSlotAnswer,
} from "../data/dialogConfig.js";

export const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

export const DEFAULT_MAX_SESSIONS = 1000;

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;

const DIALOG_RULE_LOOKUP = new Map(DIALOG_RULES.map((rule) => [rule.id, rule]));

function cloneValue(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function mergeSlots(currentSlots = {}, newSlots = {}) {
  return {
    ...currentSlots,

    ...Object.fromEntries(
      Object.entries(newSlots).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ),
  };
}

function createDialogMetadata({
  state,
  turnType,
  awaitingSlot = null,
  requiresInput = false,
  quickReplies = [],
  ruleId = null,
  confirmed = false,
  cancelled = false,
  contextSlots = {},
}) {
  return {
    state,
    turnType,
    awaitingSlot,
    requiresInput,

    quickReplies: [...quickReplies],

    ruleId,
    confirmed,
    cancelled,

    contextSlots: cloneValue(contextSlots),
  };
}

function createInitialSession({ id, now }) {
  return {
    id,
    state: DIALOG_STATES.IDLE,

    context: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isValidSessionId(sessionId) {
  return SESSION_ID_PATTERN.test(String(sessionId ?? ""));
}

export class DialogManagerService {
  constructor({
    nlpHandler,
    sessionTtlMs = DEFAULT_SESSION_TTL_MS,
    maxSessions = DEFAULT_MAX_SESSIONS,
    now = () => Date.now(),
    idGenerator = () => randomUUID(),
  } = {}) {
    if (typeof nlpHandler !== "function") {
      throw new TypeError("nlpHandler harus berupa function async.");
    }

    if (!Number.isFinite(sessionTtlMs) || sessionTtlMs <= 0) {
      throw new RangeError("sessionTtlMs harus lebih besar dari 0.");
    }

    if (!Number.isInteger(maxSessions) || maxSessions < 1) {
      throw new RangeError("maxSessions minimal bernilai 1.");
    }

    this.nlpHandler = nlpHandler;

    this.sessionTtlMs = sessionTtlMs;

    this.maxSessions = maxSessions;

    this.now = now;

    this.idGenerator = idGenerator;

    this.sessions = new Map();
  }

  cleanupExpiredSessions() {
    const currentTime = this.now();

    let removed = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (currentTime - session.updatedAt > this.sessionTtlMs) {
        this.sessions.delete(sessionId);

        removed += 1;
      }
    }

    return removed;
  }

  enforceSessionLimit() {
    if (this.sessions.size < this.maxSessions) {
      return;
    }

    const oldestSession = [...this.sessions.values()].sort(
      (first, second) => first.updatedAt - second.updatedAt,
    )[0];

    if (oldestSession) {
      this.sessions.delete(oldestSession.id);
    }
  }

  resolveSession(sessionId) {
    this.cleanupExpiredSessions();

    if (sessionId && !isValidSessionId(sessionId)) {
      throw new Error(
        "Format sessionId tidak valid. " +
          "Gunakan 8–100 karakter huruf, angka, " +
          "underscore, atau tanda hubung.",
      );
    }

    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    this.enforceSessionLimit();

    const generatedId = sessionId || this.idGenerator();

    if (!isValidSessionId(generatedId)) {
      throw new Error("idGenerator menghasilkan sessionId yang tidak valid.");
    }

    const session = createInitialSession({
      id: generatedId,
      now: this.now(),
    });

    this.sessions.set(generatedId, session);

    return session;
  }

  resetSession(sessionId) {
    if (!sessionId || !isValidSessionId(sessionId)) {
      return false;
    }

    return this.sessions.delete(sessionId);
  }

  getSessionSnapshot(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    return cloneValue(session);
  }

  clearSessionState(session) {
    session.state = DIALOG_STATES.IDLE;

    session.context = null;

    session.updatedAt = this.now();
  }

  buildSlotPromptResponse({ session, rule, slotName, nlpResult }) {
    const prompt = getSlotPrompt(rule, slotName);

    session.state = DIALOG_STATES.AWAITING_SLOT;

    session.updatedAt = this.now();

    return {
      sessionId: session.id,

      answer: prompt.text,

      confidence: nlpResult?.confidence ?? 0,

      matchedQuestion: null,

      category: nlpResult?.category ?? null,

      intent: nlpResult?.intent ?? null,

      slots: cloneValue(session.context.slots),

      dialog: createDialogMetadata({
        state: session.state,

        turnType: DIALOG_TURN_TYPES.SLOT_PROMPT,

        awaitingSlot: slotName,

        requiresInput: true,

        quickReplies: prompt.quickReplies,

        ruleId: rule.id,

        contextSlots: session.context.slots,
      }),
    };
  }

  buildConfirmationResponse({ session, rule, nlpResult }) {
    session.state = DIALOG_STATES.AWAITING_CONFIRMATION;

    session.context.pendingReply = cloneValue(nlpResult);

    session.updatedAt = this.now();

    return {
      sessionId: session.id,

      answer: buildConfirmationText(rule, {
        slots: session.context.slots,

        nlpResult,
      }),

      confidence: nlpResult?.confidence ?? 0,

      matchedQuestion: nlpResult?.matchedQuestion ?? null,

      category: nlpResult?.category ?? null,

      intent: nlpResult?.intent ?? null,

      slots: cloneValue(session.context.slots),

      dialog: createDialogMetadata({
        state: session.state,

        turnType: DIALOG_TURN_TYPES.CONFIRMATION_PROMPT,

        requiresInput: true,

        quickReplies: ["Ya, tampilkan", "Tidak, ubah pertanyaan"],

        ruleId: rule.id,

        contextSlots: session.context.slots,
      }),
    };
  }

  async handleIdleTurn(session, message) {
    const nlpResult = await this.nlpHandler(message);

    const rule = findDialogRule({
      message,
      nlpResult,
    });

    if (!rule) {
      session.updatedAt = this.now();

      return {
        sessionId: session.id,

        ...nlpResult,

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: nlpResult?.matchedQuestion
            ? DIALOG_TURN_TYPES.DIRECT_ANSWER
            : DIALOG_TURN_TYPES.NO_MATCH,

          contextSlots: nlpResult?.slots ?? {},
        }),
      };
    }

    session.context = {
      ruleId: rule.id,

      baseMessage: message,

      augmentedMessages: [],

      slots: mergeSlots({}, nlpResult?.slots),

      lastNlpResult: cloneValue(nlpResult),

      pendingReply: null,
    };

    const missingSlot = getNextMissingSlot(rule, session.context.slots);

    if (missingSlot) {
      return this.buildSlotPromptResponse({
        session,
        rule,
        slotName: missingSlot,
        nlpResult,
      });
    }

    if (!nlpResult?.matchedQuestion) {
      this.clearSessionState(session);

      return {
        sessionId: session.id,

        ...nlpResult,

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.NO_MATCH,

          contextSlots: nlpResult?.slots ?? {},
        }),
      };
    }

    return this.buildConfirmationResponse({
      session,
      rule,
      nlpResult,
    });
  }

  async handleSlotTurn(session, message) {
    const context = session.context;

    const rule = DIALOG_RULE_LOOKUP.get(context?.ruleId);

    if (!rule) {
      this.clearSessionState(session);

      return this.handleIdleTurn(session, message);
    }

    const currentSlot = getNextMissingSlot(rule, context.slots);

    if (!currentSlot) {
      return this.buildConfirmationResponse({
        session,
        rule,

        nlpResult: context.lastNlpResult,
      });
    }

    const augmentedAnswer = normalizeSlotAnswer(currentSlot, message);

    context.augmentedMessages.push(augmentedAnswer);

    const combinedMessage = [context.baseMessage, ...context.augmentedMessages]
      .join(" ")
      .trim();

    const nlpResult = await this.nlpHandler(combinedMessage);

    context.slots = mergeSlots(context.slots, nlpResult?.slots);

    context.lastNlpResult = cloneValue(nlpResult);

    session.updatedAt = this.now();

    const nextMissingSlot = getNextMissingSlot(rule, context.slots);

    if (nextMissingSlot) {
      return this.buildSlotPromptResponse({
        session,
        rule,

        slotName: nextMissingSlot,

        nlpResult,
      });
    }

    if (!nlpResult?.matchedQuestion) {
      const savedSlots = cloneValue(context.slots);

      this.clearSessionState(session);

      return {
        sessionId: session.id,

        ...nlpResult,

        answer:
          "Informasi tambahan sudah diterima, " +
          "tetapi saya belum menemukan FAQ yang cukup sesuai. " +
          "Silakan tulis ulang kebutuhan Anda dengan lebih spesifik.",

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.NO_MATCH,

          contextSlots: savedSlots,
        }),
      };
    }

    return this.buildConfirmationResponse({
      session,
      rule,
      nlpResult,
    });
  }

  handleConfirmationTurn(session, message) {
    const context = session.context;

    const pendingReply = context?.pendingReply;

    const rule = DIALOG_RULE_LOOKUP.get(context?.ruleId);

    const confirmation = classifyConfirmation(message);

    if (!pendingReply || !rule) {
      this.clearSessionState(session);

      return {
        sessionId: session.id,

        answer:
          "Konteks percakapan sebelumnya sudah tidak tersedia. " +
          "Silakan kirim ulang pertanyaan akademik Anda.",

        confidence: 0,
        matchedQuestion: null,
        category: null,

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.CANCELLED,

          cancelled: true,
        }),
      };
    }

    if (confirmation === CONFIRMATION_VALUES.AFFIRMATIVE) {
      const finalReply = cloneValue(pendingReply);

      const contextSlots = cloneValue(context.slots);

      const ruleId = rule.id;

      this.clearSessionState(session);

      return {
        sessionId: session.id,

        ...finalReply,

        slots: mergeSlots(finalReply?.slots, contextSlots),

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.FINAL_ANSWER,

          confirmed: true,

          ruleId,

          contextSlots,
        }),
      };
    }

    if (confirmation === CONFIRMATION_VALUES.NEGATIVE) {
      const contextSlots = cloneValue(context.slots);

      const ruleId = rule.id;

      this.clearSessionState(session);

      return {
        sessionId: session.id,

        answer:
          "Baik, jawaban tersebut tidak saya tampilkan. " +
          "Silakan jelaskan kembali kebutuhan Anda atau pilih topik lain.",

        confidence: 0,
        matchedQuestion: null,
        category: null,

        slots: contextSlots,

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.CANCELLED,

          cancelled: true,

          ruleId,

          contextSlots,
        }),
      };
    }

    session.updatedAt = this.now();

    return {
      sessionId: session.id,

      answer:
        "Mohon jawab dengan “Ya” untuk menampilkan jawaban " +
        "atau “Tidak” untuk membatalkan dan mengubah pertanyaan.",

      confidence: pendingReply?.confidence ?? 0,

      matchedQuestion: pendingReply?.matchedQuestion ?? null,

      category: pendingReply?.category ?? null,

      slots: cloneValue(context.slots),

      dialog: createDialogMetadata({
        state: DIALOG_STATES.AWAITING_CONFIRMATION,

        turnType: DIALOG_TURN_TYPES.CONFIRMATION_RETRY,

        requiresInput: true,

        quickReplies: ["Ya, tampilkan", "Tidak, ubah pertanyaan"],

        ruleId: rule.id,

        contextSlots: context.slots,
      }),
    };
  }

  async processTurn({ sessionId = null, message }) {
    const normalizedMessage = String(message ?? "").trim();

    if (!normalizedMessage) {
      throw new Error("Pesan tidak boleh kosong.");
    }

    const session = this.resolveSession(sessionId);

    if (
      session.state !== DIALOG_STATES.IDLE &&
      isCancellationMessage(normalizedMessage)
    ) {
      const previousContext = cloneValue(session.context);

      this.clearSessionState(session);

      return {
        sessionId: session.id,

        answer:
          "Baik, proses sebelumnya dibatalkan. " +
          "Silakan kirim pertanyaan akademik baru.",

        confidence: 0,
        matchedQuestion: null,
        category: null,

        dialog: createDialogMetadata({
          state: DIALOG_STATES.IDLE,

          turnType: DIALOG_TURN_TYPES.CANCELLED,

          cancelled: true,

          ruleId: previousContext?.ruleId ?? null,

          contextSlots: previousContext?.slots ?? {},
        }),
      };
    }

    if (session.state === DIALOG_STATES.AWAITING_SLOT) {
      return this.handleSlotTurn(session, normalizedMessage);
    }

    if (session.state === DIALOG_STATES.AWAITING_CONFIRMATION) {
      return this.handleConfirmationTurn(session, normalizedMessage);
    }

    return this.handleIdleTurn(session, normalizedMessage);
  }
}
