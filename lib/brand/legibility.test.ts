import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MARGIN_ALPHA,
  MARGIN_FADE,
  MARGIN_FADE_PORTRAIT,
  RAIL_ALPHA,
  RAIL_MIN_PX,
  RAIL_WIDTH,
  VIGNETTE_ALPHA,
  marginStopsCss,
  railStopsCss,
  shaded,
  vignetteStopsCss,
} from "./legibility";
import { legibilitySamples } from "./legibility.samples";
import { colors, contrast } from "./tokens";

const flat = (css: string) => css.replace(/\s+/g, " ");
const tokensCss = readFileSync(join(process.cwd(), "app", "tokens.css"), "utf8");
const stopCss = flat(readFileSync(join(process.cwd(), "components", "stages", "stage-stop.css"), "utf8"));
const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(tokensCss)?.[1]?.trim();

describe("stage stop legibility — contrast on measured scene samples", () => {
  // Cały tekst stopu jest w --ivory (etykieta 13 px / 600, numer piętra 13 px / 600, liczba,
  // nagłówek, zdanie). Cień tekstu w modelu pominięty — wynik jest ostrożny.
  it.each(legibilitySamples.map((row) => [row.slice(0, 5).join(" · "), row] as const))(
    "%s ≥ 4.5:1",
    (_, [, , , , side, axis, extent, width, hex, x, y]) => {
      const background = shaded(hex, x, y, { side, axis, extent, width });
      expect(contrast(colors.ivory, background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("covers day and night, all text roles, three window sizes", () => {
    const set = (i: number) => new Set(legibilitySamples.map((row) => row[i]));
    expect(set(0)).toEqual(new Set(["1920x897", "1440x900", "390x844"]));
    expect(set(2)).toEqual(new Set(["day", "night"]));
    expect(set(3)).toEqual(new Set(["label", "figure", "headline", "fact", "floor"]));
    expect(legibilitySamples).toHaveLength(3 * 6 * 5);
  });

  it("the shading is what makes it pass: bare samples would fail", () => {
    const bare = legibilitySamples.filter(([, , , , , , , , hex]) => contrast(colors.ivory, hex) < 4.5);
    expect(bare.length).toBeGreaterThan(legibilitySamples.length / 2);
  });
});

describe("stage stop legibility — CSS matches the model", () => {
  it("opacities match app/tokens.css", () => {
    expect(Number(token("--stop-margin-alpha"))).toBe(MARGIN_ALPHA);
    expect(Number(token("--stop-rail-alpha"))).toBe(RAIL_ALPHA);
    expect(Number(token("--stop-vignette-alpha"))).toBe(VIGNETTE_ALPHA);
    expect(token("--shadow-text")).toBe("0 1px 24px rgb(15 18 32 / 0.35)");
  });

  it("gradient curves match stage-stop.css", () => {
    expect(stopCss).toContain(marginStopsCss());
    expect(stopCss).toContain(railStopsCss());
    expect(stopCss).toContain(vignetteStopsCss());
    expect(stopCss).toContain(`--stop-fade: ${MARGIN_FADE * 100}%;`);
    expect(stopCss).toContain(`--stop-fade: ${MARGIN_FADE_PORTRAIT * 100}%;`);
    expect(stopCss).toContain(`--stop-rail-width: max(${RAIL_WIDTH * 100}%, ${RAIL_MIN_PX / 16}rem);`);
  });

  it("has no spots: the only radial gradient is the centred frame vignette", () => {
    const radials = stopCss.match(/radial-gradient\(/g) ?? [];
    expect(radials).toHaveLength(1);
    expect(stopCss).toContain("radial-gradient( ellipse farthest-corner at 50% 50%,");
    expect(stopCss).not.toMatch(/closest-side/);
  });

  it("small labels are ivory, 13 px, weight 600", () => {
    expect(stopCss).toContain("--stop-label-size: 0.8125rem;");
    expect(stopCss).toContain("--stop-label-weight: 600;");
    expect(stopCss).toContain("--stop-label-color: var(--ivory);");
  });
});
