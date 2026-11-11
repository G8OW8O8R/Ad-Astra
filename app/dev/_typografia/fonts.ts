/**
 * Fonty do porównania typografii (zadanie 2A) — tylko strona robocza /dev.
 *
 * Wyłącznie fonty na licencji OFL z Google Fonts: next/font pobiera je przy
 * kompilacji i serwuje lokalnie (subset latin-ext = polskie znaki).
 * Opcje next/font muszą być literałami (bez zmiennych i spreadów).
 */
import {
  Cormorant_Garamond,
  Gilda_Display,
  Instrument_Sans,
  Instrument_Serif,
  Inter_Tight,
  Manrope,
  Playfair_Display,
} from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  variable: "--f-head",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--f-head",
  display: "swap",
});
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--f-head", display: "swap" });
const gilda = Gilda_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--f-head",
  display: "swap",
});

const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--f-ui", display: "swap" });
const instrumentSans = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--f-ui", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--f-ui", display: "swap" });

export interface FontSet {
  id: "1" | "2" | "3" | "4";
  heading: string;
  ui: string;
  /** Klasy next/font ustawiające --f-head i --f-ui. */
  className: string;
  /** Grubość napisu AD ASTRA. */
  heroWeight: number;
  /** Grubość nagłówków i ceny w panelu. */
  headingWeight: number;
}

export const fontSets: readonly FontSet[] = [
  {
    id: "1",
    heading: "Cormorant Garamond",
    ui: "Manrope",
    className: `${cormorant.variable} ${manrope.variable}`,
    heroWeight: 300,
    headingWeight: 400,
  },
  {
    id: "2",
    heading: "Instrument Serif",
    ui: "Instrument Sans",
    className: `${instrumentSerif.variable} ${instrumentSans.variable}`,
    heroWeight: 400,
    headingWeight: 400,
  },
  {
    id: "3",
    heading: "Playfair Display",
    ui: "Inter Tight",
    className: `${playfair.variable} ${interTight.variable}`,
    heroWeight: 400,
    headingWeight: 400,
  },
  {
    id: "4",
    heading: "Gilda Display",
    ui: "Manrope",
    className: `${gilda.variable} ${manrope.variable}`,
    heroWeight: 400,
    headingWeight: 400,
  },
];
