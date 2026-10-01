import { Link } from 'react-router-dom';
import { contactEmail, mainLinks, moreLinks, visitAddress } from '@/data/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import { HashLink } from '@/components/ui/HashLink';
import { Rule } from '@/components/ui/Type';
import { Wrap } from '@/components/ui/Wrap';

/*
  Di ponsel (≤760px, breakpoint yang sama dengan hamburger) footer dipadatkan:
  dua daftar tautan tetap berdampingan, alamat jadi satu paragraf, dan ornamen
  di bawah nama dilepas. Versi lebarnya lebih dari satu layar penuh di 425px —
  terlalu panjang untuk bagian yang biasanya cuma dilirik.

  Tautan diberi py-1, bukan mb, supaya area sentuhnya tetap di atas 24px
  meski jaraknya dirapatkan.
*/
const LINK =
  'mb-2.5 block text-[0.88rem] text-cream/80 no-underline transition-colors duration-[350ms] ease-heritage hover:text-paper ' +
  'max-[760px]:mb-0 max-[760px]:py-1 max-[760px]:text-[0.84rem]';
const HEADING =
  'mb-4 text-[0.68rem] font-medium tracking-[0.2em] uppercase text-tan max-[760px]:mb-2 max-[760px]:text-[0.6rem]';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative z-[2] bg-forest pt-[clamp(84px,10vw,120px)] pb-8 text-cream max-[760px]:pt-12 max-[760px]:pb-6">
      <Wrap>
        <div className="grid grid-cols-1 gap-[clamp(44px,6vw,64px)] border-b border-tan/22 pb-[clamp(44px,6vw,64px)] min-[901px]:grid-cols-[1fr_1.2fr] max-[760px]:gap-7 max-[760px]:pb-7">
          <div>
            <p className="font-display text-[2rem] tracking-[0.3em] indent-[0.3em] text-paper max-[760px]:indent-0 max-[760px]:text-[1.5rem]">MATARAM</p>
            <p className="mt-1.5 text-[0.68rem] tracking-[0.28em] indent-[0.28em] text-tan max-[760px]:mt-1 max-[760px]:indent-0 max-[760px]:text-[0.6rem]">
              {t({ id: 'WARISAN KERAJAAN LUHUR', en: 'THE ROYAL HERITAGE' })}
            </p>
            <Rule small lead={false} className="my-4 max-[760px]:hidden" />
            <p className="text-[0.7rem] tracking-[0.2em] text-cream/60 max-[760px]:hidden">
              {t({ id: 'SEJARAH · BUDAYA · WARISAN', en: 'HISTORY · CULTURE · HERITAGE' })}
            </p>
          </div>

          <nav
            aria-label={t({ id: 'Navigasi footer', en: 'Footer navigation' })}
            className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8 max-[760px]:grid-cols-2 max-[760px]:gap-x-5 max-[760px]:gap-y-6"
          >
            <div>
              <h4 className={HEADING}>{t({ id: 'Jelajahi', en: 'Explore' })}</h4>
              {mainLinks.map((link) => (
                <Link key={link.to} to={link.to} className={LINK}>{t(link.label)}</Link>
              ))}
            </div>

            <div>
              <h4 className={HEADING}>{t({ id: 'Lainnya', en: 'More' })}</h4>
              {moreLinks.map((link) => (
                <HashLink key={link.label.en} hash={link.hash} className={LINK}>{t(link.label)}</HashLink>
              ))}
              <a href={`mailto:${contactEmail}`} className={LINK}>{t({ id: 'Kontak', en: 'Contact' })}</a>
            </div>

            <div className="max-[760px]:col-span-2">
              <h4 className={HEADING}>{t({ id: 'Kunjungi', en: 'Visit' })}</h4>
              <p className="mb-3.5 text-[0.8rem] leading-[1.9] text-cream/70 max-[760px]:mb-1.5 max-[760px]:text-[0.78rem] max-[760px]:leading-[1.7]">
                {visitAddress.map((line, i) => (
                  <span key={i} className="block max-[760px]:inline">
                    {t(line)}
                    {i < visitAddress.length - 1 && <span className="min-[760px]:hidden">, </span>}
                  </span>
                ))}
              </p>
              <a href={`mailto:${contactEmail}`} className="text-[0.8rem] text-gold no-underline transition-colors duration-[350ms] ease-heritage hover:text-tan">
                {contactEmail}
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 max-[760px]:mt-5 max-[760px]:gap-x-3 max-[760px]:gap-y-1">
          <p className="text-[0.76rem] text-cream/50 max-[760px]:text-[0.68rem]">
            {t({ id: '© 2026 Karaton Mataram. Hak cipta dilindungi.', en: '© 2026 Karaton Mataram. All rights reserved.' })}
          </p>
          <p className="font-display text-[0.92rem] italic text-gold/78 max-[760px]:text-[0.84rem]">Manunggaling Kawula Gusti</p>
        </div>
      </Wrap>
    </footer>
  );
}
