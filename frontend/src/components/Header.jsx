import React from "react";

import { Badge, Container } from "react-bootstrap";

import {
  BsBarChartFill,
  BsChatDotsFill,
  BsMortarboardFill,
  BsStars,
  BsWifi,
  BsWifiOff,
} from "react-icons/bs";

const TOPICS = [
  "KRS",
  "UKT",
  "KP",
  "Magang",
  "Sempro",
  "Tugas Akhir",
  "Wisuda",
];

export default function Header({
  activePage = "chat",
  connectionStatus = "online",
}) {
  const online = connectionStatus === "online";

  return (
    <header className="hero-header">
      <Container className="hero-content">
        <nav className="app-navigation" aria-label="Navigasi utama">
          <a href="/" className={activePage === "chat" ? "active" : ""}>
            <BsChatDotsFill />
            Chatbot
          </a>

          <a
            href="/evaluation"
            className={activePage === "evaluation" ? "active" : ""}
          >
            <BsBarChartFill />
            Evaluasi Sistem
          </a>
        </nav>

        <div className="hero-brand">
          <div className="hero-icon">
            <BsMortarboardFill />
          </div>

          <div className="hero-copy">
            <div className="hero-badges">
              <Badge
                bg={online ? "light" : "danger"}
                text={online ? "primary" : undefined}
                className="hero-status"
              >
                {online ? <BsWifi /> : <BsWifiOff />}

                {online ? "Backend Online" : "Backend Offline"}
              </Badge>

              <Badge bg="light" text="dark" className="hero-status">
                <BsStars />

                {activePage === "evaluation"
                  ? "Dashboard Evaluasi NLP"
                  : "FAQ Akademik"}
              </Badge>
            </div>

            <h1>
              {activePage === "evaluation"
                ? "Evaluasi Chatbot Akademik"
                : "Asisten Akademik UMB"}
            </h1>

            <p>
              {activePage === "evaluation"
                ? "Menyajikan metrik model, " +
                  "confusion matrix, analisis " +
                  "kesalahan, dan ringkasan " +
                  "log percakapan."
                : "Tanya informasi akademik " +
                  "kampus dengan cepat, jelas, " +
                  "dan mudah dipahami."}
            </p>

            {activePage === "chat" && (
              <div className="topic-chips">
                {TOPICS.map((topic) => (
                  <span key={topic} className="topic-chip">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
