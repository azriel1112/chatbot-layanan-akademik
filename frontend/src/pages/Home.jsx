import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  BsInfoCircle,
  BsLightningChargeFill,
  BsSendFill,
} from "react-icons/bs";
import Header from "../components/Header";
import ChatMessage from "../components/ChatMessage";
import FaqList from "../components/FaqList";
import { getFaqs, sendMessage } from "../api/chatApi";
<<<<<<< HEAD

const WELCOME_MESSAGE = {
  sender: "bot",
  text:
    "Halo! Saya Asisten Akademik. Saya bisa membantu menjawab pertanyaan seputar KRS, UKT, KP, Magang, Sempro, Tugas Akhir, Akreditasi, dan Wisuda.\n\nPilih contoh pertanyaan di samping atau ketik pertanyaanmu sendiri.",
};

const PRIORITY_QUESTIONS = [
  "Apa saja syarat pendaftaran sidang Tugas Akhir?",
  "Berapa lama batas revisi setelah sidang Tugas Akhir?",
  "Berapa minimal SKS dan IPK untuk mengambil Kerja Praktek?",
  "Apa saja syarat mengikuti Magang Mandiri?",
];
=======
>>>>>>> origin/feature/database-completion

export default function Home() {
  const [faqs, setFaqs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [chat, setChat] = useState([WELCOME_MESSAGE]);

=======
  const [chat, setChat] = useState([
    {
      sender: "bot",
      text: "Halo! Saya siap membantu menjawab pertanyaan seputar layanan akademik kampus. Contoh: cara mengisi KRS, pembayaran UKT, melihat nilai, cuti akademik, skripsi, surat aktif kuliah, dan wisuda.",
    },
  ]);
>>>>>>> origin/feature/database-completion
  const bottomRef = useRef(null);

  useEffect(() => {
    getFaqs()
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
<<<<<<< HEAD
  }, [chat, loading]);

  const quickPrompts = useMemo(() => {
    if (!faqs.length) return [];

    const priorityFaqs = PRIORITY_QUESTIONS.map((question) =>
      faqs.find((faq) => faq.question === question)
    ).filter(Boolean);

    if (priorityFaqs.length > 0) {
      return priorityFaqs;
    }

    return faqs.slice(0, 4);
  }, [faqs]);

  function findMatchedFaq(text, result, sourceFaq) {
    if (sourceFaq) return sourceFaq;

    const normalizedText = text.toLowerCase();

    return (
      faqs.find((faq) => faq.question.toLowerCase() === normalizedText) ||
      faqs.find((faq) => result?.answer && faq.answer === result.answer)
    );
  }

  function getRelatedQuestions(currentFaq) {
    if (!faqs.length) return [];

    if (!currentFaq) {
      return quickPrompts.slice(0, 3).map((faq) => faq.question);
    }

    return faqs
      .filter(
        (faq) =>
          faq.category === currentFaq.category && faq.id !== currentFaq.id
      )
      .slice(0, 3)
      .map((faq) => faq.question);
  }

  async function handleSend(customText, sourceFaq = null) {
    const text = String(customText || message).trim();
=======
  }, [chat]);
>>>>>>> origin/feature/database-completion

    if (!text || loading) return;

    setChat((prev) => [...prev, { sender: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const result = await sendMessage(text);
<<<<<<< HEAD
      const matchedFaq = findMatchedFaq(text, result, sourceFaq);

=======
>>>>>>> origin/feature/database-completion
      setChat((prev) => [
        ...prev,
        {
          sender: "bot",
<<<<<<< HEAD
          text:
            result?.answer ||
            "Maaf, saya belum menemukan jawaban yang sesuai. Coba gunakan kata kunci yang lebih spesifik.",
          confidence: result?.confidence,
          category: result?.category || matchedFaq?.category,
          quickReplies: getRelatedQuestions(matchedFaq),
        },
      ]);
    } catch {
=======
          text: result.answer,
          confidence: result.confidence,
        },
      ]);
    } catch (error) {
>>>>>>> origin/feature/database-completion
      setChat((prev) => [
        ...prev,
        {
          sender: "bot",
<<<<<<< HEAD
          text:
            "Terjadi kesalahan koneksi ke server. Pastikan backend sudah berjalan, lalu coba kirim ulang pertanyaan.",
=======
          text: "Terjadi kesalahan koneksi ke server. Pastikan backend sudah berjalan.",
>>>>>>> origin/feature/database-completion
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSend();
  }

  return (
    <div className="app">
      <Header />
<<<<<<< HEAD

      <Container className="main-shell">
        <Row className="g-4 align-items-start">
          <Col lg={8}>
            <Card as="section" className="chat-card surface-card">
              <Card.Header className="chat-header">
                <div>
                  <span className="section-kicker">Ruang bantuan</span>
                  <h2>Tanya Akademik</h2>
                  <p>
                    Saya akan mencari jawaban paling relevan dari FAQ akademik.
                  </p>
                </div>

                <Badge bg="light" text="primary" className="chat-mode-badge">
                  <BsInfoCircle /> Berbasis FAQ
                </Badge>
              </Card.Header>

              {chat.length <= 1 && quickPrompts.length > 0 && (
                <div className="quick-start">
                  {quickPrompts.map((faq) => (
                    <Button
                      key={faq.id}
                      type="button"
                      variant="light"
                      onClick={() => handleSend(faq.question, faq)}
                    >
                      <BsLightningChargeFill />
                      {faq.question}
                    </Button>
                  ))}
                </div>
              )}

              <div className="chat-box">
                {chat.map((item, index) => (
                  <ChatMessage
                    key={`${item.sender}-${index}`}
                    item={item}
                    onQuickPick={handleSend}
                  />
                ))}

                {loading && (
                  <ChatMessage
                    item={{
                      sender: "bot",
                      typing: true,
                      text: "Asisten sedang mencari jawaban terbaik...",
                    }}
                  />
                )}

                <div ref={bottomRef} />
              </div>

              <Form className="chat-input" onSubmit={handleSubmit}>
                <InputGroup>
                  <Form.Control
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Contoh: Berapa lama batas revisi sidang TA?"
                    disabled={loading}
                    aria-label="Tulis pertanyaan akademik"
                  />

                  <Button
                    type="submit"
                    className="send-button"
                    disabled={loading || !message.trim()}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <BsSendFill />
                    )}
                    Kirim
                  </Button>
                </InputGroup>
              </Form>
            </Card>
          </Col>

          <Col lg={4}>
            <FaqList faqs={faqs} onPick={handleSend} />
          </Col>
        </Row>
      </Container>
=======
      <main className="layout">
        <section className="chat-card">
          <div className="chat-header">
            <h2>Ruang Chat</h2>
            <p>NLP: preprocessing, stemming, TF‑IDF, cosine similarity</p>
          </div>
          <div className="chat-box">
            {chat.map((item, index) => (
              <ChatMessage key={index} item={item} />
            ))}
            {loading && (
              <ChatMessage
                item={{ sender: "bot", text: "Sedang memproses pertanyaan..." }}
              />
            )}
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
>>>>>>> origin/feature/database-completion
    </div>
  );
}