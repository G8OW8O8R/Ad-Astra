import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FLOOR_MARKER_SCRIM,
  STOP_SCRIM,
  markerReach,
  over,
  sceneSamples,
  scrimReach,
  scrimmed,
} from "./scrim";
import { colors, contrast } from "./tokens";

const tokensCss = readFileSync(join(process.cwd(), "app", "tokens.css"), "utf8");
const stopCss = readFileSync(join(process.cwd(), "components", "stages", "stage-stop.css"), "utf8");

/** Kolory tekstu stopu (krycie 1 = pełny kolor). */
const textRoles = [
  { role: "etykieta i numer piętra", color: colors.goldSoft, opacity: 1 },
  { role: "liczba, jednostka, nagłówek", color: colors.ivory, opacity: 1 },
  { role: "zdanie faktów (ivory 85%)", color: colors.ivory, opacity: 0.85 },
] as const;

const samples = [
  ...sceneSamples.day.map((s) => ({ ...s, scene: "dzień" })),
  ...sceneSamples.night.map((s) => ({ ...s, scene: "noc" })),
];

describe("stop scrim — contrast on scene samples", () => {
  for (const { role, color, opacity } of textRoles) {
    it.each(samples)(`${role} on $scene: $where ($hex) ≥ 4.5:1`, ({ hex }) => {
      const background = scrimmed(hex);
      const text = over(color, background, opacity);
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("is actually needed: without the scrim the brightest day sample fails", () => {
    expect(contrast(colors.ivory, "#faf6e3")).toBeLessThan(1.5);
  });
});

describe("stop scrim — geometry keeps text inside the full-opacity core", () => {
  // Typowe linie tekstu (px): etykieta, liczba 260 px / 120 px, nagłówek, fakty w 2–3 wierszach.
  const boxes = [
    ["label", 320, 17],
    ["figure desktop", 640, 221],
    ["figure phone", 330, 102],
    ["headline", 560, 44],
    ["headline phone, 2 lines", 358, 62],
    ["fact, 2 lines", 430, 58],
    ["fact phone, 4 lines", 358, 104],
  ] as const;

  it.each(boxes)("%s (%i×%i) corners stay within the plateau", (_, w, h) => {
    expect(scrimReach(w, h)).toBeLessThanOrEqual(STOP_SCRIM.plateau);
  });

  it("floor marker oval covers the floor number and the star", () => {
    const [w, h] = [20, 17];
    const corners = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ] as const;
    for (const [x, y] of corners) {
      expect(markerReach(w, h, x, y)).toBeLessThanOrEqual(FLOOR_MARKER_SCRIM.plateau);
    }
    expect(markerReach(w, h, FLOOR_MARKER_SCRIM.starCenterPx, h / 2)).toBeLessThanOrEqual(
      FLOOR_MARKER_SCRIM.plateau,
    );
  });

  it("alpha matches app/tokens.css", () => {
    const alpha = /--stop-scrim-alpha:\s*([\d.]+)\s*;/.exec(tokensCss)?.[1];
    expect(Number(alpha)).toBe(STOP_SCRIM.alpha);
  });

  it("shape matches stage-stop.css", () => {
    const min = `-${STOP_SCRIM.padMinPx / 16}rem`;
    const pad = (ratio: number) => `min(${min}, -${ratio * 100}%)`;
    expect(stopCss).toContain(`inset: ${pad(STOP_SCRIM.padYRatio)} ${pad(STOP_SCRIM.padX)};`);
    expect(stopCss).toContain(`var(--night) 0 ${STOP_SCRIM.plateau * 100}%`);
    expect(stopCss).toContain("opacity: var(--stop-scrim-alpha)");
    const { padYPx, padOuterPx, padStarSidePx, plateau } = FLOOR_MARKER_SCRIM;
    const rem = (px: number) => `-${px / 16}rem`;
    expect(stopCss).toContain(
      `inset: ${rem(padYPx)} ${rem(padOuterPx)} ${rem(padYPx)} ${rem(padStarSidePx)};`,
    );
    expect(stopCss).toContain(`var(--night) 0 ${plateau * 100}%`);
  });
});
