import { useEffect, useRef, useState } from 'react';

/**
 * Menandai true saat elemen masuk viewport, sekali saja.
 *
 * Halaman dalam tidak memuat GSAP — hanya homepage yang punya — jadi reveal
 * di sini pakai IntersectionObserver biasa. Kalau browser tidak punya
 * IntersectionObserver, isinya langsung ditampilkan alih-alih hilang.
 */
export function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      // Menyala sedikit sebelum elemen benar-benar terlihat penuh, supaya
      // animasinya sudah selesai saat mata pembaca sampai.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, shown];
}
