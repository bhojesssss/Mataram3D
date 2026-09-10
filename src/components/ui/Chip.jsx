import { cx } from '@/lib/cx';

/**
 * Tombol pil kecil — filter kategori di Archive. State-nya dibawa
 * aria-pressed, jadi gaya "terpilih" dan yang dibacakan pembaca layar tidak
 * bisa berbeda.
 */
export function Chip({ pressed, onClick, uppercase = false, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'cursor-pointer rounded-lg border border-forest/18 px-4 py-[9px] text-[0.66rem] tracking-[0.1em] text-ink/88',
        'transition-[background-color,border-color,color] duration-[350ms] ease-heritage hover:border-gold hover:text-forest',
        'aria-pressed:border-gold aria-pressed:bg-gold/26 aria-pressed:text-forest',
        uppercase && 'tracking-[0.18em] uppercase',
      )}
    >
      {children}
    </button>
  );
}
