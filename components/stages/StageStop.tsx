"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AdAstraStar } from "@/components/brand/AdAstraLogo";
import type { StageCopy } from "@/content/i18n/schema";
import { TOP_FLOOR, formatFloor } from "@/content/stages";
import { EXTENT_PAD } from "@/lib/brand/legibility";
import "./stage-stop.css";

export type StageStopSide = "left" | "right";

/** Punkt na wieży (ułamki 0–1 szerokości i wysokości kadru). W zadaniu 5 — rzut piętra z modelu 3D. */
export interface StagePin {
  x: number;
  y: number;
}

interface StageStopProps {
  copy: StageCopy;
  /** Piętro etapu (00–42): znacznik na skali po prawej. */
  floor: number;
  /** „Piętro” / „Floor” — dla czytników przed numerem piętra. */
  floorLabel: string;
  /** Strona kadru z tekstem — zawsze przeciwna do wieży. */
  side?: StageStopSide;
  /** Czy stop jest odsłonięty (scena zatrzymała się na etapie). Zmiana uruchamia wejście / wyjście. */
  active?: boolean;
  /** Punkt na wieży, do którego prowadzi linia od etykiety. Bez punktu — bez linii. */
  pin?: StagePin | null;
  headingLevel?: "h2" | "h3" | "h4";
  /** Elementy sceny w tych samych współrzędnych (np. szkic skali w podglądzie). */
  children?: ReactNode;
}

interface Geometry {
  width: number;
  height: number;
  /** Koniec etykiety po stronie wieży i jej środek w pionie (px w kadrze). */
  labelX: number;
  labelY: number;
  /** Jak daleko od krawędzi po stronie tekstu sięga blok (ułamek szerokości) i jak nisko (ułamek wysokości). */
  extentX: number;
  extentY: number;
}

/** Szerokość cyfry Instrument Serif (em) — do dopasowania liczby na wąskim ekranie. */
const DIGIT_EM = 0.47;
const SEPARATOR_EM = 0.22;
/** Jednostka: 0,18 rozmiaru liczby, średnio ok. 0,42 em na znak kursywy + odstęp. */
const UNIT_CHAR_EM = 0.18 * 0.42;
/** Odstęp linii od etykiety (px). */
const WIRE_GAP = 14;
/* EXTENT_PAD: zapas pełnego przyciemnienia za blokiem tekstu — wspólny z modelem w lib/brand/legibility.ts. */

function figureWidthEm(figure: string, unit: string): number {
  const digits = figure.replace(/\D/g, "").length;
  const separators = figure.length - digits;
  return digits * DIGIT_EM + separators * SEPARATOR_EM + (unit.length + 1) * UNIT_CHAR_EM + 0.05;
}

/**
 * Stop etapu budowy jako kadr filmowy: tekst leży na scenie przy krawędzi po stronie przeciwnej do
 * wieży. Czytelność daje kinowy margines (liniowe przyciemnienie od krawędzi), delikatna winieta i
 * cień tekstu — bez plam i paneli. Linia 1 px prowadzi od etykiety do punktu na wieży, a skala po
 * prawej ma tylko gwiazdę i numer piętra.
 *
 * Komponent wypełnia najbliższego przodka z `position: relative` (kadr sceny).
 */
export function StageStop({
  copy,
  floor,
  floorLabel,
  side = "left",
  active = true,
  pin = null,
  headingLevel: Heading = "h3",
  children,
}: StageStopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const blockRef = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Linia zaczyna się przy końcu etykiety, a kinowy margines sięga do końca bloku tekstu — oba zależą
  // od fontu, języka i szerokości ekranu, więc są mierzone.
  useEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    const block = blockRef.current;
    if (!root || !label || !block) return;
    const observer = new ResizeObserver(() => {
      const r = root.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      const b = block.getBoundingClientRect();
      setGeometry({
        width: r.width,
        height: r.height,
        labelX: (side === "left" ? l.right : l.left) - r.left,
        labelY: l.top + l.height / 2 - r.top,
        extentX: (side === "left" ? b.right - r.left : r.right - b.left) / r.width,
        extentY: (b.bottom - r.top) / r.height,
      });
    });
    observer.observe(root);
    observer.observe(label);
    observer.observe(block);
    return () => observer.disconnect();
  }, [side]);

  const percent = (v: number) => `${Math.round(Math.min(1, v + EXTENT_PAD) * 1000) / 10}%`;
  const style = {
    "--stop-floor-t": floor / TOP_FLOOR,
    "--stop-figure-em": figureWidthEm(copy.figure, copy.unit),
    ...(geometry
      ? { "--stop-extent-x": percent(geometry.extentX), "--stop-extent-y": percent(geometry.extentY) }
      : {}),
  } as CSSProperties;

  return (
    <div ref={rootRef} className="stage-stop" data-side={side} data-active={active} style={style}>
      <div className="stage-stop__shade" aria-hidden="true" />
      {children}

      {pin && geometry ? <PinWire pin={pin} geometry={geometry} side={side} /> : null}
      {pin ? (
        <span
          className="stage-stop__dot"
          aria-hidden="true"
          style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
        />
      ) : null}

      <article ref={blockRef} className="stage-stop__block">
        <Heading ref={labelRef} className="stage-stop__label stage-stop__sharpen">
          {copy.label}
        </Heading>
        <p className="stage-stop__figure">
          <span className="stage-stop__mask">
            <span className="stage-stop__rise">
              {copy.figure}
              <span className="stage-stop__unit"> {copy.unit}</span>
            </span>
          </span>{" "}
          <span className="stage-stop__headline stage-stop__sharpen">{copy.headline}</span>
        </p>
        <p className="stage-stop__fact stage-stop__sharpen">{copy.fact}</p>
      </article>

      <p className="stage-stop__marker">
        <span className="stage-stop__floor stage-stop__sharpen">
          <span className="sr-only">{floorLabel} </span>
          {formatFloor(floor)}
        </span>
        <AdAstraStar className="stage-stop__star" />
      </p>
    </div>
  );
}

/** Linia od etykiety: poziomo nad blokiem tekstu, potem pod kątem prostym do punktu na wieży. */
function PinWire({ pin, geometry, side }: { pin: StagePin; geometry: Geometry; side: StageStopSide }) {
  // Pół piksela, żeby linia 1 px była ostra.
  const crisp = (v: number) => Math.round(v) + 0.5;
  const startX = crisp(geometry.labelX + (side === "left" ? WIRE_GAP : -WIRE_GAP));
  const y = crisp(geometry.labelY);
  const x = crisp(pin.x * geometry.width);
  const endY = crisp(pin.y * geometry.height);
  return (
    <svg className="stage-stop__wire" width="100%" height="100%" aria-hidden="true" focusable="false">
      <polyline points={`${startX},${y} ${x},${y} ${x},${endY}`} pathLength={1} />
    </svg>
  );
}
