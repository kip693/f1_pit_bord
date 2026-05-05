import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ja from '@/locales/ja.json';
import en from '@/locales/en.json';

export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'f1pitboard.language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ja',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

// Keep <html lang> in sync so SEO and assistive tech see the right language.
function syncHtmlLang(lng: string | undefined) {
  if (typeof document === 'undefined') return;
  const lang = (SUPPORTED_LANGUAGES as readonly string[]).includes(lng ?? '')
    ? (lng as string)
    : 'ja';
  document.documentElement.lang = lang;
}
syncHtmlLang(i18n.resolvedLanguage);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
