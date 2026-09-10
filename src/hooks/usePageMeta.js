import { useEffect } from 'react';

/**
 * Menyetel <title> dan meta description per halaman.
 *
 * Di MPA ini ada di tiap file HTML; sebagai SPA hanya ada satu dokumen, jadi
 * tiap route mengumumkan judulnya sendiri saat dipasang.
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;

    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    const previous = tag?.getAttribute('content');
    tag?.setAttribute('content', description);

    return () => {
      if (previous != null) tag?.setAttribute('content', previous);
    };
  }, [title, description]);
}
