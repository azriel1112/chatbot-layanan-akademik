import React from "react";
import { useEffect, useRef, useState } from 'react';
// import { SendHorizontal } from 'lucide-react';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';
import FaqList from '../components/FaqList';
import { getFaqs, sendMessage } from '../api/chatApi';

export default function Home() {
  const [faqs, setFaqs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([
    { sender: 'bot', text: 'Halo! Saya siap membantu menjawab pertanyaan seputar layanan akademik kampus. Contoh: cara mengisi KRS, pembayaran UKT, melihat nilai, cuti akademik, skripsi, surat aktif kuliah, dan wisuda.' }
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    getFaqs().then(setFaqs).catch(() => setFaqs([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  async function handleSend(customText) {
    const text = (customText || message).trim();
    if (!text || loading) return;

    setChat((prev) => [...prev, { sender: 'user', text }]);
    setMessage('');
    setLoading(true);

    try {
      const result = await sendMessage(text);
      setChat((prev) => [...prev, {
        sender: 'bot',
        text: result.answer,
        confidence: result.confidence
      }]);
    } catch (error) {
      setChat((prev) => [...prev, { sender: 'bot', text: 'Terjadi kesalahan koneksi ke server. Pastikan backend sudah berjalan.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend();
  }

  return (
    <div className="app">
      <Header />
      <main className="layout">
        <section className="chat-card">
          <div className="chat-header">
            <h2>Ruang Chat</h2>
            <p>NLP: preprocessing, stemming, TF‑IDF, cosine similarity</p>
          </div>
          <div className="chat-box">
            {chat.map((item, index) => <ChatMessage key={index} item={item} />)}
            {loading && <ChatMessage item={{ sender: 'bot', text: 'Sedang memproses pertanyaan...' }} />}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pertanyaan akademik..."
            />
            <button type="submit" disabled={loading}>
              Kirim
            </button>
            {/* <button type="submit" disabled={loading}>
              <SendHorizontal size={18} /> Kirim
            </button> */}
          </form>
        </section>
        <FaqList faqs={faqs} onPick={handleSend} />
      </main>
    </div>
  );
}
