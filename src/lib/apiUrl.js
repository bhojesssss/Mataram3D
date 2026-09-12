/** Alamat backend, dibaca dari VITE_API_URL saat build. */
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(
  /\/+$/,
  '',
);
