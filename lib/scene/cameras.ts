/**
 * Presety kamery. Ulica leży po stronie +Z (kąt 0), słońce zachodzi po stronie −X,
 * więc ujęcia patrzą lekko z prawej, żeby oświetlona strona wieży była w kadrze.
 */
import { TOWER, levelY } from "./tower-config";

export type Vec3 = readonly [number, number, number];

export interface CameraPose {
  pos: Vec3;
  target: Vec3;
  /** Pionowe pole widzenia (stopnie). */
  fov?: number;
}

export const CAMERA_PRESETS = {
  ulica: { pos: [22, 1.7, 74], target: [0, 52, 0], fov: 58 },
  "pietro-5": { pos: [44, levelY(5) + 1.6, 66], target: [0, levelY(9), 0], fov: 48 },
  "pietro-20": { pos: [58, levelY(20) + 1.6, 72], target: [0, levelY(22), 0], fov: 46 },
  szczyt: { pos: [30, TOWER.roofHeight + 12, 46], target: [0, TOWER.roofHeight + 6, 0], fov: 50 },
  dron: { pos: [250, 135, 330], target: [0, 78, 0], fov: 30 },
} as const satisfies Record<string, CameraPose>;

export type CameraPresetId = keyof typeof CAMERA_PRESETS;

export const CAMERA_PRESET_IDS = Object.keys(CAMERA_PRESETS) as CameraPresetId[];

export function isCameraPreset(value: unknown): value is CameraPresetId {
  return typeof value === "string" && value in CAMERA_PRESETS;
}

/** Płynne przejście kamery: ease-in-out (sześcienny), czas zależny od dystansu, 0,9–2,4 s. */
export function transitionDuration(from: CameraPose, to: CameraPose): number {
  const d = Math.hypot(to.pos[0] - from.pos[0], to.pos[1] - from.pos[1], to.pos[2] - from.pos[2]);
  return Math.min(2.4, Math.max(0.9, 0.9 + d / 260));
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
