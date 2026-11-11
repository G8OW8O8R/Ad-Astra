import type { Dictionary } from "./schema";

const pl = {
  meta: {
    title: "Ad Astra — od fundamentu do gwiazd",
    description:
      "Ad Astra: 42-piętrowa wieża mieszkalna nad rzeką. Koncept strony inwestycji — inwestycja i deweloper są fikcyjne.",
    tagline: "Od fundamentu do gwiazd",
    ogAlt: "Ad Astra — od fundamentu do gwiazd. ALTUM Development. Koncept, inwestycja fikcyjna.",
  },
  common: {
    skipToContent: "Przejdź do treści",
    languageSwitcher: "Wybór języka",
    languageNames: { pl: "Polski", en: "English" },
    home: "Ad Astra — początek strony",
    floor: "Piętro",
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
  stages: {
    fundamenty: {
      label: "Etap 01 — Fundamenty",
      figure: "64",
      unit: "pale",
      headline: "wiercone 28 metrów w głąb",
      fact: "Pale o średnicy 1,2 m spina płyta grubości 2,8 m z 3 000 m³ betonu wylanego bez przerwy w 36 godzin.",
    },
    rdzen: {
      label: "Etap 02 — Rdzeń",
      figure: "4",
      unit: "dni",
      headline: "na każde piętro rdzenia",
      fact: "Ściany grubości 60 cm rosną w szalunku samowznoszącym, 6 pięter przed stropami, wokół 5 wind i 2 klatek.",
    },
    konstrukcja: {
      label: "Etap 03 — Konstrukcja",
      figure: "16",
      unit: "słupów",
      headline: "i żadnej ściany nośnej w lokalach",
      fact: "Sprężone stropy grubości 28 cm opierają się na rdzeniu i słupach, a dźwig 12 t wspina się co 5 pięter.",
    },
    fasada: {
      label: "Etap 04 — Fasada",
      figure: "2 900",
      unit: "tafli",
      headline: "szkła za lamelami co 50 cm",
      fact: "Potrójne szyby wpuszczają 62% światła i tylko 32% ciepła słońca, a lamele w kolorze szampana dają cień latem.",
    },
    tarasy: {
      label: "Etap 05 — Tarasy i technika",
      figure: "84",
      unit: "tarasy",
      headline: "w dwóch spiralach zieleni",
      fact: "Donice głębokości 90 cm podlewa deszczówka ze zbiornika 180 m³, a prąd dla pomp ciepła daje 600 m² paneli.",
    },
    szczyt: {
      label: "Etap 06 — Szczyt",
      figure: "172",
      unit: "metry",
      headline: "do gwiazdy na szczycie",
      fact: "42 piętra kończą się na 148 m, korona z 96 lameli i szpic dodają 24 m, a gwiazda zapala się o zmierzchu.",
    },
  },
  footer: {
    disclaimer: "Koncept. Inwestycja i deweloper są fikcyjne.",
    copyright: "© GOVO DIGITAL. Wszelkie prawa zastrzeżone.",
  },
} satisfies Dictionary;

export default pl;
