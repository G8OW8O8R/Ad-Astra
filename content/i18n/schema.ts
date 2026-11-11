import { z } from "zod";
import { sectionIds } from "../sections";
import { stageIds } from "../stages";

const text = z.string().trim().min(1);

const sectionsSchema = z.object(
  Object.fromEntries(sectionIds.map((id) => [id, z.object({ title: text })])) as {
    [K in (typeof sectionIds)[number]]: z.ZodObject<{ title: typeof text }>;
  },
);

/**
 * Stop etapu: etykieta („Etap 05 — Tarasy i technika”), liczba-bohater z jednostką
 * („84” + „tarasy”), jedna linia nagłówka i jedno zdanie faktów (≤ 120 znaków).
 * Liczba jest tekstem, żeby zachować zapis tysięcy: twarda spacja w PL, przecinek w EN.
 */
const stageSchema = z.strictObject({
  label: text,
  figure: z.string().regex(/^\d{1,3}(?:[\p{Zs},]\d{3})*$/u),
  unit: text,
  headline: text,
  fact: text.max(120),
});

const stagesSchema = z.strictObject(
  Object.fromEntries(stageIds.map((id) => [id, stageSchema])) as {
    [K in (typeof stageIds)[number]]: typeof stageSchema;
  },
);

/** Kształt słownika — wspólny dla wszystkich języków. */
export const dictionarySchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text,
    tagline: text,
    ogAlt: text,
  }),
  common: z.strictObject({
    skipToContent: text,
    languageSwitcher: text,
    languageNames: z.strictObject({ pl: text, en: text }),
    home: text,
    floor: text,
  }),
  sections: sectionsSchema,
  stages: stagesSchema,
  footer: z.strictObject({
    disclaimer: text,
    copyright: text,
  }),
});

export type Dictionary = z.infer<typeof dictionarySchema>;
export type StageCopy = z.infer<typeof stageSchema>;
