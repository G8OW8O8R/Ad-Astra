/**
 * Moduł sceny 3D (three.js) — jedyne miejsce, w którym żyje WebGL.
 *
 * Na razie tylko interfejs i pusta implementacja. Silnik (wieża, budowa,
 * kamera, świat wokół) powstaje w zadaniu 3. Reszta aplikacji rozmawia
 * ze sceną wyłącznie przez `SceneController`.
 */

export interface SceneInitOptions {
  /** Płótno, na którym rysuje scena. */
  canvas: HTMLCanvasElement;
  /** Rozmiar w pikselach CSS. */
  width: number;
  height: number;
  /** devicePixelRatio — scena ogranicza go do MAX_DPR. */
  pixelRatio?: number;
}

export interface SceneController {
  /** Tworzy renderer i zasoby. Wywoływane raz. */
  init(options: SceneInitOptions): Promise<void>;
  /** Postęp budowy / lotu kamery, 0–1 (wartości spoza zakresu są przycinane). */
  setProgress(progress: number): void;
  /** Zmiana rozmiaru płótna (piksele CSS). */
  resize(width: number, height: number, pixelRatio?: number): void;
  /** Zwalnia wszystkie zasoby GPU i nasłuchy. Po dispose kontroler jest bezużyteczny. */
  dispose(): void;
}

export const MAX_DPR = 2;

export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function clampPixelRatio(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return 1;
  return Math.min(MAX_DPR, value);
}

/** Stan pustej sceny — wystawiony do testów i diagnostyki. */
export interface SceneState {
  readonly initialized: boolean;
  readonly disposed: boolean;
  readonly progress: number;
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export function createScene(): SceneController & { getState(): SceneState } {
  let state: SceneState = {
    initialized: false,
    disposed: false,
    progress: 0,
    width: 0,
    height: 0,
    pixelRatio: 1,
  };

  const assertAlive = () => {
    if (state.disposed) throw new Error("Scene has been disposed");
  };

  return {
    async init({ width, height, pixelRatio }) {
      assertAlive();
      if (state.initialized) return;
      state = {
        ...state,
        initialized: true,
        width,
        height,
        pixelRatio: clampPixelRatio(pixelRatio),
      };
    },
    setProgress(progress) {
      if (state.disposed) return;
      state = { ...state, progress: clampProgress(progress) };
    },
    resize(width, height, pixelRatio) {
      if (state.disposed) return;
      state = {
        ...state,
        width,
        height,
        pixelRatio: pixelRatio === undefined ? state.pixelRatio : clampPixelRatio(pixelRatio),
      };
    },
    dispose() {
      state = { ...state, disposed: true, initialized: false };
    },
    getState() {
      return state;
    },
  };
}
