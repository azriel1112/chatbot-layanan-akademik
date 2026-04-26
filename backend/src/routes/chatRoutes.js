import express from 'express';
import { getAllFaqs, getBotReply } from '../services/nlpService.js';

const router = express.Router();

router.get('/faqs', (req, res) => {
  res.json({ success: true, data: getAllFaqs() });
});

router.post('/chat', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
  }

  const reply = getBotReply(message);
  return res.json({ success: true, data: reply });
});

export default router;
