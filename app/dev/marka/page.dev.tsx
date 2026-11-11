import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { AdAstraLogo, AdAstraStar } from "@/components/brand/AdAstraLogo";
import { AltumMark } from "@/components/brand/AltumMark";
import en from "@/content/i18n/en";
import pl from "@/content/i18n/pl";
import { stages } from "@/content/stages";
import { colors, contrast, cssVarName, textPairs, type ColorName } from "@/lib/brand/tokens";
import { StopCard } from "../_marka/StopCard";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Marka — podgląd",
  robots: { index: false, follow: false, nocache: true },
};

const colorUse: Record<ColorName, string> = {
  ivory: "panele, jasne strony",
  ink: "tekst na jasnym",
  inkSoft: "tekst drugorzędny",
  gold: "akcent, linie 1 px, przyciski z tekstem ink",
  goldSoft: "linie na ciemnym",
  night: "tło nocnych scen pod UI",
  sky: "akcent dzienny, oszczędnie",
  statusFree: "status: wolne",
  statusReserved: "status: rezerwacja",
  statusSold: "status: sprzedane",
};

const typeSteps: Array<{ token: string; range: string; serif: boolean }> = [
  { token: "display", range: "64–160", serif: true },
  { token: "6xl", range: "56–120", serif: true },
  { token: "5xl", range: "48–88", serif: true },
  { token: "4xl", range: "40–64", serif: true },
  { token: "3xl", range: "32–48", serif: true },
  { token: "2xl", range: "26–36", serif: true },
  { token: "xl", range: "22–28", serif: true },
  { token: "lg", range: "18–22", serif: false },
  { token: "base", range: "16–18", serif: false },
  { token: "sm", range: "14–16", serif: false },
  { token: "xs", range: "13–14", serif: false },
  { token: "2xs", range: "12", serif: false },
];

// Pełne nazwy klas (Tailwind musi je znaleźć w kodzie).
const textClass: Record<string, string> = {
  display: "text-display",
  "6xl": "text-6xl",
  "5xl": "text-5xl",
  "4xl": "text-4xl",
  "3xl": "text-3xl",
  "2xl": "text-2xl",
  xl: "text-xl",
  lg: "text-lg",
  base: "text-base",
  sm: "text-sm",
  xs: "text-xs",
  "2xs": "text-2xs",
};

const swatchClass: Record<ColorName, string> = {
  ivory: "bg-ivory",
  ink: "bg-ink",
  inkSoft: "bg-ink-soft",
  gold: "bg-gold",
  goldSoft: "bg-gold-soft",
  night: "bg-night",
  sky: "bg-sky",
  statusFree: "bg-status-free",
  statusReserved: "bg-status-reserved",
  statusSold: "bg-status-sold",
};

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-gold py-16">
      <h2 id={`${id}-h`} className="label mb-10 text-ink-soft">
        {title}
      </h2>
      {children}
    </section>
  );
}

const nav = [
  ["kolory", "Kolory"],
  ["typografia", "Typografia"],
  ["uklad", "Odstępy, promienie, cienie"],
  ["logo", "Logotypy"],
  ["ikony", "Ikony i OG"],
  ["stopy", "Stopy"],
] as const;

