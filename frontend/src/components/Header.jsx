import React from "react";
import { Badge, Container } from "react-bootstrap";
import {
  BsMortarboardFill,
  BsStars,
  BsWifi,
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

export default function Header() {
  return (
    <header className="hero-header">
      <Container className="hero-content">
        <div className="hero-brand">
          <div className="hero-icon">
            <BsMortarboardFill />
          </div>

          <div className="hero-copy">
            <div className="hero-badges">
              <Badge bg="light" text="primary" className="hero-status">
                <BsWifi /> Online
              </Badge>
              <Badge bg="light" text="dark" className="hero-status">
                <BsStars /> FAQ Akademik
              </Badge>
            </div>

            <h1>Asisten Akademik UMB</h1>
            <p>
              Tanya informasi akademik kampus dengan cepat, jelas, dan mudah
              dipahami.
            </p>

            <div className="topic-chips">
              {TOPICS.map((topic) => (
                <span key={topic} className="topic-chip">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}