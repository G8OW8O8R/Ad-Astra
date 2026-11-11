/**
 * Kroje marki (Google Fonts, OFL, serwowane lokalnie przez next/font):
 * Instrument Serif 400 + kursywa — nagłówki, nazwy, ceny, jednostki w stopach; Instrument Sans — interfejs i tekst.
 * Opcje next/font muszą być literałami.
 */
import { Instrument_Sans, Instrument_Serif } from "next/font/google";

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-sans",
  display: "swap",
});

/** Klasy ustawiające zmienne fontów — na <html>. */
export const fontVariables = `${instrumentSerif.variable} ${instrumentSans.variable}`;
