import type { SVGProps } from "react";
import { toneClass, type BrandTone } from "./AdAstraLogo";
import { ALTUM, DEVELOPMENT } from "./paths.generated";

/*
 * Znak ALTUM Development: „ALTUM” (Instrument Sans 500, wersaliki, rozstrzelenie 0.32em)
 * nad mniejszym „Development”; po lewej wąski pionowy znak — dwie cienkie linie:
 * jedna sięga ponad napis (wysoko), druga pod niego (głęboko). „Altum” = wysoko i głęboko.
 * Jednostki: font (wysokość wersalika ALTUM = 720).
 */
const LINE = 28; // grubość linii
const LINE_GAP = 160; // odstęp między liniami (czytelny także przy wysokości 40 px)
const HIGH = { x: 0, top: -200, bottom: 760 };
const DEEP = { x: LINE + LINE_GAP, top: 440, bottom: 1440 };
const TEXT_X = DEEP.x + LINE + 210;
const DEV_SCALE = 0.46;
const DEV_TOP = 720 + 220;

const minX = 0;
const minY = HIGH.top;
const maxX = TEXT_X + ALTUM.box.x + ALTUM.box.width;
const maxY = DEEP.bottom;
const VIEWBOX = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

type Props = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> & {
  tone?: BrandTone;
  /** Nazwa dostępna; `null` = dekoracyjny. */
  title?: string | null;
  /** Kolor wypełnienia; domyślnie currentColor. */
  color?: string;
};

export function AltumMark({ tone = "current", title, color = "currentColor", className, ...rest }: Props) {
  const label = title === undefined ? "ALTUM Development" : title;
  const a11y =
    label === null
      ? ({ "aria-hidden": true, focusable: false } as const)
      : ({ role: "img", "aria-label": label } as const);

  return (
    <svg
      viewBox={VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      className={[toneClass[tone], className].filter(Boolean).join(" ") || undefined}
      {...a11y}
      {...rest}
    >
      <rect fill={color} x={HIGH.x} y={HIGH.top} width={LINE} height={HIGH.bottom - HIGH.top} />
      <rect fill={color} x={DEEP.x} y={DEEP.top} width={LINE} height={DEEP.bottom - DEEP.top} />
      <path fill={color} transform={`translate(${TEXT_X} 0)`} d={ALTUM.d} />
      <path
        fill={color}
        transform={`translate(${TEXT_X} ${DEV_TOP}) scale(${DEV_SCALE})`}
        d={DEVELOPMENT.d}
      />
    </svg>
  );
}

export const ALTUM_VIEWBOX = VIEWBOX;
export const ALTUM_ASPECT = (maxX - minX) / (maxY - minY);
