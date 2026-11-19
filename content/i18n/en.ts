import type { Dictionary } from "./schema";

const en = {
  meta: {
    title: "Ad Astra — from the foundation to the stars",
    description:
      "Ad Astra: a 42-storey residential tower by the river. A development website concept — the development and the developer are fictional.",
    tagline: "From the foundation to the stars",
    ogAlt:
      "Ad Astra — from the foundation to the stars. ALTUM Development. A concept; the development is fictional.",
  },
  common: {
    skipToContent: "Skip to content",
    languageSwitcher: "Language",
    languageNames: { pl: "Polski", en: "English" },
    home: "Ad Astra — top of the page",
    floor: "Floor",
  },
  sections: {
    scena: { title: "Building the tower" },
    penthouse: { title: "Penthouse" },
    deweloper: { title: "Developer" },
    mieszkania: { title: "Apartments" },
    ceny: { title: "Prices" },
    dostosowanie: { title: "Customisation" },
    lokalizacja: { title: "Location" },
    harmonogram: { title: "Schedule" },
    finansowanie: { title: "Financing" },
    kontakt: { title: "Contact" },
  },
  stages: {
    fundamenty: {
      label: "Stage 01 — Foundations",
      figure: "64",
      unit: "piles",
      headline: "bored 28 metres deep",
      fact: "The 1.2 m piles are tied by a 2.8 m raft of 3,000 m³ of concrete, poured non-stop over 36 hours.",
    },
    rdzen: {
      label: "Stage 02 — Core",
      figure: "4",
      unit: "days",
      headline: "for every storey of the core",
      fact: "Its 60 cm walls rise in self-climbing formwork 6 storeys ahead of the slabs, around 5 lifts and 2 stairwells.",
    },
    konstrukcja: {
      label: "Stage 03 — Structure",
      figure: "16",
      unit: "columns",
      headline: "and no load-bearing walls inside",
      fact: "28 cm post-tensioned slabs rest on the core and columns, and the 12-tonne crane climbs every 5 floors.",
    },
    fasada: {
      label: "Stage 04 — Façade",
      figure: "2,900",
      unit: "panes",
      headline: "of glass and 96 fins every 1.1 m",
      fact: "Triple glazing lets in 62% of daylight and only 32% of the sun’s heat; champagne fins shade it in summer.",
    },
    tarasy: {
      label: "Stage 05 — Terraces & services",
      figure: "84",
      unit: "terraces",
      headline: "in two spirals of green",
      fact: "Rainwater from a 180 m³ tank feeds 90 cm-deep planters, and 600 m² of solar panels power the heat pumps.",
    },
    szczyt: {
      label: "Stage 06 — Summit",
      figure: "172",
      unit: "metres",
      headline: "to the star at the top",
      fact: "42 storeys end at 148 m, the crown of 96 fins and the spire add 24 m, and the star lights up at dusk.",
    },
  },
  footer: {
    disclaimer: "Concept. The development and the developer are fictional.",
    copyright: "© GOVO DIGITAL. All rights reserved.",
  },
} satisfies Dictionary;

export default en;
