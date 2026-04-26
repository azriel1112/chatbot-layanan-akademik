import React from "react";
export default function FaqList({ faqs, onPick }) {
  return (
    <aside className="faq-panel">
      <h2>Contoh Pertanyaan</h2>
      <p>Klik salah satu pertanyaan untuk mencoba chatbot.</p>
      <div className="faq-list">
        {faqs.map((faq) => (
          <button key={faq.id} className="faq-item" onClick={() => onPick(faq.question)}>
            <span>{faq.category}</span>
            {faq.question}
          </button>
        ))}
      </div>
    </aside>
  );
}
