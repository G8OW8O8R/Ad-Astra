/**
 * Pora dnia 0 (dzień) → 1 (noc): klatki kluczowe nieba, słońca/księżyca, mgiełki i świateł.
 * Kolory zapisane w sRGB (hex), interpolowane w przestrzeni liniowej. Czyste funkcje — bez three.js.
 *
 * Kierunki światła: azymut 0° = +Z (ulica), 90° = +X. Elewacja w stopniach nad horyzontem.
 */

export type RGB = readonly [number, number, number];

interface Keyframe {
  t: number;
  /** Zenit → pas środkowy → horyzont nieba; ziemia w odbiciach. */
  zenith: string;
  mid: string;
  horizon: string;
  ground: string;
  /** Słońce (dzień) albo księżyc (noc) — jedno światło kierunkowe. */
  lightColor: string;
  lightIntensity: number;
  lightAzimuth: number;
  lightElevation: number;
  /** Tarcza i poświata słońca na niebie. */
  sunDisc: number;
  sunGlow: string;
  /** Mgiełka atmosferyczna. */
  fog: string;
  fogDensity: number;
  envIntensity: number;
  exposure: number;
  /** Światła: okna, korona, gwiazda, gwiazdy na niebie. */
  windows: number;
  crown: number;
  star: number;
  skyStars: number;
}

/**
 * dzień (turkus → krem) → złota godzina → zmierzch → niebieska godzina → noc (fiolet → granat).
 * Przy t = 0,72 światło ma natężenie 0 — tam słońce zamienia się w księżyc (bez skoku cieni).
 */
const KEYFRAMES: readonly Keyframe[] = [
  {
    t: 0,
    zenith: "#3aa7c9",
    mid: "#8fd2dc",
    horizon: "#f7ead0",
    ground: "#b9ab92",
    lightColor: "#fff0d8",
    lightIntensity: 2.6,
    lightAzimuth: -58,
    lightElevation: 36,
    sunDisc: 1,
    sunGlow: "#fff2d2",
    fog: "#e3ecdf",
    fogDensity: 0.00055,
    envIntensity: 1,
    exposure: 1,
    windows: 0,
    crown: 0,
    star: 0.18,
    skyStars: 0,
  },
  {
    t: 0.38,
    zenith: "#3b91ba",
    mid: "#9ccbd0",
    horizon: "#fad9a2",
    ground: "#b39a7c",
    lightColor: "#ffc98a",
    lightIntensity: 2.4,
    lightAzimuth: -72,
    lightElevation: 11,
    sunDisc: 1,
    sunGlow: "#ffcf8c",
    fog: "#f0dcc0",
    fogDensity: 0.00065,
    envIntensity: 0.95,
    exposure: 1.02,
    windows: 0.05,
    crown: 0,
    star: 0.25,
    skyStars: 0,
  },
  {
    t: 0.58,
    zenith: "#36457f",
    mid: "#9a7aa6",
    horizon: "#f3a882",
    ground: "#7c6a6a",
    lightColor: "#ff9466",
    lightIntensity: 0.9,
    lightAzimuth: -80,
    lightElevation: 2.5,
    sunDisc: 0.7,
    sunGlow: "#ff9a6e",
    fog: "#c99a92",
    fogDensity: 0.0007,
    envIntensity: 0.8,
    exposure: 1.08,
    windows: 0.55,
    crown: 0.35,
    star: 0.6,
    skyStars: 0,
  },
  {
    t: 0.72,
    zenith: "#262c62",
    mid: "#57437c",
    horizon: "#a8789c",
    ground: "#3e3546",
    lightColor: "#b7a6d6",
    lightIntensity: 0,
    lightAzimuth: -85,
    lightElevation: -2,
    sunDisc: 0,
    sunGlow: "#b77a9a",
    fog: "#6d587e",
    fogDensity: 0.00065,
    envIntensity: 0.7,
    exposure: 1.12,
    windows: 0.85,
    crown: 0.75,
    star: 0.85,
    skyStars: 0.25,
  },
  {
    t: 1,
    zenith: "#121735",
    mid: "#272250",
    horizon: "#4b3a70",
    ground: "#1d1b2a",
    lightColor: "#9fb2ff",
    lightIntensity: 0.32,
    lightAzimuth: 35,
    lightElevation: 38,
    sunDisc: 0,
    sunGlow: "#5a4f8f",
    fog: "#2f2b52",
    fogDensity: 0.0006,
    envIntensity: 0.62,
    exposure: 1.15,
    windows: 1,
    crown: 1,
    star: 1,
    skyStars: 1,
  },
];

export interface TimeOfDayState {
  zenith: RGB;
  mid: RGB;
  horizon: RGB;
  ground: RGB;
  lightColor: RGB;
  lightIntensity: number;
  /** Kierunek DO światła (znormalizowany). */
  lightDirection: RGB;
  sunDisc: number;
  sunGlow: RGB;
  fog: RGB;
  fogDensity: number;
  envIntensity: number;
  exposure: number;
  windows: number;
  crown: number;
  star: number;
  skyStars: number;
}

export function srgbToLinear(hex: string): RGB {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Nieprawidłowy kolor: ${hex}`);
  const ch = (h: string | undefined) => {
    const c = parseInt(h ?? "0", 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [ch(m[1]), ch(m[2]), ch(m[3])];
}

function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function direction(azimuthDeg: number, elevationDeg: number): RGB {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
}

export function sampleTimeOfDay(value: number): TimeOfDayState {
  const t = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  let i = 0;
  while (i < KEYFRAMES.length - 2 && t > (KEYFRAMES[i + 1] as Keyframe).t) i++;
  const a = KEYFRAMES[i] as Keyframe;
  const b = KEYFRAMES[i + 1] as Keyframe;
  const raw = (t - a.t) / (b.t - a.t);
  const k = raw * raw * (3 - 2 * raw); // łagodne przejście przez klatki

  const c = (key: "zenith" | "mid" | "horizon" | "ground" | "lightColor" | "sunGlow" | "fog") =>
    mixRGB(srgbToLinear(a[key]), srgbToLinear(b[key]), k);
  const n = (key: keyof Keyframe) => mix(a[key] as number, b[key] as number, k);

  // Słońce i księżyc mają różne azymuty — kierunek mieszamy tylko w obrębie jednej roli.
  const dir = direction(n("lightAzimuth"), n("lightElevation"));
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;

  return {
    zenith: c("zenith"),
    mid: c("mid"),
    horizon: c("horizon"),
    ground: c("ground"),
    lightColor: c("lightColor"),
    lightIntensity: n("lightIntensity"),
    lightDirection: [dir[0] / len, dir[1] / len, dir[2] / len],
    sunDisc: n("sunDisc"),
    sunGlow: c("sunGlow"),
    fog: c("fog"),
    fogDensity: n("fogDensity"),
    envIntensity: n("envIntensity"),
    exposure: n("exposure"),
    windows: n("windows"),
    crown: n("crown"),
    star: n("star"),
    skyStars: n("skyStars"),
  };
}

export const TIME_KEYFRAMES = KEYFRAMES.map((k) => k.t);
