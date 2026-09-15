import { Suspense, lazy, useCallback, useState } from 'react';
import { Loader } from './Loader';

/*
  three + gsap + lenis hanya dipakai homepage, dan bersama-sama ukurannya
  beberapa ratus kilobyte. Impor dinamis menjaga halaman dalam tetap ringan
  seperti waktu masih enam dokumen terpisah — dulu ini dijamin oleh build
  multi-entry Vite, sekarang oleh batas chunk ini.
*/
const Scene3D = lazy(() => import('./Scene3D'));

/**
 * Latar homepage: scene 3D, dengan loader di atasnya.
 *
 * Dipasang SiteLayout sebagai saudara <main>, bukan anaknya. Canvas-nya fixed
 * di z-0 dan konten halaman di z-2; kalau ia hidup di dalam <main> ia akan
 * terkurung di stacking context yang sama dan loader tidak bisa menutupi navbar.
 */
export function HomeBackdrop() {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  return (
    <>
      {/* fallback null: loader di bawah ini sudah menutupi layar selama chunk-nya diunduh. */}
      <Suspense fallback={null}>
        <Scene3D onReady={handleReady} />
      </Suspense>
      <Loader done={ready} />
    </>
  );
}
