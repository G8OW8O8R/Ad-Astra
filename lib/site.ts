/**
 * Ustawienia witryny.
 *
 * INDEXING_ENABLED: do czasu publikacji strona jest wyłączona z indeksowania
 * (meta robots, nagłówek X-Robots-Tag, robots.txt). Zmiana na `true`
 * włącza indeksowanie we wszystkich trzech miejscach naraz.
 */
export const INDEXING_ENABLED = false;

/** Adres bazowy dla linków kanonicznych i hreflang (bez końcowego „/”). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);
