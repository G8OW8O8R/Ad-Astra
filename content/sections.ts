/**
 * Sekcje strony w kolejności wyświetlania. Identyfikatory są stałe dla obu
 * języków (kotwice /pl#ceny i /en#ceny wskazują to samo miejsce).
 */
export const sectionIds = [
  "scena",
  "penthouse",
  "deweloper",
  "mieszkania",
  "ceny",
  "dostosowanie",
  "lokalizacja",
  "harmonogram",
  "finansowanie",
  "kontakt",
] as const;

export type SectionId = (typeof sectionIds)[number];
