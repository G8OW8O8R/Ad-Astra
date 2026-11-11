import { z } from "zod";
import { sectionIds } from "../sections";

const text = z.string().trim().min(1);

const sectionsSchema = z.object(
  Object.fromEntries(sectionIds.map((id) => [id, z.object({ title: text })])) as {
    [K in (typeof sectionIds)[number]]: z.ZodObject<{ title: typeof text }>;
  },
);

/** Kształt słownika — wspólny dla wszystkich języków. */
export const dictionarySchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text,
  }),
  common: z.strictObject({
    skipToContent: text,
    languageSwitcher: text,
    languageNames: z.strictObject({ pl: text, en: text }),
  }),
  sections: sectionsSchema,
  footer: z.strictObject({
    disclaimer: text,
    copyright: text,
  }),
});

export type Dictionary = z.infer<typeof dictionarySchema>;
