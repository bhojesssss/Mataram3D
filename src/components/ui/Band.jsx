import { cx } from '@/lib/cx';

/*
  Rentang baca: satu pelat paper selebar viewport yang menutupi render 3D,
  memudar masuk di ujung atas dan keluar di ujung bawah.

  ── KENAPA SATU PELAT, BUKAN SATU PANEL PER BLOK ──────────────────────────

  Struktur halaman ini ada di README aslinya: 3D-nya adalah halaman di dua
  momen — hero dan Palace — dan selebihnya latar untuk teks. Band memotong
  halaman menurut narasi itu, bukan menurut tiap blok teks:

      hero      3D terbuka
      band      Introduction -> History -> Royal House
      PALACE    3D terbuka + panel hijau      <- reveal
      band      Culture -> Discover -> Archive -> News
      footer

  Dua pendekatan sebelumnya gagal di sisi yang berlawanan. Scrim global tidak
  bisa benar karena render-nya tidak seragam: langit terang dan massa pendopo
  gelap ada di layar yang sama, jadi satu angka opacity harus memilih salah
  satu — pada 0.10, teks di atas sirap atap cuma 1.02:1. Panel per-blok
  memperbaiki kontrasnya tapi memecah halaman jadi sebelas kartu ngambang,
  dan kartu-kartu itu justru menutupi pendopo di tempat-tempat acak.

  Band menyelesaikan keduanya sekaligus: kontrasnya dijamin di seluruh
  rentang baca, dan tempat 3D-nya terbuka jadi keputusan editorial yang
  disengaja, bukan akibat sampingan.

  ── PEMUDARANNYA ADALAH REVEAL-NYA ────────────────────────────────────────

  Ujung bawah band pertama bukan sekadar tepi yang dirapikan — di situlah
  Palace muncul. Putihnya mengelupas, interior pendopo terbuka, panel hijau
  mendarat di atasnya, lalu band kedua menutup kembali. Panjang pemudaran
  (`--band-fade`) karena itu variabel kerajinan, bukan angka kosmetik.

  ── KENAPA PELATNYA ELEMEN TERSENDIRI ─────────────────────────────────────

  Mask harus mengenai pelatnya saja. Kalau latar dan mask dipasang langsung
  di wadah isi, teks di ujung band ikut memudar bersama pelatnya — persis di
  tempat teks paling butuh kontras.
*/

/**
 * @param {'both'|'top'} fade
 *   'both' — memudar di kedua ujung. Untuk band yang berakhir di Palace.
 *   'top'  — memudar masuk saja, ujung bawahnya rata. Untuk band terakhir,
 *   yang bertemu footer hijau solid; pemudaran di situ hanya menghasilkan
 *   pita transisi kotor sebelum warnanya berganti total.
 */
export function Band({ fade = 'both', className, children, ...rest }) {
  return (
    <div
      className={cx('band', className)}
      /*
        Variabelnya dipasang di BAND, bukan di pelatnya. Ia menggerakkan dua
        hal — panjang mask pada pelat dan padding pada band — dan pelat cuma
        anak, jadi nilai yang ditaruh di sana tidak pernah sampai ke padding
        induknya. Efeknya waktu itu senyap: mask-nya benar, tapi band kedua
        tetap membawa padding bawah sepanjang fade yang tidak lagi ia pakai,
        dan menyisakan pita kosong sebelum footer.
      */
      style={fade === 'top' ? { '--band-foot': '0px' } : undefined}
      {...rest}
    >
      <div aria-hidden="true" className="band-plate" />
      {children}
    </div>
  );
}
