/**
 * Satu sumber kebenaran untuk seluruh navigasi.
 *
 * Dipakai bersama oleh navbar, overlay menu mobile, dan footer — dulu ketiga
 * daftar ini disalin ulang di enam file HTML dan gampang sekali jadi beda.
 */

/** Menu utama. Urutannya persis seperti di navbar desktop. */
export const mainLinks = [
  { to: '/history', label: 'History' },
  { to: '/royal-house', label: 'Royal House' },
  { to: '/palace', label: 'Palace' },
  { to: '/archive', label: 'Royal Archive' },
  { to: '/about', label: 'About' },
];

/** Tautan sekunder — semuanya menunjuk ke section di homepage. */
export const moreLinks = [
  { hash: '#culture', label: 'Culture' },
  { hash: '#discover', label: 'Discover' },
  { hash: '#news', label: 'News & Events' },
  { hash: '#discover', label: 'Visit the Keraton' },
];

export const contactEmail = 'info@mataram.id';

export const visitAddress = ['Keraton Surakarta Hadiningrat', 'Baluwarti, Pasar Kliwon', 'Surakarta, Central Java'];
