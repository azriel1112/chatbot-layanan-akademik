import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
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
  BsArrowClockwise,
  BsExclamationTriangleFill,
  BsInfoCircle,
  BsLightningChargeFill,
  BsSendFill,
} from "react-icons/bs";

import Header from "../components/Header";

import Footer from "../components/Footer";

import ChatMessage from "../components/ChatMessage";

import FaqList from "../components/FaqList";

import {
  checkBackendHealth,
  getFaqs,
  getStoredSessionId,
  resetChatSession,
  sendMessage,
} from "../api/chatApi";

const WELCOME_MESSAGE = {
  sender: "bot",

  text:
    "Halo! Saya Asisten Akademik. Saya bisa membantu menjawab " +
    "pertanyaan seputar KRS, UKT, KP, Magang, Sempro, Tugas Akhir, " +
    "Akreditasi, dan Wisuda.\n\n" +
    "Saya juga dapat menanyakan informasi tambahan dan melakukan " +
    "konfirmasi sebelum menampilkan jawaban tertentu.",
};

const PRIORITY_QUESTIONS = [
  "Apa saja syarat pendaftaran sidang Tugas Akhir?",
  "Berapa lama batas revisi setelah sidang Tugas Akhir?",
  "Berapa minimal SKS dan IPK untuk mengambil Kerja Praktek?",
  "Apa saja syarat mengikuti Magang Mandiri?",
];

function readableError(error) {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan " + "yang tidak diketahui.";
}

