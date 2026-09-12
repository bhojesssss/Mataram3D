/** Mengambil arsip dari GET /blogs untuk halaman Royal Archive, dengan cadangan data statis. */
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/apiUrl';
import { records as staticRecords } from '@/data/archive';

let lastLive = null;

export function useArchiveRecords() {
  const [state, setState] = useState(() => {
    if (lastLive) return { status: 'live', records: lastLive };
    if (API_URL) return { status: 'loading', records: [] };
    return { status: 'fallback', records: staticRecords };
  });

  useEffect(() => {
    if (!API_URL) return;
    const controller = new AbortController();

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

        setState((current) => (current.status === 'live' ? current : { status: 'fallback', records: staticRecords }));
      });

    return () => controller.abort();
  }, []);

  return state;
}

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
