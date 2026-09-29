import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { contactEmail, mainLinks, moreLinks } from '@/data/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { HashLink } from '@/components/ui/HashLink';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

/**
 * Overlay navigasi layar penuh.
 *
 * Menu utama hilang di bawah 760px, jadi tanpa ini layout ponsel tidak punya
 * navigasi sama sekali. Dipakai homepage dan halaman dalam.
 */
export function MobileMenu({ open, onClose }) {
  const closeRef = useRef(null);
  const lastFocused = useRef(null);
  const { t } = useLanguage();

  // Kunci scroll, pindahkan fokus ke tombol tutup, kembalikan saat ditutup.
  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Kalau breakpoint dilewati sambil overlay terbuka, kunci scroll akan
    // terdampar di layout desktop yang tidak punya cara menutupnya.
    const wide = window.matchMedia('(min-width: 761px)');
    const onWiden = (e) => e.matches && onClose();
    wide.addEventListener('change', onWiden);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onWiden);
      lastFocused.current instanceof HTMLElement && lastFocused.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="menu"
      // Klik pada veil-nya sendiri — bukan pada tautan di dalamnya — menutup overlay.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-paper/92 p-[clamp(22px,5vw,56px)] backdrop-blur-[28px] backdrop-saturate-150"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-[1.2rem] tracking-[0.4em] indent-[0.4em] text-forest">MATARAM</p>
        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t({ id: 'Tutup menu', en: 'Close menu' })}
            className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-lg border border-forest/25 text-base text-forest transition-colors duration-[350ms] ease-heritage hover:bg-forest/12"
          >
            &#10005;
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[clamp(24px,5vw,56px)]">
          <nav aria-label={t({ id: 'Menu utama', en: 'Main menu' })} className="flex flex-col gap-1.5">
            <MenuLink to="/" onClose={onClose} end>{t({ id: 'Beranda', en: 'Home' })}</MenuLink>
            {mainLinks.map((link) => (
              <MenuLink key={link.to} to={link.to} onClose={onClose}>{t(link.label)}</MenuLink>
            ))}
          </nav>

          <nav aria-label={t({ id: 'Menu lainnya', en: 'More menu' })} className="flex flex-col justify-center gap-3">
            <h4 className="mb-1 text-[0.66rem] font-medium tracking-[0.28em] uppercase text-gold-deep">
              {t({ id: 'Lainnya', en: 'More' })}
            </h4>
            {moreLinks.map((link) => (
              <HashLink key={link.label.en} hash={link.hash} onClick={onClose} className={SECONDARY}>
                {t(link.label)}
              </HashLink>
            ))}
            <a href={`mailto:${contactEmail}`} className={SECONDARY}>
              {t({ id: 'Kontak', en: 'Contact' })}
            </a>
          </nav>
        </div>
      </div>

      <p className="border-t border-forest/18 pt-5 text-[0.66rem] tracking-[0.16em] text-ink/72">
        {t({ id: 'KERATON SURAKARTA HADININGRAT · JAWA', en: 'KERATON SURAKARTA HADININGRAT · JAVA' })}
      </p>
    </div>
  );
}

const SECONDARY = 'text-[0.86rem] text-ink-soft no-underline transition-colors duration-[350ms] ease-heritage hover:text-gold-deep';

function MenuLink({ to, end, onClose, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={cx(
        'font-display text-[clamp(2rem,7vw,3.1rem)] font-light leading-[1.2] text-forest no-underline',
        'transition-colors duration-[350ms] ease-heritage hover:text-gold-deep aria-[current=page]:text-gold-deep',
      )}
    >
      {children}
    </NavLink>
  );
}
