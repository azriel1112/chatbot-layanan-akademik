import { getBotReply } from "./nlpService.js";

import { DialogManagerService } from "./dialogManagerService.js";

const dialogManager = new DialogManagerService({
  nlpHandler: getBotReply,
});

export function processDialogTurn(payload) {
  return dialogManager.processTurn(payload);
}

export function resetDialogSession(sessionId) {
  return dialogManager.resetSession(sessionId);
}

export function getDialogSessionSnapshot(sessionId) {
  return dialogManager.getSessionSnapshot(sessionId);
}

export function cleanupExpiredDialogSessions() {
  return dialogManager.cleanupExpiredSessions();
}
