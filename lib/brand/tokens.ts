/**
 * Kopia kolorów z app/tokens.css dla miejsc bez CSS (OG image, ikony generowane w kodzie,
 * w przyszłości materiały three.js). Źródłem jest tokens.css — zgodność sprawdza test.
 */
export const colors = {
  ivory: "#f6f1e8",
  ink: "#2b2622",
  inkSoft: "#5c544c",
  gold: "#b8955a",
  goldSoft: "#d9c29a",
  night: "#1e2236",
  sky: "#6fc3df",
  statusFree: "#9db59a",
  statusReserved: "#d8b98a",
  statusSold: "#b9b6b1",
} as const;

export type ColorName = keyof typeof colors;

/** Nazwa zmiennej CSS dla klucza (inkSoft → --ink-soft). */
export function cssVarName(name: ColorName): string {
  return `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Względna luminancja WCAG 2.x dla koloru #rrggbb. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Nieprawidłowy kolor: ${hex}`);
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => channel(parseInt(h as string, 16)));
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
}

/** Kontrast WCAG 2.x (1–21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pary tekst/tło używane w interfejsie — każda musi mieć kontrast ≥ 4,5:1 (WCAG AA). */
export const textPairs: ReadonlyArray<{ text: ColorName; background: ColorName; use: string }> = [
  { text: "ink", background: "ivory", use: "tekst na panelach" },
  { text: "inkSoft", background: "ivory", use: "tekst drugorzędny" },
  { text: "ink", background: "gold", use: "przycisk główny" },
  { text: "ivory", background: "night", use: "tekst na nocnych scenach" },
  { text: "goldSoft", background: "night", use: "etykiety na ciemnym" },
  { text: "gold", background: "night", use: "akcent na ciemnym" },
  { text: "ink", background: "statusFree", use: "chip: wolne" },
  { text: "ink", background: "statusReserved", use: "chip: rezerwacja" },
  { text: "ink", background: "statusSold", use: "chip: sprzedane" },
];
