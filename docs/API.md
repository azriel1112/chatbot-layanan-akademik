# Dokumentasi API Chatbot Akademik

Base URL lokal:

```text
http://localhost:5000/api
```

## 1. Health check

```http
GET /api/health
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "framework": "Flask",
    "algorithm": "TF-IDF + Logistic Regression",
    "faqCount": 300,
    "intentCount": 13
  }
}
```

## 2. Mengambil seluruh FAQ

```http
GET /api/faqs
```

Response berisi array FAQ dengan:

```text
id
category
question
answer
keywords
```

## 3. Mengirim pesan chat

```http
POST /api/chat
Content-Type: application/json
```

### Pesan pertama

```json
{
  "message": "bagaimana cara bayar uang kuliah"
}
```

### Pesan lanjutan

```json
{
  "message": "Kampus Menteng",
  "sessionId": "SESSION_ID_DARI_RESPONSE_SEBELUMNYA"
}
```

Contoh response jawaban langsung:

```json
{
  "success": true,
  "data": {
    "sessionId": "8d4bdb32-8be7-4abc-9c63-42be78c2cb03",
    "answer": "...",
    "confidence": 0.517,
    "matchedQuestion": "Bagaimana cara membayar biaya kuliah Universitas Mercu Buana?",
    "category": "Pembayaran dan Biaya Kuliah",
    "intent": "pembayaran_dan_biaya",
    "intentConfidence": 0.212391,
    "slots": {
      "service": "pembayaran"
    },
    "retrievalMode": "intent_filtered",
    "dialog": {
      "state": "idle",
      "turnType": "direct_answer",
      "requiresInput": false,
      "quickReplies": []
    }
  }
}
```

### Dialog meminta slot

```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "answer": "Jenis surat apa yang ingin Anda ajukan?",
    "slots": {
      "service": "surat_keterangan"
    },
    "dialog": {
      "state": "awaiting_slot",
      "turnType": "slot_prompt",
      "awaitingSlot": "documentType",
      "requiresInput": true,
      "quickReplies": [
        "Surat mahasiswa aktif",
        "Surat keterangan lulus"
      ]
    }
  }
}
```

### Dialog meminta konfirmasi

```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "answer": "... Apakah Anda ingin menampilkan jawabannya?",
    "dialog": {
      "state": "awaiting_confirmation",
      "turnType": "confirmation_prompt",
      "requiresInput": true,
      "quickReplies": [
        "Ya, tampilkan",
        "Tidak, ubah pertanyaan"
      ]
    }
  }
}
```

### Validasi pesan kosong

Request:

```json
{
  "message": ""
}
```

Response HTTP 400:

```json
{
  "success": false,
  "message": "Pesan tidak boleh kosong."
}
```

## 4. Reset session

```http
DELETE /api/chat/session/:sessionId
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "removed": true
  }
}
```

## Nilai `retrievalMode`

| Nilai | Arti |
|---|---|
| `intent_filtered` | FAQ dicari pada intent hasil klasifikasi. |
| `global_fallback` | Intent kurang meyakinkan sehingga seluruh FAQ digunakan. |
| `global_override` | Hasil global jauh lebih kuat daripada hasil intent. |
| `no_match` | Tidak ditemukan FAQ yang cukup relevan. |

## Nilai `dialog.turnType`

| Nilai | Arti |
|---|---|
| `direct_answer` | Jawaban dapat diberikan langsung. |
| `slot_prompt` | Sistem meminta slot yang belum tersedia. |
| `confirmation_prompt` | Sistem meminta konfirmasi pengguna. |
| `confirmation_retry` | Jawaban konfirmasi belum dikenali. |
| `final_answer` | Jawaban akhir ditampilkan setelah konfirmasi. |
| `cancelled` | Proses dibatalkan. |
| `no_match` | Tidak ditemukan jawaban. |