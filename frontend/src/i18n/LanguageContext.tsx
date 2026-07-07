import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import pt from './locales/pt';
import en from './locales/en';

export type LanguagePreference = 'auto' | 'pt' | 'en';
export type AppLocale = 'pt' | 'en';

const STORAGE_KEY = 'genoma-language';

const translations = { pt, en } as const;

type TranslationParams = Record<string, string | number>;

interface LanguageContextType {
  language: LanguagePreference;
  locale: AppLocale;
  localeTag: string;
  setLanguage: (language: LanguagePreference) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'pt';
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

function resolveLocale(preference: LanguagePreference): AppLocale {
  if (preference === 'pt') return 'pt';
  if (preference === 'en') return 'en';
  return detectBrowserLocale();
}

function lookupTranslation(locale: AppLocale, key: string): string | undefined {
  const parts = key.split('.');
  let node: unknown = translations[locale];

  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === 'string' ? node : undefined;
}

function translate(locale: AppLocale, key: string, params?: TranslationParams): string {
  const value = lookupTranslation(locale, key) ?? lookupTranslation('pt', key) ?? key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, paramKey: string) => String(params[paramKey] ?? `{${paramKey}}`));
}

export const LOCALE_TAGS: Record<AppLocale, string> = {
  pt: 'pt-PT',
  en: 'en-GB',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguagePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'auto' || saved === 'pt' || saved === 'en') return saved;
    } catch {}
    return 'auto';
  });

  const locale = useMemo(() => resolveLocale(language), [language]);
  const localeTag = LOCALE_TAGS[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language, locale]);

  const setLanguage = useCallback((next: LanguagePreference) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ language, locale, localeTag, setLanguage, t }),
    [language, locale, localeTag, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function formatRelativeTime(iso: string, t: LanguageContextType['t'], localeTag: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('time.now');
  if (diffMin < 60) return t('time.minutesAgo', { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('time.hoursAgo', { count: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return t('time.daysAgo', { count: diffD });

  return date.toLocaleDateString(localeTag, { day: '2-digit', month: 'short', year: 'numeric' });
}
