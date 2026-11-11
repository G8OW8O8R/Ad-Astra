/**
 * Konfiguracja języków. Bez zależności serwerowych — używana też w proxy.ts.
 */
export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Pierwszy segment ścieżki, jeśli jest obsługiwanym językiem. */
export function localeFromPathname(pathname: string): Locale | null {
  const first = pathname.split("/")[1] ?? "";
  return hasLocale(first) ? first : null;
}

/** Strony robocze (/dev/*) — poza i18n, dostępne tylko lokalnie. */
export function isDevToolPath(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

/**
 * Ścieżka przekierowania dla adresu bez prefiksu języka
 * (np. "/" → "/pl", "/kontakt" → "/pl/kontakt"). `null` = bez przekierowania.
 */
export function localeRedirectPath(pathname: string): string | null {
  if (localeFromPathname(pathname)) return null;
  const rest = pathname === "/" ? "" : pathname;
  return `/${defaultLocale}${rest}`;
}

