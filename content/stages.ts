/**
 * Etapy budowy (stopy informacyjne) — wspólne dla obu języków.
 * `floor` = piętro na skali 00–42, przy którym pojawia się stop.
 * Teksty (etykieta, nagłówek z liczbą, fakty) są w content/i18n.
 *
 * Dane techniczne są fikcyjne, ale spójne ze sobą: 42 kondygnacje, 148 m do dachu,
 * korona i szpic +24 m = 172 m.
 */
export const stages = [
  { id: "fundamenty", floor: 0 },
  { id: "rdzen", floor: 12 },
  { id: "konstrukcja", floor: 24 },
  { id: "fasada", floor: 33 },
  { id: "tarasy", floor: 39 },
  { id: "szczyt", floor: 42 },
] as const;

export type StageId = (typeof stages)[number]["id"];

export const stageIds = stages.map((stage) => stage.id) as [StageId, ...StageId[]];

export const TOP_FLOOR = 42;

/** Piętro zapisane dwiema cyframi, jak na skali (00–42). */
export function formatFloor(floor: number): string {
  return String(floor).padStart(2, "0");
}
