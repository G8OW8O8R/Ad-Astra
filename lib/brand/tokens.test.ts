import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colors, contrast, cssVarName, textPairs, type ColorName } from "./tokens";

const css = readFileSync(join(process.cwd(), "app", "tokens.css"), "utf8");

function cssColor(name: string): string | undefined {
  return new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i").exec(css)?.[1]?.toLowerCase();
}

describe("design tokens", () => {
  it.each(Object.entries(colors))("%s matches app/tokens.css", (name, hex) => {
    expect(cssColor(cssVarName(name as ColorName))).toBe(hex);
  });

  it("every :root color in tokens.css is mirrored in TS", () => {
    const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    const declared = [...root.matchAll(/(--[a-z-]+):\s*#[0-9a-f]{6}/gi)].map((m) => m[1]);
    const mirrored = Object.keys(colors).map((k) => cssVarName(k as ColorName));
    expect(declared.sort()).toEqual(mirrored.sort());
  });

  it.each(textPairs)("$text on $background ($use) has contrast ≥ 4.5:1", ({ text, background }) => {
    expect(contrast(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it("type scale spans 12–160 px", () => {
    const sizes = [...css.matchAll(/--text-[a-z0-9]+:\s*([^;]+);/g)].map((m) => m[1] as string);
    const px = sizes.flatMap((v) => [...v.matchAll(/([\d.]+)rem(?![^,]*vw)/g)].map((m) => Number(m[1]) * 16));
    expect(Math.min(...px)).toBe(12);
    expect(Math.max(...px)).toBe(160);
  });

  it("computes WCAG contrast correctly", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast(colors.ink, colors.gold)).toBeCloseTo(5.33, 2);
  });
});
