import { locales, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/content/i18n/schema";

interface Props {
  current: Locale;
  labels: Dictionary["common"];
}

/**
 * Zwykłe <a> zamiast <Link>: zmiana języka przeładowuje cały dokument
 * (lang, metadane, scena), zamiast trzymać poprzednią wersję w ukrytym <Activity>.
 */
export function LanguageSwitcher({ current, labels }: Props) {
  return (
    <nav aria-label={labels.languageSwitcher}>
      <ul className="label flex items-center gap-1">
        {locales.map((locale, index) => {
          const active = locale === current;
          return (
            <li key={locale} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-ink-soft">
                  /
                </span>
              )}
              <a
                href={`/${locale}`}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "page" : undefined}
                className={`px-1 py-2 transition-colors ${
                  active ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {locale}
                <span className="sr-only"> — {labels.languageNames[locale]}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
