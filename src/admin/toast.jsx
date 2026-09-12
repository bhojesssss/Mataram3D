/** Notifikasi singkat setelah sebuah aksi berhasil. */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { useI18n } from './i18n';
import { CloseIcon } from './icons';

const ToastContext = createContext(null);
const DURATION_MS = 4500;

export function ToastProvider({ children }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (message, tone = 'info') => {
      nextId.current += 1;
      const id = nextId.current;

      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-5 z-50 flex flex-col items-center gap-2 min-[720px]:inset-x-auto min-[720px]:right-6 min-[720px]:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex w-full max-w-[420px] animate-fade-in items-start gap-3 rounded-lg px-4 py-3 text-[0.86rem] leading-snug',
              'shadow-[0_10px_30px_rgb(27_47_33/0.28)]',
              toast.tone === 'error' ? 'bg-[#7d2f25] text-paper' : 'bg-forest-deep text-cream',
            )}
          >
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t('common.dismiss')}
              className="-mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md opacity-70 hover:bg-white/10 hover:opacity-100"
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast dipakai di luar <ToastProvider>');
  return show;
}
