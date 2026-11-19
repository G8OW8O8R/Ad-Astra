/**
 * Parametry wieży Ad Astra — jedyne źródło wymiarów dla geometrii, osi budowy i kamery.
 * Jednostki: metry, kąty w stopniach (pochodne funkcje zwracają radiany).
 *
 * Kondygnacje: parter (L0, dwukondygnacyjny hol) + 42 piętra (L1–L42).
 * L42 = penthouse z podwyższonym salonem. Dach na 148 m, korona i szpic do 172 m.
 * Kąt 0 = kierunek +Z (ulica, kamera „ulica”), kąty rosną przeciwnie do ruchu wskazówek
 * zegara patrząc z góry.
 */
export const TOWER = {
  floors: 42,
  roofHeight: 148,
  spireTop: 172,
  lobbyHeight: 7.6,
  penthouseHeight: 4.6,
  /** Kondygnacja podziemna między płytą fundamentową a parterem. */
  basementDepth: 4,

  /** Średnica obrysu (zewnętrzna krawędź lamel): dół → dach. */
  diameterBottom: 34,
  diameterTop: 30,
  /** Wykładnik krzywej zwężania (1 = liniowo, > 1 = zwężanie mocniej u góry). */
  taperCurve: 1.35,
  twistPerFloorDeg: 1.5,

  foundation: { thickness: 2.8, radius: 19.5, piles: 64, pileDiameter: 1.2, pileDepth: 28 },
  pit: { radius: 26, depth: 6.8 },

  core: { outerRadius: 6, wall: 0.6, aboveRoof: 3, formworkHeight: 4.2 },
  /** edge = wysokość jasnego pasa krawędzi stropu; overhang = wysunięcie czoła stropu przed szkło. */
  slab: { thickness: 0.28, edge: 0.45, overhang: 0.34 },
  columns: { count: 16, diameter: 0.62, inset: 1.15 },

  facade: {
    /** Pola szkła na obwodzie piętra (tafle ok. 1,1 m). */
    panes: 96,
    /** Lamele na obwodzie — co drugie pole (ok. 2,2 m przy parterze). */
    lamellas: 48,
    /** Profil lameli 12 × 45 cm. */
    lamellaWidth: 0.12,
    lamellaDepth: 0.45,
    /** Zewnętrzna krawędź lameli przed szkłem. */
    lamellaOut: 0.6,
  },

  terraces: {
    spirals: 2,
    /** Szerokość wcięcia w polach szkła (12 × 3,75° = 45°). */
    widthSlots: 12,
    /** Przesunięcie spirali na piętro (pola), do tego dochodzi skręt bryły. */
    advanceSlots: 2,
    depth: 2.5,
    planterDepth: 0.9,
    planterHeight: 0.9,
  },

  penthouse: { terraceSlots: 23, terraceArea: 86, doorHeight: 2.8 },

  lobby: { recess: 1.5, colonnadeEvery: 4, canopyArcDeg: 42, canopyDepth: 6.5, canopyHeight: 4.9 },

  /** Korona: lamele elewacji przechodzą ponad dach; wysokość rośnie po spirali (min → max). */
  crown: { lamellas: 48, minHeight: 7, maxHeight: 21, inward: 2.6, ribs: 12, ribBaseRadius: 6.2 },
  /** Szpic: smukła igła od żeber korony do 172 m. */
  spire: { base: 157, baseRadius: 0.5 },
} as const;

export type LevelKind = "lobby" | "typical" | "penthouse";

export interface Level {
  /** 0 = parter, 1–42 = piętra. */
  index: number;
  base: number;
  height: number;
  kind: LevelKind;
}

const TYPICAL_HEIGHT =
  (TOWER.roofHeight - TOWER.lobbyHeight - TOWER.penthouseHeight) / (TOWER.floors - 1);

export const LEVELS: readonly Level[] = (() => {
  const levels: Level[] = [];
  let base = 0;
  for (let index = 0; index <= TOWER.floors; index++) {
    const kind: LevelKind =
      index === 0 ? "lobby" : index === TOWER.floors ? "penthouse" : "typical";
    const height =
      kind === "lobby" ? TOWER.lobbyHeight : kind === "penthouse" ? TOWER.penthouseHeight : TYPICAL_HEIGHT;
    levels.push({ index, base, height, kind });
    base += height;
  }
  return levels;
})();

export const LEVEL_COUNT = LEVELS.length; // 43
export const TYPICAL_FLOOR_HEIGHT = TYPICAL_HEIGHT;
export const SLOT_ANGLE = (Math.PI * 2) / TOWER.facade.panes;
/** Co ile pól szkła stoi lamela. */
export const PANES_PER_LAMELLA = TOWER.facade.panes / TOWER.facade.lamellas;
export const FOUNDATION_TOP = -TOWER.basementDepth;

export function level(index: number): Level {
  const l = LEVELS[Math.min(LEVEL_COUNT - 1, Math.max(0, index))];
  if (!l) throw new Error(`Brak kondygnacji ${index}`);
  return l;
}

/** Wysokość stropu na spodzie kondygnacji `index` (index = LEVEL_COUNT → dach). Ułamki interpolowane. */
export function levelY(index: number): number {
  if (index <= 0) return index * TOWER.basementDepth; // poniżej parteru: piwnica
  if (index >= LEVEL_COUNT) return TOWER.roofHeight;
  const i = Math.floor(index);
  const l = level(i);
  return l.base + (index - i) * l.height;
}

