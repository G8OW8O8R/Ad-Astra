import type { FontSet } from "./fonts";

/** Twarde spacje w kwotach — liczba nie łamie się między wierszami. */
const nb = (value: string) => value.replace(/ /g, " ");

interface Props {
  set: FontSet;
  /** Unikalny prefiks id (ten sam panel pojawia się w kilku podglądach). */
  idPrefix: string;
}

export function UnitPanelExample({ set, idPrefix }: Props) {
  const titleId = `${idPrefix}-lokal`;
  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#4b4f86_0%,#2a2d55_45%,#151832_100%)] p-4 font-ui @3xl:items-center @3xl:justify-end @3xl:p-12">
      {/* tło zastępcze: w docelowej stronie pod panelem jest scena 3D */}
      <p className="absolute top-6 left-6 text-xs tracking-[0.2em] text-white/35 uppercase">
        tło zastępcze — scena 3D
      </p>

      <article
        aria-labelledby={titleId}
        className="w-full max-w-[400px] rounded-2xl bg-paper p-2 text-text shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="rounded-xl border border-frame px-6 py-7 text-center @3xl:px-8 @3xl:py-9">
          <h3
            id={titleId}
            className="nums font-head text-[1.85rem] leading-tight whitespace-nowrap @3xl:text-[2.5rem]"
            style={{ fontWeight: set.headingWeight }}
          >
            Apartament 27.03
          </h3>
          <p className="nums mt-3 text-[15px] leading-relaxed">
            86,4&nbsp;m² · 3&nbsp;pokoje · piętro&nbsp;27 · wystawa południowo-zachodnia ·
            taras&nbsp;14&nbsp;m²
          </p>

          <p className="nums mt-6 text-[15px]">Cena za m²: {nb("21 900 zł")}</p>
          <p
            className="nums mt-1 font-head text-[2.6rem] leading-tight @3xl:text-[3rem]"
            style={{ fontWeight: set.headingWeight }}
          >
            {nb("1 892 160 zł")}
          </p>

          <dl className="nums mt-4 space-y-1 text-[15px]">
            <div>
              <dt className="inline">Miejsce postojowe: </dt>
              <dd className="inline">{nb("89 000 zł")}</dd>
            </div>
            <div>
              <dt className="inline">Komórka lokatorska: </dt>
              <dd className="inline">{nb("24 000 zł")}</dd>
            </div>
          </dl>

          <p className="mt-5 text-[15px]">
            <a href="#" className="underline underline-offset-4 hover:text-frame">
              Historia ceny
            </a>
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="rounded-full bg-frame px-6 py-3.5 text-[16px] font-medium text-text transition-colors hover:bg-[#c7a56b]"
            >
              Zapytaj o lokal
            </button>
            <button
              type="button"
              className="rounded-full border border-frame px-6 py-3.5 text-[16px] font-medium text-[#8a6c3c] transition-colors hover:bg-frame/10"
            >
              Pobierz kartę PDF
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
