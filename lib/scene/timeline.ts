/**
 * Oś budowy: postęp 0–1 → stan każdej części wieży. Czyste funkcje (testy, scena, w przyszłości
 * licznik pięter w interfejsie). Wszystko jest ciągłe — „czoło” prac to ułamek kondygnacji,
 * a pojedyncze elementy wjeżdżają w ciągu `REVEAL_SPAN` kondygnacji za czołem.
 */
import { FOUNDATION_TOP, LEVEL_COUNT, TOWER, levelAt, levelY } from "./tower-config";

export type Range = readonly [start: number, end: number];

/** Stropy i słupy: czoło konstrukcji przesuwa się równo przez cały ten zakres. */
const STRUCTURE: Range = [0.14, 0.56];

/** O ile kondygnacji wierzch rdzenia wyprzedza najwyższy wylany strop (tekst etapu 02: 6 pięter). */
export const CORE_LEAD = 6;

/**
 * Najwyższy numer kolejności elementu w fazie (jednostka = kondygnacja).
 * Konstrukcja: strop i na spodzie kondygnacji i ma kolejność i + 1 (+0,6 na obwodzie), dach = 44,6;
 * fasada i tarasy: kondygnacja L → L … L + 1.
 */
export const FRONT_MAX = { structure: LEVEL_COUNT + 1.6, facade: LEVEL_COUNT, terraces: LEVEL_COUNT } as const;

/** Ile kondygnacji trwa wjazd pojedynczego elementu za czołem prac. */
export const REVEAL_SPAN = 1.2;

/** Strop i jest w pełni wylany, gdy czoło konstrukcji przekroczy i + SLAB_LAG. */
const SLAB_LAG = 1.6 + REVEAL_SPAN;

/** Czoło stropów przyrasta o tyle kondygnacji na jednostkę postępu. */
const SLAB_RATE = (FRONT_MAX.structure + REVEAL_SPAN) / (STRUCTURE[1] - STRUCTURE[0]);

/** Kondygnacja (ułamkowa) wierzchu rdzenia na końcu: 3 m nad dachem. */
const CORE_TOP_LEVEL = LEVEL_COUNT + TOWER.core.aboveRoof / TOWER.penthouseHeight;
/** Kondygnacja płyty fundamentowej (spód piwnicy). */
const FOUNDATION_LEVEL = FOUNDATION_TOP / TOWER.basementDepth;

/** Ciągły poziom wylanych stropów (bez przycinania) — rdzeń liczy się od niego, więc różnica jest stała. */
function slabLevelRaw(p: number): number {
  return (p - STRUCTURE[0]) * SLAB_RATE - SLAB_LAG;
}

/** Postęp, przy którym rdzeń osiąga daną kondygnację. */
const coreAt = (lvl: number) => STRUCTURE[0] + (lvl - CORE_LEAD + SLAB_LAG) / SLAB_RATE;
const CORE: Range = [coreAt(FOUNDATION_LEVEL), coreAt(CORE_TOP_LEVEL)];

export const PHASES = {
  excavation: [0, 0.035],
  piles: [0.012, 0.04],
  rebar: [0.03, 0.068],
  pour: [0.062, 0.1],
  craneErect: [0.035, 0.09],
  /** Wyliczony ze stropów: ok. 0,10 → 0,51. */
  core: CORE,
  formworkOff: [CORE[1], CORE[1] + 0.03],
  structure: STRUCTURE,
  backfill: [0.27, 0.33],
  facade: [0.45, 0.75],
  terraces: [0.65, 0.85],
  crown: [0.85, 0.94],
  spire: [0.9, 0.965],
  star: [0.955, 1],
  craneRemove: [0.95, 0.985],
} as const satisfies Record<string, Range>;

export type PhaseName = keyof typeof PHASES;

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Postęp fazy 0–1. */
export function phase(p: number, name: PhaseName): number {
  const [a, b] = PHASES[name];
  return clamp01((p - a) / (b - a));
}

/** Czoło fazy: 0 → FRONT_MAX + REVEAL_SPAN (ostatni element kończy wjazd dokładnie na końcu fazy). */
export function front(p: number, name: keyof typeof FRONT_MAX): number {
  return phase(p, name) * (FRONT_MAX[name] + REVEAL_SPAN);
}

/** Indeks najwyższego w pełni wylanego stropu (−1 = jeszcze żaden; 43 = dach). */
function topSlab(p: number): number {
  return Math.floor(front(p, "structure") - SLAB_LAG);
}

/** Wierzch rdzenia jako kondygnacja (ułamkowa): stałe wyprzedzenie CORE_LEAD nad stropami. */
export function coreLevel(p: number): number {
  return Math.min(CORE_TOP_LEVEL, Math.max(FOUNDATION_LEVEL, slabLevelRaw(p) + CORE_LEAD));
}

/** Wierzch rdzenia (m). Rdzeń zaczyna się na płycie fundamentowej i kończy 3 m nad dachem. */
export function coreTop(p: number): number {
  const lvl = coreLevel(p);
  if (lvl <= LEVEL_COUNT) return levelY(lvl);
  return TOWER.roofHeight + (lvl - LEVEL_COUNT) * TOWER.penthouseHeight;
}

/** Kondygnacja (ułamkowa) najwyższego w pełni wylanego stropu — do porównań z rdzeniem. */
export function slabLevel(p: number): number {
  return Math.min(LEVEL_COUNT, Math.max(0, slabLevelRaw(p)));
}

/** Wysokość najwyżej położonego, w pełni wylanego stropu (m). */
export function structureTop(p: number): number {
  const i = topSlab(p);
  return i < 0 ? FOUNDATION_TOP : levelY(Math.min(LEVEL_COUNT, i));
}

/** Liczba ukończonych pięter (0–42) — do licznika w interfejsie. */
export function floorsBuilt(p: number): number {
  // Piętro n jest gotowe, gdy leży strop nad nim (strop n + 1).
  return Math.max(0, Math.min(TOWER.floors, topSlab(p) - 1));
}

/**
 * Wierzch masztu dźwigu (m). Dźwig wspina się co 5 pięter — płynnie, ale skokowo w czasie:
 * stoi, a gdy prace dojdą do końca 5-piętrowego odcinka, podnosi się w ciągu ułamka kondygnacji.
 */
export function craneTop(p: number): number {
  const erected = 42 * smoothstep(0, 1, phase(p, "craneErect"));
  // Dźwig obsługuje rdzeń, który idzie 6 pięter przed stropami — wspina się za nim.
  const f = Math.max(0, levelAt(coreTop(p)));
  const steps = f / 5;
  const k = Math.floor(steps);
  const climb = (k + smoothstep(0.8, 1, steps - k)) * 5;
  const followStructure = levelY(Math.min(LEVEL_COUNT, climb)) + 30;
  // Na koronę i szpic dźwig musi sięgnąć ponad 172 m.
  const forCrown = 172 + 14;
  const crownLift = smoothstep(0.78, 0.84, p);
  const top = Math.max(erected, followStructure * (1 - crownLift) + forCrown * crownLift);
  return Math.min(top, forCrown);
}

/** Rozpuszczenie dźwigu po zakończeniu budowy (0 = jest, 1 = zniknął). */
export function craneGone(p: number): number {
  return smoothstep(0, 1, phase(p, "craneRemove"));
}

/** Głębokość wykopu (m) i stopień zasypania wokół wieży. */
export function pitDepth(p: number): number {
  return TOWER.pit.depth * smoothstep(0, 1, phase(p, "excavation"));
}
export function backfill(p: number): number {
  return smoothstep(0, 1, phase(p, "backfill"));
}
