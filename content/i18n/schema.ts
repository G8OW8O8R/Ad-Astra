import { z } from "zod";
import { sectionIds } from "../sections";
import { stageIds } from "../stages";

const text = z.string().trim().min(1);

const sectionsSchema = z.object(
  Object.fromEntries(sectionIds.map((id) => [id, z.object({ title: text })])) as {
    [K in (typeof sectionIds)[number]]: z.ZodObject<{ title: typeof text }>;
  },
);

/** Stop informacyjny: etykieta etapu, nagłówek z liczbą, 1–2 zdania faktów. */
const stageSchema = z.strictObject({
  label: text,
  title: text,
  body: text,
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
