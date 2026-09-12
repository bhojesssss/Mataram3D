import { Link } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { ArrowRight } from './Icons';

/*
  Atom tipografi yang muncul di banyak halaman. Tiap komponen memegang satu
  set class Tailwind, jadi ukuran/jarak huruf hanya ditulis sekali.

  Prop `tone`: 'light' (default) untuk latar krem/kertas, 'dark' untuk dua blok
  hijau — kutipan Royal House dan penutup About. Di CSS lama ini ditangani
  dengan menukar custom property di dalam .psec--forest; di sini eksplisit.
*/

/** Label kecil huruf kapital di atas judul. Dipakai di halaman dalam. */
export function Eyebrow({ children, tone = 'light', className, as: Tag = 'p', ...rest }) {
  return (
    <Tag
      className={cx(
        'mb-5 text-[0.64rem] font-medium tracking-[0.34em] uppercase',
        // Di panel hijau, emas murni cuma 4.27:1 — tan yang dipakai (6.18:1), dan
        // itu memang perannya di palet: trim dan teks di atas latar gelap.
        tone === 'dark' ? 'text-tan' : 'text-gold-deep',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Versi homepage dari Eyebrow.
 *
 * Dulu `text-gold` + halo. Emas murni di atas latar terang cuma 1.93:1 — pada
 * 0.72rem huruf kapital berjarak lebar, itu praktis tidak terbaca, dan halo
 * tidak menolong karena text-shadow menambah glow di luar huruf, bukan kontras
 * di dalamnya. Sekarang `gold-deep` (5.00:1 di kasus terburuk) dan kontrasnya
 * datang dari surface yang menampungnya.
 */
export function Kicker({ children, className, ...rest }) {
  return (
    <p
      className={cx('mb-4 text-[0.72rem] font-medium tracking-[0.26em] uppercase text-gold-deep', className)}
      {...rest}
    >
      {children}
    </p>
  );
}

/** Judul section homepage. Kontrasnya dari surface induknya, bukan dari halo. */
export function SectionTitle({ children, className, ...rest }) {
  return (
    <h2
      className={cx(
        'mb-8 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-normal leading-[1.12] tracking-[0.005em] text-forest',
        className,
      )}
      {...rest}
    >
      {children}
    </h2>
  );
}

/** Tautan "lanjut" homepage — panahnya melebar saat hover, bukan bergeser. */
export function LinkMore({ to, href, children, className, ...rest }) {
  const classes = cx(
    'inline-flex items-center gap-2 text-[0.78rem] font-medium tracking-[0.1em] uppercase no-underline',
    // hover:text-gold dulu di sini. Warna hover tetap harus terbaca — emas murni
    // di atas surface cuma 1.55:1, jadi tautan justru menghilang saat disentuh.
    'text-forest transition-[gap,color] duration-[400ms] ease-heritage hover:gap-[15px] hover:text-gold-deep',
    className,
  );
  const inner = (
    <>
      {children}
      <ArrowRight size={14} />
    </>
  );

  return to ? (
    <Link to={to} className={classes} {...rest}>{inner}</Link>
  ) : (
    <a href={href} className={classes} {...rest}>{inner}</a>
  );
}

/** Tautan bergaris bawah di halaman dalam — terbaca sebagai lanjutan teks, bukan tombol. */
export function Dlink({ to, children, className, ...rest }) {
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex items-center gap-3 border-b border-forest/30 pb-1.5 text-[0.7rem] tracking-[0.24em] uppercase no-underline',
        'text-gold-deep transition-[gap,color] duration-[400ms] ease-heritage hover:gap-[18px] hover:text-forest',
        className,
      )}
      {...rest}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Tombol garis. Render sebagai <Link> kalau diberi `to`, kalau tidak sebagai <button>. */
export function ButtonOutline({ to, tone = 'light', children, className, ...rest }) {
  const classes = cx(
    'inline-flex cursor-pointer items-center gap-3 rounded-lg border px-[30px] py-3.5 text-[0.68rem] tracking-[0.24em] uppercase no-underline',
    'transition-[background-color,gap] duration-[400ms] ease-heritage hover:gap-[18px]',
    tone === 'dark'
      ? 'border-gold/45 text-paper hover:bg-gold/20'
      : 'border-forest/32 text-forest hover:bg-forest/12',
    className,
  );

  return to ? (
    <Link to={to} className={classes} {...rest}>{children}</Link>
  ) : (
    <button type="button" className={classes} {...rest}>{children}</button>
  );
}

/** CTA emas di hero. */
export function ButtonGold({ href, children, className, ...rest }) {
  return (
    <a
      href={href}
      className={cx(
        /*
          Teks hijau tua di atas emas, bukan krem. Moodboard menggambarnya krem,
          tapi krem di atas #C9A34E cuma 2.16:1 — pada CTA utama hero itu tidak
          bisa dipertahankan. Emasnya sendiri tetap, jadi tombolnya masih terbaca
          sebagai tombol yang sama; yang berubah hanya warna hurufnya (5.99:1).
        */
        'inline-flex items-center gap-3 rounded-lg border border-transparent bg-gold px-[34px] py-[15px] text-[0.76rem] font-medium tracking-[0.2em] uppercase text-forest-deep no-underline',
        'transition-[background-color,color,gap,border-color] duration-[450ms] ease-heritage',
        // Sama seperti LinkMore: saat isian emasnya dilepas, warna teksnya harus
        // turun ke gold-deep, kalau tidak tombolnya kosong saat di-hover.
        'hover:gap-5 hover:border-gold hover:bg-transparent hover:text-gold-deep',
        className,
      )}
      {...rest}
    >
      {children}
      <ArrowRight />
    </a>
  );
}

/**
 * Garis rambut emas dengan ornamen bintang moodboard di tengahnya.
 *
 * `lead={false}` menghilangkan ruas kiri — dipakai di footer, tempat garisnya
 * rata kiri dan ruas kiri akan menabrak tepi kolom.
 */
export function Rule({ small = false, lead = true, className }) {
  const arm = small ? 'w-[42px]' : 'w-[clamp(48px,12vw,130px)]';

  return (
    <div
      aria-hidden="true"
      className={cx('my-8 flex items-center gap-3.5', lead ? 'justify-center' : 'justify-start', className)}
    >
      {lead && <span className={cx(arm, 'h-px bg-gradient-to-r from-transparent to-gold')} />}
      <span className="text-[0.85rem] leading-none text-gold">&#10022;</span>
      <span className={cx(arm, 'h-px bg-gradient-to-r from-gold to-transparent')} />
    </div>
  );
}
