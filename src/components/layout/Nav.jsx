import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { mainLinks } from '@/data/navigation';
import { subscribeProgress } from '@/scroll/scrollBus';
import { MenuIcon, Rosette, SearchIcon } from '@/components/ui/Icons';

/*
  Tiga kolom, bukan space-between. space-between hanya menyamakan jarak, jadi
  brand yang lebar di kiri mendorong menu keluar dari titik tengah sebesar
  selisihnya terhadap kelompok ikon yang sempit. Rel 1fr di kedua sisi menaruh
  menu tepat di tengah berapa pun lebar brand-nya.
*/
const SHELL =
  'fixed inset-x-0 top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-8 border-b px-[clamp(20px,4vw,52px)] ' +
  'transition-[background-color,backdrop-filter,border-color,padding] duration-500 ease-heritage';

const SOLID = 'border-forest/12 bg-paper/86 backdrop-blur-[14px]';

const ICON =
  'grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-lg border border-forest/18 text-forest ' +
  'transition-[background-color,border-color] duration-[350ms] ease-heritage hover:border-gold hover:bg-gold/14';

/**
 * @param {'home'|'page'} variant
 *   'home' mulai transparan di atas hero lalu memadat saat digulir; 'page'
 *   tidak punya hero, jadi padat sejak frame pertama.
 */
export function Nav({ variant = 'page', menuOpen = false, onOpenMenu }) {
  const heroPassed = useHeroPassed();
  const solid = variant === 'page' || heroPassed;

  return (
    <header
      className={cx(
        SHELL,
        variant === 'page'
          ? cx(SOLID, 'h-[78px] py-0 max-[760px]:h-[60px] max-[760px]:px-[18px]')
          : solid
            ? cx(SOLID, 'py-3.5')
            : 'border-transparent py-[22px]',
      )}
    >
      <Link
        to="/"
        className="col-start-1 inline-flex items-center gap-2.5 justify-self-start font-display text-[1.18rem] font-medium tracking-[0.34em] indent-[0.34em] whitespace-nowrap text-forest no-underline"
      >
        <span className="text-gold">
          <Rosette />
        </span>
        MATARAM
      </Link>

      <nav aria-label="Navigasi utama" className="col-start-2 flex justify-self-center gap-[clamp(14px,2.2vw,34px)] max-[760px]:hidden">
        {mainLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={cx(
              'relative pb-[3px] text-[0.76rem] tracking-[0.14em] uppercase text-forest no-underline opacity-[0.78]',
              'transition-opacity duration-[350ms] ease-heritage hover:opacity-100',
              // Garis bawah emas yang menyapu dari kiri; halaman aktif memakainya permanen.
              "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-[450ms] after:ease-heritage after:content-['']",
              'hover:after:scale-x-100',
              'aria-[current=page]:opacity-100 aria-[current=page]:after:scale-x-100',
            )}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="col-start-3 flex justify-self-end gap-2">
        <Link to="/archive" aria-label="Cari di arsip" className={ICON}>
          <SearchIcon />
        </Link>
        {/* Hamburger hanya untuk mobile — di desktop menu utamanya sudah tampil penuh. */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-controls="menu"
          aria-expanded={menuOpen}
          aria-label="Buka menu"
          className={cx(ICON, 'hidden max-[760px]:grid')}
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}

/** True begitu judul hero lewat di bawah bar. Hanya relevan di homepage. */
function useHeroPassed() {
  const [passed, setPassed] = useState(false);
  useEffect(() => subscribeProgress((p) => setPassed(p > 0.035)), []);
  return passed;
}
