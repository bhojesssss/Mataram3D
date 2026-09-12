import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import Home from '@/pages/Home';
import History from '@/pages/History';
import RoyalHouse from '@/pages/RoyalHouse';
import Palace from '@/pages/Palace';
import Archive from '@/pages/Archive';
import About from '@/pages/About';
import AdminEntry from '@/admin/AdminEntry';

/**
 * Peta route.
 *
 * Dulu ini enam file HTML terpisah dan Vite build multi-entry. Sekarang satu
 * dokumen: URL-nya sama persis (/history, /royal-house, …) hanya tanpa .html.
 */
export default function App() {
  return (
    <Routes>
      {/* Dasbor admin: di luar SiteLayout, tanpa navbar dan footer situs. */}
      <Route path="/admin/*" element={<AdminEntry />} />
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/royal-house" element={<RoyalHouse />} />
        <Route path="/palace" element={<Palace />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/about" element={<About />} />
        {/* URL tak dikenal jatuh ke homepage, bukan halaman kosong. */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
