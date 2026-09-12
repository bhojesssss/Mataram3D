import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { AdminShell } from './AdminShell';
import { useI18n } from './i18n';
import { Notice, PrimaryButton } from './ui';

const SessionContext = createContext(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession dipakai di luar <RequireAdmin>');
  return value;
}

/**
 * Tujuan balik setelah login hanya boleh halaman dasbor. `?next=` datang dari
 * URL yang bisa dikarang siapa saja, jadi nilai lain diganti /admin.
 */
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
}

/** Kegagalan di sisi klien diterjemahkan; pesan dari backend ditampilkan apa adanya. */
export function errorMessage(error, t) {
  if (error?.code) return t(`errors.${error.code}`);
  return error?.message || t('errors.unexpected');
}

/**
 * Gerbang semua halaman dasbor selain login.
 *
 * Cookie sesi httpOnly tidak bisa dibaca JS, jadi status login ditanyakan ke
 * GET /auth/me. Sekali saat dasbor dibuka; setelah itu sesi dijaga refresh
 * otomatis di api.js, dan halaman memanggil `expire()` kalau refresh pun gagal.
 */
export function RequireAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [session, setSession] = useState({ status: 'checking' });

  const toLogin = useCallback(
    (reason) => {
      const params = new URLSearchParams({ next: location.pathname + location.search });
      if (reason) params.set('reason', reason);
      navigate(`/admin/login?${params}`, { replace: true });
    },
    [navigate, location.pathname, location.search],
  );

  const check = useCallback(() => {
    setSession({ status: 'checking' });
    api.me().then(
      (admin) => setSession({ status: 'ready', admin }),
      (error) => (error.status === 401 ? toLogin() : setSession({ status: 'offline', error })),
    );
  }, [toLogin]);

  // Sengaja hanya saat dipasang: berpindah antarhalaman dasbor tidak perlu bertanya ulang.
  useEffect(() => {
    check();
  }, []);

  const value = useMemo(
    () => ({
      admin: session.admin,
      expire: () => toLogin('expired'),
      signOut: async () => {
        try {
          await api.logout();
        } catch {
          // Gagal menghubungi server bukan alasan menahan admin di dasbor.
        }
        navigate('/admin/login', { replace: true });
      },
    }),
    [session.admin, toLogin, navigate],
  );

  if (session.status === 'checking') {
    return (
      <div role="status" className="grid min-h-svh place-items-center text-[0.84rem] text-ink/72">
        {t('boot.checkingSession')}
      </div>
    );
  }

  if (session.status === 'offline') {
    return (
      <div className="grid min-h-svh place-items-center px-5">
        <div className="w-full max-w-md space-y-5 text-center">
          <Notice tone="error">{errorMessage(session.error, t)}</Notice>
          <PrimaryButton onClick={check}>{t('common.tryAgain')}</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </SessionContext.Provider>
  );
}

/**
 * Ubah error API jadi pesan untuk ditampilkan. 401 di sini berarti refresh pun
 * gagal (sesi benar-benar habis): admin langsung dialihkan ke login dan hook ini
 * mengembalikan null supaya halaman tidak menampilkan apa-apa.
 */
export function useApiError() {
  const { expire } = useSession();
  const { t } = useI18n();
  return useCallback(
    (error) => {
      if (error?.status === 401) {
        expire();
        return null;
      }
      return errorMessage(error, t);
    },
    [expire, t],
  );
}
