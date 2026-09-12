/** Kerangka tampilan dasbor: header, pengalih bahasa, dan area konten. */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { Rosette } from '@/components/ui/Icons';
import { Wrap } from '@/components/ui/Wrap';
import { LanguageSwitch, useI18n } from './i18n';
import { ExternalIcon } from './icons';
import { useSession } from './session';
import { ToastProvider } from './toast';
import { FOCUS } from './ui';

export function AdminShell({ children }) {
  const { admin, signOut } = useSession();
  const { t } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ToastProvider>
      <header className="sticky top-0 z-30 h-16 bg-forest-deep text-cream">

        <Wrap className="flex h-full items-center justify-between gap-3 max-[400px]:gap-2">
          <Link to="/admin" className={cx('inline-flex min-w-0 items-center gap-2.5 rounded-md whitespace-nowrap no-underline', FOCUS)}>
            <span className="text-gold">
              <Rosette size={22} />
            </span>
            <span className="font-display text-[1.05rem] font-medium tracking-[0.3em] text-cream max-[380px]:tracking-[0.2em]">
              MATARAM
            </span>
            <span className="ml-1 border-l border-cream/20 pl-3 text-[0.62rem] font-medium tracking-[0.22em] text-gold max-[560px]:hidden">
              {t('shell.section')}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 max-[400px]:gap-1 min-[640px]:gap-3">
            <a
              href="/archive"
              target="_blank"
              rel="noopener"
              className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.8rem] whitespace-nowrap text-cream/80 hover:text-cream', FOCUS)}
            >
              <ExternalIcon size={15} />
              <span className="max-[720px]:sr-only">{t('shell.viewSite')}</span>
            </a>
            <LanguageSwitch tone="dark" />
            <span className="hidden items-center gap-2 border-l border-cream/15 pl-3 min-[900px]:flex">
              <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-full bg-gold/20 text-[0.78rem] font-medium text-gold"
              >
                {admin.email.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[200px] truncate text-[0.8rem] text-cream/80">{admin.email}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className={cx(
                'cursor-pointer rounded-lg border border-cream/25 px-3 py-1.5 text-[0.8rem] whitespace-nowrap text-cream',
                'transition-colors duration-[350ms] ease-heritage hover:border-gold hover:text-gold',
                FOCUS,
              )}
            >
              {t('shell.signOut')}
            </button>
          </div>
        </Wrap>
      </header>

      <main className="pb-24">{children}</main>
    </ToastProvider>
  );
}
