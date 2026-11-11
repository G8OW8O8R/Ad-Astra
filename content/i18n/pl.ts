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
      title: "64 pale, 28 metrów w głąb",
      body: "Wieża stoi na 64 palach wierconych o średnicy 1,2 m, sięgających 28 m poniżej poziomu ulicy. Spina je płyta fundamentowa grubości 2,8 m: 3 000 m³ betonu wylanego bez przerwy w 36 godzin.",
    },
    rdzen: {
      label: "Etap 02 — Rdzeń",
      title: "Nowe piętro rdzenia co 4 dni",
      body: "Żelbetowy rdzeń o ścianach grubości 60 cm rośnie w szalunku samowznoszącym i wyprzedza stropy o 6 kondygnacji. Mieści 5 wind, w tym windę dla ekip ratowniczych, i 2 klatki schodowe chronione nadciśnieniem.",
    },
    konstrukcja: {
      label: "Etap 03 — Konstrukcja",
      title: "16 słupów, zero ścian nośnych w mieszkaniach",
      body: "Stropy sprężone grubości 28 cm opierają się na rdzeniu i 16 słupach na obwodzie, więc układ każdego mieszkania można zmienić bez ingerencji w konstrukcję. Dźwig wieżowy o udźwigu 12 t podnosi się razem z budynkiem co 5 pięter.",
    },
    fasada: {
      label: "Etap 04 — Fasada",
      title: "2 900 tafli szkła, lamele co 50 cm",
      body: "Potrójne przeszklenia z powłoką selektywną wpuszczają 62% światła dziennego i tylko 32% ciepła słońca. Pionowe lamele z aluminium anodowanego na kolor szampana zacieniają szkło latem, a zimą przepuszczają nisko stojące słońce.",
    },
    tarasy: {
      label: "Etap 05 — Tarasy i technika",
      title: "84 tarasy w dwóch spiralach zieleni",
      body: "Każde piętro ma 2 tarasy z donicami głębokości 90 cm, podlewanymi wodą deszczową ze zbiornika 180 m³ pod budynkiem. Mieszkania ogrzewają i chłodzą pompy ciepła, wspierane przez 600 m² paneli fotowoltaicznych na dachu podium.",
    },
    szczyt: {
      label: "Etap 06 — Szczyt",
      title: "172 metry do gwiazdy",
      body: "42 piętra kończą się na wysokości 148 m, a korona z 96 lameli i szpic dodają kolejne 24 m. Gwiazda na szczycie zapala się o zmierzchu ciepłym światłem 2700 K i przygasa po północy, żeby nie razić sąsiadów.",
    },
  },
  footer: {
    disclaimer: "Koncept. Inwestycja i deweloper są fikcyjne.",
    copyright: "© GOVO DIGITAL. Wszelkie prawa zastrzeżone.",
  },
} satisfies Dictionary;

export default pl;
