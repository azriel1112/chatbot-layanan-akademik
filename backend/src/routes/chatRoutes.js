import express from "express";

import {
  processDialogTurn,
  resetDialogSession,
} from "../services/dialogService.js";

import { isValidSessionId } from "../services/dialogManagerService.js";

import { getAllFaqs } from "../services/nlpService.js";

const router = express.Router();

router.get("/faqs", (request, response) => {
  response.json({
    success: true,
    data: getAllFaqs(),
  });
});

router.post("/chat", async (request, response, next) => {
  try {
    const message = String(request.body?.message ?? "").trim();

    const sessionId = request.body?.sessionId
      ? String(request.body.sessionId).trim()
      : null;

    if (!message) {
      return response.status(400).json({
        success: false,

        message: "Pesan tidak boleh kosong.",
      });
    }

    if (sessionId && !isValidSessionId(sessionId)) {
      return response.status(400).json({
        success: false,

        message:
          "Format sessionId tidak valid. " +
          "Muat ulang halaman untuk membuat sesi baru.",
      });
    }

    const reply = await processDialogTurn({
      sessionId,
      message,
    });

    return response.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/chat/session/:sessionId", (request, response) => {
  const sessionId = String(request.params.sessionId ?? "").trim();

  if (!isValidSessionId(sessionId)) {
    return response.status(400).json({
      success: false,

      message: "Format sessionId tidak valid.",
    });
  }

  const removed = resetDialogSession(sessionId);

  return response.json({
    success: true,

    data: {
      sessionId,
      removed,
    },
  });
});

export default router;
