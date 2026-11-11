import Image from "next/image";
import type { FontSet } from "./fonts";

const FLOORS = 42;
const LABEL_EVERY = 6;
const navItems = ["Inwestycja", "Mieszkania", "Lokalizacja", "Deweloper"];

/*
 * Układ reaguje na szerokość ramki podglądu (container queries: @3xl = 768 px,
 * jednostki cqw), bo podgląd telefonu i desktopu stoją obok siebie na jednej stronie.
 */

function FloorScale() {
  const floors = Array.from({ length: FLOORS + 1 }, (_, i) => FLOORS - i);
  return (
    <div
      role="img"
      aria-label="Skala pięter: 00 z 42"
      className="absolute top-[14%] right-3 bottom-[22%] flex flex-col justify-between @3xl:right-8 @3xl:bottom-[11%]"
    >
      {floors.map((floor) => {
        const labelled = floor % LABEL_EVERY === 0;
        const current = floor === 0;
        return (
          <div key={floor} className="flex h-0 items-center justify-end gap-2">
            {labelled && (
              <span
                className={`nums font-ui text-[10px] leading-none @3xl:text-xs ${
                  current ? "text-[#e2c690]" : "text-[#f6f1e8]/85"
                }`}
              >
                {String(floor).padStart(2, "0")}
              </span>
            )}
            <span
              className={`block h-px ${
                current
                  ? "w-5 bg-[#e2c690] @3xl:w-7"
                  : labelled
                    ? "w-3.5 bg-[#f6f1e8]/80 @3xl:w-5"
                    : "w-2 bg-[#f6f1e8]/45 @3xl:w-3"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function HeroExample({ set, frameWidth }: { set: FontSet; frameWidth: number }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#7cc4dc] font-ui text-[#f6f1e8]">
      <Image
        src="/dev/ulica-pusta.jpg"
        alt=""
        fill
        loading="eager"
        sizes={`${frameWidth}px`}
        className="object-cover object-[50%_70%]"
      />
      {/* lekkie przyciemnienie krawędzi dla czytelności tekstu */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-6 px-5 py-5 @3xl:px-10 @3xl:py-7">
        <span
          className="font-head text-2xl tracking-[0.06em] @3xl:text-[2rem]"
          style={{ fontWeight: set.headingWeight }}
        >
          ALTUM
        </span>
        <nav aria-label="Nawigacja (podgląd)" className="hidden items-center gap-8 text-[15px] @3xl:flex">
          <ul className="flex items-center gap-2">
            {navItems.map((item, i) => (
              <li key={item} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                <a href="#" className="hover:text-[#e2c690]">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <span>
            <span className="text-[#e2c690]">PL</span> / EN
          </span>
          <a
            href="#"
            className="rounded-full border border-[#e2c690] px-5 py-2 text-[#e2c690] hover:bg-[#e2c690]/15"
          >
            Umów spotkanie
          </a>
        </nav>
        <div className="flex items-center gap-4 text-sm @3xl:hidden">
          <span>
            <span className="text-[#e2c690]">PL</span> / EN
          </span>
          <button type="button" className="rounded-full border border-[#f6f1e8]/70 px-4 py-1.5">
            Menu
          </button>
        </div>
      </header>

      <div className="absolute inset-x-0 top-[15%] flex flex-col items-center px-4 text-center @3xl:top-[12%]">
        <h3
          className="font-head text-[16cqw] leading-[0.9] whitespace-nowrap drop-shadow-[0_2px_24px_rgba(20,40,60,0.25)] @3xl:text-[10.5cqw]"
          style={{ fontWeight: set.heroWeight }}
        >
          AD ASTRA
        </h3>
        <p className="mt-4 pl-[0.4em] text-[11px] tracking-[0.4em] @3xl:mt-6 @3xl:text-[1.35cqw] @3xl:tracking-[0.32em]">
          OD FUNDAMENTU DO GWIAZD
        </p>
      </div>

      <FloorScale />

      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-6 text-[13px] @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:px-10 @3xl:pb-7 @3xl:text-[15px]">
        <p className="text-center @3xl:w-1/3 @3xl:text-left">
          Inwestycja nad rzeką · 42 piętra · Oddanie IV kw. 2029
        </p>
        <p className="flex flex-col items-center gap-2 @3xl:w-1/3">
          <span aria-hidden="true" className="block h-8 w-px bg-[#f6f1e8]/70" />
          Przewiń, żeby zbudować
        </p>
        <span className="hidden @3xl:block @3xl:w-1/3" />
      </footer>
    </div>
  );
}
