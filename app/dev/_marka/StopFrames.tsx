"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StageStop, type StagePin, type StageStopSide } from "@/components/stages/StageStop";
import en from "@/content/i18n/en";
import pl from "@/content/i18n/pl";
import { TOP_FLOOR, stages } from "@/content/stages";

const dictionaries = { pl, en } as const;
type Lang = keyof typeof dictionaries;

const plates = {
  day: { src: "/dev/ulica-pusta.jpg", width: 2576, height: 1438, posX: 0.5, posY: 0.6, name: "ulica, dzień" },
  night: { src: "/dev/taras-noc.jpg", width: 2752, height: 1536, posX: 0.5, posY: 0.5, name: "taras, noc" },
} as const;

/**
 * Kadry: etapy 01–03 na ulicy (dzień), 04–06 na tarasie (noc); obie strony stopu w każdej scenie.
 * `pin` to zaślepka punktu na wieży we współrzędnych planszy (ułamki): wykop i miejsce, gdzie wieża
 * będzie rosła, a nocą elewacja i donice tarasu. W zadaniu 5 punkt przyjdzie z modelu 3D.
 */
const frames: ReadonlyArray<{
  stage: (typeof stages)[number];
  scene: keyof typeof plates;
  side: StageStopSide;
  pin: StagePin;
}> = [
  { stage: stages[0], scene: "day", side: "left", pin: { x: 0.535, y: 0.8 } },
  { stage: stages[1], scene: "day", side: "left", pin: { x: 0.535, y: 0.62 } },
  { stage: stages[2], scene: "day", side: "right", pin: { x: 0.535, y: 0.45 } },
  { stage: stages[3], scene: "night", side: "left", pin: { x: 0.585, y: 0.35 } },
  { stage: stages[4], scene: "night", side: "right", pin: { x: 0.36, y: 0.6 } },
  { stage: stages[5], scene: "night", side: "left", pin: { x: 0.6, y: 0.06 } },
];

/** Punkt planszy (ułamki obrazu) → punkt kadru przy `object-fit: cover` i danym `object-position`. */
function coverPoint(
  plate: (typeof plates)[keyof typeof plates],
  frameWidth: number,
  frameHeight: number,
  point: StagePin,
): StagePin {
  const scale = Math.max(frameWidth / plate.width, frameHeight / plate.height);
  const width = plate.width * scale;
  const height = plate.height * scale;
  const left = (frameWidth - width) * plate.posX;
  const top = (frameHeight - height) * plate.posY;
  return { x: (left + point.x * width) / frameWidth, y: (top + point.y * height) / frameHeight };
}

/** Szkic skali pięter tylko w podglądzie: kreski co 6 pięter przy prawej krawędzi (docelowa w zadaniu 5). */
function ScaleSketch({ floor }: { floor: number }) {
  const floors = Array.from({ length: TOP_FLOOR / 6 + 1 }, (_, i) => i * 6).filter((f) => f !== floor);
  return (
    <div aria-hidden="true">
      {floors.map((f) => (
        <span
          key={f}
          className="absolute block h-px w-1.5 bg-ivory/45"
          style={{
            right: "calc(var(--stop-scale-x) - 0.1875rem)",
            top: `calc(82% - ${f / TOP_FLOOR} * 64%)`,
          }}
        />
      ))}
    </div>
  );
}

function Frame({ index, lang }: { index: number; lang: Lang }) {
  const frame = frames[index]!;
  const dict = dictionaries[lang];
  const plate = plates[frame.scene];
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // „Odtwórz animację”: nowy montaż stopu w stanie spoczynku, a w następnej klatce wejście.
  const [cycle, setCycle] = useState(0);
  const [armed, setArmed] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Stop odsłania się, gdy kadr wypełnia ekran — jak zatrzymanie sceny na etapie.
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry && entry.intersectionRatio >= 0.6)),
      { threshold: [0, 0.6] },
    );
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    io.observe(el);
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (cycle === 0) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setArmed(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [cycle]);

  const replay = () => {
    setArmed(false);
    setCycle((c) => c + 1);
  };

  const pin = size ? coverPoint(plate, size.width, size.height, frame.pin) : null;

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
        className="object-cover"
        style={{ objectPosition: `${plate.posX * 100}% ${plate.posY * 100}%` }}
      />
      <StageStop
        key={cycle}
        copy={dict.stages[frame.stage.id]}
        floor={frame.stage.floor}
        floorLabel={dict.common.floor}
        side={frame.side}
        active={inView && armed}
        pin={pin}
      >
        <ScaleSketch floor={frame.stage.floor} />
      </StageStop>
      <button
        type="button"
        onClick={replay}
        aria-label={`Odtwórz animację — kadr ${index + 1}`}
        className={`group label absolute bottom-[6%] flex items-center gap-2 py-2 text-ivory [text-shadow:var(--shadow-text)] ${
          frame.side === "left" ? "left-[6vw]" : "right-[6vw] max-md:right-14"
        }`}
      >
        <span className="relative">
          Odtwórz animację
          <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-gold-soft transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
        </span>
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </button>
    </figure>
  );
}

export function StopFrames() {
  const [lang, setLang] = useState<Lang>("pl");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <p className="max-w-2xl text-sm text-ink-soft">
          Pełnoekranowe kadry: etapy 01–03 na ulicy (dzień), 04–06 na tarasie nocą. Stop wchodzi, gdy kadr
          wypełni ekran. Punkt na wieży i kreski skali to zaślepki do zadania 5.
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
