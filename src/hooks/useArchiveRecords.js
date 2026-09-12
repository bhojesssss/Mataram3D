import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/apiUrl';
import { records as staticRecords } from '@/data/archive';

/** Hasil terakhir dari backend, supaya kembali ke halaman ini tidak berkedip "Loading" lagi. */
let lastLive = null;

/**
 * Koleksi Royal Archive dari backend (GET /blogs), yang dikelola lewat /admin.
 *
 * Kalau backend tidak terjangkau (VITE_API_URL belum diatur, server mati, atau
 * jaringan putus), halaman memakai koleksi statis src/data/archive.js supaya
 * tidak pernah kosong. Balasan sukses yang kosong tetap dipakai apa adanya:
 * artinya admin memang belum menerbitkan arsip apa pun.
 *
 * @returns {{ status: 'loading' | 'live' | 'fallback', records: Array }}
 */
export function useArchiveRecords() {
  const [state, setState] = useState(() => {
    if (lastLive) return { status: 'live', records: lastLive };
    if (API_URL) return { status: 'loading', records: [] };
    return { status: 'fallback', records: staticRecords };
  });

  useEffect(() => {
    if (!API_URL) return;
    const controller = new AbortController();

    // Tanpa credentials: data publik, dan tanpa cookie responsnya boleh di-cache CDN.
    fetch(`${API_URL}/blogs`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('format respons tidak dikenal');
        lastLive = data.map(fromApi);
        setState({ status: 'live', records: lastLive });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.warn('[archive] backend tidak terjangkau, memakai koleksi statis:', error.message);
        // Data live yang sudah tampil tidak diganti data statis hanya karena revalidasi gagal.
        setState((current) => (current.status === 'live' ? current : { status: 'fallback', records: staticRecords }));
      });

    return () => controller.abort();
  }, []);

  return state;
}

/** Bentuk API → bentuk record yang sudah dipakai kartu arsip (sama dengan data statis). */
function fromApi(blog) {
  return {
    id: blog.id,
    cat: blog.category,
    era: blog.era,
    title: blog.title,
    sub: blog.description,
    image: blog.imageUrl,
    href: blog.externalUrl,
  };
}