export default function Home() {
  const [faqs, setFaqs] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [faqsLoading, setFaqsLoading] = useState(true);

  const [connectionStatus, setConnectionStatus] = useState("checking");

  const [connectionError, setConnectionError] = useState("");

  const [chat, setChat] = useState([WELCOME_MESSAGE]);

  const [sessionId, setSessionId] = useState(() => getStoredSessionId());

  const chatBoxRef = useRef(null);

  const loadRuntime = useCallback(async () => {
    setFaqsLoading(true);

    setConnectionStatus("checking");

    setConnectionError("");

    try {
      const [health, faqData] = await Promise.all([
        checkBackendHealth(),
        getFaqs(),
      ]);

      setFaqs(faqData);

      setConnectionStatus(health.status === "healthy" ? "online" : "offline");

      if (health.status !== "healthy") {
        setConnectionError(
          "Backend merespons, tetapi status penyimpanan log sedang bermasalah.",
        );
      }
    } catch (error) {
      setFaqs([]);

      setConnectionStatus("offline");

      setConnectionError(readableError(error));
    } finally {
      setFaqsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuntime();
  }, [loadRuntime]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;

    if (!chatBox) {
      return;
    }

    chatBox.scrollTo({
      top: chatBox.scrollHeight,

      behavior: "smooth",
    });
  }, [chat, loading]);

  const quickPrompts = useMemo(() => {
    if (!faqs.length) {
      return [];
    }

    const priorityFaqs = PRIORITY_QUESTIONS.map((question) =>
      faqs.find((faq) => faq.question === question),
    ).filter(Boolean);

    return priorityFaqs.length > 0 ? priorityFaqs : faqs.slice(0, 4);
  }, [faqs]);

  function findMatchedFaq(text, result, sourceFaq) {
    if (sourceFaq) {
      return sourceFaq;
    }

    if (result?.matchedFaqId) {
      const faqById = faqs.find((faq) => faq.id === result.matchedFaqId);

      if (faqById) {
        return faqById;
      }
    }

    const normalizedText = text.toLowerCase();

    return (
      faqs.find((faq) => faq.question.toLowerCase() === normalizedText) ||
      faqs.find((faq) => result?.answer && faq.answer === result.answer)
    );
  }

  function getRelatedQuestions(currentFaq) {
    if (!faqs.length) {
      return [];
    }

    if (!currentFaq) {
      return quickPrompts.slice(0, 3).map((faq) => faq.question);
    }

    return faqs
      .filter(
        (faq) =>
          faq.category === currentFaq.category && faq.id !== currentFaq.id,
      )
      .slice(0, 3)
      .map((faq) => faq.question);
  }

  function getBotQuickReplies(result, matchedFaq) {
    const dialogReplies = result?.dialog?.quickReplies;

    if (Array.isArray(dialogReplies) && dialogReplies.length > 0) {
      return dialogReplies;
    }

    const turnType = result?.dialog?.turnType;

    const canShowRelated =
      !turnType || turnType === "direct_answer" || turnType === "final_answer";

    return canShowRelated ? getRelatedQuestions(matchedFaq) : [];
  }

  async function handleSend(customText, sourceFaq = null) {
    const text = String(customText || message).trim();

    if (!text || loading || connectionStatus !== "online") {
      return;
    }

    setChat((previous) => [
      ...previous,

      {
        sender: "user",

        text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const result = await sendMessage(text, sessionId);

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      const matchedFaq = findMatchedFaq(text, result, sourceFaq);

      setChat((previous) => [
        ...previous,

        {
          sender: "bot",

          text:
            result.answer ||
            "Maaf, saya belum menemukan jawaban yang sesuai. " +
              "Coba gunakan kata kunci yang lebih spesifik.",

          confidence: result.confidence,

          category: result.category || matchedFaq?.category,

          quickReplies: getBotQuickReplies(result, matchedFaq),

          dialogState: result.dialog?.state,

          turnType: result.dialog?.turnType,
        },
      ]);
    } catch (error) {
      const messageText = readableError(error);

      setConnectionStatus("offline");

      setConnectionError(messageText);

      setChat((previous) => [
        ...previous,

        {
          sender: "bot",

          text: messageText,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetChat() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await resetChatSession(sessionId);
    } catch {
      /*
       * UI tetap direset ketika
       * backend tidak dapat dijangkau.
       */
    } finally {
      setSessionId(null);

      setChat([WELCOME_MESSAGE]);

      setMessage("");

      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    void handleSend();
  }

  const online = connectionStatus === "online";

  return (
    <div className="app">
      <Header
        activePage="chat"
        connectionStatus={online ? "online" : "offline"}
      />

      <Container className="main-shell">
        {!online && (
          <Alert variant="danger" className="runtime-alert">
            <BsExclamationTriangleFill />

            <div>
              <strong>Frontend belum terhubung ke backend Flask.</strong>

              <span>{connectionError || "Backend sedang diperiksa."}</span>

              <small>
                Pada Vercel, pastikan environment variable VITE_API_URL mengarah
                ke URL backend Render dan lakukan redeploy frontend.
              </small>
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={loadRuntime}
            >
              <BsArrowClockwise />
              Coba Lagi
            </Button>
          </Alert>
        )}

        <Row className="g-4 align-items-start">
          <Col lg={8}>
            <Card as="section" className="chat-card surface-card">
              <Card.Header className="chat-header">
                <div>
                  <span className="section-kicker">Ruang bantuan</span>

                  <h2>Tanya Akademik</h2>

                  <p>
                    Saya dapat memahami konteks percakapan, meminta informasi
                    tambahan, dan mengonfirmasi kebutuhan Anda.
                  </p>
                </div>

                <div className="chat-header-actions">
                  <Badge bg="light" text="primary" className="chat-mode-badge">
                    <BsInfoCircle />
                    Multi-turn NLP
                  </Badge>

                  <Button
                    type="button"
                    variant="light"
                    size="sm"
                    className="reset-chat-button"
                    onClick={handleResetChat}
                    disabled={loading || chat.length <= 1}
                  >
                    <BsArrowClockwise />
                    Reset Chat
                  </Button>
                </div>
              </Card.Header>

              {chat.length <= 1 && quickPrompts.length > 0 && online && (
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

              <div className="chat-box" ref={chatBoxRef}>
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

                      text: "Asisten sedang memproses konteks percakapan...",
                    }}
                  />
                )}
              </div>

              <Form className="chat-input" onSubmit={handleSubmit}>
                <InputGroup>
                  <Form.Control
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      online
                        ? "Contoh: Saya ingin mengajukan surat keterangan"
                        : "Backend offline — periksa konfigurasi deployment"
                    }
                    disabled={loading || !online}
                    aria-label="Tulis pertanyaan akademik"
                  />

                  <Button
                    type="submit"
                    className="send-button"
                    disabled={loading || !message.trim() || !online}
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
            <FaqList
              faqs={faqs}
              onPick={handleSend}
              loading={faqsLoading}
              error={connectionError}
              onRetry={loadRuntime}
            />
          </Col>
        </Row>
      </Container>

      <Footer />
    </div>
  );
}
