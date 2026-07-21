export const INTENTS = Object.freeze({
  ACCREDITATION: "akreditasi",
  CURRICULUM: "kurikulum_dan_mata_kuliah",
  ELEARNING: "elearning_dan_absensi",
  ACADEMIC_CALENDAR: "kalender_dan_pengumuman",
  INTERNSHIP: "kerja_praktek_dan_magang",
  SEMINAR_PROPOSAL: "seminar_proposal",
  FINAL_PROJECT: "tugas_akhir",
  DOCUMENT_SERVICES: "surat_dan_legalisir",
  STUDENT_STATUS: "status_dan_perpindahan_mahasiswa",
  ACADEMIC_SERVICES: "layanan_akademik_dan_kontak",
  LIBRARY: "perpustakaan_dan_jurnal",
  PAYMENT: "pembayaran_dan_biaya",
  CAMPUS_POLICY: "kebijakan_kampus",
});

export const FAQ_CATEGORY_TO_INTENT = Object.freeze({
  Akreditasi: INTENTS.ACCREDITATION,

  Kurikulum: INTENTS.CURRICULUM,
  "Kurikulum Informatika": INTENTS.CURRICULUM,
  "Kurikulum Sistem Informasi": INTENTS.CURRICULUM,
  "Ekuivalensi Mata Kuliah": INTENTS.CURRICULUM,

  "E-Learning dan Absensi": INTENTS.ELEARNING,

  "Kalender Akademik": INTENTS.ACADEMIC_CALENDAR,
  "Pengumuman Kampus": INTENTS.ACADEMIC_CALENDAR,

  "Kerja Praktek": INTENTS.INTERNSHIP,
  "Magang Mandiri": INTENTS.INTERNSHIP,

  "Seminar Proposal": INTENTS.SEMINAR_PROPOSAL,

  "Tugas Akhir": INTENTS.FINAL_PROJECT,

  "Surat Keterangan": INTENTS.DOCUMENT_SERVICES,
  Legalisir: INTENTS.DOCUMENT_SERVICES,
  Turnitin: INTENTS.DOCUMENT_SERVICES,

  "Pengajuan Cuti": INTENTS.STUDENT_STATUS,
  "Aktif Kembali dari Cuti": INTENTS.STUDENT_STATUS,
  "Perubahan Status Mahasiswa": INTENTS.STUDENT_STATUS,
  "Pindah Program Studi": INTENTS.STUDENT_STATUS,
  "Pindah Program Perkuliahan": INTENTS.STUDENT_STATUS,
  "Pindah Lokasi Kampus": INTENTS.STUDENT_STATUS,
  "Buka Blok KRS": INTENTS.STUDENT_STATUS,

  BAK: INTENTS.ACADEMIC_SERVICES,
  "Pelaporan Akademik": INTENTS.ACADEMIC_SERVICES,
  "Layanan Akademik dan Pelaporan": INTENTS.ACADEMIC_SERVICES,
  "Kontak Penting": INTENTS.ACADEMIC_SERVICES,

  "Perpustakaan dan Jurnal": INTENTS.LIBRARY,

  "Pembayaran dan Biaya Kuliah": INTENTS.PAYMENT,

  "Surat Edaran dan Kebijakan Kampus": INTENTS.CAMPUS_POLICY,
});

export function getIntentForFaqCategory(category) {
  return FAQ_CATEGORY_TO_INTENT[category] ?? null;
}
