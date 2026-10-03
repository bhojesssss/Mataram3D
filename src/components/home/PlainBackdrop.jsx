import { useEffect, useRef } from 'react';
import { ScrollController } from '@/scroll/ScrollController';
import { PendopoArt, TumpangSariArt } from './Ornaments';

/**
 * Latar homepage untuk ponsel: ornamen keraton di atas cream, bukan scene 3D.
 *
 * Tidak ada canvas, tidak ada gambar yang diunduh. Ponsel tidak memuat
 * three.js maupun model penarinya, dan GPU-nya tinggal mengurus scroll.
 *
 * Tiga lapis, mengikuti alur yang sama dengan kamera 3D di desktop:
 *  - batik kawung tipis di seluruh latar, yang tembus samar di balik Band;
 *  - siluet pendopo di bawah hero — pengganti pendopo 3D di bidikan pembuka —
 *    memudar saat pembaca mulai turun;
 *  - tumpang sari di belakang section Palace, muncul saat Band pertama
 *    memudar di sana, seperti kamera 3D yang masuk ke bawah atap.
 *
 * ScrollController tetap dipasang (reveal dan progres untuk navbar). Yang
 * ia gerakkan di sini bukan kamera, tapi opacity dua lapis itu — properti
 * yang hanya disusun ulang oleh compositor, tanpa menggambar ulang apa pun.
 */
export default function PlainBackdrop({ onReady }) {
  const heroRef = useRef(null);
  const palaceRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const hero = heroRef.current;
    const palace = palaceRef.current;
    let scroll = null;
    let cancelled = false;
    let beats = null;

    // Lihat Scene3D: reveal hanya disembunyikan selama JS-nya benar-benar hidup.
    root.classList.add('has-js');
    // Band lebih tipis di atas batik (lihat .is-plain di index.css).
    root.classList.add('is-plain');

    // Antarmuka yang sama dengan Scene yang dipakai ScrollController.
    const backdrop = {
      retime(table) {
        beats = table;
      },
      setProgress(t) {
        if (!beats) return;
        hero.style.opacity = 1 - smoothstep(t, beats.hero, beats.approach);
        palace.style.opacity =
          smoothstep(t, beats.threshold, beats.interior) * (1 - smoothstep(t, beats.ascend, beats.compound));
      },
    };

    (async () => {
      // Hanya font yang ditunggu — tanpa scene, tidak ada frame yang perlu dirender dulu.
      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
      if (cancelled) return;

      onReady();
      // Garisnya mulai tergambar saat tirai asap tersibak (jedanya di CSS).
      hero.classList.add('is-drawn');
      scroll = new ScrollController(backdrop);
      document.fonts?.ready.then(() => scroll?.refresh());
    })();

    return () => {
      cancelled = true;
      scroll?.dispose();
      root.classList.remove('has-js', 'is-plain');
    };
  }, [onReady]);

  return (
    /*
      h-screen (100vh), bukan inset-0: di ponsel 100vh adalah viewport besar,
      jadi lapisnya tidak ikut berubah ukuran tiap kali toolbar browser
      naik-turun saat digulir.
    */
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0 h-screen overflow-hidden">
      {/*
        Kawung, dibuat lebih tipis di tengah — tempat judul hero dan panel
        Palace berada — dan penuh di tepi, jadi ia membingkai, bukan bersaing.
      */}
      <div className="batik-kawung absolute inset-0 opacity-[0.3] [mask-image:radial-gradient(130%_70%_at_50%_42%,rgb(0_0_0/0.18)_0%,#000_72%)]" />

      <div
        ref={heroRef}
        className="line-draw absolute inset-x-0 bottom-[13vh] flex justify-center px-4 will-change-[opacity]"
      >
        <PendopoArt className="w-full max-w-[440px]" />
      </div>

      <div
        ref={palaceRef}
        className="absolute top-1/2 left-1/2 w-[125vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-[opacity]"
      >
        <TumpangSariArt className="block w-full opacity-70" />
      </div>
    </div>
  );
}

function smoothstep(t, a, b) {
  const x = Math.min(Math.max((t - a) / (b - a || 1), 0), 1);
  return x * x * (3 - 2 * x);
}
