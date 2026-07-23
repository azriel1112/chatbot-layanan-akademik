# Chatbot Layanan Akademik Berbasis NLP

Aplikasi chatbot akademik berbasis web untuk membantu mahasiswa menemukan informasi layanan kampus. Frontend menggunakan React/Vite, sedangkan backend aktif menggunakan Flask. Sistem menerapkan klasifikasi intent, slot filling berbasis regex, pencarian FAQ berbasis TF-IDF, dialog multi-turn, konfirmasi pengguna, dan penyimpanan log percakapan.

## Fitur utama

- Dataset intent lebih dari 200 utterance dan 13 intent.
- Text preprocessing: lowercase, cleaning, tokenization, stopword removal, dan stemming Bahasa Indonesia.
- Intent classification menggunakan TF-IDF dan Logistic Regression.
- Evaluasi accuracy, precision, recall, F1-score, confusion matrix, serta contoh salah klasifikasi.
- Slot filling berbasis regex dan pattern.
- FAQ retrieval yang mempertimbangkan intent dan slot.
- Dialog manager multi-turn dengan session state.
- Tahap konfirmasi sebelum jawaban tertentu ditampilkan.
- Penyimpanan log percakapan dalam JSONL.
- Analisis log percakapan menjadi JSON dan CSV.
- Frontend responsif untuk demo.

## Arsitektur

```text
React/Vite Frontend
        ↓ HTTP JSON
Flask REST API
        ↓
Dialog Manager + Session State
        ↓
Intent Classifier + Slot Filling
        ↓
Intent/Slot-Aware FAQ Retrieval
        ↓
Response + Conversation Log JSONL
```

## Struktur proyek

```text
chatbot-layanan-akademik/
├── backend/                       # Backend Flask aktif
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── data/
│   ├── models/
│   ├── logs/
│   ├── reports/
│   ├── scripts/
│   ├── src/
│   └── tests/
├── backend-node/                  # Baseline Node.js Tahap 1–8
├── docs/
│   ├── API.md
│   ├── DEMO_SCENARIOS.md
│   └── UAS_COMPLIANCE.md
├── frontend/
└── scripts/
    ├── verify_all.sh
    └── verify_all.ps1
```

## Persiapan backend Flask

### Git Bash

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
```

### PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Jalankan backend:

```bash
python app.py
```

Backend tersedia di `http://localhost:5000`.

## Persiapan frontend

Buka terminal baru:

```bash
cd frontend
npm ci
npm run dev
```

Frontend tersedia di `http://localhost:5173`.

## Endpoint penting

```text
GET    /api/health
GET    /api/faqs
POST   /api/chat
DELETE /api/chat/session/:sessionId
```

Dokumentasi request dan response tersedia pada `docs/API.md`.

## Verifikasi final

### Git Bash

```bash
bash scripts/verify_all.sh
```

### PowerShell

```powershell
.\scripts\verify_all.ps1
```

Pemeriksaan tersebut menjalankan:

1. Python syntax compilation.
2. Seluruh pytest.
3. Validasi dataset, model, confusion matrix, API, multi-turn, konfirmasi, dan logging.
4. Frontend production build.

Laporan final dihasilkan pada:

```text
backend/reports/final_verification.json
backend/reports/final_verification.md
```

## Analisis log percakapan

Setelah chatbot digunakan:

```bash
cd backend
python scripts/analyze_conversation_logs.py
```

Output:

```text
backend/reports/conversation_log_summary.json
backend/reports/conversation_log_summary.csv
```

Log mentah berada di `backend/logs/conversations.jsonl` dan tidak disimpan ke Git.

## Artefak evaluasi model

Salin artefak evaluasi dari backend Node.js lama:

```bash
cd backend
python scripts/sync_evaluation_artifacts.py
```

Hasilnya berada di:

```text
backend/reports/model-evaluation/
```

Artefak tersebut mencakup model metrics, classification report, confusion matrix, distribusi intent, contoh preprocessing, dan contoh salah klasifikasi.

## Skenario demo

Tiga skenario wajib sudah didokumentasikan dalam `docs/DEMO_SCENARIOS.md`:

1. Jawaban langsung untuk pembayaran kuliah.
2. Multi-turn pengajuan surat mahasiswa aktif dengan slot dan konfirmasi.
3. Penanganan pertanyaan di luar domain.

## Catatan keamanan dan privasi

- Jangan commit file `.env`.
- Jangan commit `.venv` atau `node_modules`.
- Jangan commit `backend/logs/conversations.jsonl` karena dapat memuat isi percakapan pengguna.
- Log sebaiknya digunakan untuk evaluasi sistem dengan memperhatikan privasi pengguna.