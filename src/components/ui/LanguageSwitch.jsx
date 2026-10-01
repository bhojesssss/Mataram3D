import { cx } from '@/lib/cx';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Switch dua-posisi ID / EN.
 *
 * Satu tombol dengan role="switch", bukan dua tombol terpisah — statusnya
 * jadi tidak mungkin berbeda antara yang tampak (thumb emas) dan yang
 * dibacakan pembaca layar (aria-checked). Ukurannya disamakan dengan ikon
 * bundar lain di navbar (`h-[34px]`) supaya sebaris rapi.
 */
export function LanguageSwitch({ tone = 'light', className }) {
  const { lang, toggleLang } = useLanguage();
  const isEn = lang === 'en';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEn}
      aria-label={isEn ? 'Switch language to Indonesian' : 'Ganti bahasa ke Inggris'}
      onClick={toggleLang}
      className={cx(
        'relative inline-flex h-[34px] w-[64px] shrink-0 cursor-pointer items-center rounded-lg border p-[3px]',
        'transition-colors duration-[350ms] ease-heritage',
        tone === 'dark' ? 'border-tan/32 bg-forest-deep/35' : 'border-forest/18 bg-paper',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'absolute top-[3px] bottom-[3px] left-[3px] w-[29px] rounded-[6px] bg-gold',
          'transition-transform duration-[350ms] ease-heritage',
          isEn && 'translate-x-[29px]',
        )}
      />
      <span
        aria-hidden="true"
        className={cx(
          'relative z-[1] flex-1 text-center text-[0.6rem] font-medium tracking-[0.08em] transition-colors duration-[350ms] ease-heritage',
          !isEn ? 'text-forest-deep' : tone === 'dark' ? 'text-cream/60' : 'text-forest/50',
        )}
      >
        ID
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative z-[1] flex-1 text-center text-[0.6rem] font-medium tracking-[0.08em] transition-colors duration-[350ms] ease-heritage',
          isEn ? 'text-forest-deep' : tone === 'dark' ? 'text-cream/60' : 'text-forest/50',
        )}
      >
        EN
      </span>
    </button>
  );
}
