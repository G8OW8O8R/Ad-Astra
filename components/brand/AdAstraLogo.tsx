import type { SVGProps } from "react";
import { WORDMARK } from "./paths.generated";
import { STAR_RATIO, WORDMARK_STAR, starPath } from "./star";

export type BrandTone = "current" | "dark" | "light";

/** Kolor przez currentColor; `tone` to skrót: dark = ink (na jasnym), light = ivory (na ciemnym). */
export const toneClass: Record<BrandTone, string> = {
  current: "",
  dark: "text-ink",
  light: "text-ivory",
};

type SvgProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children">;

interface LogoProps extends SvgProps {
  tone?: BrandTone;
  /** Nazwa dostępna; `null` = logo dekoracyjne (np. obok widocznego tekstu „Ad Astra”). */
  title?: string | null;
  /** Kolor gwiazdy (domyślnie jak litery). */
  starColor?: string;
  /** Kolor wypełnienia; domyślnie currentColor (jawny kolor potrzebny np. w OG image). */
  color?: string;
}

const PAD = 24;
const box = WORDMARK.box;
const VIEWBOX = `${box.x - PAD} ${box.y - PAD} ${box.width + PAD * 2} ${box.height + PAD * 2}`;
const WORDMARK_STAR_D = starPath({ cx: WORDMARK.star.cx, cy: WORDMARK.star.cy, ...WORDMARK_STAR });

/** Ścieżka gwiazdy w polu -1…1 (do użycia także poza Reactem, np. w ikonach). */
export const STAR_D = starPath({ cx: 0, cy: 0, rx: STAR_RATIO, ry: 1, waist: 0.14 });

function a11y(title: string | null | undefined, fallback: string) {
  const label = title === undefined ? fallback : title;
  return label === null
    ? ({ "aria-hidden": true, focusable: false } as const)
    : ({ role: "img", "aria-label": label } as const);
}

/**
 * Wordmark AD ASTRA — Instrument Serif, wersaliki, rozstrzelenie 0.04em; w drugim „A”
 * zamiast poprzeczki czteroramienna gwiazda. Szerokość wynika z wysokości (podaj height lub klasę h-*).
 */
export function AdAstraLogo({
  tone = "current",
  title,
  starColor,
  color = "currentColor",
  className,
  ...rest
}: LogoProps) {
  return (
    <svg
      viewBox={VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      className={[toneClass[tone], className].filter(Boolean).join(" ") || undefined}
      {...a11y(title, "Ad Astra")}
      {...rest}
    >
      <path d={WORDMARK.d} fill={color} />
      <path d={WORDMARK_STAR_D} fill={starColor ?? color} />
    </svg>
  );
}

/** Sama gwiazda (favicon, znacznik w skali pięter). Domyślnie dekoracyjna. */
export function AdAstraStar({
  tone = "current",
  title = null,
  color = "currentColor",
  className,
  ...rest
}: Omit<LogoProps, "starColor">) {
  return (
    <svg
      viewBox="-1 -1 2 2"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      className={[toneClass[tone], className].filter(Boolean).join(" ") || undefined}
      {...a11y(title, "Ad Astra")}
      {...rest}
    >
      <path d={STAR_D} fill={color} />
    </svg>
  );
}

/** Proporcja szerokość/wysokość wordmarku (do układów i OG image). */
export const WORDMARK_ASPECT = (box.width + PAD * 2) / (box.height + PAD * 2);
export const WORDMARK_VIEWBOX = VIEWBOX;
export { WORDMARK_STAR_D };
