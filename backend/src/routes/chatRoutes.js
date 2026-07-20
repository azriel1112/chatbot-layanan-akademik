import express from "express";

import { getAllFaqs, getBotReply } from "../services/nlpService.js";

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

    if (!message) {
      return response.status(400).json({
        success: false,

        message: "Pesan tidak boleh kosong.",
      });
    }

    const reply = await getBotReply(message);

    return response.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
