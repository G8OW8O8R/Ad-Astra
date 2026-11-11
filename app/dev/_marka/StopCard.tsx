import { AdAstraStar } from "@/components/brand/AdAstraLogo";
import type { StageCopy } from "@/content/i18n/schema";
import { TOP_FLOOR, formatFloor } from "@/content/stages";

interface Props {
  copy: StageCopy;
  floor: number;
  floorLabel: string;
  tone: "day" | "night";
  headingLevel?: "h3" | "h4";
}

/**
 * Szkic stopu informacyjnego do podglądu marki (docelowy komponent powstanie w zadaniu 5).
 * Dzień: panel ivory z linią złota. Noc: półprzezroczysta noc z linią gold-soft.
 */
export function StopCard({ copy, floor, floorLabel, tone, headingLevel: Heading = "h3" }: Props) {
  const night = tone === "night";
  return (
    <article
      className={`flex max-w-md flex-col gap-4 rounded-panel border p-7 ${
        night
          ? "border-gold-soft/60 bg-night/80 text-ivory shadow-glow backdrop-blur-md"
          : "border-gold bg-ivory text-ink shadow-panel"
      }`}
    >
      <p className={`label ${night ? "text-gold-soft" : "text-ink-soft"}`}>{copy.label}</p>
      <Heading className="font-serif text-3xl">{copy.title}</Heading>
      <p className={`text-sm ${night ? "text-ivory/85" : "text-ink-soft"}`}>{copy.body}</p>
      <p
        className={`label figures flex items-center gap-2 border-t pt-4 ${
          night ? "border-gold-soft/40 text-gold-soft" : "border-gold/60 text-ink-soft"
        }`}
      >
        <AdAstraStar className={`h-3 w-3 ${night ? "text-gold-soft" : "text-gold"}`} />
        {floorLabel} {formatFloor(floor)} / {TOP_FLOOR}
      </p>
    </article>
  );
}
