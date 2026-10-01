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

/** ~4 detik. Cukup untuk scene 3D selesai boot di mesin yang lambat. */
const MAX_FRAMES = 240;

/**
 * Halaman baru dibuka dari atas; tautan ber-hash menggeser ke section-nya.
 *
 * Dua alasan percobaannya diulang per frame. Datang dari halaman dalam,
 * targetnya belum tentu sudah ada di DOM. Dan di homepage, Lenis baru hidup
 * setelah scene 3D selesai boot — menggeser sebelum itu akan ditimpa begitu
 * Lenis mengambil alih posisi scroll. Percobaan terakhir dilakukan tanpa
 * syarat itu, supaya hash tetap sampai kalau WebGL gagal dan Lenis tak pernah
 * ada.
 */
function useRouteScroll({ pathname, hash, key }) {
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const needsSmooth = pathname === '/';
    let frames = 0;
    let raf = 0;

    const attempt = () => {
      frames += 1;
      const lastChance = frames >= MAX_FRAMES;
      if (scrollToHash(hash, { requireSmooth: needsSmooth && !lastChance }) || lastChance) return;
      raf = requestAnimationFrame(attempt);
    };
    attempt();

    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, key]);
}
