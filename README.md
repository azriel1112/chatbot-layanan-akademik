# Chatbot FAQ Layanan Akademik Kampus Berbasis Web

Project fullstack untuk Capstone Project semester 8. Aplikasi ini menggunakan React sebagai frontend, Express.js sebagai backend, dan NLP sederhana untuk mencocokkan pertanyaan mahasiswa dengan FAQ layanan akademik kampus.

## Fitur

- Chatbot FAQ akademik berbasis web
- Dataset FAQ dapat dikembangkan sendiri
- API backend untuk chat dan daftar FAQ
- Penerapan NLP:
  - normalisasi teks
  - tokenisasi
  - stopword removal
  - stemming Bahasa Indonesia menggunakan `natural.PorterStemmerId`
  - TF-IDF
  - cosine similarity
- Tampilan responsive untuk presentasi/demo

## Struktur Folder

```text
chatbot-faq-akademik/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── data/
│       │   └── faqs.js
│       ├── routes/
│       │   └── chatRoutes.js
│       └── services/
│           └── nlpService.js
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── api/
        │   └── chatApi.js
        ├── components/
        │   ├── Header.jsx
        │   ├── ChatMessage.jsx
        │   └── FaqList.jsx
        ├── pages/
        │   └── Home.jsx
        └── styles/
            └── app.css
```

## Cara Menjalankan

### 1. Jalankan Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend berjalan di:

```text
http://localhost:5000
```

### 2. Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

## Contoh Pertanyaan

- Bagaimana cara mengisi KRS?
- Kapan jadwal pengisian KRS?
- Bagaimana cara membayar UKT?
- Bagaimana cara melihat nilai semester?
- Bagaimana prosedur pengajuan cuti akademik?
- Apa syarat mengambil skripsi?
- Bagaimana cara membuat surat aktif kuliah?
- Apa saja syarat pendaftaran wisuda?

## Alur Kerja NLP

1. Pertanyaan user dinormalisasi menjadi huruf kecil dan karakter khusus dihapus.
2. Kalimat dipecah menjadi token/kata.
3. Stopword seperti “yang”, “di”, “ke”, “dan” dihapus.
4. Kata diproses menggunakan stemming Bahasa Indonesia.
5. Sistem membentuk vektor TF-IDF dari pertanyaan user dan dokumen FAQ.
6. Sistem menghitung cosine similarity.
7. FAQ dengan skor tertinggi dikirim sebagai jawaban chatbot.

## Catatan Pengembangan

Untuk kampus asli, ubah dataset pada file:

```text
backend/src/data/faqs.js
```

Tambahkan FAQ sesuai SOP akademik kampus, misalnya layanan BAAK, prodi, pembayaran, beasiswa, surat, yudisium, dan wisuda.
"# chatbot-layanan-akademik" 
