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

/**
 * Ścieżka przekierowania dla adresu bez prefiksu języka
 * (np. "/" → "/pl", "/kontakt" → "/pl/kontakt"). `null` = bez przekierowania.
 */
export function localeRedirectPath(pathname: string): string | null {
  if (localeFromPathname(pathname)) return null;
  const rest = pathname === "/" ? "" : pathname;
  return `/${defaultLocale}${rest}`;
}

