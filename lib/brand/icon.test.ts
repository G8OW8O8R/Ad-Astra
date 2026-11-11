import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { iconSvg } from "./icon";

describe("favicon", () => {
  it("app/icon.svg is generated from the brand star and tokens", () => {
    const file = readFileSync(join(process.cwd(), "app", "icon.svg"), "utf8").replace(/\r\n/g, "\n");
    // Przy zmianie gwiazdy lub kolorów: zapisz iconSvg() do app/icon.svg (np. jednorazowym testem Vitest).
    expect(file).toBe(iconSvg());
  });
});
