import React, { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";

import {
  BsArrowClockwise,
  BsArrowRight,
  BsBriefcase,
  BsExclamationTriangle,
  BsFileEarmarkText,
  BsMortarboard,
  BsPatchCheck,
  BsSearch,
} from "react-icons/bs";

function getCategoryIcon(category) {
  const icons = {
    Akreditasi: <BsPatchCheck />,

    "Kerja Praktek": <BsBriefcase />,

    "Magang Mandiri": <BsBriefcase />,

    "Seminar Proposal": <BsFileEarmarkText />,

    "Tugas Akhir": <BsMortarboard />,
  };

  return icons[category] || <BsFileEarmarkText />;
}

export default function FaqList({
  faqs,
  onPick,
  loading = false,
  error = "",
  onRetry,
}) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(faqs.map((faq) => faq.category))];

    return ["Semua", ...uniqueCategories];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchCategory =
        selectedCategory === "Semua" || faq.category === selectedCategory;

      const matchSearch =
        !keyword ||
        faq.question.toLowerCase().includes(keyword) ||
        faq.category.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [faqs, search, selectedCategory]);

  return (
    <Card as="aside" className="faq-panel surface-card">
      <Card.Body>
        <div className="section-heading">
          <span className="section-kicker">Referensi cepat</span>

          <h2>Contoh Pertanyaan</h2>

          <p>Pilih topik atau cari pertanyaan yang paling sesuai.</p>
        </div>

        <InputGroup className="faq-search">
          <InputGroup.Text>
            <BsSearch />
          </InputGroup.Text>

          <Form.Control
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pertanyaan..."
            aria-label="Cari contoh pertanyaan"
            disabled={loading || Boolean(error)}
          />
        </InputGroup>

        <div className="category-filter">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={selectedCategory === category ? "primary" : "light"}
              onClick={() => setSelectedCategory(category)}
              disabled={loading || Boolean(error)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="faq-list">
          {loading && (
            <div className="faq-runtime-state">
              <Spinner animation="border" size="sm" />
              Mengambil FAQ dari backend...
            </div>
          )}

          {!loading && error && (
            <div className="faq-runtime-state error">
              <BsExclamationTriangle />

              <strong>FAQ gagal dimuat.</strong>

              <span>{error}</span>

              <Button type="button" size="sm" onClick={onRetry}>
                <BsArrowClockwise />
                Coba Lagi
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredFaqs.length > 0 &&
            filteredFaqs.map((faq) => (
              <button
                key={faq.id}
                type="button"
                className="faq-item"
                onClick={() => onPick(faq.question, faq)}
              >
                <span className="faq-icon">
                  {getCategoryIcon(faq.category)}
                </span>

                <span className="faq-item-content">
                  <Badge bg="light" text="primary" className="faq-category">
                    {faq.category}
                  </Badge>

                  <span className="faq-question">{faq.question}</span>
                </span>

                <BsArrowRight className="faq-arrow" />
              </button>
            ))}

          {!loading && !error && filteredFaqs.length === 0 && (
            <div className="faq-empty">
              {faqs.length === 0
                ? "Backend belum mengirimkan " + "data FAQ."
                : "Tidak ada pertanyaan yang " + "cocok dengan pencarianmu."}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
