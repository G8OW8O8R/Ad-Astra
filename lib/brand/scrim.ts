/**
 * Przyciemnienie sceny pod tekstem stopów etapów (components/stages/stage-stop.css).
 *
 * Pod każdą linią tekstu leży miękka elipsa w kolorze --night (radial-gradient closest-side).
 * Elipsy są zebrane w jedną warstwę o kryciu `alpha`, więc tam, gdzie zachodzą na siebie,
 * nie ciemnieją podwójnie. Pełne krycie trzyma się do `plateau` promienia, dalej gaśnie do zera.
 * Elipsa jest większa od linii tekstu z każdej strony o max(`padMinPx`, `padX` szerokości) w poziomie
 * i o max(`padMinPx`, `padYRatio` wysokości) w pionie — cały tekst leży w pełnym kryciu (sprawdza
 * test), a pod krótkim numerem piętra elipsa jest prawie kołem, które obejmuje też gwiazdę.
 *
 * Wartości muszą zgadzać się z CSS: alpha z app/tokens.css, geometria ze stage-stop.css (test).
 */
import { colors } from "./tokens";

export const STOP_SCRIM = {
  alpha: 0.8,
  plateau: 0.72,
  padX: 0.35,
  padYRatio: 0.8,
  padMinPx: 48,
} as const;

export interface SceneSample {
  hex: string;
  where: string;
}

/**
 * Próbki tła z plansz (najjaśniejsze miejsca, tam gdzie może wypaść tekst), zmierzone 11.11.2026
 * na `ulica-pusta.jpg` (dzień) i `taras-noc.jpg` (noc), plus biel jako przepał (bloom, refleks).
 */
export const sceneSamples: Readonly<Record<"day" | "night", readonly SceneSample[]>> = {
  day: [
    { hex: "#5bbfdb", where: "niebo, środek kadru" },
    { hex: "#68c7df", where: "niebo przy horyzoncie" },
    { hex: "#f7e4cb", where: "kremowa chmura" },
    { hex: "#faf6e3", where: "najjaśniejszy refleks, środek kadru" },
    { hex: "#fcdaa9", where: "ogrodzenie w słońcu" },
    { hex: "#c5c0ac", where: "szklana elewacja, lewa tercja" },
    { hex: "#aa6644", where: "terakota, prawa tercja" },
    { hex: "#ffffff", where: "przepał (biel)" },
  ],
  night: [
    { hex: "#1e2236", where: "nocne niebo" },
    { hex: "#736174", where: "niebo nad miastem" },
    { hex: "#898cce", where: "zmierzch, lewa tercja" },
    { hex: "#f1aa5c", where: "światła ulic" },
    { hex: "#ffe2a4", where: "okna w środku kadru" },
    { hex: "#fffbe0", where: "najjaśniejsze światło" },
  ],
};

function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Nieprawidłowy kolor: ${hex}`);
  return [m[1], m[2], m[3]].map((h) => parseInt(h as string, 16)) as [number, number, number];
}

/** Kolor `top` o kryciu `alpha` nałożony na `bottom` (mieszanie w sRGB, jak w przeglądarce). */
export function over(top: string, bottom: string, alpha: number): string {
  const a = rgb(top);
  const b = rgb(bottom);
  return `#${a
    .map((c, i) => Math.round(c * alpha + (b[i] as number) * (1 - alpha)))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Tło pod tekstem stopu: próbka sceny przykryta rdzeniem przyciemnienia. */
export function scrimmed(sample: string, alpha: number = STOP_SCRIM.alpha): string {
  return over(colors.night, sample, alpha);
}

/**
 * Jak daleko od środka elipsy (0 = środek, 1 = brzeg) leży narożnik linii tekstu w×h px.
 * Tekst ma pełne przyciemnienie, gdy wynik ≤ `plateau`.
 */
export function scrimReach(width: number, height: number): number {
  const rx = width / 2 + Math.max(STOP_SCRIM.padMinPx, width * STOP_SCRIM.padX);
  const ry = height / 2 + Math.max(STOP_SCRIM.padMinPx, height * STOP_SCRIM.padYRatio);
  return Math.hypot(width / 2 / rx, height / 2 / ry);
}

/**
 * Owal pod znacznikiem piętra (gwiazda + numer, 12 px). Przesunięty w stronę gwiazdy
 * (88 px od strony gwiazdy, 64 px od strony wieży, 48 px w pionie), pełne krycie do 45% promienia.
 */
export const FLOOR_MARKER_SCRIM = {
  plateau: 0.45,
  padStarSidePx: 88,
  padOuterPx: 64,
  padYPx: 48,
  /** Środek gwiazdy względem lewej krawędzi numeru: pół gwiazdy (7 px) + odstęp 10 px. */
  starCenterPx: -17,
} as const;

/** Odległość punktu (x, y) od środka owalu znacznika (0–1); x liczone od lewej krawędzi numeru w×h. */
export function markerReach(width: number, height: number, x: number, y: number): number {
  const { padStarSidePx, padOuterPx, padYPx } = FLOOR_MARKER_SCRIM;
  const left = -padStarSidePx;
  const right = width + padOuterPx;
  const cx = (left + right) / 2;
  const rx = (right - left) / 2;
  const ry = height / 2 + padYPx;
  return Math.hypot((x - cx) / rx, (y - height / 2) / ry);
}
