import { describe, expect, it } from "vitest";
import { MAX_DPR, clampPixelRatio, clampProgress, createScene } from "./index";

describe("scene module (stub)", () => {
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
  });

  it("runs the init → setProgress → resize → dispose lifecycle", async () => {
    const scene = createScene();
    const canvas = document.createElement("canvas");

    await scene.init({ canvas, width: 800, height: 600, pixelRatio: 3 });
    expect(scene.getState()).toMatchObject({ initialized: true, width: 800, pixelRatio: 2 });

    scene.setProgress(1.7);
    expect(scene.getState().progress).toBe(1);

    scene.resize(1280, 720);
    expect(scene.getState()).toMatchObject({ width: 1280, height: 720, pixelRatio: 2 });

    scene.dispose();
    expect(scene.getState().disposed).toBe(true);
    await expect(scene.init({ canvas, width: 1, height: 1 })).rejects.toThrow(/disposed/);
  });
});
