import { cx } from '@/lib/cx';
import { Wrap } from './Wrap';
import { Eyebrow } from './Type';

/*
  Potongan tata letak yang dipakai bersama oleh halaman-halaman dalam.
  Homepage punya aturannya sendiri dan tidak memakai apa pun dari file ini.
*/

/** 78px membersihkan navbar yang fixed; sisanya ruang napas pembuka. */
export const HEAD_PADDING = 'pt-[calc(78px+clamp(46px,6vw,84px))] max-[760px]:pt-[104px]';

/** Judul besar pembuka halaman. <em> di dalamnya tampil miring dan lebih redup. */
export function PageTitle({ children, className }) {
  return (
    <h1
      className={cx(
        'font-display text-[clamp(2.4rem,5.6vw,5.2rem)] font-light leading-[1.02] text-forest',
        '[&_em]:italic [&_em]:text-ink/88',
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function PageLede({ children, className }) {
  return (
    <p className={cx('max-w-[44ch] text-[clamp(0.86rem,1.1vw,1rem)] leading-[1.9] text-ink/72', className)}>
      {children}
    </p>
  );
}

/**
 * Kepala halaman dua kolom: judul di kiri, pengantar rata bawah di kanan.
 * Dipakai History dan Palace; Royal House, Archive, dan About masing-masing
 * punya bentuk pembuka sendiri.
 */
export function PageHeader({ eyebrow, title, lede }) {
  return (
    <div className={cx(HEAD_PADDING, 'border-b border-forest/18 bg-paper pb-[clamp(36px,4vw,60px)]')}>
      <Wrap>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-end gap-[clamp(20px,3vw,60px)]">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <PageTitle>{title}</PageTitle>
          </div>
          <PageLede>{lede}</PageLede>
        </div>
      </Wrap>
    </div>
  );
}

const TONES = {
  cream: 'bg-cream text-ink',
  paper: 'bg-paper text-ink',
  // Krem dengan garis atas — memisahkan dua pita terang yang berdampingan.
  banded: 'border-t border-forest/16 bg-cream text-ink',
  // Hijau yang lebih dalam dari footer. Keduanya duduk di kaki halaman dan
  // kalau senada akan melebur jadi satu massa hijau panjang.
  forest: 'bg-forest-deep text-cream',
};

export function PSection({ tone = 'cream', className, children, ...rest }) {
  return (
    <section className={cx('py-[clamp(48px,7vw,110px)]', TONES[tone], className)} {...rest}>
      {children}
    </section>
  );
}

/** Judul display di dalam badan halaman. */
export function DisplayHeading({ children, className }) {
  return (
    <h2
      className={cx(
        'mb-5 font-display text-[clamp(1.85rem,3.8vw,3.3rem)] font-light leading-[1.1] text-forest',
        '[&_em]:italic [&_em]:text-ink/88',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Paragraf badan halaman. `dim` untuk kalimat pendukung. */
export function Prose({ dim = false, children, className }) {
  return (
    <p
      className={cx(
        'mb-4 text-[clamp(0.86rem,1.1vw,1rem)] leading-[1.95] text-pretty last:mb-0',
        dim ? 'text-ink/72' : 'text-ink/88',
        className,
      )}
    >
      {children}
    </p>
  );
}
