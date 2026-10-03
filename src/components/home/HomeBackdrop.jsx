import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { deviceClass } from '@/config/quality';
import { Loader } from './Loader';

/*
  three + gsap hanya dipakai homepage, dan bersama-sama ukurannya
  beberapa ratus kilobyte. Impor dinamis menjaga halaman dalam tetap ringan
  seperti waktu masih enam dokumen terpisah — dulu ini dijamin oleh build
  multi-entry Vite, sekarang oleh batas chunk ini.

  Latar polos chunk-nya terpisah supaya ponsel tidak ikut mengunduh three.js.
*/
const Scene3D = lazy(() => import('./Scene3D'));
const PlainBackdrop = lazy(() => import('./PlainBackdrop'));

/** Breakpoint ponsel situs ini — sama dengan hamburger kecil dan footer padat. */
const NARROW = '(max-width: 760px)';

/**
 * Latar homepage: scene 3D di desktop dan tablet, warna polos di ponsel,
 * dengan loader di atasnya.
 *
 * Dipasang SiteLayout sebagai saudara <main>, bukan anaknya. Canvas-nya fixed
 * di z-0 dan konten halaman di z-2; kalau ia hidup di dalam <main> ia akan
 * terkurung di stacking context yang sama dan loader tidak bisa menutupi navbar.
 */
export function HomeBackdrop() {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  const plain = usePlainBackdrop();
  const Backdrop = plain ? PlainBackdrop : Scene3D;

  return (
    <>
      {/* fallback null: loader di bawah ini sudah menutupi layar selama chunk-nya diunduh. */}
      <Suspense fallback={null}>
        <Backdrop onReady={handleReady} />
      </Suspense>
      <Loader done={ready} />
    </>
  );
}

/**
 * Polos untuk ponsel, dan untuk layar apa pun selebar ponsel.
 *
 * Ponsel tetap polos dalam posisi landscape, yang bisa melewati 760px. Di luar
 * ponsel yang menentukan lebar layarnya, dan ikut berubah saat jendela diubah
 * ukurannya: desktop yang dipersempit ke tata letak ponsel juga dapat tampilan
 * ponsel, bukan scene 3D di belakang tata letak yang tidak pernah dirancang
 * untuknya.
 */
function usePlainBackdrop() {
  const [isPhone] = useState(() => deviceClass() === 'phone');
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);

  useEffect(() => {
    if (isPhone) return undefined;
    const mq = window.matchMedia(NARROW);
    const onChange = (e) => setNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isPhone]);

  return isPhone || narrow;
}
