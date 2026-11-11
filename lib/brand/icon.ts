import { STAR_RATIO, starPath } from "@/components/brand/star";
import { colors } from "./tokens";

/**
 * Ikona: gwiazda gold-soft na nocnym kafelku. W małych rozmiarach talia gwiazdy jest
 * grubsza (0.2 zamiast 0.14), żeby ramiona nie znikały przy 16 px.
 */
export const ICON_STAR_WAIST = 0.2;

export function iconStarPath(size: number): string {
  const ry = size * (23 / 64);
  return starPath({ cx: size / 2, cy: size / 2, rx: ry * STAR_RATIO, ry, waist: ICON_STAR_WAIST });
}

/** Treść app/icon.svg (favicon). Test sprawdza, że plik jest zgodny z tą funkcją. */
export function iconSvg(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `  <rect width="64" height="64" rx="14" fill="${colors.night}"/>`,
    `  <path d="${iconStarPath(64)}" fill="${colors.goldSoft}"/>`,
    "</svg>",
    "",
  ].join("\n");
}
