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

/** Granice formy stopu: jedna linia nagłówka w 28–40 px, jedno zdanie ≤ 120 znaków. */
const HEADLINE_MAX = 34;
const FACT_MAX = 120;
const UNIT_MAX = 10;

const asNumber = (figure: string) => Number(figure.replace(/[^\d]/g, ""));

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
      const ids = stages.map((s) => s.id);

      it.each(stages.map((s, i) => [s.id, i] as const))("%s: label is numbered", (id, i) => {
        expect(dict.stages[id].label).toMatch(
          new RegExp(`^${labelPrefix[lang]} 0${i + 1} — \\S`),
        );
      });

      it.each(ids)("%s: hero figure is a bare number that never wraps", (id) => {
        const { figure } = dict.stages[id];
        expect(figure).toMatch(/^\d{1,3}(?:[\p{Zs},]\d{3})*$/u);
        expect(figure).not.toMatch(/ /);
      });

      it.each(ids)("%s: unit is one short word", (id) => {
        const { unit } = dict.stages[id];
        expect(unit).toMatch(/^\p{Ll}+$/u);
        expect(unit.length).toBeLessThanOrEqual(UNIT_MAX);
      });

      it.each(ids)(`%s: headline is one line (≤ ${HEADLINE_MAX} chars), lower-case continuation`, (id) => {
        const { headline } = dict.stages[id];
        expect(headline.length).toBeLessThanOrEqual(HEADLINE_MAX);
        expect(headline).toMatch(/^\p{Ll}/u);
        expect(headline).not.toMatch(/[.!?]$/);
      });

      it.each(ids)(`%s: one sentence of facts, ≤ ${FACT_MAX} chars, with numbers`, (id) => {
        const { fact } = dict.stages[id];
        expect(fact.length).toBeLessThanOrEqual(FACT_MAX);
        expect(fact).toMatch(/\.$/);
        expect(fact.slice(0, -1)).not.toMatch(/[.!?](?=\s)/);
        expect((fact.match(/\d+/g) ?? []).length).toBeGreaterThanOrEqual(2);
      });

      it.each(ids)("%s: a number never breaks away from its unit", (id) => {
        const { headline, fact } = dict.stages[id];
        // Zwykła spacja między liczbą a jednostką = ryzyko „180 / m³” w dwóch wierszach.
        for (const text of [headline, fact]) {
          expect(text).not.toMatch(/\d (?:m|cm|m²|m³|t|h|K|metrów|metres|godzin|hours)(?!\p{L})/u);
        }
      });

      it("keeps the tower numbers consistent: 42 floors, 148 m, 172 m with the spire", () => {
        const { szczyt, tarasy } = dict.stages;
        expect(asNumber(szczyt.figure)).toBe(172);
        expect(szczyt.fact).toMatch(new RegExp(`\\b${TOP_FLOOR}\\b`));
        expect(szczyt.fact).toMatch(/\b148\sm\b/);
        expect(szczyt.fact).toMatch(/\b24\sm\b/);
        expect(148 + 24).toBe(asNumber(szczyt.figure));
        // Dwa tarasy na każdym piętrze.
        expect(asNumber(tarasy.figure)).toBe(TOP_FLOOR * 2);
      });

      it("uses the same figures as the other language", () => {
        const other = lang === "pl" ? dictionaries.en : dictionaries.pl;
        for (const id of ids) {
          expect(asNumber(dict.stages[id].figure)).toBe(asNumber(other.stages[id].figure));
        }
      });

      it("uses no empty marketing words", () => {
        const all = Object.values(dict.stages)
          .flatMap((s) => [s.label, s.unit, s.headline, s.fact])
          .join(" ");
        for (const word of emptyWords) expect(all).not.toMatch(word);
      });
    });
  }
});
