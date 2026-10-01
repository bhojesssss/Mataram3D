import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { contactEmail, mainLinks, moreLinks } from '@/data/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { HashLink } from '@/components/ui/HashLink';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

/**
 * Menu navigasi mobile — panel kaca yang turun dari atas layar.
 *
 * Menu utama hilang di bawah 1100px (lihat Nav), jadi tanpa ini ponsel dan
 * tablet tidak punya navigasi sama sekali. Dipakai homepage dan halaman dalam.
 * Di tablet panelnya tidak selebar layar — cukup 400px di pojok kanan, di
 * bawah hamburger-nya.
 *
 * Panelnya kaca (liquid-glass di index.css): halaman di belakangnya tetap
 * terlihat, diburamkan. Veil di luar panel meredupkan sisanya dan menutup
 * menu kalau disentuh. Keduanya bersaudara, bukan bersarang — backdrop-filter
 * di dalam elemen lain yang juga ber-backdrop-filter hanya bisa memburamkan
 * induknya sendiri, bukan halaman.
 *
 * Tetap terpasang selama animasi keluarnya berjalan; baru dilepas saat
 * animasi panel selesai.
 */
export function MobileMenu({ open, onClose }) {
  const closeRef = useRef(null);
  const lastFocused = useRef(null);
  const [present, setPresent] = useState(open);
  const { t } = useLanguage();

  if (open && !present) setPresent(true);

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
    const wide = window.matchMedia('(min-width: 1100px)');
    const onWiden = (e) => e.matches && onClose();
    wide.addEventListener('change', onWiden);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onWiden);
      lastFocused.current instanceof HTMLElement && lastFocused.current.focus();
    };
  }, [open, onClose]);

  if (!present) return null;

  const closing = !open;
  let order = 0;

  return (
    <div className={cx('fixed inset-0 z-[90]', closing && 'pointer-events-none')}>
      <div aria-hidden="true" onClick={onClose} className={cx('menu-veil absolute inset-0', closing && 'is-leaving')} />

      <div
        id="menu"
        onAnimationEnd={(e) => closing && e.target === e.currentTarget && setPresent(false)}
        className={cx(
          'menu-sheet liquid-glass absolute inset-x-2.5 top-2.5 flex max-h-[calc(100dvh-20px)] flex-col overflow-y-auto rounded-[26px] p-5 min-[640px]:left-auto min-[640px]:w-[400px]',
          closing && 'is-leaving',
        )}
      >
        <div className="flex items-center justify-between">
          <p className="pl-1 font-display text-[1.1rem] tracking-[0.4em] indent-[0.4em] text-forest">MATARAM</p>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t({ id: 'Tutup menu', en: 'Close menu' })}
              className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-lg border border-forest/18 bg-paper text-[0.8rem] text-forest transition-colors duration-[350ms] ease-heritage hover:bg-forest/12"
            >
              &#10005;
            </button>
          </div>
        </div>

        <nav aria-label={t({ id: 'Menu utama', en: 'Main menu' })} className="mt-7 flex flex-col gap-1 pl-1">
          <MenuLink to="/" onClose={onClose} order={order++} end>{t({ id: 'Beranda', en: 'Home' })}</MenuLink>
          {mainLinks.map((link) => (
            <MenuLink key={link.to} to={link.to} onClose={onClose} order={order++}>{t(link.label)}</MenuLink>
          ))}
        </nav>

        <nav aria-label={t({ id: 'Menu lainnya', en: 'More menu' })} className="mt-7 border-t border-forest/14 pt-5 pl-1">
          <h4 className="menu-item mb-3 text-[0.62rem] font-medium tracking-[0.28em] uppercase text-gold-deep" style={{ '--i': order++ }}>
            {t({ id: 'Lainnya', en: 'More' })}
          </h4>
          <div className="grid grid-cols-2 gap-x-4">
            {moreLinks.map((link) => (
              <HashLink key={link.label.en} hash={link.hash} onClick={onClose} className={SECONDARY} style={{ '--i': order++ }}>
                {t(link.label)}
              </HashLink>
            ))}
            <a href={`mailto:${contactEmail}`} className={SECONDARY} style={{ '--i': order++ }}>
              {t({ id: 'Kontak', en: 'Contact' })}
            </a>
          </div>
        </nav>

        <p className="menu-item mt-6 pl-1 text-[0.6rem] tracking-[0.16em] text-ink/60" style={{ '--i': order++ }}>
          {t({ id: 'KERATON SURAKARTA HADININGRAT · JAWA', en: 'KERATON SURAKARTA HADININGRAT · JAVA' })}
        </p>
      </div>
    </div>
  );
}

const SECONDARY =
  'menu-item py-[7px] text-[0.86rem] text-ink-soft no-underline transition-colors duration-[350ms] ease-heritage hover:text-gold-deep';

function MenuLink({ to, end, onClose, order, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      style={{ '--i': order }}
      className={cx(
        'menu-item font-display text-[clamp(1.9rem,7vw,2.6rem)] font-light leading-[1.2] text-forest no-underline',
        'transition-colors duration-[350ms] ease-heritage hover:text-gold-deep aria-[current=page]:text-gold-deep',
      )}
    >
      {children}
    </NavLink>
  );
}
