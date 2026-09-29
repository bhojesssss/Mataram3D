import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { Rosette } from '@/components/ui/Icons';

/**
 * Layar pembuka — tirai asap.
 *
 * Meniru transisi Clash of Clans: gumpalan asap bergulung masuk dari tepi
 * layar sampai menutup penuh, lalu logo muncul di tengahnya. Selama menunggu,
 * asapnya terus bergolak pelan. Saat scene siap logo hilang lebih dulu, lalu
 * asapnya tersibak dari tengah ke luar sambil menipis dan membuka pendopo di
 * belakangnya.
 *
 * Tetap bertahan sampai renderer benar-benar menaruh satu frame di canvas dan
 * font display selesai dimuat (lihat Scene3D) — memperlihatkan canvas kosong,
 * atau membiarkan Cormorant menggantikan judul hero di depan mata, dua-duanya
 * lebih buruk daripada tahan sebentar lebih lama. Tirai juga tidak dibuka
 * sebelum logonya selesai muncul, supaya di koneksi cepat animasinya tidak
 * terpotong di tengah jalan.
 *
 * Murni CSS (keyframes di index.css). GSAP sengaja tidak dipakai di sini:
 * komponen ini ada di bundle utama, sementara GSAP hidup di chunk homepage.
 *
 * Fase:  enter → hold → exit → gone
 *   enter  asap masuk, logo muncul
 *   hold   tertutup penuh, menunggu `done`
 *   exit   logo hilang, lalu asap tersibak
 */
export function Loader({ done }) {
  const [phase, setPhase] = useState('enter');
  const cleared = useRef(0);

  useEffect(() => {
    if (done && phase === 'hold') setPhase('exit');
  }, [done, phase]);

  // Jaring pengaman: kalau animationend tidak pernah datang, tirai yang macet
  // menutup seluruh situs. Batasnya jauh di atas durasi animasinya.
  useEffect(() => {
    if (phase !== 'enter' && phase !== 'exit') return undefined;
    const id = setTimeout(() => setPhase(phase === 'enter' ? 'hold' : 'gone'), 3000);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'gone') return null;

  const leaving = phase === 'exit';

  const handleAnimationEnd = (e) => {
    if (e.animationName === 'loader-logo-in') setPhase((p) => (p === 'enter' ? 'hold' : p));
    // Tiap gumpalan punya jedanya sendiri — tirai baru selesai saat yang terakhir hilang.
    else if (e.animationName === 'loader-smoke-out' && ++cleared.current === PUFFS.length) setPhase('gone');
  };

  return (
    <div
      className={cx('fixed inset-0 z-[100] overflow-hidden', leaving && 'pointer-events-none')}
      onAnimationEnd={handleAnimationEnd}
    >
      {/*
        Kabut dasar: menutupi halaman yang belum siap sejak frame pertama, dan
        mengisi celah antar gumpalan sebagai bagian asap yang lebih dalam.
        Memudar begitu tirai mulai dibuka, jadi pendopo mulai tembus di celah
        itu sebelum gumpalannya sendiri pergi.
      */}
      <div aria-hidden="true" className={cx('loader-haze absolute inset-0', leaving && 'is-leaving')} />

      <div aria-hidden="true" className={cx('smoke absolute inset-0', leaving && 'is-leaving')}>
        {PUFFS.map((p, i) => (
          <span
            key={i}
            className="smoke-puff"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              '--away': p.away,
              '--in': p.delayIn,
              '--out': p.delayOut,
            }}
          >
            <span
              className="smoke-billow"
              style={{ '--drift': p.drift, animationDuration: p.billowFor, animationDelay: p.billowAt }}
            />
          </span>
        ))}
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <div
          className={cx(
            'loader-logo relative isolate flex flex-col items-center gap-4 text-gold',
            leaving && 'is-leaving',
          )}
        >
          {/* Halo kertas di belakang logo, supaya emasnya tidak tenggelam di asap yang terang. */}
          <span
            aria-hidden="true"
            className="absolute -inset-x-28 -inset-y-20 -z-10 bg-[radial-gradient(closest-side,rgb(247_244_236/0.95),rgb(247_244_236/0.7)_55%,transparent)]"
          />
          <Rosette size={72} strokeWidth={1.3} className="animate-breathe" />
          <p className="font-display text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[0.45em] indent-[0.45em] text-forest">
            MATARAM
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── susunan gumpalan ───────────────────────────────────────────────────── */

/*
  Posisi dihitung sekali di level modul dari PRNG berbenih: acak supaya tidak
  terlihat seperti pola, tapi sama di setiap render.

  Gumpalan disebar dengan spiral Vogel (sudut emas) dalam koordinat layar
  ternormalisasi, jadi kerapatannya rata di rasio apa pun; ukurannya dalam
  vmax supaya tetap bulat. Yang jatuh terlalu jauh di luar layar dibuang.

  Arah "pergi" tiap gumpalan adalah arah dari pusat layar ke dirinya, dalam
  vw/vh supaya tetap lurus menjauhi pusat di layar lebar maupun tegak. Karena
  semuanya bergeser keluar sejauh yang sama, tengah layar yang pertama kosong
  — itu yang membuat asapnya terlihat tersibak dari tengah.
*/

function seeded(seed) {
  // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function buildPuffs(seed, count) {
  const rand = seeded(seed);
  const between = (a, b) => a + (b - a) * rand();
  const reach = 0.8; // jari-jari spiral; sudut layar ada di ~0.71
  const puffs = [];

  for (let n = 0; n < count; n++) {
    const r = reach * Math.sqrt((n + 0.5) / count);
    const a = n * GOLDEN_ANGLE + between(-0.25, 0.25);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const x = 0.5 + r * dx;
    const y = 0.5 + r * dy;
    if (Math.abs(x - 0.5) > 0.58 || Math.abs(y - 0.5) > 0.58) continue;

    const depth = r / reach; // 0 di pusat, 1 di tepi terluar
    const travel = between(48, 62);

    puffs.push({
      y,
      left: `${(x * 100).toFixed(2)}%`,
      top: `${(y * 100).toFixed(2)}%`,
      size: `${between(26, 38).toFixed(1)}vmax`,
      away: `translate(${(dx * travel).toFixed(1)}vw, ${(dy * travel).toFixed(1)}vh)`,
      // Masuk: tepi lebih dulu, tengah menyusul. Keluar: kebalikannya.
      delayIn: `${((1 - depth) * 0.28).toFixed(3)}s`,
      delayOut: `${(depth * 0.3).toFixed(3)}s`,
      drift: `translate(${between(-1.8, 1.8).toFixed(2)}vmax, ${between(-1.2, 1.2).toFixed(2)}vmax)`,
      billowFor: `${between(5, 9).toFixed(2)}s`,
      billowAt: `${(-between(0, 9)).toFixed(2)}s`,
    });
  }

  // Yang lebih rendah digambar belakangan: puncak terangnya menimpa perut
  // teduh gumpalan di atasnya, dan dari situ lekuk asapnya terbaca.
  return puffs.sort((p, q) => p.y - q.y);
}

const PUFFS = buildPuffs(11, 54);
