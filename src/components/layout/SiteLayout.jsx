import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { scrollToHash } from '@/scroll/scrollBus';
import { HomeBackdrop } from '@/components/home/HomeBackdrop';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { Footer } from './Footer';

/**
 * Kerangka bersama semua halaman: navbar, overlay menu, konten, footer.
 *
 * Di MPA ini disalin ulang di enam file HTML. Sebagai satu layout route,
 * navbar dan footer tidak pernah lagi bisa berbeda antar halaman.
 */
export function SiteLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  // Overlay tidak boleh bertahan melewati perpindahan halaman.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  useRouteScroll(location);

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>

      {isHome && <HomeBackdrop />}

      <Nav
        variant={isHome ? 'home' : 'page'}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* z-[2] menaruh konten di atas canvas 3D yang fixed di homepage. */}
      <main id="main" className="relative z-[2]">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

/** ~4 detik. Batas menunggu target hash muncul di DOM. */
const MAX_FRAMES = 240;

/**
 * Halaman baru dibuka dari atas; tautan ber-hash menggeser ke section-nya.
 *
 * Percobaannya diulang per frame karena, datang dari halaman dalam, targetnya
 * belum tentu sudah ada di DOM saat efek ini jalan.
 */
function useRouteScroll({ pathname, hash, key }) {
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    let frames = 0;
    let raf = 0;

    const attempt = () => {
      frames += 1;
      if (scrollToHash(hash) || frames >= MAX_FRAMES) return;
      raf = requestAnimationFrame(attempt);
    };
    attempt();

    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, key]);
}
