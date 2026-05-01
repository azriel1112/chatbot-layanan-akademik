import React, { useState } from "react";
import { Badge, Button } from "react-bootstrap";
import {
  BsCheckCircle,
  BsClipboard,
  BsHandThumbsDown,
  BsHandThumbsUp,
  BsPersonCircle,
  BsRobot,
} from "react-icons/bs";

function getConfidenceBadge(confidence) {
  const score = Number(confidence);

  if (Number.isNaN(score)) return null;

  if (score >= 0.75) {
    return {
      label: "Kecocokan tinggi",
      variant: "success",
    };
  }

  if (score >= 0.55) {
    return {
      label: "Kecocokan cukup",
      variant: "primary",
    };
  }

  return {
    label: "Perlu diperjelas",
    variant: "warning",
  };
}

export default function ChatMessage({ item, onQuickPick }) {
  const isBot = item.sender === "bot";
  const confidenceBadge = getConfidenceBadge(item.confidence);

  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.text || "");
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`message-row ${isBot ? "bot" : "user"}`}>
      {isBot && (
        <div className="message-avatar bot-avatar">
          <BsRobot />
        </div>
      )}

      <div className={`message-bubble ${isBot ? "bot-bubble" : "user-bubble"}`}>
        <div className="message-meta">
          <span className="message-sender">
            {isBot ? "Asisten Akademik" : "Anda"}
          </span>

          {isBot && item.category && (
            <Badge bg="light" text="primary" className="category-badge">
              {item.category}
            </Badge>
          )}
        </div>

        {item.typing ? (
          <div className="typing-indicator" aria-label="Asisten sedang mengetik">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="message-text">{item.text}</div>
        )}

        {isBot && confidenceBadge && !item.typing && (
          <div className="confidence-wrap">
            <Badge bg={confidenceBadge.variant} className="confidence-badge">
              {confidenceBadge.label}
            </Badge>
          </div>
        )}

        {isBot && Array.isArray(item.quickReplies) && item.quickReplies.length > 0 && (
          <div className="quick-replies">
            {item.quickReplies.map((reply) => (
              <Button
                key={reply}
                type="button"
                variant="light"
                size="sm"
                onClick={() => onQuickPick?.(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        )}

        {isBot && !item.typing && (
          <div className="message-actions">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="message-action-button"
              onClick={handleCopy}
            >
              {copied ? <BsCheckCircle /> : <BsClipboard />}
              {copied ? "Tersalin" : "Salin"}
            </Button>

            <div className="feedback-actions">
              <Button
                type="button"
                variant={feedback === "good" ? "primary" : "light"}
                size="sm"
                onClick={() => setFeedback("good")}
              >
                <BsHandThumbsUp />
              </Button>

              <Button
                type="button"
                variant={feedback === "bad" ? "primary" : "light"}
                size="sm"
                onClick={() => setFeedback("bad")}
              >
                <BsHandThumbsDown />
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="message-avatar user-avatar">
          <BsPersonCircle />
        </div>
      )}
    </div>
  );
}