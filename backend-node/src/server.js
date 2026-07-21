import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import chatRoutes from "./routes/chatRoutes.js";

import { initializeNlpService } from "./services/nlpService.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chatbot-layanan-akademik.vercel.app",
    ],

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/", (request, response) => {
  response.json({
    message: "API Chatbot FAQ Akademik aktif.",
  });
});

app.use("/api", chatRoutes);

/*
 * Centralized error handler.
 * Error internal tidak ditampilkan
 * secara lengkap kepada frontend.
 */
app.use((error, request, response, next) => {
  console.error(error);

  if (response.headersSent) {
    return next(error);
  }

  return response.status(500).json({
    success: false,

    message: "Terjadi kesalahan pada layanan chatbot.",
  });
});

async function startServer() {
  try {
    /*
     * Model dimuat sebelum server
     * menerima request.
     */
    const classifier = await initializeNlpService();

    console.log(
      "Intent classifier aktif: " +
        (classifier.metadata.algorithm ?? "model NLP"),
    );

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Server gagal dijalankan karena model NLP tidak dapat dimuat.",
    );

    console.error(error);

    process.exitCode = 1;
  }
}

startServer();
