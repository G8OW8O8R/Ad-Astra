"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

interface SetInfo {
  id: string;
  heading: string;
  ui: string;
}

interface Props {
  sets: SetInfo[];
  /** Podglądy wyrenderowane na serwerze, po jednym na zestaw. */
  previews: Record<string, ReactNode>;
}

/** Wybrany zestaw żyje w adresie (#zestaw-2) — odświeżenie strony go zachowuje. */
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const readHash = () => window.location.hash;
const serverHash = () => "";

function select(id: string) {
  window.location.replace(`#zestaw-${id}`);
}

export function Comparison({ sets, previews }: Props) {
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const hashId = /^#zestaw-(\d)$/.exec(hash)?.[1];
  const active = sets.find((set) => set.id === hashId) ?? sets[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (sets.some((s) => s.id === event.key)) select(event.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sets]);

  if (!active) return null;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1b1d22]/95 px-4 py-4 backdrop-blur md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Typografia — porównanie zestawów</h1>
            <p className="text-sm text-white/55">
              Strona robocza (tylko lokalnie). Nagłówki / interfejs. Klawisze 1–{sets.length}{" "}
              przełączają.
            </p>
          </div>
          <div role="group" aria-label="Zestaw fontów" className="flex flex-wrap gap-2">
            {sets.map((set) => {
              const pressed = set.id === active.id;
              return (
                <button
                  key={set.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => select(set.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8955a] ${
                    pressed
                      ? "border-[#b8955a] bg-[#b8955a] text-[#1b1d22]"
                      : "border-white/25 text-white/80 hover:border-white/60"
                  }`}
                >
                  {set.id}. {set.heading} / {set.ui}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-4 py-8 md:px-8">{previews[active.id]}</main>
    </div>
  );
}
