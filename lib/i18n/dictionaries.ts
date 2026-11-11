import "server-only";
import type { Dictionary } from "@/content/i18n/schema";
import type { Locale } from "./config";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  pl: () => import("@/content/i18n/pl").then((m) => m.default),
  en: () => import("@/content/i18n/en").then((m) => m.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
