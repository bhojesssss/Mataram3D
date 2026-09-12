/**
 * Klien HTTP dasbor admin.
 *
 * Token tidak pernah disentuh JS: backend menyimpannya di cookie httpOnly, jadi
 * setiap request cukup `credentials: 'include'`. Access token hidup 15 menit;
 * balasan 401 memicu satu kali POST /auth/refresh, lalu request diulang.
 */

import { API_URL } from '@/lib/apiUrl';

/**
 * `code` diisi untuk kegagalan di sisi klien (`network`, `config`) supaya halaman
 * bisa menampilkannya dalam bahasa dasbor yang aktif. Error dari backend tidak
 * punya code dan membawa pesan backend apa adanya.
 */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let refreshInFlight = null;

/** Beberapa request yang kedaluwarsa bersamaan cukup memicu satu refresh. */
function refreshSession() {
  refreshInFlight ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(
      (res) => res.ok,
      () => false,
    )
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function request(path, { method = 'GET', json, form, retry = true } = {}) {
  if (!API_URL) {
    throw new ApiError(0, 'VITE_API_URL is not set', 'config');
  }

  const init = { method, credentials: 'include' };
  if (form) {
    // Content-Type multipart (dengan boundary) diisi browser sendiri.
    init.body = form;
  } else if (json !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(API_URL + path, init);
  } catch {
    throw new ApiError(0, 'Network request failed', 'network');
  }

  if (res.status === 401 && retry && (await refreshSession())) {
    return request(path, { method, json, form, retry: false });
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageFrom(res.status, data));
  return data;
}

/** Backend selalu membalas error sebagai { statusCode, message, error }; message bisa berupa array. */
function messageFrom(status, data) {
  const message = data?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(' · ');
  if (typeof message === 'string' && message) return message;
  return `Permintaan gagal (${status}).`;
}

const recordPath = (id) => `/admin/blogs/${encodeURIComponent(id)}`;

export const api = {
  // 401 dari login berarti kredensial salah, bukan sesi habis: jangan coba refresh.
  login: (email, password) => request('/auth/login', { method: 'POST', json: { email, password }, retry: false }),
  logout: () => request('/auth/logout', { method: 'POST', retry: false }),
  me: () => request('/auth/me'),

  listRecords: () => request('/admin/blogs'),
  createRecord: (data) => request('/admin/blogs', { method: 'POST', json: data }),
  updateRecord: (id, data) => request(recordPath(id), { method: 'PATCH', json: data }),
  deleteRecord: (id) => request(recordPath(id), { method: 'DELETE' }),

  uploadImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/admin/uploads/image', { method: 'POST', form });
  },
  /** Buang upload yang tidak jadi dipakai. Backend menolak (409) kalau gambarnya dipakai arsip. */
  deleteUpload: (path) => request('/admin/uploads/image', { method: 'DELETE', json: { path } }),
};
