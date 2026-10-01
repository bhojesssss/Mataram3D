import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Konteks bahasa situs — Indonesia ⇄ Inggris.
 *
 * Kontennya (data/*.js dan copy inline di tiap halaman) ditulis sebagai
 * pasangan `{ id, en }`. `t()` di bawah ini memilih sisi yang aktif; string
 * polos (bukan pasangan) diteruskan apa adanya, jadi field yang memang sama
 * di kedua bahasa — nama tempat, proper noun, alamat — tidak perlu dibungkus.
 */

const STORAGE_KEY = 'mataram-lang';
const LanguageContext = createContext(null);

function readStoredLang() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'id' || saved === 'en' ? saved : null;
  } catch {
    return null;
  }
}

/** Diekspor supaya bisa dipakai di luar komponen kalau perlu (mis. util non-hook). */
export function pick(field, lang) {
  if (field == null) return field;
  if (typeof field === 'string') return field;
  return field[lang] ?? field.id ?? field.en ?? '';
}

export function LanguageProvider({ children }) {
  // Default 'id': brand dan homepage situs ini berbahasa Indonesia.
  const [lang, setLang] = useState(() => readStoredLang() ?? 'id');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage tidak tersedia (mode privat, dsb) — bahasa tetap ganti, hanya tidak tersimpan.
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((current) => (current === 'id' ? 'en' : 'id')),
      t: (field) => pick(field, lang),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage harus dipakai di dalam <LanguageProvider>.');
  return ctx;
}
