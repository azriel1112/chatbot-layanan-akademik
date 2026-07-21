export const SLOT_TYPES = Object.freeze({
  SEMESTER: "semester",
  SEMESTER_PERIOD: "semesterPeriod",
  ACADEMIC_YEAR: "academicYear",
  CURRICULUM_YEAR: "curriculumYear",
  STUDY_PROGRAM: "studyProgram",
  CAMPUS: "campus",
  CLASS_PROGRAM: "classProgram",
  SERVICE: "service",
  DOCUMENT_TYPE: "documentType",
  REQUEST_TYPE: "requestType",
});

export const NUMBER_WORDS = Object.freeze({
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  dua_belas: 12,
  tiga_belas: 13,
  empat_belas: 14,
});

export const ROMAN_NUMERALS = Object.freeze({
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
  xiii: 13,
  xiv: 14,
});

export const CATEGORICAL_SLOT_DEFINITIONS = Object.freeze([
  {
    type: SLOT_TYPES.STUDY_PROGRAM,
    values: [
      {
        value: "teknik_informatika",
        label: "Teknik Informatika",
        patterns: [
          {
            regex: /\bteknik\s+informatika\b/gi,
            priority: 120,
          },
          {
            regex: /\bprodi\s+informatika\b/gi,
            priority: 115,
          },
          {
            regex: /\binformatika\b/gi,
            priority: 70,
          },
        ],
      },
      {
        value: "sistem_informasi",
        label: "Sistem Informasi",
        patterns: [
          {
            regex: /\bsistem\s+informasi\b/gi,
            priority: 120,
          },
          {
            regex: /\bprodi\s+si\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "sains_data",
        label: "Sains Data",
        patterns: [
          {
            regex: /\bmagister\s+sains\s+data\b/gi,
            priority: 130,
          },
          {
            regex: /\bsains\s+data\b/gi,
            priority: 120,
          },
          {
            regex: /\bprodi\s+sains\s+data\b/gi,
            priority: 125,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.CAMPUS,
    values: [
      {
        value: "meruya",
        label: "Kampus Meruya",
        patterns: [
          {
            regex: /\bkampus\s+meruya\b/gi,
            priority: 120,
          },
          {
            regex: /\bmeruya\b/gi,
            priority: 80,
          },
        ],
      },
      {
        value: "menteng",
        label: "Kampus Menteng",
        patterns: [
          {
            regex: /\bkampus\s+menteng\b/gi,
            priority: 120,
          },
          {
            regex: /\bmenteng\b/gi,
            priority: 80,
          },
        ],
      },
      {
        value: "warung_buncit",
        label: "Kampus Warung Buncit",
        patterns: [
          {
            regex: /\bkampus\s+warung\s+buncit\b/gi,
            priority: 130,
          },
          {
            regex: /\bwarung\s+buncit\b/gi,
            priority: 120,
          },
          {
            regex: /\bbuncit\b/gi,
            priority: 70,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.CLASS_PROGRAM,
    values: [
      {
        value: "reguler_1",
        label: "Reguler 1",
        patterns: [
          {
            regex: /\b(?:kelas\s+)?reg(?:u|o)ler\s*1\b/gi,
            priority: 120,
          },
          {
            regex: /\bprogram\s+reg(?:u|o)ler\s*1\b/gi,
            priority: 125,
          },
        ],
      },
      {
        value: "reguler_2",
        label: "Reguler 2/Karyawan",
        patterns: [
          {
            regex: /\b(?:kelas\s+)?reg(?:u|o)ler\s*2\b/gi,
            priority: 120,
          },
          {
            regex: /\bprogram\s+reg(?:u|o)ler\s*2\b/gi,
            priority: 125,
          },
          {
            regex: /\bkelas\s+karyawan\b/gi,
            priority: 120,
          },
          {
            regex: /\bprogram\s+karyawan\b/gi,
            priority: 120,
          },
          {
            regex: /\bkaryawan\b/gi,
            priority: 70,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.SEMESTER_PERIOD,
    values: [
      {
        value: "ganjil",
        label: "Semester Ganjil",
        patterns: [
          {
            regex: /\bsemester\s+ganjil\b/gi,
            priority: 120,
          },
          {
            regex: /\bganjil\b/gi,
            priority: 80,
          },
        ],
      },
      {
        value: "genap",
        label: "Semester Genap",
        patterns: [
          {
            regex: /\bsemester\s+genap\b/gi,
            priority: 120,
          },
          {
            regex: /\bgenap\b/gi,
            priority: 80,
          },
        ],
      },
      {
        value: "antara",
        label: "Semester Antara",
        patterns: [
          {
            regex: /\bsemester\s+antara\b/gi,
            priority: 120,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.SERVICE,
    values: [
      {
        value: "aktif_kembali",
        label: "Aktif Kembali dari Cuti",
        patterns: [
          {
            regex: /\baktif\s+kembali(?:\s+dari)?\s+cuti\b/gi,
            priority: 170,
          },
          {
            regex: /\baktif\s+kuliah\s+kembali\b/gi,
            priority: 160,
          },
        ],
      },
      {
        value: "pindah_program_perkuliahan",
        label: "Pindah Program Perkuliahan",
        patterns: [
          {
            regex: /\bpindah\s+program\s+perkuliahan\b/gi,
            priority: 170,
          },
          {
            regex: /\bpindah\s+kelas\b/gi,
            priority: 130,
          },
          {
            regex:
              /\bpindah\s+dari\s+reg(?:u|o)ler\s*1\s+ke\s+reg(?:u|o)ler\s*2\b/gi,
            priority: 175,
          },
        ],
      },
      {
        value: "pindah_program_studi",
        label: "Pindah Program Studi",
        patterns: [
          {
            regex: /\bpindah\s+program\s+studi\b/gi,
            priority: 170,
          },
          {
            regex: /\bpindah\s+prodi\b/gi,
            priority: 160,
          },
          {
            regex: /\bmutasi\s+prodi\b/gi,
            priority: 150,
          },
        ],
      },
      {
        value: "pindah_kampus",
        label: "Pindah Lokasi Kampus",
        patterns: [
          {
            regex: /\bpindah\s+lokasi\s+kampus\b/gi,
            priority: 170,
          },
          {
            regex: /\bpindah\s+kampus\b/gi,
            priority: 160,
          },
        ],
      },
      {
        value: "buka_blok_krs",
        label: "Buka Blok KRS",
        patterns: [
          {
            regex: /\bbuka\s+blok\s+krs\b/gi,
            priority: 170,
          },
          {
            regex: /\bblokir?\s+krs\b/gi,
            priority: 150,
          },
          {
            regex: /\bkrs\s+terblokir\b/gi,
            priority: 150,
          },
        ],
      },
      {
        value: "magang_mandiri",
        label: "Magang Mandiri",
        patterns: [
          {
            regex: /\bmagang\s+mandiri\b/gi,
            priority: 165,
          },
        ],
      },
      {
        value: "kerja_praktek",
        label: "Kerja Praktek",
        patterns: [
          {
            regex: /\bkerja\s+prakt(?:e|i)k\b/gi,
            priority: 160,
          },
          {
            regex: /\bkp\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "seminar_proposal",
        label: "Seminar Proposal",
        patterns: [
          {
            regex: /\bseminar\s+proposal\b/gi,
            priority: 165,
          },
          {
            regex: /\bsempro\b/gi,
            priority: 150,
          },
          {
            regex: /\bmpti\b/gi,
            priority: 140,
          },
        ],
      },
      {
        value: "tugas_akhir",
        label: "Tugas Akhir",
        patterns: [
          {
            regex: /\btugas\s+akhir\b/gi,
            priority: 165,
          },
          {
            regex: /\bta\b(?!\s*20\d{2}\s*[\/-])/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "cuti",
        label: "Pengajuan Cuti",
        patterns: [
          {
            regex: /\bpengajuan\s+cuti\b/gi,
            priority: 150,
          },
          {
            regex: /\bcuti\s+kuliah\b/gi,
            priority: 145,
          },
          {
            regex: /\bcuti\b/gi,
            priority: 70,
          },
        ],
      },
      {
        value: "legalisir",
        label: "Legalisir",
        patterns: [
          {
            regex: /\blegalisir\b/gi,
            priority: 130,
          },
          {
            regex: /\blegalisasi\s+dokumen\b/gi,
            priority: 125,
          },
        ],
      },
      {
        value: "turnitin",
        label: "Cek Turnitin",
        patterns: [
          {
            regex: /\bturnitin\b/gi,
            priority: 130,
          },
          {
            regex: /\bcek\s+plagiasi\b/gi,
            priority: 120,
          },
          {
            regex: /\bcek\s+similarity\b/gi,
            priority: 120,
          },
        ],
      },
      {
        value: "surat_keterangan",
        label: "Surat Keterangan",
        patterns: [
          {
            regex: /\bsurat\s+keterangan\b/gi,
            priority: 120,
          },
        ],
      },
      {
        value: "pembayaran",
        label: "Pembayaran dan Biaya Kuliah",
        patterns: [
          {
            regex: /\bpembayaran\s+(?:biaya\s+)?kuliah\b/gi,
            priority: 140,
          },
          {
            regex: /\bbiaya\s+kuliah\b/gi,
            priority: 130,
          },
          {
            regex: /\buang\s+kuliah\b/gi,
            priority: 130,
          },
          {
            regex: /\btagihan\s+kuliah\b/gi,
            priority: 125,
          },
        ],
      },
      {
        value: "elearning",
        label: "E-Learning",
        patterns: [
          {
            regex: /\be[\s-]?learning\b/gi,
            priority: 130,
          },
          {
            regex: /\bfast\s+learning\b/gi,
            priority: 125,
          },
          {
            regex: /\bmoodle\b/gi,
            priority: 110,
          },
        ],
      },
      {
        value: "absensi",
        label: "Absensi",
        patterns: [
          {
            regex: /\babsensi\b/gi,
            priority: 125,
          },
          {
            regex: /\bkehadiran\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "akreditasi",
        label: "Akreditasi",
        patterns: [
          {
            regex: /\bakreditasi\b/gi,
            priority: 125,
          },
        ],
      },
      {
        value: "perpustakaan",
        label: "Perpustakaan dan Jurnal",
        patterns: [
          {
            regex: /\bperpustakaan\b/gi,
            priority: 125,
          },
          {
            regex: /\bjurnal\b/gi,
            priority: 90,
          },
          {
            regex: /\bproquest\b/gi,
            priority: 110,
          },
          {
            regex: /\bemerald\b/gi,
            priority: 110,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.REQUEST_TYPE,
    values: [
      {
        value: "procedure",
        label: "Prosedur/Cara",
        patterns: [
          {
            regex: /\bbagaimana\s+cara\b/gi,
            priority: 150,
          },
          {
            regex:
              /\bcara\s+(?:mengajukan|mendaftar|mengisi|mengakses|melakukan|membayar)\b/gi,
            priority: 145,
          },
          {
            regex: /\bprosedur\b/gi,
            priority: 130,
          },
          {
            regex: /\balur\b/gi,
            priority: 120,
          },
          {
            regex: /\blangkah(?:-langkah)?\b/gi,
            priority: 115,
          },
        ],
      },
      {
        value: "definition",
        label: "Definisi/Pengertian",
        patterns: [
          {
            regex: /\bapa\s+itu\b/gi,
            priority: 140,
          },
          {
            regex: /\bpengertian\b/gi,
            priority: 120,
          },
        ],
      },
      {
        value: "requirements",
        label: "Syarat/Berkas",
        patterns: [
          {
            regex: /\bapa\s+saja\s+syarat\b/gi,
            priority: 150,
          },
          {
            regex: /\bsyarat\b/gi,
            priority: 120,
          },
          {
            regex: /\bdokumen\s+apa\b/gi,
            priority: 115,
          },
          {
            regex: /\bberkas\b/gi,
            priority: 105,
          },
        ],
      },
      {
        value: "schedule",
        label: "Jadwal/Waktu",
        patterns: [
          {
            regex: /\bkapan\b/gi,
            priority: 120,
          },
          {
            regex: /\bjadwal\b/gi,
            priority: 115,
          },
          {
            regex: /\btanggal\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "contact",
        label: "Kontak/Penanggung Jawab",
        patterns: [
          {
            regex: /\bsiapa\s+(?:kontak|yang\s+bisa\s+dihubungi)\b/gi,
            priority: 145,
          },
          {
            regex: /\bkontak\b/gi,
            priority: 115,
          },
          {
            regex: /\bhubungi\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "location",
        label: "Lokasi/Tempat",
        patterns: [
          {
            regex: /\bdi\s+mana\b/gi,
            priority: 125,
          },
          {
            regex: /\bdimana\b/gi,
            priority: 125,
          },
          {
            regex: /\blokasi\b/gi,
            priority: 105,
          },
        ],
      },
    ],
  },
  {
    type: SLOT_TYPES.DOCUMENT_TYPE,
    values: [
      {
        value: "mahasiswa_aktif",
        label: "Surat Keterangan Mahasiswa Aktif",
        patterns: [
          {
            regex: /\bsurat\s+keterangan\s+mahasiswa\s+aktif\b/gi,
            priority: 170,
          },
          {
            regex: /\bsurat\s+mahasiswa\s+aktif\b/gi,
            priority: 160,
          },
          {
            regex: /\bmahasiswa\s+aktif\b/gi,
            priority: 100,
          },
        ],
      },
      {
        value: "keterangan_lulus",
        label: "Surat Keterangan Lulus",
        patterns: [
          {
            regex: /\bsurat\s+keterangan\s+lulus\b/gi,
            priority: 170,
          },
          {
            regex: /\bskl\b/gi,
            priority: 110,
          },
        ],
      },
      {
        value: "mengundurkan_diri",
        label: "Surat Mengundurkan Diri",
        patterns: [
          {
            regex: /\bsurat\s+(?:keterangan\s+)?mengundurkan\s+diri\b/gi,
            priority: 170,
          },
          {
            regex: /\bmengundurkan\s+diri\b/gi,
            priority: 120,
          },
        ],
      },
      {
        value: "mutasi",
        label: "Surat Mutasi",
        patterns: [
          {
            regex: /\bsurat\s+(?:keterangan\s+)?mutasi\b/gi,
            priority: 170,
          },
        ],
      },
      {
        value: "putus_studi",
        label: "Surat Putus Studi/Drop Out",
        patterns: [
          {
            regex: /\bsurat\s+(?:keterangan\s+)?putus\s+studi\b/gi,
            priority: 170,
          },
          {
            regex: /\bdrop\s*out\b/gi,
            priority: 130,
          },
          {
            regex: /\bdo\b/gi,
            priority: 60,
          },
        ],
      },
    ],
  },
]);

export const SLOT_MATCH_WEIGHTS = Object.freeze({
  [SLOT_TYPES.SEMESTER]: Object.freeze({
    match: 0.35,
    mismatch: -0.25,
  }),
  [SLOT_TYPES.SEMESTER_PERIOD]: Object.freeze({
    match: 0.14,
    mismatch: -0.09,
  }),
  [SLOT_TYPES.ACADEMIC_YEAR]: Object.freeze({
    match: 0.24,
    mismatch: -0.16,
  }),
  [SLOT_TYPES.CURRICULUM_YEAR]: Object.freeze({
    match: 0.24,
    mismatch: -0.16,
  }),
  [SLOT_TYPES.STUDY_PROGRAM]: Object.freeze({
    match: 0.25,
    mismatch: -0.18,
  }),
  [SLOT_TYPES.CAMPUS]: Object.freeze({
    match: 0.25,
    mismatch: -0.18,
  }),
  [SLOT_TYPES.CLASS_PROGRAM]: Object.freeze({
    match: 0.22,
    mismatch: -0.15,
  }),
  [SLOT_TYPES.SERVICE]: Object.freeze({
    match: 0.1,
    mismatch: -0.06,
  }),
  [SLOT_TYPES.DOCUMENT_TYPE]: Object.freeze({
    match: 0.25,
    mismatch: -0.18,
  }),
  [SLOT_TYPES.REQUEST_TYPE]: Object.freeze({
    match: 0.16,
    mismatch: -0.1,
  }),
});
