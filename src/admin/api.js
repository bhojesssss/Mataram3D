/** Klien HTTP dasbor: menyertakan cookie sesi dan menyegarkan token saat kedaluwarsa. */
import { API_URL } from '@/lib/apiUrl';

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let refreshInFlight = null;

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

function messageFrom(status, data) {
  const message = data?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(' · ');
  if (typeof message === 'string' && message) return message;
  return `Permintaan gagal (${status}).`;
}

const recordPath = (id) => `/admin/blogs/${encodeURIComponent(id)}`;

export const api = {
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
  deleteUpload: (path) => request('/admin/uploads/image', { method: 'DELETE', json: { path } }),
};
