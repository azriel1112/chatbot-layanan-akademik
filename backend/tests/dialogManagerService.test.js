import assert from "node:assert/strict";

import test from "node:test";

import { DIALOG_STATES, DIALOG_TURN_TYPES } from "../src/data/dialogConfig.js";

import { DialogManagerService } from "../src/services/dialogManagerService.js";

function createFakeNlpHandler() {
  return async (message) => {
    const normalized = String(message).toLowerCase();

    const slots = {};

    if (/surat\s+(?:keterangan\s+)?mahasiswa\s+aktif/.test(normalized)) {
      slots.documentType = "mahasiswa_aktif";
    }

    if (/kampus\s+menteng|\bmenteng\b/.test(normalized)) {
      slots.campus = "menteng";
    }

    if (/surat\s+keterangan|surat\s+mahasiswa\s+aktif/.test(normalized)) {
      slots.service = "surat_keterangan";
    }

    const completed = slots.documentType && slots.campus;

    return {
      answer: completed
        ? "Silakan mengisi formulir surat mahasiswa aktif Kampus Menteng."
        : "Jawaban sementara.",

      confidence: completed ? 0.91 : 0.4,

      matchedQuestion: completed
        ? "Bagaimana mengajukan surat keterangan mahasiswa aktif Kampus Menteng?"
        : null,

      category: "Surat Keterangan",

      intent: "surat_dan_legalisir",

      slots,
      suggestions: [],
    };
  };
}

function createManager(overrides = {}) {
  let idCounter = 0;

  return new DialogManagerService({
    nlpHandler: createFakeNlpHandler(),

    idGenerator: () => `session_${String(++idCounter).padStart(4, "0")}`,

    ...overrides,
  });
}

test("dialog multi-turn meminta slot, konfirmasi, lalu menampilkan jawaban", async () => {
  const manager = createManager();

  const first = await manager.processTurn({
    message: "Saya ingin mengajukan surat keterangan",
  });

  assert.equal(first.sessionId, "session_0001");

  assert.equal(first.dialog.state, DIALOG_STATES.AWAITING_SLOT);

  assert.equal(first.dialog.turnType, DIALOG_TURN_TYPES.SLOT_PROMPT);

  assert.equal(first.dialog.awaitingSlot, "documentType");

  const second = await manager.processTurn({
    sessionId: first.sessionId,

    message: "mahasiswa aktif",
  });

  assert.equal(second.dialog.state, DIALOG_STATES.AWAITING_SLOT);

  assert.equal(second.dialog.awaitingSlot, "campus");

  assert.equal(second.slots.documentType, "mahasiswa_aktif");

  const third = await manager.processTurn({
    sessionId: first.sessionId,

    message: "Menteng",
  });

  assert.equal(third.dialog.state, DIALOG_STATES.AWAITING_CONFIRMATION);

  assert.equal(third.dialog.turnType, DIALOG_TURN_TYPES.CONFIRMATION_PROMPT);

  assert.match(third.answer, /apakah/i);

  assert.equal(third.slots.campus, "menteng");

  const fourth = await manager.processTurn({
    sessionId: first.sessionId,

    message: "Ya, tampilkan",
  });

  assert.equal(fourth.dialog.state, DIALOG_STATES.IDLE);

  assert.equal(fourth.dialog.turnType, DIALOG_TURN_TYPES.FINAL_ANSWER);

  assert.equal(fourth.dialog.confirmed, true);

  assert.match(fourth.answer, /mengisi formulir/i);

  const snapshot = manager.getSessionSnapshot(first.sessionId);

  assert.equal(snapshot.state, DIALOG_STATES.IDLE);

  assert.equal(snapshot.context, null);
});

test("jawaban konfirmasi yang tidak dikenali meminta pengguna menjawab ulang", async () => {
  const manager = createManager();

  const first = await manager.processTurn({
    message: "Bagaimana surat mahasiswa aktif untuk kampus Menteng?",
  });

  assert.equal(first.dialog.state, DIALOG_STATES.AWAITING_CONFIRMATION);

  const retry = await manager.processTurn({
    sessionId: first.sessionId,

    message: "mungkin nanti",
  });

  assert.equal(retry.dialog.state, DIALOG_STATES.AWAITING_CONFIRMATION);

  assert.equal(retry.dialog.turnType, DIALOG_TURN_TYPES.CONFIRMATION_RETRY);

  assert.deepEqual(retry.dialog.quickReplies, [
    "Ya, tampilkan",
    "Tidak, ubah pertanyaan",
  ]);
});

test("konfirmasi negatif membatalkan jawaban dan membersihkan context", async () => {
  const manager = createManager();

  const first = await manager.processTurn({
    message: "Bagaimana surat mahasiswa aktif untuk kampus Menteng?",
  });

  const cancelled = await manager.processTurn({
    sessionId: first.sessionId,

    message: "Tidak",
  });

  assert.equal(cancelled.dialog.state, DIALOG_STATES.IDLE);

  assert.equal(cancelled.dialog.cancelled, true);

  assert.equal(cancelled.matchedQuestion, null);

  assert.equal(
    manager.getSessionSnapshot(first.sessionId).context,

    null,
  );
});

test("perintah batal menghentikan pengumpulan slot", async () => {
  const manager = createManager();

  const first = await manager.processTurn({
    message: "Saya ingin mengajukan surat keterangan",
  });

  const cancelled = await manager.processTurn({
    sessionId: first.sessionId,

    message: "batal",
  });

  assert.equal(cancelled.dialog.turnType, DIALOG_TURN_TYPES.CANCELLED);

  assert.equal(cancelled.dialog.cancelled, true);

  assert.equal(cancelled.dialog.state, DIALOG_STATES.IDLE);
});

test("session terpisah tidak saling mencampur context", async () => {
  const manager = createManager();

  const firstSession = await manager.processTurn({
    message: "Saya ingin mengajukan surat keterangan",
  });

  const secondSession = await manager.processTurn({
    message: "Saya ingin mengajukan surat keterangan",
  });

  await manager.processTurn({
    sessionId: firstSession.sessionId,

    message: "mahasiswa aktif",
  });

  const firstSnapshot = manager.getSessionSnapshot(firstSession.sessionId);

  const secondSnapshot = manager.getSessionSnapshot(secondSession.sessionId);

  assert.equal(
    firstSnapshot.context.slots.documentType,

    "mahasiswa_aktif",
  );

  assert.equal(
    secondSnapshot.context.slots.documentType,

    undefined,
  );
});

test("session kedaluwarsa dibersihkan dan dibuat ulang", async () => {
  let currentTime = 1000;
  let idCounter = 0;

  const manager = createManager({
    sessionTtlMs: 100,

    now: () => currentTime,

    idGenerator: () => `expire_${String(++idCounter).padStart(4, "0")}`,
  });

  const first = await manager.processTurn({
    message: "Saya ingin mengajukan surat keterangan",
  });

  currentTime += 101;

  assert.equal(
    manager.cleanupExpiredSessions(),

    1,
  );

  assert.equal(
    manager.getSessionSnapshot(first.sessionId),

    null,
  );
});
