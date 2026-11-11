import { describe, expect, it } from "vitest";
import { WORDMARK } from "./paths.generated";
import { WORDMARK_STAR, starPath } from "./star";

describe("star", () => {
  it("draws a closed four-pointed path through its tips", () => {
    const d = starPath({ cx: 0, cy: 0, rx: 0.72, ry: 1 });
    expect(d.startsWith("M0 -1")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(4);
    for (const tip of ["0.72 0", "0 1", "-0.72 0"]) expect(d).toContain(tip);
  });

  it("fits between the legs of the second A in the wordmark", () => {
    // Wewnętrzne krawędzie nóg A (jednostki fontu, y w górę od linii bazowej):
    // lewa (89,88)→(207,563), prawa (294,222)→(212,563). Gwiazda na wysokości y = 263.
    const leftAt = (y: number) => 89 + ((207 - 89) * (y - 88)) / (563 - 88);
    const rightAt = (y: number) => 294 + ((212 - 294) * (y - 222)) / (563 - 222);
    const half = (rightAt(263) - leftAt(263)) / 2;
    expect(WORDMARK_STAR.rx).toBeLessThan(half - 25);
    expect(WORDMARK.star.cy).toBe(WORDMARK.capHeight - 263);
  });
});
