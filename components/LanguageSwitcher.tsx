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
      <ul className="flex gap-3 text-sm uppercase tracking-[0.2em]">
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <a
                href={`/${locale}`}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-ink underline decoration-gold underline-offset-4"
                    : "text-ink/60 transition-colors hover:text-ink focus-visible:text-ink"
                }
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
