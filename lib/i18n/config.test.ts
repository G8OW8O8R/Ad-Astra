import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  hasLocale,
  localeFromPathname,
  localeRedirectPath,
} from "./config";

describe("i18n config", () => {
  it("defaults to Polish", () => {
    expect(defaultLocale).toBe("pl");
  });

  it("recognises supported locales only", () => {
    expect(hasLocale("pl")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(false);
    expect(hasLocale("PL")).toBe(false);
  });

  it("reads the locale from the first path segment", () => {
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/pl/ceny")).toBe("pl");
    expect(localeFromPathname("/english")).toBeNull();
    expect(localeFromPathname("/")).toBeNull();
  });

  it("redirects paths without a locale to the default one", () => {
    expect(localeRedirectPath("/")).toBe("/pl");
    expect(localeRedirectPath("/kontakt")).toBe("/pl/kontakt");
    expect(localeRedirectPath("/pl")).toBeNull();
    expect(localeRedirectPath("/en/ceny")).toBeNull();
  });
});
