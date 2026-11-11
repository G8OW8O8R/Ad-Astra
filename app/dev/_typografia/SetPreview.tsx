import type { ReactNode } from "react";
import { DeviceFrame } from "./DeviceFrame";
import type { FontSet } from "./fonts";
import { HeroExample } from "./HeroExample";
import { UnitPanelExample } from "./UnitPanelExample";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

function Specimen({ set }: { set: FontSet }) {
  return (
    <section
      aria-labelledby={`znaki-${set.id}`}
      className="rounded-xl bg-paper p-6 text-text md:p-8"
    >
      <h2 id={`znaki-${set.id}`} className="mb-5 text-xs tracking-[0.2em] text-text/60 uppercase">
        Polskie znaki · zestaw {set.id}: {set.heading} / {set.ui}
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-text/50">
            {set.heading} · {set.heroWeight}
          </p>
          <p className="font-head text-5xl leading-tight" style={{ fontWeight: set.heroWeight }}>
            ĄĘŁŃÓŚŹŻĆ ąęłńóśźżć
          </p>
          <p className="mt-3 mb-1 text-xs text-text/50">
            {set.heading} · {set.headingWeight}
          </p>
          <p
            className="nums font-head text-4xl leading-tight"
            style={{ fontWeight: set.headingWeight }}
          >
            Zażółć gęślą jaźń · 1 892 160 zł
          </p>
        </div>
        <div className="font-ui">
          <p className="mb-1 text-xs text-text/50">{set.ui} · 400</p>
          <p className="text-2xl">ĄĘŁŃÓŚŹŻĆ ąęłńóśźżć</p>
          <p className="nums mt-2 text-lg">
            Źródło światła: wystawa południowo-zachodnia, taras 14 m², piętro 27.
          </p>
          <p className="mt-3 mb-1 text-xs text-text/50">{set.ui} · 500</p>
          <p className="nums text-lg font-medium">
            ŻÓŁTE ŚWIATŁA NAD RZEKĄ · Pobierz kartę PDF · 0123456789
          </p>
        </div>
      </div>
    </section>
  );
}

function ExampleRow({
  id,
  title,
  render,
}: {
  id: string;
  title: string;
  render: (frame: { width: number; prefix: string }) => ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 text-sm tracking-[0.2em] text-white/60 uppercase">
        {title}
      </h2>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DeviceFrame {...DESKTOP} label="Desktop">
          {render({ width: DESKTOP.width, prefix: `${id}-d` })}
        </DeviceFrame>
        <DeviceFrame {...MOBILE} label="Telefon">
          {render({ width: MOBILE.width, prefix: `${id}-m` })}
        </DeviceFrame>
      </div>
    </section>
  );
}

/** Komplet podglądów jednego zestawu: próbka znaków, hero i panel lokalu. */
export function SetPreview({ set }: { set: FontSet }) {
  return (
    <div className={`${set.className} space-y-14`}>
      <Specimen set={set} />
      <ExampleRow
        id={`hero-${set.id}`}
        title="Hero"
        render={({ width }) => <HeroExample set={set} frameWidth={width} />}
      />
      <ExampleRow
        id={`panel-${set.id}`}
        title="Panel lokalu"
        render={({ prefix }) => <UnitPanelExample set={set} idPrefix={prefix} />}
      />
    </div>
  );
}
