# Evaluasi Intent Classifier

## Konfigurasi

- Algoritma: **TF-IDF + Logistic Regression**
- Teknik pembagian data: **stratified train-test split**
- Random seed: **2026**
- Rasio testing: **20%**
- Data training: **260**
- Data testing: **67**
- Jumlah intent: **13**

## Ringkasan Metrik

- Accuracy: **92.54%**
- Macro Precision: **92.56%**
- Macro Recall: **91.98%**
- Macro F1-Score: **91.41%**
- Weighted F1-Score: **92.48%**
- Prediksi benar: **62**
- Prediksi salah: **5**

## Metrik per Intent

| Intent | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
| `akreditasi` | 80.00% | 100.00% | 88.89% | 4 |
| `elearning_dan_absensi` | 83.33% | 100.00% | 90.91% | 5 |
| `kalender_dan_pengumuman` | 100.00% | 100.00% | 100.00% | 5 |
| `kebijakan_kampus` | 100.00% | 75.00% | 85.71% | 4 |
| `kerja_praktek_dan_magang` | 100.00% | 85.71% | 92.31% | 7 |
| `kurikulum_dan_mata_kuliah` | 100.00% | 100.00% | 100.00% | 7 |
| `layanan_akademik_dan_kontak` | 60.00% | 75.00% | 66.67% | 4 |
| `pembayaran_dan_biaya` | 100.00% | 100.00% | 100.00% | 4 |
| `perpustakaan_dan_jurnal` | 100.00% | 100.00% | 100.00% | 4 |
| `seminar_proposal` | 80.00% | 100.00% | 88.89% | 4 |
| `status_dan_perpindahan_mahasiswa` | 100.00% | 100.00% | 100.00% | 7 |
| `surat_dan_legalisir` | 100.00% | 60.00% | 75.00% | 5 |
| `tugas_akhir` | 100.00% | 100.00% | 100.00% | 7 |

## Pasangan Intent yang Tertukar

| No. | Intent Aktual | Diprediksi Menjadi | Jumlah |
|---:|---|---|---:|
| 1 | `surat_dan_legalisir` | `layanan_akademik_dan_kontak` | 2 |
| 2 | `kebijakan_kampus` | `elearning_dan_absensi` | 1 |
| 3 | `kerja_praktek_dan_magang` | `seminar_proposal` | 1 |
| 4 | `layanan_akademik_dan_kontak` | `akreditasi` | 1 |

## Contoh Kesalahan Prediksi

| No. | Utterance | Aktual | Prediksi | Confidence |
|---:|---|---|---|---:|
| 1 | Siapa admin yang bisa dihubungi untuk layanan BAP Meruya? | `surat_dan_legalisir` | `layanan_akademik_dan_kontak` | 15.15% |
| 2 | Apakah praktikum tetap boleh tatap muka selama kebijakan WFH? | `kebijakan_kampus` | `elearning_dan_absensi` | 14.42% |
| 3 | Apa itu kartu asistensi atau kartu bimbingan KP? | `kerja_praktek_dan_magang` | `seminar_proposal` | 12.46% |
| 4 | Siapa admin yang bisa dihubungi untuk layanan BAP Menteng? | `surat_dan_legalisir` | `layanan_akademik_dan_kontak` | 15.09% |
| 5 | Apa saja website penting untuk mahasiswa Universitas Mercu Buana? | `layanan_akademik_dan_kontak` | `akreditasi` | 13.31% |

## Analisis Awal Kesalahan

Kesalahan terbanyak terjadi saat `surat_dan_legalisir` diprediksi sebagai `layanan_akademik_dan_kontak` sebanyak **2** data. Kedua intent memiliki kata dominan yang beririsan, yaitu: `mahasiswa`, `kampus`.

Analisis overlap kata di atas bersifat indikasi otomatis. Penyebab akhir tetap perlu diperiksa dari contoh utterance yang salah pada file `misclassified_examples.csv`.

## Keterbatasan Model

1. Evaluasi menggunakan satu stratified train-test split, sehingga nilai metrik dapat berubah pada pembagian data lain.
2. Dataset berisi 327 utterance dan sebagian besar berasal dari pertanyaan FAQ yang relatif formal; variasi bahasa percakapan nyata masih terbatas.
3. Dataset belum memiliki kelas khusus untuk pertanyaan di luar domain, sehingga kemampuan mendeteksi unknown intent belum dievaluasi.
4. Nilai confidence berasal dari normalisasi skor one-vs-rest Logistic Regression dan belum melalui probability calibration.
5. Model hanya menentukan intent. Pemilihan jawaban FAQ, slot filling, dan dialog multi-turn akan diintegrasikan pada tahap berikutnya.
