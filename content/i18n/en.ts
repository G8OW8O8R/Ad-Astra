import type { Dictionary } from "./schema";

const en = {
  meta: {
    title: "Ad Astra — from the foundation to the stars",
    description:
      "Ad Astra: a 42-storey residential tower by the river. A development website concept — the development and the developer are fictional.",
  },
  common: {
    skipToContent: "Skip to content",
    languageSwitcher: "Language",
    languageNames: { pl: "Polski", en: "English" },
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
  footer: {
    disclaimer: "Concept. The development and the developer are fictional.",
    copyright: "© GOVO DIGITAL. All rights reserved.",
  },
} satisfies Dictionary;

export default en;
