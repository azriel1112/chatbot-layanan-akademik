import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chatbot-layanan-akademik.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Chatbot FAQ Akademik aktif.' });
});

app.use('/api', chatRoutes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
