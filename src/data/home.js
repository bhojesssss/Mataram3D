/**
 * Isi homepage. Markup-nya generik; yang berubah dari waktu ke waktu ada di
 * sini. Tiap field teks adalah pasangan `{ id, en }`, dipilih lewat `t()`.
 */

export const timeline = [
  {
    year: '1556',
    title: { id: 'Ki Ageng Pemanahan', en: 'Ki Ageng Pemanahan' },
    body: {
      id: 'Tanah Mataram dianugerahkan sebagai imbalan pengabdian — benih sebuah wangsa yang kelak menguasai Jawa.',
      en: 'The land of Mataram is granted as reward for service — the seed of a dynasty that would come to rule Java.',
    },
  },
  {
    year: '1587',
    title: { id: 'Panembahan Senopati', en: 'Panembahan Senopati' },
    body: {
      id: 'Pendiri Kesultanan Mataram. Meletakkan fondasi kekuasaan sekaligus mitos yang mengiringinya.',
      en: 'Founder of the Sultanate of Mataram. He lays the foundation of its power, and the myth that comes with it.',
    },
  },
  {
    year: '1613',
    title: { id: 'Sultan Agung', en: 'Sultan Agung' },
    body: {
      id: 'Puncak kejayaan Mataram. Ekspansi, kalender Jawa, dan sintesis budaya yang bertahan hingga hari ini.',
      en: "Mataram's golden age. Expansion, the Javanese calendar, and a cultural synthesis that endures today.",
    },
  },
  {
    year: '1745',
    title: { id: 'Kartasura & Surakarta', en: 'Kartasura & Surakarta' },
    body: {
      id: 'Perpindahan pusat kekuasaan, lalu pembagian yang melahirkan dua keraton besar.',
      en: 'The seat of power moves, then splits — giving rise to two great courts.',
    },
  },
];

export const royalHouseCards = [
  {
    title: { id: 'Sang Penguasa', en: 'The Sovereign' },
    body: {
      id: 'Kedudukan raja sebagai poros antara rakyat dan tatanan semesta.',
      en: 'The standing of the king as the axis between the people and the order of the cosmos.',
    },
  },
  {
    title: { id: 'Keluarga Kerajaan', en: 'Royal Family' },
    body: {
      id: 'Profil keluarga kerajaan dan peran yang diemban tiap generasi.',
      en: 'Profiles of the royal family and the role carried by each generation.',
    },
  },
  {
    title: { id: 'Pesan Kerajaan', en: 'Royal Messages' },
    body: {
      id: 'Pesan dan petuah yang diwariskan dari takhta kepada rakyatnya.',
      en: 'Words and counsel passed down from the throne to its people.',
    },
  },
];

export const palaceIndex = [
  { id: 'Arsitektur', en: 'Architecture' },
  { id: 'Ruang Keraton', en: 'Palace Grounds' },
  { id: 'Simbol', en: 'Symbols' },
  { id: 'Kehidupan Istana', en: 'Court Life' },
];

export const cultureCards = [
  {
    title: { id: 'Gamelan', en: 'Gamelan' },
    body: {
      id: 'Laras slendro dan pelog — musik sebagai tata ruang batin.',
      en: 'The slendro and pelog scales — music as an inner architecture.',
    },
  },
  {
    title: { id: 'Batik', en: 'Batik' },
    body: {
      id: 'Motif parang dan kawung, ditulis sebagai bahasa status dan doa.',
      en: 'Parang and kawung motifs, written as a language of status and prayer.',
    },
  },
  {
    title: { id: 'Upacara', en: 'Ceremony' },
    body: {
      id: 'Grebeg dan sekaten — siklus yang menautkan istana dengan rakyat.',
      en: 'Grebeg and Sekaten — the cycle that binds the court to its people.',
    },
  },
  {
    title: { id: 'Seni Pertunjukan', en: 'Performing Arts' },
    body: {
      id: 'Wayang dan bedhaya, tempat sejarah dirawat lewat tubuh dan suara.',
      en: 'Wayang and bedhaya, where history is kept alive through body and voice.',
    },
  },
  {
    title: { id: 'Kriya', en: 'Craft' },
    body: {
      id: 'Keris, perak, dan ukir kayu — keahlian yang diturunkan tanpa putus.',
      en: 'Kris, silver, and woodcarving — skill passed down without interruption.',
    },
  },
  {
    title: { id: 'Kuliner', en: 'Cuisine' },
    body: {
      id: 'Rasa keraton yang menyebar menjadi meja makan sehari-hari.',
      en: "The court's palate, now spread across everyday tables.",
    },
  },
];

export const discoverCards = [
  {
    title: { id: 'Situs Warisan', en: 'Heritage Sites' },
    body: {
      id: 'Keraton, masjid agung, dan makam raja-raja.',
      en: 'The keraton, the great mosque, and the tombs of kings.',
    },
  },
  {
    title: { id: 'Alam', en: 'Nature' },
    body: {
      id: 'Gunung, gua, dan lanskap yang membentuk mitosnya.',
      en: 'The mountain, caves, and landscape that shaped its mythology.',
    },
  },
  {
    title: { id: 'Seni & Kriya', en: 'Arts & Crafts' },
    body: {
      id: 'Sentra kriya yang masih bekerja hari ini.',
      en: 'Craft workshops still working to this day.',
    },
  },
  {
    title: { id: 'Pengalaman', en: 'Experiences' },
    body: {
      id: 'Program dan laku budaya yang bisa diikuti langsung.',
      en: 'Programs and cultural practice open to join in person.',
    },
  },
];

/** Tiga kartu cuplikan arsip di homepage. Koleksi penuhnya ada di data/archive.js. */
export const archivePreview = [
  {
    glyph: '◎',
    title: { id: 'Sebaran Sultan Agung', en: "Sultan Agung's Reign" },
    meta: { id: '1613 · Peristiwa', en: '1613 · Event' },
  },
  {
    glyph: '☰',
    title: { id: 'Manuskrip Kuno', en: 'Ancient Manuscript' },
    meta: { id: '1742 · Dokumen', en: '1742 · Document' },
  },
  {
    glyph: '◆',
    title: { id: 'Artefak Keraton', en: 'Palace Artifact' },
    meta: { id: 'Benda Pusaka', en: 'Royal Heirloom' },
    dark: true,
  },
];

export const news = [
  {
    tag: { id: 'Kerajaan', en: 'Royal' },
    title: { id: 'Peringatan Tingalan Jumenengan', en: 'Tingalan Jumenengan Anniversary' },
    date: { id: '12 Agu 2026', en: '12 Aug 2026' },
  },
  {
    tag: { id: 'Khusus', en: 'Special' },
    title: { id: 'Pameran Manuskrip Terbuka untuk Umum', en: 'Manuscript Exhibition Opens to the Public' },
    date: { id: '28 Jul 2026', en: '28 Jul 2026' },
  },
  {
    tag: { id: 'Lokal', en: 'Local' },
    title: { id: 'Lokakarya Batik Tulis Angkatan Baru', en: 'New Cohort: Hand-Drawn Batik Workshop' },
    date: { id: '03 Jul 2026', en: '03 Jul 2026' },
  },
];

export const values = [
  { id: 'WARISAN', en: 'HERITAGE' },
  { id: 'KEHORMATAN', en: 'HONOR' },
  { id: 'KESELARASAN', en: 'HARMONY' },
  { id: 'PUSAKA', en: 'LEGACY' },
];
