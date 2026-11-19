import { describe, expect, it, vi } from "vitest";
import {
  MAX_DPR,
  clampPixelRatio,
  clampProgress,
  createScene,
  detectQuality,
  type EngineFactory,
  type SceneEngine,
} from "./index";

function fakeEngine() {
  const engine: SceneEngine = {
    setProgress: vi.fn(),
    setTimeOfDay: vi.fn(),
    setCamera: vi.fn(),
    setOrbit: vi.fn(),
    setPixelRatio: vi.fn(),
    resize: vi.fn(),
    getStats: vi.fn(() => ({
      fps: 60,
      frameMs: 16.7,
      drawCalls: 60,
      triangles: 1,
      sceneDrawCalls: 40,
      sceneTriangles: 1,
      pixelRatio: 2,
      quality: "high" as const,
    })),
    dispose: vi.fn(),
  };
  const factory = vi.fn<EngineFactory>(() => engine);
  return { engine, factory, loadEngine: async () => factory };
}

describe("scene module", () => {
  it("clamps progress to 0–1", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(0.4)).toBe(0.4);
    expect(clampProgress(3)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it("caps the pixel ratio", () => {
    expect(clampPixelRatio(3)).toBe(MAX_DPR);
    expect(clampPixelRatio(1.5)).toBe(1.5);
    expect(clampPixelRatio(undefined)).toBe(1);
    expect(clampPixelRatio(0)).toBe(1);
    expect(clampPixelRatio(3, 1.5)).toBe(1.5);
  });

  it("lowers render quality on phones and weak CPUs, not on desktops", () => {
    expect(detectQuality({ coarsePointer: true, minScreenSide: 390, cores: 8 })).toBe("low");
    expect(detectQuality({ coarsePointer: false, minScreenSide: 900, cores: 4 })).toBe("low");
    expect(detectQuality({ coarsePointer: false, minScreenSide: 900, cores: 12 })).toBe("high");
    expect(detectQuality({ coarsePointer: true, minScreenSide: 1024, cores: 8 })).toBe("high");
  });

  it("buffers calls made before init and forwards them to the engine", async () => {
    const { engine, factory, loadEngine } = fakeEngine();
    const scene = createScene({ loadEngine });
    const canvas = document.createElement("canvas");

    scene.setProgress(1.7);
    scene.setTimeOfDay(0.5);
    scene.setCamera("szczyt");
    await scene.init(canvas, { quality: "high", pixelRatio: 3 });

    expect(factory).toHaveBeenCalledWith(canvas, { quality: "high", pixelRatio: 2, progress: 1, timeOfDay: 0.5 });
    expect(engine.setCamera).toHaveBeenCalledWith("szczyt", { immediate: true });
    expect(scene.getState()).toMatchObject({ initialized: true, progress: 1, pixelRatio: 2, quality: "high" });

    scene.setProgress(0.3);
    expect(engine.setProgress).toHaveBeenLastCalledWith(0.3);
    scene.setCamera({ pos: [0, 10, 50], target: [0, 20, 0] });
    expect(engine.setCamera).toHaveBeenLastCalledWith({ pos: [0, 10, 50], target: [0, 20, 0] }, undefined);
    expect(scene.getStats()?.fps).toBe(60);
  });

  it("caps DPR at 1.5 on low quality", async () => {
    const { factory, loadEngine } = fakeEngine();
    const scene = createScene({ loadEngine });
    await scene.init(document.createElement("canvas"), { quality: "low", pixelRatio: 3 });
    expect(factory.mock.calls[0]?.[1]).toMatchObject({ quality: "low", pixelRatio: 1.5 });
  });

  it("disposes the engine once and refuses to re-init", async () => {
    const { engine, loadEngine } = fakeEngine();
    const scene = createScene({ loadEngine });
    const canvas = document.createElement("canvas");
    await scene.init(canvas, { quality: "high" });
    scene.dispose();
    expect(engine.dispose).toHaveBeenCalledTimes(1);
    expect(scene.getState().disposed).toBe(true);
    scene.setProgress(0.5); // bez błędu, bez efektu
    expect(engine.setProgress).not.toHaveBeenCalled();
    await expect(scene.init(canvas)).rejects.toThrow(/disposed/);
  });

  it("does not create an engine when disposed while loading", async () => {
    const { factory } = fakeEngine();
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const scene = createScene({ loadEngine: async () => (await gate, factory) });
    const pending = scene.init(document.createElement("canvas"), { quality: "high" });
    scene.dispose();
    release();
    await pending;
    expect(factory).not.toHaveBeenCalled();
  });
});
