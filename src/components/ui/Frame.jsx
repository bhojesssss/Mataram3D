import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';

/**
 * Bingkai foto dengan keadaan kosong.
 *
 * Semua foto di situs ini opsional — filenya ditaruh ke public/img/ terpisah.
 * Selama file belum ada, bingkai menampilkan pelat arsiran emas berlabel, bukan
 * ikon gambar rusak. Gambarnya tetap dirender (opacity 0, bukan display:none)
 * supaya browser terus memuatnya dan `onLoad` bisa membuka pelatnya.
 *
 * `rounded={false}` untuk bingkai yang menempel di dalam kartu: sudut membulat
 * di sana akan mencowak tempat gambar bertemu keterangan. Kartunya yang memotong.
 */
export function Frame({ src, alt = '', label, tag, rounded = true, className, children }) {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Menangkap gambar yang sudah selesai di-decode sebelum React memasang onLoad.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <figure
      className={cx(
        'relative m-0 overflow-hidden border border-forest/18 bg-forest/8',
        rounded && 'rounded-lg',
        className,
      )}
    >
      {src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cx(
            'h-full w-full object-cover transition-opacity duration-[600ms] ease-heritage',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}

      {!loaded && (
        <>
          <span aria-hidden="true" className="hatch absolute inset-0" />
          {label && (
            <figcaption className="absolute inset-0 flex items-center justify-center p-3 text-center text-[0.62rem] tracking-[0.24em] uppercase text-ink/72">
              {label}
            </figcaption>
          )}
        </>
      )}

      {tag && (
        <span className="pointer-events-none absolute top-3.5 left-3.5 rounded-lg border border-forest/20 bg-paper/82 px-4 py-2.5 text-[0.62rem] tracking-[0.26em] uppercase text-forest backdrop-blur-md">
          {tag}
        </span>
      )}

      {children}
    </figure>
  );
}
