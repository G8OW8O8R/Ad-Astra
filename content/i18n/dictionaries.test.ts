import { describe, expect, it } from "vitest";
import { sectionIds } from "../sections";
import en from "./en";
import pl from "./pl";
import { dictionarySchema } from "./schema";

const dictionaries = { pl, en };

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("dictionaries", () => {
  it.each(Object.entries(dictionaries))("%s matches the schema", (_, dict) => {
    expect(() => dictionarySchema.parse(dict)).not.toThrow();
  });

  it("PL and EN have identical keys", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(pl).sort());
  });

  it("has a title for every section", () => {
    for (const dict of Object.values(dictionaries)) {
      expect(Object.keys(dict.sections).sort()).toEqual([...sectionIds].sort());
    }
  });

  it("states that the project is fictional", () => {
    expect(pl.footer.disclaimer).toBe("Koncept. Inwestycja i deweloper są fikcyjne.");
    expect(en.footer.disclaimer).toMatch(/fictional/i);
  });
});
