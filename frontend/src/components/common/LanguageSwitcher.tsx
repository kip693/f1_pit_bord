import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.resolvedLanguage ?? '')
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : 'ja';

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white text-xs font-medium"
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => {
              i18n.changeLanguage(lng).catch((err) => {
                console.error('[i18n] changeLanguage failed', err);
              });
            }}
            aria-pressed={active}
            className={
              active
                ? 'bg-gray-900 px-2 py-1 text-white'
                : 'px-2 py-1 text-gray-700 hover:bg-gray-100'
            }
          >
            {lng === 'ja' ? '日本語' : 'EN'}
          </button>
        );
      })}
    </div>
  );
}
