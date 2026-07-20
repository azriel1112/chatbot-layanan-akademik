import { INTENTS } from "./intentConfig.js";

export const SUPPLEMENTAL_SOURCE_TYPE = "manual_augmentation";
export const SUPPLEMENTAL_SOURCE_CATEGORY = "Augmentasi Manual";

export const supplementalIntentUtterances = Object.freeze([
  Object.freeze({
    id: "aug-payment-001",
    text: "Saya ingin mengecek tagihan biaya kuliah.",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-002",
    text: "Bagaimana mengetahui jumlah tagihan semester ini?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-003",
    text: "Pembayaran uang kuliah saya belum masuk.",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-004",
    text: "Virtual account pembayaran kampus bisa dilihat di mana?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-005",
    text: "Apakah biaya kuliah dapat dicicil?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-006",
    text: "Kapan batas akhir pembayaran kuliah?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-007",
    text: "Bagaimana cara melakukan konfirmasi pembayaran kuliah?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-008",
    text: "Mengapa pembayaran kuliah saya belum terverifikasi?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-009",
    text: "Saya salah memasukkan nominal pembayaran kuliah.",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-010",
    text: "Apakah pembayaran dapat dilakukan dari bank selain BNI?",
    intent: INTENTS.PAYMENT,
  }),
  Object.freeze({
    id: "aug-payment-011",
    text: "Di mana saya dapat melihat riwayat pembayaran kuliah?",
    intent: INTENTS.PAYMENT,
  }),

  Object.freeze({
    id: "aug-sempro-001",
    text: "Saya ingin mendaftar seminar proposal.",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-002",
    text: "Dokumen apa yang diperlukan untuk pendaftaran sempro?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-003",
    text: "Bagaimana alur pengajuan seminar proposal?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-004",
    text: "Kapan jadwal sidang sempro diumumkan?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-005",
    text: "Siapa yang menentukan dosen penguji sempro?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-006",
    text: "Apakah mahasiswa boleh mengulang seminar proposal?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),
  Object.freeze({
    id: "aug-sempro-007",
    text: "Bagaimana cara mengumpulkan revisi setelah sidang sempro?",
    intent: INTENTS.SEMINAR_PROPOSAL,
  }),

  Object.freeze({
    id: "aug-service-001",
    text: "Saya ingin menghubungi bagian akademik kampus.",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-002",
    text: "Ke mana saya harus bertanya tentang administrasi akademik?",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-003",
    text: "Bagaimana cara membuat pengaduan layanan akademik?",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-004",
    text: "Berapa nomor telepon layanan akademik UMB?",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-005",
    text: "Apakah bagian akademik melayani mahasiswa secara online?",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-006",
    text: "Saya membutuhkan bantuan terkait portal akademik.",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),
  Object.freeze({
    id: "aug-service-007",
    text: "Ke mana melaporkan kendala pelayanan akademik?",
    intent: INTENTS.ACADEMIC_SERVICES,
  }),

  Object.freeze({
    id: "aug-policy-001",
    text: "Di mana mahasiswa dapat membaca kebijakan kampus terbaru?",
    intent: INTENTS.CAMPUS_POLICY,
  }),
  Object.freeze({
    id: "aug-policy-002",
    text: "Apakah ada aturan khusus perkuliahan selama kebijakan kerja dari rumah?",
    intent: INTENTS.CAMPUS_POLICY,
  }),
]);
