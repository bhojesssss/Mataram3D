import { useEffect, useRef, useState } from 'react';
import { Scene } from '@/scene/Scene';
import { ScrollController } from '@/scroll/ScrollController';
import { hydrateAssets } from '@/config/assets.manifest';

/**
 * Pendopo 3D di belakang homepage, plus scrim krem di atasnya.
 *
 * Kode Three.js-nya tidak berubah sedikit pun dari versi vanilla — komponen
 * ini hanya mengurus daur hidupnya: dibuat saat homepage terpasang, dibuang
 * saat pembaca pindah halaman.
 *
 * Urutannya penting. Loader baru dilepas setelah renderer benar-benar
 * menggambar, dan ScrollController baru dibangun setelah itu, supaya animasi
 * reveal mulai di halaman yang memang sudah dilihat pembaca.
 */
export default function Scene3D({ onReady }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    let scene = null;
    let scroll = null;
    let cancelled = false;

    // Menggerbangi style reveal pada JS yang hidup: kalau boot di bawah gagal,
    // CSS tidak pernah menyembunyikan isinya dan halaman turun jadi dokumen statis.
    root.classList.add('has-js');

    try {
      scene = new Scene(canvasRef.current);
      scene.start();
    } catch (err) {
      // WebGL tidak tersedia. Halaman tetap dokumen utuh tanpanya, jadi canvas
      // dibuang dan situs jalan terus alih-alih mati.
      console.error('[mataram] 3D scene failed to start:', err);
      root.classList.remove('has-js');
      setFailed(true);
      onReady();
      return;
    }

    (async () => {
      await Promise.all([
        withTimeout(document.fonts?.ready ?? Promise.resolve(), 2500),
        withTimeout(framesRendered(2), 2500),
      ]);
      if (cancelled) return;

      onReady();

      // Menukar GLB dari Higgsfield yang sudah ditaruh di public/models/ dan
      // diaktifkan di manifest. Sengaja tidak di-await — scene prosedural sudah
      // di layar dan unduhan model yang lambat tidak boleh menahan reveal.
      hydrateAssets(scene.scene, {
        pendopo: scene.pendopo,
        tumpangSari: scene.pendopo.tumpangSari,
        dancer: scene.dancer,
      }).catch((err) => console.warn('[mataram] asset hydration skipped:', err));

      scroll = new ScrollController(scene);

      // Metrik webfont yang datang telat menggeser offset elemen; ScrollTrigger
      // harus mengukur ulang.
      document.fonts?.ready.then(() => scroll?.refresh());

      // Berguna saat menyetel beat di tokens.js sambil melihat halamannya.
      if (import.meta.env.DEV) window.__mataram = { scene, scroll };
    })();

    return () => {
      cancelled = true;
      scroll?.dispose();
      scene?.dispose();
      root.classList.remove('has-js');
    };
  }, [onReady]);

  if (failed) return null;

  return (
    <>
      {/* Pendopo 3D. Fixed di belakang segalanya; seluruh isi halaman menggulir di atasnya. */}
      <canvas ref={canvasRef} id="scene" aria-hidden="true" className="fixed inset-0 z-0 block h-full w-full" />

      {/*
        Cuci krem yang memudar masuk di atas canvas untuk section padat teks,
        supaya badan teks selalu punya kontras. Opacity-nya digerakkan
        ScrollController, bukan nilai tetap.
      */}
      <div id="scrim" aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] bg-cream opacity-0 will-change-[opacity]" />
    </>
  );
}

/** Selesai setelah renderer merampungkan `count` frame. */
function framesRendered(count = 2) {
  return new Promise((resolve) => {
    let n = 0;
    const step = () => {
      if ((n += 1) >= count) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/** Jangan biarkan font atau GPU yang macet menahan loader selamanya. */
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
}
