import { useEffect, useRef, useState } from 'react';
import { Scene } from '@/scene/Scene';
import { ScrollController } from '@/scroll/ScrollController';
import { hydrateAssets } from '@/config/assets.manifest';

/**
 * Pendopo 3D di belakang homepage.
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
        // Model penari diunduh, teksturnya diunggah, dan semua shader dikompilasi
        // selagi tirai asap masih menutup layar — bukan di tengah scroll pertama
        // pembaca. Dibatasi 5 detik: di koneksi lambat tirainya tetap dibuka dan
        // sisanya menyusul; scroll native tidak ikut tertahan olehnya.
        withTimeout(scene.warmUp().catch(() => {}), 5000),
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

  /*
    Cuma canvas. Dulu ada #scrim di sini — satu div fixed sepenuh layar yang
    opacity-nya digerakkan scroll — dan itu yang menanggung keterbacaan
    halaman. Tugas itu sekarang dipegang <Band> di dalam halaman, yang menutupi
    render hanya di sepanjang rentang baca; lihat components/ui/Band.jsx.
  */
  return (
    /*
      Pendopo 3D. Fixed di belakang segalanya; seluruh isi halaman menggulir di atasnya.

      h-screen (100vh), bukan inset-0. Di ponsel 100vh adalah viewport besar —
      tinggi layar saat toolbar browser tersembunyi — jadi ukuran canvas tidak
      ikut berubah tiap kali toolbar naik-turun saat digulir. Dengan inset-0
      canvas mengikuti toolbar, dan tiap perubahan itu memaksa Scene
      mengalokasi ulang seluruh render target-nya di tengah gestur scroll.
    */
    <canvas ref={canvasRef} id="scene" aria-hidden="true" className="fixed inset-x-0 top-0 z-0 block h-screen w-full" />
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
