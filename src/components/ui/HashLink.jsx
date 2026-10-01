import { Link, useLocation } from 'react-router-dom';
import { scrollToHash } from '@/scroll/scrollBus';

/**
 * Tautan ke sebuah section di homepage, mis. <HashLink hash="#culture">.
 *
 * Kalau pembaca sudah di homepage, tidak ada navigasi sama sekali — cukup
 * digeser lewat Lenis supaya smoothing 3D-nya tidak dilangkahi. Dari halaman
 * dalam, router pindah ke "/" dan SiteLayout yang menggeser setelah homepage
 * benar-benar terpasang.
 */
export function HashLink({ hash, className, children, onClick, ...rest }) {
  const { pathname } = useLocation();

  const handleClick = (event) => {
    onClick?.(event);
    if (pathname !== '/') return;
    if (scrollToHash(hash)) event.preventDefault();
  };

  return (
    <Link to={`/${hash}`} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
