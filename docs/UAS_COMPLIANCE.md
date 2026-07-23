# Checklist Kepatuhan UAS Natural Language Processing

## P1 — Masalah, kebutuhan, flow dialog, dan struktur data

| Kebutuhan | Implementasi/Bukti | Status |
|---|---|---|
| Masalah nyata | FAQ dan layanan akademik kampus. | Selesai |
| Kebutuhan fungsional | Chat, FAQ retrieval, multi-turn, reset session, logging. | Selesai |
| Flow dialog | `docs/DEMO_SCENARIOS.md` dan dialog manager. | Selesai |
| Dataset intent | `backend-node/data/intent_dataset.csv`. | Selesai |
| Log percakapan | `backend/logs/conversations.jsonl`. | Selesai |

## P2 — Dataset dan preprocessing

| Kebutuhan | Implementasi/Bukti | Status |
|---|---|---|
| Minimal 200 utterance | 327 utterance. | Selesai |
| Minimal 4 intent | 13 intent. | Selesai |
| Distribusi intent | `backend/reports/model-evaluation/intent_distribution.csv` dan `.svg`. | Selesai |
| Lowercase dan cleaning | `backend/src/services/preprocessing.py`. | Selesai |
| Tokenization | `backend/src/services/preprocessing.py`. | Selesai |
| Representasi TF-IDF | `backend/src/services/intent_classifier.py`. | Selesai |
| Contoh sebelum/sesudah | `backend/reports/model-evaluation/preprocessing_examples.csv`. | Selesai |

## P3 — Implementasi NLP

| Kebutuhan | Implementasi/Bukti | Status |
|---|---|---|
| Intent classification | TF-IDF + Logistic Regression. | Selesai |
| Slot filling | `backend/src/services/slot_filling.py`. | Selesai |
| Rule-based regex/pattern | Definisi regex pada `slot_filling.py`. | Selesai |
| Multi-turn conversation | `backend/src/services/dialog_manager.py`. | Selesai |
| Tahap konfirmasi | State `awaiting_confirmation`. | Selesai |

## P4 — Evaluasi

| Kebutuhan | Implementasi/Bukti | Status |
|---|---|---|
| Accuracy | `model_metrics.json`. | Selesai |
| Precision | `model_metrics.json`. | Selesai |
| Recall | `model_metrics.json`. | Selesai |
| F1-score | `model_metrics.json`. | Selesai |
| Confusion matrix | `confusion_matrix.csv` dan `.svg`. | Selesai |
| Intent yang salah | `classification_report.md`. | Selesai |
| Penyebab kesalahan | `classification_report.md` dan `misclassified_examples.csv`. | Selesai |
| Keterbatasan | README, demo scenarios, dan classification report. | Selesai |

## P5 — Implementasi web dan log

| Kebutuhan | Implementasi/Bukti | Status |
|---|---|---|
| Web sederhana | React frontend + Flask API. | Selesai |
| Input pengguna | Halaman chat React. | Selesai |
| Respons chatbot | Endpoint `POST /api/chat`. | Selesai |
| Log CSV/JSON | JSONL pada `backend/logs/conversations.jsonl`. | Selesai |
| Analisis log | `analyze_conversation_logs.py`. | Selesai |

## P6 — Luaran proyek

| Luaran | Bahan yang tersedia | Status |
|---|---|---|
| Laporan PDF maksimal 10 halaman | Dataset, arsitektur, evaluasi, dan analisis sudah tersedia sebagai bahan. | Perlu disusun/diekspor |
| Slide minimal 12 slide | Metrik, diagram, demo, dan screenshot tersedia sebagai bahan. | Perlu disusun |
| Video 5–10 menit | Script dan tiga skenario pada `DEMO_SCENARIOS.md`. | Perlu direkam |
| Pembagian tugas | Harus ditambahkan sesuai anggota kelompok. | Perlu diisi |
| Link video dalam TXT | Dibuat setelah video diunggah. | Perlu diisi |

## Verifikasi otomatis

Jalankan dari root project:

```bash
bash scripts/verify_all.sh
```

atau PowerShell:

```powershell
.\scripts\verify_all.ps1
```

Laporan otomatis:

```text
backend/reports/final_verification.md
backend/reports/final_verification.json
```

## Status akhir teknis

Komponen aplikasi dan NLP telah selesai. Pekerjaan setelah Tahap 10 berfokus pada penyusunan luaran akademik: laporan PDF, slide presentasi, rekaman video, pembagian tugas anggota, serta file TXT berisi link video.