import type { Dictionary } from "./schema";

const pl = {
  meta: {
    title: "Ad Astra — od fundamentu do gwiazd",
    description:
      "Ad Astra: 42-piętrowa wieża mieszkalna nad rzeką. Koncept strony inwestycji — inwestycja i deweloper są fikcyjne.",
  },
  common: {
    skipToContent: "Przejdź do treści",
    languageSwitcher: "Wybór języka",
    languageNames: { pl: "Polski", en: "English" },
  },
  sections: {
    scena: { title: "Budowa wieży" },
    penthouse: { title: "Penthouse" },
    deweloper: { title: "Deweloper" },
    mieszkania: { title: "Mieszkania" },
    ceny: { title: "Ceny" },
    dostosowanie: { title: "Dostosowanie mieszkania" },
    lokalizacja: { title: "Lokalizacja" },
    harmonogram: { title: "Harmonogram" },
    finansowanie: { title: "Finansowanie" },
    kontakt: { title: "Kontakt" },
  },
  footer: {
    disclaimer: "Koncept. Inwestycja i deweloper są fikcyjne.",
    copyright: "© GOVO DIGITAL. Wszelkie prawa zastrzeżone.",
  },
} satisfies Dictionary;

export default pl;
