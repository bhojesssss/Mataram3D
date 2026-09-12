import { Component, lazy, Suspense } from 'react';
import { bootText } from './i18n';

/*
  Pintu masuk /admin/*. Seluruh kode dasbor ada di chunk terpisah yang baru
  diunduh saat URL admin dibuka, jadi pengunjung situs tidak ikut memuatnya.
*/
const AdminApp = lazy(() => import('./AdminApp'));

export default function AdminEntry() {
  return (
    <AdminErrorBoundary>
      <Suspense
        fallback={
          <div role="status" className="grid min-h-svh place-items-center text-[0.84rem] text-ink/72">
            {bootText('boot.loading')}
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    </AdminErrorBoundary>
  );
}

/**
 * Chunk gagal diunduh (mis. versi lama terbuka saat deploy baru) atau error saat
 * render: tampilkan jalan keluar, bukan layar kosong.
 */
class AdminErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[admin]', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="grid min-h-svh place-items-center px-5 text-center">
        <div>
          <p className="mb-5 text-[0.92rem] text-ink/88">{bootText('boot.failed')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-lg border border-forest/32 px-5 py-2.5 text-[0.84rem] text-forest hover:bg-forest/12"
          >
            {bootText('boot.reload')}
          </button>
        </div>
      </div>
    );
  }
}
