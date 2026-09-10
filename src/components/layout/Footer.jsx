import { Link } from 'react-router-dom';
import { contactEmail, mainLinks, moreLinks, visitAddress } from '@/data/navigation';
import { HashLink } from '@/components/ui/HashLink';
import { Rule } from '@/components/ui/Type';
import { Wrap } from '@/components/ui/Wrap';

const LINK = 'mb-2.5 block text-[0.88rem] text-cream/80 no-underline transition-colors duration-[350ms] ease-heritage hover:text-paper';
const HEADING = 'mb-4 text-[0.68rem] font-medium tracking-[0.2em] uppercase text-tan';

export function Footer() {
  return (
    <footer className="relative z-[2] bg-forest pt-[clamp(84px,10vw,120px)] pb-8 text-cream">
      <Wrap>
        <div className="grid grid-cols-1 gap-[clamp(44px,6vw,64px)] border-b border-tan/22 pb-[clamp(44px,6vw,64px)] min-[901px]:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="font-display text-[2rem] tracking-[0.3em] indent-[0.3em] text-paper">MATARAM</p>
            <p className="mt-1.5 text-[0.68rem] tracking-[0.28em] indent-[0.28em] text-tan">THE ROYAL HERITAGE</p>
            <Rule small lead={false} className="my-4" />
            <p className="text-[0.7rem] tracking-[0.2em] text-cream/60">SEJARAH &middot; BUDAYA &middot; WARISAN</p>
          </div>

          <nav aria-label="Navigasi footer" className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8">
            <div>
              <h4 className={HEADING}>Explore</h4>
              {mainLinks.map((link) => (
                <Link key={link.to} to={link.to} className={LINK}>{link.label}</Link>
              ))}
            </div>

            <div>
              <h4 className={HEADING}>More</h4>
              {moreLinks.map((link) => (
                <HashLink key={link.label} hash={link.hash} className={LINK}>{link.label}</HashLink>
              ))}
              <a href={`mailto:${contactEmail}`} className={LINK}>Contact</a>
            </div>

            <div>
              <h4 className={HEADING}>Visit</h4>
              <p className="mb-3.5 text-[0.8rem] leading-[1.9] text-cream/70">
                {visitAddress.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </p>
              <a href={`mailto:${contactEmail}`} className="text-[0.8rem] text-gold no-underline transition-colors duration-[350ms] ease-heritage hover:text-tan">
                {contactEmail}
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[0.76rem] text-cream/50">&copy; 2026 Karaton Mataram. All rights reserved.</p>
          <p className="font-display text-[0.92rem] italic text-gold/78">Manunggaling Kawula Gusti</p>
        </div>
      </Wrap>
    </footer>
  );
}
