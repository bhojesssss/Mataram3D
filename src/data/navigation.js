/**
 * Satu sumber kebenaran untuk seluruh navigasi.
 *
 * Dipakai bersama oleh navbar, overlay menu mobile, dan footer — dulu ketiga
 * daftar ini disalin ulang di enam file HTML dan gampang sekali jadi beda.
 *
 * `label` adalah pasangan `{ id, en }`; dipilih lewat `t()` dari
 * LanguageContext di titik pakainya masing-masing.
 */

/** Menu utama. Urutannya persis seperti di navbar desktop. */
export const mainLinks = [
  { to: '/history', label: { id: 'Sejarah', en: 'History' } },
  { to: '/royal-house', label: { id: 'Wangsa Mataram', en: 'Royal House' } },
  { to: '/palace', label: { id: 'Keraton', en: 'Palace' } },
  { to: '/archive', label: { id: 'Arsip Kerajaan', en: 'Royal Archive' } },
  { to: '/about', label: { id: 'Tentang', en: 'About' } },
];

/** Tautan sekunder — semuanya menunjuk ke section di homepage. */
export const moreLinks = [
  { hash: '#culture', label: { id: 'Budaya', en: 'Culture' } },
  { hash: '#discover', label: { id: 'Jelajahi', en: 'Discover' } },
  { hash: '#news', label: { id: 'Berita & Acara', en: 'News & Events' } },
  { hash: '#discover', label: { id: 'Kunjungi Keraton', en: 'Visit the Keraton' } },
];

export const contactEmail = 'info@mataram.id';

export const visitAddress = [
  'Keraton Surakarta Hadiningrat',
  'Baluwarti, Pasar Kliwon',
  { id: 'Surakarta, Jawa Tengah', en: 'Surakarta, Central Java' },
];
