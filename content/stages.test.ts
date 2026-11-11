import { describe, expect, it } from "vitest";
import en from "./i18n/en";
import pl from "./i18n/pl";
import { TOP_FLOOR, formatFloor, stages } from "./stages";

const dictionaries = { pl, en } as const;
const labelPrefix = { pl: "Etap", en: "Stage" } as const;

/** ZASADA NR 2: konkret zamiast haseł — tych słów nie używamy w stopach. */
const emptyWords = [
  /luksus/i,
  /presti[żz]/i,
  /wyjątkow/i,
  /unikaln/i,
  /niepowtarzaln/i,
  /luxur/i,
  /prestig/i,
  /unique/i,
  /exclusive/i,
  /world-class/i,
];

describe("construction stages", () => {
  it("has 6 stages in floor order, ending at the top floor", () => {
    expect(stages).toHaveLength(6);
    const floors = stages.map((s) => s.floor);
    expect([...floors].sort((a, b) => a - b)).toEqual(floors);
    expect(floors[0]).toBe(0);
    expect(floors.at(-1)).toBe(TOP_FLOOR);
    expect(floors.every((f) => Number.isInteger(f) && f >= 0 && f <= TOP_FLOOR)).toBe(true);
  });

  it("formats floors with two digits", () => {
    expect(formatFloor(0)).toBe("00");
    expect(formatFloor(42)).toBe("42");
  });

  for (const [lang, dict] of Object.entries(dictionaries) as Array<
    [keyof typeof dictionaries, (typeof dictionaries)[keyof typeof dictionaries]]
  >) {
    describe(lang, () => {
      it.each(stages.map((s, i) => [s.id, i] as const))("%s: label is numbered", (id, i) => {
        expect(dict.stages[id].label).toMatch(
          new RegExp(`^${labelPrefix[lang]} 0${i + 1} — \\S`),
        );
      });

      it.each(stages.map((s) => s.id))("%s: headline carries a number", (id) => {
        expect(dict.stages[id].title).toMatch(/\d/);
      });

      it.each(stages.map((s) => s.id))("%s: 1–2 sentences of facts with numbers", (id) => {
        const body = dict.stages[id].body;
        const sentences = body.split(/(?<=[.!?])\s+(?=\p{Lu}|\d)/u);
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(2);
        expect((body.match(/\d+/g) ?? []).length).toBeGreaterThanOrEqual(2);
      });

      it("uses no empty marketing words", () => {
        const all = Object.values(dict.stages)
          .flatMap((s) => [s.label, s.title, s.body])
          .join(" ");
        for (const word of emptyWords) expect(all).not.toMatch(word);
      });
    });
  }
});