export default function BrandPage() {
  return (
    <div className="min-h-svh bg-ivory font-sans text-ink">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-gold bg-ivory/95 px-6 py-4 backdrop-blur md:px-12">
        <div className="flex items-center gap-4">
          <AdAstraLogo className="h-5 w-auto" />
          <span className="label text-ink-soft">Marka · strona robocza</span>
        </div>
        <nav aria-label="Sekcje">
          <ul className="label flex flex-wrap gap-x-5 gap-y-2">
            {nav.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-ink-soft hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="px-6 md:px-12">
        <h1 className="sr-only">Ad Astra — identyfikacja i tokeny</h1>

        <Block id="kolory" title="01 · Kolory">
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(colors) as ColorName[]).map((name) => (
              <li key={name} className="flex flex-col gap-3">
                <span
                  className={`block h-24 border border-ink/10 ${swatchClass[name]}`}
                  aria-hidden="true"
                />
                <span className="font-serif text-xl">{cssVarName(name)}</span>
                <span className="label figures text-ink-soft">{colors[name]}</span>
                <span className="text-xs text-ink-soft">{colorUse[name]}</span>
              </li>
            ))}
          </ul>
          <table className="figures mt-12 w-full max-w-3xl text-left text-sm">
            <caption className="label mb-4 text-left text-ink-soft">
              Kontrast par tekst / tło (WCAG AA ≥ 4,5:1)
            </caption>
            <thead className="label text-ink-soft">
              <tr className="border-b border-gold">
                <th className="py-2 font-medium">Próbka</th>
                <th className="py-2 font-medium">Para</th>
                <th className="py-2 font-medium">Użycie</th>
                <th className="py-2 text-right font-medium">Kontrast</th>
              </tr>
            </thead>
            <tbody>
              {textPairs.map(({ text, background, use }) => (
                <tr key={`${text}-${background}`} className="border-b border-ink/10">
                  <td className="py-2">
                    <span
                      className="inline-block rounded-chip px-3 py-1 font-medium"
                      style={{ color: colors[text], background: colors[background] }}
                    >
                      Aa 1 892 160 zł
                    </span>
                  </td>
                  <td className="py-2">
                    {cssVarName(text)} / {cssVarName(background)}
                  </td>
                  <td className="py-2 text-ink-soft">{use}</td>
                  <td className="py-2 text-right">
                    {contrast(colors[text], colors[background]).toFixed(2)}:1
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>

        <Block id="typografia" title="02 · Typografia — Instrument Serif 400 / Instrument Sans">
          <ul className="flex flex-col gap-6">
            {typeSteps.map(({ token, range, serif }) => (
              <li
                key={token}
                className="grid items-baseline gap-2 border-b border-ink/10 pb-6 md:grid-cols-[180px_1fr]"
              >
                <span className="label figures text-ink-soft">
                  text-{token} · {range} px
                </span>
                <span className={`${textClass[token]} ${serif ? "font-serif" : ""} block truncate`}>
                  {token === "display"
                    ? "Ad Astra"
                    : token === "6xl"
                      ? "Do gwiazd"
                      : serif
                        ? "Od fundamentu do gwiazd"
                        : "Żółte światła zapalają się nad rzeką o zmierzchu."}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="label text-ink-soft">Etykieta · Sans 500, wersaliki, 0.18em</span>
              <span className="label">Etap 01 — Fundamenty</span>
              <span className="label text-ink-soft">Cena za m² · Piętro 27 · Taras 14 m²</span>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label text-ink-soft">Ceny · Serif, cyfry tabelaryczne</span>
              <span className="figures font-serif text-5xl">1 892 160 zł</span>
              <span className="figures text-sm text-ink-soft">21 900 zł/m² · 86,4 m² · 3 pokoje</span>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label text-ink-soft">Polskie znaki</span>
              <span className="font-serif text-4xl">ĄĘŁŃÓŚŹŻĆ ąęłńóśźżć</span>
              <span className="text-lg">ĄĘŁŃÓŚŹŻĆ ąęłńóśźżć — Zażółć gęślą jaźń</span>
            </div>
          </div>
        </Block>

        <Block id="uklad" title="03 · Odstępy, promienie, linie, cienie">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <p className="label mb-4 text-ink-soft">Odstępy · skala 4 px</p>
              <ul className="flex flex-col gap-2">
                {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((step) => (
                  <li key={step} className="figures flex items-center gap-4 text-xs text-ink-soft">
                    <span className="w-14">{step * 4} px</span>
                    <span className="block h-2 bg-gold" style={{ width: `calc(var(--spacing) * ${step})` }} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-6">
              <p className="label text-ink-soft">Promienie i linie</p>
              <div className="rounded-panel border border-gold p-6 text-sm">Panel · promień 0 · linia 1 px gold</div>
              <div className="flex flex-wrap gap-2">
                <span className="label rounded-chip bg-status-free px-3 py-1.5">Wolne</span>
                <span className="label rounded-chip bg-status-reserved px-3 py-1.5">Rezerwacja</span>
                <span className="label rounded-chip bg-status-sold px-3 py-1.5">Sprzedane</span>
                <span className="label rounded-chip border border-gold px-3 py-1.5">Chip · pełne zaokrąglenie</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="rounded-chip bg-gold px-6 py-3 text-sm font-medium text-ink">
                  Zapytaj o lokal
                </button>
                <button type="button" className="rounded-chip border border-gold px-6 py-3 text-sm font-medium text-ink">
                  Pobierz kartę PDF
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <p className="label text-ink-soft">Cienie · miękkie, ciepłe</p>
              <div className="bg-ivory p-6 text-sm shadow-soft">shadow-soft</div>
              <div className="bg-ivory p-6 text-sm shadow-panel">shadow-panel</div>
              <div className="bg-night p-6 text-sm text-ivory">
                <div className="border border-gold-soft/60 p-4 shadow-glow">shadow-glow (na nocy)</div>
              </div>
            </div>
          </div>
        </Block>

        <Block id="logo" title="04 · Logotypy">
          <div className="grid gap-6 lg:grid-cols-2">
            <figure className="flex min-w-0 flex-col gap-3">
              <div className="flex h-56 items-center justify-center border border-gold bg-ivory p-10">
                <AdAstraLogo tone="dark" className="h-auto w-full max-w-md" />
              </div>
              <figcaption className="label text-ink-soft">Ciemna (ink) na ivory</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-col gap-3">
              <div className="flex h-56 items-center justify-center bg-night p-10">
                <AdAstraLogo tone="light" starColor="var(--gold-soft)" className="h-auto w-full max-w-md" />
              </div>
              <figcaption className="label text-ink-soft">Jasna (ivory) na nocy, gwiazda gold-soft</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-col gap-3 lg:col-span-2">
              <div className="relative flex h-80 items-start justify-center overflow-hidden pt-14">
                <Image
                  src="/dev/ulica-pusta.jpg"
                  alt=""
                  fill
                  loading="eager"
                  sizes="100vw"
                  className="object-cover object-[50%_65%]"
                />
                <AdAstraLogo
                  tone="light"
                  className="relative h-auto w-[85%] max-w-3xl drop-shadow-[0_2px_24px_rgba(30,34,54,0.35)]"
                />
              </div>
              <figcaption className="label text-ink-soft">Jasna na ulicy (dzień)</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-col gap-3">
              <div className="flex h-44 items-center justify-center gap-10 border border-gold bg-ivory">
                <AltumMark tone="dark" className="h-14 w-auto max-w-[80%]" />
              </div>
              <figcaption className="label text-ink-soft">ALTUM Development · ciemna</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-col gap-3">
              <div className="flex h-44 items-center justify-center bg-night">
                <AltumMark tone="light" className="h-14 w-auto max-w-[80%]" />
              </div>
              <figcaption className="label text-ink-soft">ALTUM Development · jasna</figcaption>
            </figure>
            <figure className="flex min-w-0 flex-col gap-3 lg:col-span-2">
              <div className="flex flex-wrap items-end gap-10 border border-gold bg-ivory p-10">
                <AdAstraLogo className="h-4 w-auto" />
                <AdAstraLogo className="h-6 w-auto" />
                <AdAstraLogo className="h-10 w-auto" />
                <AdAstraStar className="h-4 w-4 text-gold" />
                <AdAstraStar className="h-8 w-8 text-gold" />
                <AdAstraStar className="h-16 w-16 text-ink" />
                <span className="flex h-16 items-center bg-night px-6">
                  <AdAstraStar className="h-10 w-10 text-gold-soft" />
                </span>
              </div>
              <figcaption className="label text-ink-soft">Rozmiary · sama gwiazda (favicon, znacznik skali pięter)</figcaption>
            </figure>
          </div>
        </Block>

        <Block id="ikony" title="05 · Favicon, ikona aplikacji, OG image">
          <div className="flex flex-wrap items-end gap-10">
            {/* eslint-disable-next-line @next/next/no-img-element -- podgląd plików ikon 1:1 */}
            <img src="/icon.svg" alt="Favicon 16 px" width={16} height={16} />
            {/* eslint-disable-next-line @next/next/no-img-element -- podgląd plików ikon 1:1 */}
            <img src="/icon.svg" alt="Favicon 32 px" width={32} height={32} />
            {/* eslint-disable-next-line @next/next/no-img-element -- podgląd plików ikon 1:1 */}
            <img src="/icon.svg" alt="Favicon 64 px" width={64} height={64} />
            {/* eslint-disable-next-line @next/next/no-img-element -- podgląd plików ikon 1:1 */}
            <img src="/apple-icon" alt="Ikona aplikacji 180 px" width={180} height={180} className="rounded-[40px]" />
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {(["pl", "en"] as const).map((lang) => (
              <figure key={lang} className="flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- podgląd wygenerowanego obrazu OG */}
                <img
                  src={`/${lang}/opengraph-image/og`}
                  alt={(lang === "pl" ? pl : en).meta.ogAlt}
                  width={1200}
                  height={630}
                  className="h-auto w-full border border-ink/10 shadow-soft"
                />
                <figcaption className="label text-ink-soft">OG 1200×630 · {lang.toUpperCase()}</figcaption>
              </figure>
            ))}
          </div>
        </Block>

        <Block id="stopy" title="06 · Stopy informacyjne — PL na ulicy, EN nocą">
          <div className="relative overflow-hidden p-6 md:p-12">
            <Image src="/dev/ulica-pusta.jpg" alt="" fill loading="eager" sizes="100vw" className="object-cover" />
            <div className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {stages.map((stage) => (
                <StopCard
                  key={stage.id}
                  copy={pl.stages[stage.id]}
                  floor={stage.floor}
                  floorLabel={pl.common.floor}
                  tone="day"
                />
              ))}
            </div>
          </div>
          <div
            lang="en"
            className="mt-6 grid gap-6 bg-[radial-gradient(ellipse_at_50%_20%,#30365a_0%,var(--night)_60%)] p-6 md:grid-cols-2 md:p-12 xl:grid-cols-3"
          >
            {stages.map((stage) => (
              <StopCard
                key={stage.id}
                copy={en.stages[stage.id]}
                floor={stage.floor}
                floorLabel={en.common.floor}
                tone="night"
              />
            ))}
          </div>
        </Block>
      </main>
    </div>
  );
}
