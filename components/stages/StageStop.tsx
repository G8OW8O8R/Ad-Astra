import type { CSSProperties, ReactNode } from "react";
import { AdAstraStar } from "@/components/brand/AdAstraLogo";
import type { StageCopy } from "@/content/i18n/schema";
import { formatFloor } from "@/content/stages";
import "./stage-stop.css";

export type StageStopSide = "left" | "right";

interface StageStopProps {
  copy: StageCopy;
  /** Piętro etapu na skali 00–42 (numer przy gwieździe). */
  floor: number;
  /** „Piętro” / „Floor” — dla czytników przed numerem piętra. */
  floorLabel: string;
  /** Strona kadru z tekstem — zawsze przeciwna do wieży. */
  side?: StageStopSide;
  /** Czy stop jest odsłonięty (scena zatrzymała się na etapie). Zmiana uruchamia wejście / wyjście. */
  active?: boolean;
  /** Pozycja skali pięter w poziomie (CSS, np. „44%”). Domyślnie ze stage-stop.css. */
  scaleX?: string;
  /** Wysokość wiersza z etykietą i linią (CSS, np. „28%”). Domyślnie ze stage-stop.css. */
  anchorY?: string;
  headingLevel?: "h2" | "h3" | "h4";
  /** Elementy sceny przypięte do tych samych współrzędnych (np. skala pięter). */
  children?: ReactNode;
}

/**
 * Stop etapu budowy: tekst leży na scenie, bez paneli i ramek.
 * Wiersz-szpilka (etykieta → linia 1 px → gwiazda na skali pięter), liczba-bohater z jednostką,
 * jedna linia nagłówka i jedno zdanie faktów. Czytelność daje warstwa miękkich radialnych
 * przyciemnień pod liniami tekstu (kopia układu bez treści dla czytników, patrz stage-stop.css).
 *
 * Komponent wypełnia najbliższego przodka z `position: relative` (kadr sceny).
 */
export function StageStop({
  copy,
  floor,
  floorLabel,
  side = "left",
  active = true,
  scaleX,
  anchorY,
  headingLevel = "h3",
  children,
}: StageStopProps) {
  const style = {
    ...(scaleX ? { "--stop-scale-x": scaleX } : {}),
    ...(anchorY ? { "--stop-anchor-y": anchorY } : {}),
  } as CSSProperties;

  return (
    <div className="stage-stop" data-side={side} data-active={active} style={style}>
      {children}
      <div className="stage-stop__block stage-stop__block--scrim" aria-hidden="true" inert>
        <StopBody copy={copy} floor={floor} floorLabel={floorLabel} heading="div" />
      </div>
      <article className="stage-stop__block">
        <StopBody copy={copy} floor={floor} floorLabel={floorLabel} heading={headingLevel} />
      </article>
    </div>
  );
}

function StopBody({
  copy,
  floor,
  floorLabel,
  heading: Heading,
}: {
  copy: StageCopy;
  floor: number;
  floorLabel: string;
  heading: "h2" | "h3" | "h4" | "div";
}) {
  return (
    <>
      <div className="stage-stop__pin">
        <Heading className="stage-stop__label stage-stop__shape">{copy.label}</Heading>
        <span className="stage-stop__line" aria-hidden="true" />
        <AdAstraStar className="stage-stop__star" />
        <span className="stage-stop__floor stage-stop__shape">
          <span className="sr-only">{floorLabel} </span>
          {formatFloor(floor)}
        </span>
      </div>
      <p className="stage-stop__figure">
        <span className="stage-stop__mask stage-stop__mask--figure stage-stop__shape">
          <span className="stage-stop__rise">
            {copy.figure}
            <span className="stage-stop__unit"> {copy.unit}</span>
          </span>
        </span>{" "}
        <span className="stage-stop__mask stage-stop__mask--headline stage-stop__shape">
          <span className="stage-stop__rise">{copy.headline}</span>
        </span>
      </p>
      <p className="stage-stop__fact stage-stop__shape">{copy.fact}</p>
    </>
  );
}
