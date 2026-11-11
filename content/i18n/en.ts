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
      title: "64 piles, 28 metres deep",
      body: "The tower stands on 64 bored piles, 1.2 m in diameter, reaching 28 m below street level. A 2.8 m-thick raft ties them together: 3,000 m³ of concrete poured continuously over 36 hours.",
    },
    rdzen: {
      label: "Stage 02 — Core",
      title: "A new core storey every 4 days",
      body: "The reinforced-concrete core, with 60 cm walls, rises in self-climbing formwork and stays 6 storeys ahead of the floor slabs. It houses 5 lifts, including a firefighting lift, and 2 pressurised stairwells.",
    },
    konstrukcja: {
      label: "Stage 03 — Structure",
      title: "16 columns, no load-bearing walls inside the apartments",
      body: "28 cm post-tensioned slabs rest on the core and 16 perimeter columns, so any apartment layout can change without touching the structure. A 12-tonne tower crane climbs with the building every 5 floors.",
    },
    fasada: {
      label: "Stage 04 — Façade",
      title: "2,900 glass panels, fins every 50 cm",
      body: "Triple glazing with a selective coating lets in 62% of daylight but only 32% of the sun’s heat. Vertical fins in champagne-anodised aluminium shade the glass in summer and let the low winter sun in.",
    },
    tarasy: {
      label: "Stage 05 — Terraces & services",
      title: "84 terraces in two spirals of green",
      body: "Every floor has 2 terraces with 90 cm-deep planters, watered with rainwater from a 180 m³ tank below the building. Heat pumps heat and cool the apartments, backed by 600 m² of solar panels on the podium roof.",
    },
    szczyt: {
      label: "Stage 06 — Summit",
      title: "172 metres to the star",
      body: "The 42 storeys end at 148 m; a crown of 96 fins and the spire add another 24 m. The star at the top lights up at dusk in warm 2700 K light and dims after midnight so it never glares into the neighbours’ windows.",
    },
  },
  footer: {
    disclaimer: "Concept. The development and the developer are fictional.",
    copyright: "© GOVO DIGITAL. All rights reserved.",
  },
} satisfies Dictionary;

export default en;
