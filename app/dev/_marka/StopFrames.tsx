"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StageStop, type StageStopSide } from "@/components/stages/StageStop";
import en from "@/content/i18n/en";
import pl from "@/content/i18n/pl";
import { TOP_FLOOR, stages } from "@/content/stages";

const dictionaries = { pl, en } as const;
type Lang = keyof typeof dictionaries;

/** Kadry: 3 etapy na ulicy (dzień), 3 na nocnej panoramie; obie strony stopu w każdej scenie. */
const frames = stages.map((stage, i) => ({
  stage,
  scene: i < 3 ? ("day" as const) : ("night" as const),
  side: (["left", "left", "right", "left", "right", "left"] as const)[i] as StageStopSide,
}));

const plates = {
  day: { src: "/dev/ulica-pusta.jpg", position: "object-[50%_60%]", name: "ulica, dzień" },
  night: { src: "/dev/taras-noc.jpg", position: "object-[50%_50%]", name: "panorama, noc" },
} as const;

/** Odstęp pięter na szkicu skali (rem). */
const TICK = 0.875;
const TICKS_AROUND = 9;

/**
 * Szkic skali pięter tylko na potrzeby podglądu (docelowa skala powstanie w zadaniu 5):
 * kreski pięter wokół bieżącego, które leży na wysokości linii stopu. Gwiazdę rysuje stop.
 */
function FloorScaleSketch({ floor, side }: { floor: number; side: StageStopSide }) {
  const floors = Array.from({ length: TICKS_AROUND * 2 + 1 }, (_, i) => floor + TICKS_AROUND - i).filter(
    (f) => f >= 0 && f <= TOP_FLOOR && f !== floor,
  );
  return (
    <div
      aria-hidden="true"
      className="absolute"
      style={{ left: "var(--stop-scale-x)", top: "calc(var(--stop-anchor-y) + 0.525rem)" }}
    >
      {floors.map((f) => {
        const distance = Math.abs(f - floor);
        const major = f % 6 === 0;
        return (
          <span
            key={f}
            className="absolute block h-px bg-gold-soft"
            style={{
              top: `${(floor - f) * TICK}rem`,
              width: major ? "0.75rem" : "0.4375rem",
              [side === "left" ? "right" : "left"]: "0.25rem",
              opacity: Math.max(0, 0.75 - distance * 0.075),
            }}
          />
        );
      })}
    </div>
  );
}

function Frame({ index, lang }: { index: number; lang: Lang }) {
  const frame = frames[index]!;
  const dict = dictionaries[lang];
  const plate = plates[frame.scene];
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  // Stop odsłania się, gdy kadr wypełnia ekran — jak zatrzymanie sceny na etapie.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(Boolean(entry && entry.intersectionRatio >= 0.6)),
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      aria-label={`Kadr ${index + 1} / ${frames.length} · ${plate.name} · stop po ${
        frame.side === "left" ? "lewej" : "prawej"
      }`}
      className="relative h-svh min-h-[560px] overflow-hidden bg-night"
    >
      <Image
        src={plate.src}
        alt=""
        fill
        sizes="100vw"
        // Dwa pliki na 6 kadrów, a strona może się otworzyć od razu na #stopy (LCP w dowolnym kadrze).
        loading="eager"
        className={`object-cover ${plate.position}`}
      />
      <StageStop
        copy={dict.stages[frame.stage.id]}
        floor={frame.stage.floor}
        floorLabel={dict.common.floor}
        side={frame.side}
        active={active}
      >
        <FloorScaleSketch floor={frame.stage.floor} side={frame.side} />
      </StageStop>
    </figure>
  );
}

export function StopFrames() {
  const [lang, setLang] = useState<Lang>("pl");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <p className="max-w-2xl text-sm text-ink-soft">
          Pełnoekranowe kadry: etapy 01–03 na ulicy (dzień), 04–06 na nocnej panoramie. Stop wchodzi,
          gdy kadr wypełni ekran. Skala pięter jest tu tylko szkicem.
        </p>
        <div role="group" aria-label="Język stopów" className="label flex gap-4">
          {(Object.keys(dictionaries) as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`border-b py-1 ${
                lang === l ? "border-gold text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div lang={lang} className="-mx-6 md:-mx-12">
        {frames.map((frame, i) => (
          <Frame key={frame.stage.id} index={i} lang={lang} />
        ))}
      </div>
    </div>
  );
}
