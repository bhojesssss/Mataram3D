/**
 * Alamat backend, dipakai halaman Archive dan dasbor /admin.
 *
 * Dev tanpa .env langsung menunjuk backend lokal. Build production wajib diberi
 * VITE_API_URL; tanpa itu nilainya kosong dan pemanggil memakai jalur cadangannya.
 */
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(
  /\/+$/,
  '',
);
