/**
 * Moduł sceny 3D (three.js) — jedyne miejsce, w którym żyje WebGL.
 *
 * Reszta aplikacji rozmawia ze sceną wyłącznie przez `SceneController`. Ten plik nie importuje
 * three.js: silnik (`./engine`) ładuje się dynamicznie w `init`, więc strona bez sceny
 * (wersja statyczna, reduced motion) nie pobiera biblioteki.
 */
import type { CameraPose, CameraPresetId } from "./cameras";

export type { CameraPose, CameraPresetId } from "./cameras";
export { CAMERA_PRESETS, CAMERA_PRESET_IDS } from "./cameras";

export type SceneQuality = "high" | "low";
export type CameraTarget = CameraPresetId | CameraPose;

export interface SceneInitOptions {
  /** auto: telefon / słabe urządzenie → low (niższa rozdzielczość, mniejsza mapa cieni, bez MSAA). */
  quality?: SceneQuality | "auto";
  /** devicePixelRatio — scena ogranicza go do MAX_DPR (na niskiej jakości do 1,5). */
  pixelRatio?: number;
}

export interface CameraOptions {
  /** Bez przejścia (np. pierwsze ustawienie). */
  immediate?: boolean;
  /** Czas przejścia w sekundach (domyślnie zależny od dystansu, 0,9–2,4 s). */
  duration?: number;
}

export interface SceneStats {
  fps: number;
  frameMs: number;
  /** Cała klatka: scena z cieniami + postprodukcja. */
  drawCalls: number;
  triangles: number;
  /** Sam render sceny (z mapą cieni), bez postprodukcji. */
  sceneDrawCalls: number;
  sceneTriangles: number;
  pixelRatio: number;
  quality: SceneQuality;
}

export interface SceneController {
  /** Tworzy renderer i zasoby. Wywoływane raz; rozmiar brany z wymiarów płótna w CSS. */
  init(canvas: HTMLCanvasElement, options?: SceneInitOptions): Promise<void>;
  /** Postęp budowy 0–1 (wartości spoza zakresu są przycinane). Scena dochodzi do niego płynnie. */
  setProgress(progress: number): void;
  /** Pora dnia: 0 dzień → 1 noc. */
  setTimeOfDay(value: number): void;
  /** Preset kamery albo dowolna pozycja; domyślnie płynne przejście. */
  setCamera(camera: CameraTarget, options?: CameraOptions): void;
  /** Ponowne odczytanie rozmiaru płótna (scena obserwuje je też sama). */
  resize(): void;
  /** Zwalnia wszystkie zasoby GPU i nasłuchy. Po dispose kontroler jest bezużyteczny. */
  dispose(): void;
}

/** Rozszerzenia dla stron roboczych (/dev/wieza). */
export interface SceneDevController extends SceneController {
  setOrbit(enabled: boolean): void;
  getStats(): SceneStats | null;
  getState(): SceneState;
}

export const MAX_DPR = 2;
export const LOW_MAX_DPR = 1.5;

export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function clampPixelRatio(value: number | undefined, max = MAX_DPR): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return 1;
  return Math.min(max, value);
}

/** Wybór jakości renderu (nie wyglądu): telefon i słabe urządzenia → low. */
export function detectQuality(env: {
  coarsePointer: boolean;
  minScreenSide: number;
  cores: number | undefined;
}): SceneQuality {
  if (env.coarsePointer && env.minScreenSide < 820) return "low";
  if (env.cores !== undefined && env.cores <= 4) return "low";
  return "high";
}

/** Stan kontrolera — wystawiony do testów i diagnostyki. */
export interface SceneState {
  readonly initialized: boolean;
  readonly disposed: boolean;
  readonly progress: number;
  readonly timeOfDay: number;
  readonly camera: CameraTarget;
  readonly pixelRatio: number;
  readonly quality: SceneQuality;
}

/** Interfejs silnika (implementacja w ./engine). */
export interface EngineOptions {
  quality: SceneQuality;
  pixelRatio: number;
  progress: number;
  timeOfDay: number;
}
export interface SceneEngine {
  setProgress(p: number): void;
  setTimeOfDay(t: number): void;
  setCamera(camera: CameraTarget, options?: CameraOptions): void;
  setOrbit(enabled: boolean): void;
  setPixelRatio(value: number): void;
  resize(): void;
  getStats(): SceneStats;
  dispose(): void;
}
export type EngineFactory = (canvas: HTMLCanvasElement, options: EngineOptions) => SceneEngine;

const loadEngine = async (): Promise<EngineFactory> => (await import("./engine")).createEngine;

function environment() {
  if (typeof window === "undefined") return { coarsePointer: false, minScreenSide: 1080, cores: undefined };
  return {
    coarsePointer: window.matchMedia?.("(pointer: coarse)").matches ?? false,
    minScreenSide: Math.min(window.screen?.width ?? 1080, window.screen?.height ?? 1080),
    cores: navigator.hardwareConcurrency,
  };
}

export function createScene(deps: { loadEngine?: () => Promise<EngineFactory> } = {}): SceneDevController {
  let state: SceneState = {
    initialized: false,
    disposed: false,
    progress: 0,
    timeOfDay: 0,
    camera: "ulica",
    pixelRatio: 1,
    quality: "high",
  };
  let engine: SceneEngine | null = null;
  let orbit = false;

  const assertAlive = () => {
    if (state.disposed) throw new Error("Scene has been disposed");
  };

  return {
    async init(canvas, options = {}) {
      assertAlive();
      if (state.initialized) return;
      const quality = !options.quality || options.quality === "auto" ? detectQuality(environment()) : options.quality;
      const pixelRatio = clampPixelRatio(
        options.pixelRatio ?? (typeof window === "undefined" ? 1 : window.devicePixelRatio),
        quality === "low" ? LOW_MAX_DPR : MAX_DPR,
      );
      const factory = await (deps.loadEngine ?? loadEngine)();
      if (state.disposed) return; // dispose w trakcie ładowania
      engine = factory(canvas, { quality, pixelRatio, progress: state.progress, timeOfDay: state.timeOfDay });
      engine.setCamera(state.camera, { immediate: true });
      if (orbit) engine.setOrbit(true);
      state = { ...state, initialized: true, pixelRatio, quality };
    },
    setProgress(progress) {
      if (state.disposed) return;
      state = { ...state, progress: clampProgress(progress) };
      engine?.setProgress(state.progress);
    },
    setTimeOfDay(value) {
      if (state.disposed) return;
      state = { ...state, timeOfDay: clampProgress(value) };
      engine?.setTimeOfDay(state.timeOfDay);
    },
    setCamera(camera, options) {
      if (state.disposed) return;
      state = { ...state, camera };
      engine?.setCamera(camera, options);
    },
    setOrbit(enabled) {
      orbit = enabled;
      engine?.setOrbit(enabled);
    },
    resize() {
      engine?.resize();
    },
    getStats() {
      return engine?.getStats() ?? null;
    },
    getState() {
      return state;
    },
    dispose() {
      engine?.dispose();
      engine = null;
      state = { ...state, disposed: true, initialized: false };
    },
  };
}
