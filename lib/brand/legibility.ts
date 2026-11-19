/**
 * Czytelność tekstu stopów na scenie — model tego, co rysuje components/stages/stage-stop.css:
 *
 * 1. Kinowy margines: liniowy gradient --night od krawędzi ekranu po stronie tekstu. Pełne krycie
 *    `--stop-margin-alpha` sięga do końca bloku tekstu (`extent`, mierzone w komponencie), potem
 *    łagodnie gaśnie na `MARGIN_FADE` (w poziomie) lub `MARGIN_FADE_PORTRAIT` (telefon: od góry w dół).
 * 2. Krawędź skali: wąski liniowy gradient od prawej krawędzi (skala pięter), `--stop-rail-alpha`
 *    przy krawędzi, zero na max(`RAIL_WIDTH` szerokości, `RAIL_MIN_PX`).
 * 3. Delikatna winieta całego kadru (elipsa farthest-corner), w narożnikach `--stop-vignette-alpha`.
 * 4. Cień samego tekstu (--shadow-text) — w modelu pominięty, więc wynik jest ostrożny.
 *
 * Test (legibility.test.ts) liczy kontrast każdego tekstu stopu na próbkach tła zmierzonych pod tym
 * tekstem w kadrach /dev/marka i pilnuje, żeby CSS miał dokładnie te same krzywe.
 */
import { colors } from "./tokens";

export const MARGIN_ALPHA = 0.65;
export const RAIL_ALPHA = 0.6;
export const VIGNETTE_ALPHA = 0.35;
/** Szerokość przyciemnienia prawej krawędzi pod skalą pięter: ułamek szerokości kadru, min. 8rem. */
export const RAIL_WIDTH = 0.1;
export const RAIL_MIN_PX = 128;
/** Długość wygaszania marginesu za blokiem tekstu (ułamek szerokości / wysokości kadru). */
export const MARGIN_FADE = 0.22;
export const MARGIN_FADE_PORTRAIT = 0.2;
/** Zapas pełnego krycia za blokiem tekstu — jak EXTENT_PAD w StageStop.tsx. */
export const EXTENT_PAD = 0.02;

/** Wygaszanie marginesu za blokiem: [droga jako ułamek MARGIN_FADE, ułamek MARGIN_ALPHA]. */
export const MARGIN_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0.25, 0.8],
  [0.5, 0.5],
  [0.75, 0.2],
  [1, 0],
];

/** Krzywa krawędzi skali: [odległość od prawej krawędzi jako ułamek szerokości pasa, ułamek RAIL_ALPHA]. */
export const RAIL_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0.35, 0.9],
  [0.6, 0.55],
  [0.8, 0.22],
  [1, 0],
];

/** Krzywa winiety: [odległość od środka (0 = środek, 1 = narożnik), ułamek VIGNETTE_ALPHA]. */
export const VIGNETTE_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.45, 0],
  [0.7, 0.35],
  [1, 1],
];

function interpolate(curve: ReadonlyArray<readonly [number, number]>, t: number): number {
  const first = curve[0]!;
  const last = curve[curve.length - 1]!;
  if (t <= first[0]) return first[1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i]!;
    const [x0, y0] = curve[i - 1]!;
    if (t <= x1) return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
  }
  return last[1];
}

/**
 * Krycie kinowego marginesu w odległości `fromEdge` od krawędzi, gdy blok tekstu kończy się na
 * `extent` (oba jako ułamki osi gradientu).
 */
export function marginAlpha(fromEdge: number, extent: number, fade: number = MARGIN_FADE): number {
  const full = Math.min(1, extent + EXTENT_PAD);
  if (fromEdge <= full) return MARGIN_ALPHA;
  return MARGIN_ALPHA * interpolate(MARGIN_CURVE, (fromEdge - full) / fade);
}

/**
 * Krycie przyciemnienia krawędzi skali w odległości `fromRight` (ułamek szerokości) od prawej
 * krawędzi kadru o szerokości `frameWidth` px.
 */
export function railAlpha(fromRight: number, frameWidth: number): number {
  const width = Math.max(RAIL_WIDTH, RAIL_MIN_PX / frameWidth);
  return RAIL_ALPHA * interpolate(RAIL_CURVE, fromRight / width);
}

/** Krycie winiety w punkcie (x, y) kadru (ułamki 0–1). Elipsa farthest-corner jak w CSS. */
export function vignetteAlpha(x: number, y: number): number {
  const d = Math.hypot((x - 0.5) / 0.5, (y - 0.5) / 0.5) / Math.SQRT2;
  return VIGNETTE_ALPHA * interpolate(VIGNETTE_CURVE, d);
}

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const night = (share: number, token: string) =>
  share === 0 ? "transparent" : `color-mix(in srgb, var(--night) calc(var(${token}) * ${pct(share)}), transparent)`;

/** Przystanki gradientu marginesu dokładnie tak, jak w stage-stop.css (sprawdza test). */
export function marginStopsCss(): string {
  const at = (t: number) =>
    t === 0 ? "var(--stop-extent)" : `calc(var(--stop-extent) + var(--stop-fade)${t === 1 ? "" : ` * ${t}`})`;
  return [
    `${night(1, "--stop-margin-alpha")} 0%`,
    ...MARGIN_CURVE.map(([t, a]) => `${night(a, "--stop-margin-alpha")} ${at(t)}`),
  ].join(", ");
}

/** Przystanki gradientu krawędzi skali dokładnie tak, jak w stage-stop.css (sprawdza test). */
export function railStopsCss(): string {
  const at = (t: number) =>
    t === 0 ? "0%" : t === 1 ? "var(--stop-rail-width)" : `calc(var(--stop-rail-width) * ${t})`;
  return RAIL_CURVE.map(([t, a]) => `${night(a, "--stop-rail-alpha")} ${at(t)}`).join(", ");
}

/** Przystanki gradientu winiety dokładnie tak, jak w stage-stop.css (sprawdza test). */
export function vignetteStopsCss(): string {
  return VIGNETTE_CURVE.slice(1)
    .map(([t, a]) => `${night(a, "--stop-vignette-alpha")} ${pct(t)}`)
    .join(", ");
}

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

export interface ShadeContext {
  /** Strona tekstu. */
  side: "left" | "right";
  /** Kierunek marginesu: od krawędzi bocznej (ekran szeroki) albo od górnej (telefon w pionie). */
  axis: "x" | "y";
  /** Koniec bloku tekstu wzdłuż osi marginesu (ułamek). */
  extent: number;
  /** Szerokość kadru (px) — pas pod skalą ma co najmniej RAIL_MIN_PX. */
  width: number;
}

/**
 * Tło pod tekstem: próbka sceny pod winietą, krawędzią skali i kinowym marginesem (kolejność warstw
 * jak w CSS, od spodu). `x`, `y` — położenie w kadrze (0–1).
 */
export function shaded(sample: string, x: number, y: number, ctx: ShadeContext): string {
  const fromEdge = ctx.axis === "y" ? y : ctx.side === "left" ? x : 1 - x;
  const fade = ctx.axis === "y" ? MARGIN_FADE_PORTRAIT : MARGIN_FADE;
  const vignetted = over(colors.night, sample, vignetteAlpha(x, y));
  const railed = over(colors.night, vignetted, railAlpha(1 - x, ctx.width));
  return over(colors.night, railed, marginAlpha(fromEdge, ctx.extent, fade));
}
