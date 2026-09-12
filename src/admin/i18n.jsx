/** Penyedia bahasa dasbor (ID dan EN) beserta tombol pengalihnya. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cx } from '@/lib/cx';
import { messages } from './messages';
import { FOCUS } from './ui';

const STORAGE_KEY = 'mataram-admin-lang';

export const LANGUAGES = [
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia' },
  { code: 'en', label: 'EN', name: 'English' },
];

export function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in messages) return saved;
  } catch {
  }
  return 'id';
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => node?.[part], dictionary);
}

function translate(lang, key, params) {
  const value = lookup(messages[lang], key) ?? lookup(messages.id, key) ?? key;
  return typeof value === 'function' ? value(params ?? {}) : value;
}

export function bootText(key) {
  return translate(initialLang(), key);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
  }, []);

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n dipakai di luar <I18nProvider>');
  return value;
}

export function LanguageSwitch({ tone = 'dark', className }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cx(
        'inline-flex shrink-0 rounded-lg border p-0.5',
        tone === 'dark' ? 'border-cream/25' : 'border-forest/22 bg-paper',
        className,
      )}
    >
      {LANGUAGES.map((option) => {
        const active = option.code === lang;
        return (
          <button
            key={option.code}
            type="button"
            lang={option.code}
            aria-label={option.name}
            aria-pressed={active}
            onClick={() => setLang(option.code)}
            className={cx(
              'w-[2.1rem] cursor-pointer rounded-md py-1 text-center text-[0.7rem] font-medium tracking-[0.08em]',
              'transition-colors duration-[350ms] ease-heritage',
              tone === 'dark'
                ? active
                  ? 'bg-gold text-forest-deep'
                  : 'text-cream/75 hover:text-cream'
                : active
                  ? 'bg-forest text-paper'
                  : 'text-forest hover:bg-forest/8',
              FOCUS,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
