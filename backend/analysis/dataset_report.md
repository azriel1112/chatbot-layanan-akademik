# Hasil Analisis Dataset Intent

## Ringkasan

- Total utterance: **300**
- Total intent: **13**
- Kosakata unik setelah preprocessing: **401**
- Rata-rata kata sebelum preprocessing: **7.73**
- Rata-rata token setelah preprocessing: **5.9**
- Intent terbesar: **kurikulum_dan_mata_kuliah (35)**
- Intent terkecil: **pembayaran_dan_biaya (9)**
- Rasio intent terbesar terhadap terkecil: **3.89 : 1**
- Data kosong setelah preprocessing: **0**

## Distribusi Data

| No. | Intent | Jumlah | Persentase |
|---:|---|---:|---:|
| 1 | `kurikulum_dan_mata_kuliah` | 35 | 11.67% |
| 2 | `tugas_akhir` | 35 | 11.67% |
| 3 | `kerja_praktek_dan_magang` | 34 | 11.33% |
| 4 | `status_dan_perpindahan_mahasiswa` | 33 | 11% |
| 5 | `surat_dan_legalisir` | 24 | 8% |
| 6 | `elearning_dan_absensi` | 23 | 7.67% |
| 7 | `kalender_dan_pengumuman` | 23 | 7.67% |
| 8 | `akreditasi` | 20 | 6.67% |
| 9 | `perpustakaan_dan_jurnal` | 20 | 6.67% |
| 10 | `kebijakan_kampus` | 18 | 6% |
| 11 | `layanan_akademik_dan_kontak` | 13 | 4.33% |
| 12 | `seminar_proposal` | 13 | 4.33% |
| 13 | `pembayaran_dan_biaya` | 9 | 3% |

## Intent yang Masih Perlu Ditambah

Batas rekomendasi yang digunakan pada analisis ini adalah 15 utterance per intent.

- `layanan_akademik_dan_kontak`: 13 utterance
- `seminar_proposal`: 13 utterance
- `pembayaran_dan_biaya`: 9 utterance

## Contoh Sebelum dan Sesudah Preprocessing

| No. | Intent | Sebelum | Sesudah |
|---:|---|---|---|
| 1 | `akreditasi` | Apa akreditasi Universitas Mercu Buana saat ini? | akreditasi universitas mercu buana saat |
| 2 | `kerja_praktek_dan_magang` | Apa itu Kerja Praktek atau KP? | kerja praktek |
| 3 | `seminar_proposal` | Apa itu Seminar Proposal? | seminar proposal |
| 4 | `tugas_akhir` | Apa itu Tugas Akhir? | tugas akhir |
| 5 | `kurikulum_dan_mata_kuliah` | Apa itu kurikulum 2025? | kurikulum 2025 |
| 6 | `surat_dan_legalisir` | Apa saja jenis surat keterangan yang bisa diajukan mahasiswa? | saja jenis surat terang bisa aju mahasiswa |
| 7 | `layanan_akademik_dan_kontak` | Apa saja layanan akademik dan pelaporan yang tersedia? | saja layan akademik lapor tersedia |
| 8 | `status_dan_perpindahan_mahasiswa` | Apa itu Form Permintaan Buka Blok KRS Teknik Informatika? | form minta buka blok krs teknik informatika |
| 9 | `pembayaran_dan_biaya` | Bagaimana cara membayar biaya kuliah Universitas Mercu Buana? | bayar biaya kuliah universitas mercu buana |
| 10 | `elearning_dan_absensi` | Apa itu FAST Learning Universitas Mercu Buana? | fast learning universitas mercu buana |
| 11 | `kebijakan_kampus` | Apa itu surat edaran rektor? | surat edar rektor |
| 12 | `kalender_dan_pengumuman` | Kapan perkuliahan semester genap 2025/2026 dimulai? | kuliah semester genap 2025 2026 mulai |
| 13 | `perpustakaan_dan_jurnal` | Apa saja layanan e-resource Perpustakaan UMB? | saja layan resource pustaka umb |

## Tahapan Preprocessing

1. Mengubah teks menjadi lowercase.
2. Membersihkan tanda baca dan karakter selain huruf, angka, serta spasi.
3. Melakukan tokenisasi berdasarkan spasi.
4. Mempertahankan token angka dan token huruf dengan panjang lebih dari dua karakter.
5. Menghapus stopword Bahasa Indonesia yang telah ditentukan.
6. Melakukan stemming menggunakan Sastrawi.
7. Menggabungkan token hasil preprocessing menjadi teks bersih.

## Catatan

Analisis ini belum merupakan hasil evaluasi model. Accuracy, precision, recall, F1-score, dan confusion matrix baru dapat dihitung setelah classifier dilatih dan diuji.
