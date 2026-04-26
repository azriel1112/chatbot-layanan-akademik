import React from "react";
export default function ChatMessage({ item }) {
  const isBot = item.sender === 'bot';
  return (
    <div className={`message-row ${isBot ? 'bot' : 'user'}`}>
      <div className="message-bubble">
        <div className="message-sender">{isBot ? 'Bot Akademik' : 'Anda'}</div>
        <div>{item.text}</div>
        {item.confidence !== undefined && (
          <small className="confidence">Confidence NLP: {item.confidence}</small>
        )}
      </div>
    </div>
  );
}
