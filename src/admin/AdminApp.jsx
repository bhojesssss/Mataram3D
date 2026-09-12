/** Peta route dasbor, dibungkus penyedia bahasa dan penjaga sesi. */
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { RequireAdmin } from './session';
import LoginPage from './pages/LoginPage';
import RecordsPage from './pages/RecordsPage';
import RecordFormRoute from './pages/RecordFormPage';

export default function AdminApp() {
  useNoIndex();

  return (
    <I18nProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route index element={<RecordsPage />} />
          <Route path="records/new" element={<RecordFormRoute />} />
          <Route path="records/:id" element={<RecordFormRoute />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </I18nProvider>
  );
}

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    return () => meta.remove();
  }, []);
}
