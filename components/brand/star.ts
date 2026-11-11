/**
 * Czteroramienna gwiazda o smukłych ramionach (jak gwiazda na szczycie wieży).
 * Ramiona to krzywe Béziera zbiegające się w wąskiej „talii” przy środku.
 */
export interface StarShape {
  cx: number;
  cy: number;
  /** Połowa rozpiętości poziomej. */
  rx: number;
  /** Połowa rozpiętości pionowej (pion dłuższy — gwiazda „strzela” w górę). */
  ry: number;
  /** Grubość talii jako ułamek promienia (mniej = smuklej). */
  waist?: number;
}

const r = (v: number) => Math.round(v * 100) / 100;

export function starPath({ cx, cy, rx, ry, waist = 0.14 }: StarShape): string {
  const wx = rx * waist;
  const wy = ry * waist;
  const pts: Array<[number, number]> = [
    [cx, cy - ry],
    [cx + rx, cy],
    [cx, cy + ry],
    [cx - rx, cy],
  ];
  // Punkty kontrolne w ćwiartkach, blisko środka.
  const ctrl: Array<[number, number]> = [
    [cx + wx, cy - wy],
    [cx + wx, cy + wy],
    [cx - wx, cy + wy],
    [cx - wx, cy - wy],
  ];
  let d = `M${r(pts[0]![0])} ${r(pts[0]![1])}`;
  for (let i = 0; i < 4; i++) {
    const [qx, qy] = ctrl[i]!;
    const [x, y] = pts[(i + 1) % 4]!;
    d += `C${r(qx)} ${r(qy)} ${r(qx)} ${r(qy)} ${r(x)} ${r(y)}`;
  }
  return `${d}Z`;
}

/** Proporcje gwiazdy samodzielnej (favicon, znacznik skali pięter): pion 1, poziom 0.72. */
export const STAR_RATIO = 0.72;

/** Gwiazda w wordmarku — w miejscu poprzeczki drugiego „A” (jednostki fontu). */
export const WORDMARK_STAR = { rx: 46, ry: 108, waist: 0.14 } as const;