/** Odwrotność levelY: ułamkowa kondygnacja dla wysokości y (0–43). */
export function levelAt(y: number): number {
  if (y <= 0) return y / TOWER.basementDepth;
  if (y >= TOWER.roofHeight) return LEVEL_COUNT;
  for (const l of LEVELS) {
    if (y < l.base + l.height) return l.index + (y - l.base) / l.height;
  }
  return LEVEL_COUNT;
}

/** Skręt bryły na wysokości y (radiany). Parter jest prosty, każde piętro dodaje 1,5°. */
export function twistAt(y: number): number {
  const deg = TOWER.twistPerFloorDeg * Math.max(0, levelAt(Math.min(y, TOWER.roofHeight)) - 1);
  return (deg * Math.PI) / 180;
}

/** Całkowity skręt od parteru do dachu (stopnie). */
export const TOTAL_TWIST_DEG = TOWER.twistPerFloorDeg * TOWER.floors;

/** Promień obrysu (zewnętrzna krawędź lamel) na wysokości y. */
export function outerRadius(y: number): number {
  const t = Math.min(1, Math.max(0, y / TOWER.roofHeight));
  const rb = TOWER.diameterBottom / 2;
  const rt = TOWER.diameterTop / 2;
  return rb + (rt - rb) * t ** TOWER.taperCurve;
}

const { lamellaDepth, lamellaOut } = TOWER.facade;
/** Linia szkła. */
export function glassRadius(y: number): number {
  return outerRadius(y) - lamellaOut;
}
/** Środek lameli (promieniowo). */
export function lamellaRadius(y: number): number {
  return outerRadius(y) - lamellaDepth / 2;
}
/** Krawędź stropu (wysunięta przed szkło). */
export function slabRadius(y: number): number {
  return glassRadius(y) + TOWER.slab.overhang;
}
export function columnRadius(y: number): number {
  return glassRadius(y) - TOWER.columns.inset;
}

export interface Terrace {
  level: number;
  spiral: number;
  /** Pierwsze pole elewacji (0–95, liczone w układzie skręconego piętra). */
  startSlot: number;
  slots: number;
  depth: number;
  penthouse: boolean;
}

/** Tarasy w dwóch spiralach: po jednym na piętro w każdej (L1–L42 → 84). Penthouse ma taras 86 m². */
export const TERRACES: readonly Terrace[] = (() => {
  const list: Terrace[] = [];
  const { spirals, widthSlots, advanceSlots, depth } = TOWER.terraces;
  const n = TOWER.facade.panes;
  for (let index = 1; index <= TOWER.floors; index++) {
    for (let spiral = 0; spiral < spirals; spiral++) {
      const penthouse = index === TOWER.floors && spiral === 0;
      const slots = penthouse ? TOWER.penthouse.terraceSlots : widthSlots;
      // Początek spirali po stronie słońca (zachód–południe), druga spirala naprzeciw.
      const start = 30 + (index - 1) * advanceSlots + spiral * (n / spirals);
      list.push({
        level: index,
        spiral,
        startSlot: ((start % n) + n) % n,
        slots,
        depth: penthouse ? penthouseTerraceDepth() : depth,
        penthouse,
      });
    }
  }
  return list;
})();

/** Głębokość tarasu penthouse'u dobrana tak, by pole wycinka pierścienia wynosiło 86 m². */
function penthouseTerraceDepth(): number {
  const y = level(TOWER.floors).base;
  const ro = slabRadius(y);
  const angle = TOWER.penthouse.terraceSlots * SLOT_ANGLE;
  // A = angle/2 · (ro² − ri²) → ri
  const ri = Math.sqrt(ro * ro - (2 * TOWER.penthouse.terraceArea) / angle);
  return ro - ri - TOWER.slab.overhang;
}

/** Pole tarasu (wycinek pierścienia od krawędzi stropu do cofniętego szkła), m². */
export function terraceArea(t: Terrace): number {
  const y = level(t.level).base;
  const ro = slabRadius(y);
  const ri = glassRadius(y) - t.depth;
  return ((t.slots * SLOT_ANGLE) / 2) * (ro * ro - ri * ri);
}

/** Taras zajmujący dane pole elewacji na kondygnacji (albo undefined). */
export function terraceAtSlot(levelIndex: number, slot: number): Terrace | undefined {
  const n = TOWER.facade.panes;
  for (const t of TERRACES) {
    if (t.level !== levelIndex) continue;
    const rel = (((slot - t.startSlot) % n) + n) % n;
    if (rel < t.slots) return t;
  }
  return undefined;
}

/**
 * Lamela leży na granicy pól slot−1 i slot (slot = numer lameli × PANES_PER_LAMELLA);
 * jest przerwana, gdy dotyka tarasu (taras to wycięcie w fasadzie).
 */
export function lamellaInTerrace(levelIndex: number, slot: number): boolean {
  const n = TOWER.facade.panes;
  const a = terraceAtSlot(levelIndex, slot);
  const b = terraceAtSlot(levelIndex, (slot - 1 + n) % n);
  return a !== undefined || b !== undefined;
}

/** Kąt (radiany) pola/lameli na wysokości y, z uwzględnieniem skrętu. */
export function slotAngle(slot: number, y: number): number {
  return slot * SLOT_ANGLE + twistAt(y);
}
