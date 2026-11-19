/**
 * Żółty dźwig wieżowy obok wieży: kratownicowy maszt (instancje segmentów 3 m) rośnie razem
 * z budynkiem, wysięgnik powoli się obraca, wózek i hak pracują. Kotwy do stropów co 24 m.
 * Po zakończeniu budowy rozpuszcza się (dither, razem z cieniem).
 */
import {
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type IUniform,
} from "three";
import { beam, box, merge, paint } from "./geometry";
import { depthMaterialFor, patchMaterial, type PatchOptions, type SharedUniforms } from "./shader-patch";
import { slabRadius } from "./tower-config";

export const CRANE_PALETTE = {
  yellow: "#e9b43a",
  yellowDark: "#c99526",
  cab: "#f1ede4",
  glass: "#3b4b55",
  counterweight: "#b9b2a6",
  steel: "#6d6a66",
} as const;

const SEGMENT = 3;
const MAST = 2.1;
const JIB = 58;
const COUNTER = 17;
const MAX_SEGMENTS = 70;

/** Kąt i odległość dźwigu od osi wieży (za wieżą, po prawej od ulicy). */
export const CRANE_ANGLE = 2.35;
export const CRANE_DISTANCE = 31;

export interface CraneState {
  top: number;
  gone: number;
  time: number;
  structureTop: number;
  night: number;
}

export interface Crane {
  group: Group;
  update(s: CraneState): void;
  dispose(): void;
}

function mastSegment(): BufferGeometry {
  const y = new Color(CRANE_PALETTE.yellow);
  const h = MAST / 2;
  const parts: BufferGeometry[] = [];
  const corners = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ] as const;
  for (const [x, z] of corners) parts.push(beam(new Vector3(x, 0, z), new Vector3(x, SEGMENT, z), 0.17, y));
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = corners[i] as readonly [number, number];
    const [x1, z1] = corners[(i + 1) % 4] as readonly [number, number];
    parts.push(beam(new Vector3(x0, 0.05, z0), new Vector3(x1, 0.05, z1), 0.11, y));
    parts.push(beam(new Vector3(x0, 0.05, z0), new Vector3(x1, SEGMENT - 0.05, z1), 0.09, y));
    parts.push(beam(new Vector3(x1, SEGMENT / 2, z1), new Vector3(x0, SEGMENT - 0.05, z0), 0.08, y));
  }
  return merge(parts);
}

function headAssembly(): BufferGeometry {
  const y = new Color(CRANE_PALETTE.yellow);
  const yd = new Color(CRANE_PALETTE.yellowDark);
  const parts: BufferGeometry[] = [];
  const V = (x: number, yy: number, z: number) => new Vector3(x, yy, z);
  // obrotnica i kabina
  parts.push(box(V(0, 0.7, 0), V(3.2, 1.4, 3.2), yd));
  parts.push(box(V(1.2, 1.9, 2.4), V(2.2, 2.4, 2.0), new Color(CRANE_PALETTE.cab)));
  parts.push(box(V(1.2, 2.2, 3.42), V(1.9, 1.3, 0.05), new Color(CRANE_PALETTE.glass)));
  // wieżyczka (kozioł) nad obrotnicą
  const apex = V(0, 9.5, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) parts.push(beam(V(x, 1.4, z), apex, 0.2, y));
  // wysięgnik: kratownica trójkątna, długość 58 m wzdłuż +X
  const wy = 1.6;
  const ww = 0.75;
  parts.push(beam(V(1.5, 1.4, -ww), V(JIB, 1.4, -ww * 0.6), 0.16, y));
  parts.push(beam(V(1.5, 1.4, ww), V(JIB, 1.4, ww * 0.6), 0.16, y));
  parts.push(beam(V(1.5, 1.4 + wy, 0), V(JIB, 1.4 + wy * 0.7, 0), 0.16, y));
  const bays = Math.floor((JIB - 1.5) / 2.6);
  for (let i = 0; i <= bays; i++) {
    const x0 = 1.5 + i * 2.6;
    const x1 = Math.min(JIB, x0 + 2.6);
    const f0 = 1 - (x0 / JIB) * 0.35;
    const f1 = 1 - (x1 / JIB) * 0.35;
    parts.push(beam(V(x0, 1.4, -ww * f0), V(x0, 1.4, ww * f0), 0.08, y));
    parts.push(beam(V(x0, 1.4, -ww * f0), V(x1, 1.4 + wy * f1, 0), 0.08, y));
    parts.push(beam(V(x0, 1.4, ww * f0), V(x1, 1.4 + wy * f1, 0), 0.08, y));
  }
  // przeciwwysięgnik z pomostem i balastem
  parts.push(beam(V(-1.5, 1.6, -0.9), V(-COUNTER, 1.6, -0.9), 0.2, y));
  parts.push(beam(V(-1.5, 1.6, 0.9), V(-COUNTER, 1.6, 0.9), 0.2, y));
  for (let x = -2; x > -COUNTER; x -= 2.5) parts.push(beam(V(x, 1.6, -0.9), V(x, 1.6, 0.9), 0.1, y));
  parts.push(box(V(-6, 2.0, 0), V(3.4, 0.9, 1.6), new Color(CRANE_PALETTE.steel)));
  for (let i = 0; i < 4; i++) {
    parts.push(box(V(-COUNTER + 1.2 + i * 0.95, 0.4, 0), V(0.85, 3.2, 2.3), new Color(CRANE_PALETTE.counterweight)));
  }
  // odciągi od kozła
  parts.push(beam(apex, V(JIB * 0.62, 1.4 + wy * 0.78, 0), 0.07, yd));
  parts.push(beam(apex, V(JIB * 0.3, 1.4 + wy * 0.9, 0), 0.07, yd));
  parts.push(beam(apex, V(-COUNTER + 1.5, 1.7, 0), 0.08, yd));
  return merge(parts);
}

export function createCrane(shared: SharedUniforms): Crane {
  const group = new Group();
  group.name = "crane";
  const disposables: { dispose(): void }[] = [];
  const dissolve: IUniform<number> = { value: 0 };
  const opts: PatchOptions = { key: "crane", shared, dissolve };
  const mat = patchMaterial(new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.25 }), opts);
  const depth = depthMaterialFor(opts);
  disposables.push(mat, depth);

  const base = new Vector3(Math.sin(CRANE_ANGLE) * CRANE_DISTANCE, 0, Math.cos(CRANE_ANGLE) * CRANE_DISTANCE);
  group.position.copy(base);
  // maszt zwrócony jednym bokiem do wieży
  group.rotation.y = CRANE_ANGLE;

  const segGeo = mastSegment();
  const mast = new InstancedMesh(segGeo, mat, MAX_SEGMENTS);
  mast.castShadow = true;
  mast.receiveShadow = true;
  mast.customDepthMaterial = depth;
  mast.frustumCulled = false;
  group.add(mast);

  const footing = new Mesh(paint(box(new Vector3(0, -0.4, 0), new Vector3(6, 1.2, 6)), new Color(CRANE_PALETTE.counterweight)), mat);
  footing.receiveShadow = true;
  footing.castShadow = true;
  footing.customDepthMaterial = depth;
  group.add(footing);

  const slew = new Group();
  group.add(slew);
  const headGeo = headAssembly();
  const head = new Mesh(headGeo, mat);
  head.castShadow = true;
  head.receiveShadow = true;
  head.customDepthMaterial = depth;
  slew.add(head);

  // wózek, lina i hak
  const trolleyGeo = merge([
    box(new Vector3(0, 0, 0), new Vector3(1.6, 0.5, 1.4), new Color(CRANE_PALETTE.yellowDark)),
  ]);
  const trolley = new Mesh(trolleyGeo, mat);
  trolley.customDepthMaterial = depth;
  trolley.castShadow = true;
  slew.add(trolley);
  const cableGeo = merge([
    beam(new Vector3(-0.2, 0, 0), new Vector3(-0.2, -1, 0), 0.05, new Color(CRANE_PALETTE.steel)),
    beam(new Vector3(0.2, 0, 0), new Vector3(0.2, -1, 0), 0.05, new Color(CRANE_PALETTE.steel)),
  ]);
  const cable = new Mesh(cableGeo, mat);
  cable.customDepthMaterial = depth;
  slew.add(cable);
  const hookGeo = merge([
    box(new Vector3(0, 0, 0), new Vector3(0.9, 1.1, 0.55), new Color(CRANE_PALETTE.yellow)),
    box(new Vector3(0, -0.9, 0), new Vector3(0.22, 0.7, 0.22), new Color(CRANE_PALETTE.steel)),
  ]);
  const hook = new Mesh(hookGeo, mat);
  hook.customDepthMaterial = depth;
  hook.castShadow = true;
  slew.add(hook);

  // kotwy masztu do stropów
  const tieGeo = merge([beam(new Vector3(0, 0, 0), new Vector3(1, 0, 0), 0.22, new Color(CRANE_PALETTE.yellowDark))]);
  const TIE_HEIGHTS = [24, 48, 72, 96, 120, 144];
  const ties = new InstancedMesh(tieGeo, mat, TIE_HEIGHTS.length * 2);
  ties.customDepthMaterial = depth;
  ties.castShadow = true;
  ties.frustumCulled = false;
  {
    // w układzie grupy dźwigu wieża leży w kierunku −Z
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    TIE_HEIGHTS.forEach((h, i) => {
      const len = CRANE_DISTANCE - slabRadius(h) - MAST / 2;
      for (const side of [-1, 1]) {
        const m = new Matrix4().compose(new Vector3(side * (MAST / 2 - 0.1), h, -MAST / 2), q, new Vector3(len, 1, 1));
        ties.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), m);
      }
    });
  }
  group.add(ties);

  // światła przeszkodowe (czerwone) na koźle i końcu wysięgnika
  const lightMat = new MeshBasicMaterial({ color: new Color("#ff3a2a"), toneMapped: false });
  patchMaterial(lightMat, { key: "crane-lights", shared, dissolve });
  const lightGeo = new SphereGeometry(0.28, 10, 8);
  const lightTip = new Mesh(lightGeo, lightMat);
  lightTip.position.set(JIB, 2.0, 0);
  const lightApex = new Mesh(lightGeo, lightMat);
  lightApex.position.set(0, 9.8, 0);
  slew.add(lightTip, lightApex);
  disposables.push(segGeo, headGeo, trolleyGeo, cableGeo, hookGeo, tieGeo, lightGeo, lightMat, footing.geometry);

  const m = new Matrix4();
  const red = new Color("#ff3a2a");
  return {
    group,
    update(s) {
      const top = Math.max(0, s.top);
      group.visible = s.gone < 0.999 && top > 0.5;
      dissolve.value = s.gone;
      // segmenty od wierzchu w dół — maszt „wysuwa się” płynnie
      const count = Math.min(MAX_SEGMENTS, Math.ceil(top / SEGMENT));
      for (let i = 0; i < count; i++) {
        m.makeTranslation(0, top - (i + 1) * SEGMENT, 0);
        mast.setMatrixAt(i, m);
      }
      mast.count = count;
      mast.instanceMatrix.needsUpdate = true;

      slew.position.y = top;
      // powolny obrót z zatrzymaniami — jak przy pracy
      const t = s.time;
      slew.rotation.y = 1.9 + t * 0.045 + Math.sin(t * 0.09) * 0.7;
      const reach = 16 + (Math.sin(t * 0.13) * 0.5 + 0.5) * (JIB - 22);
      trolley.position.set(reach, 1.05, 0);
      cable.position.set(reach, 0.8, 0);
      const hookY = Math.max(s.structureTop + 9 - top, -top + 6) + Math.sin(t * 0.21) * 4 - 4;
      const drop = Math.min(-2, hookY);
      cable.scale.set(1, -drop, 1);
      hook.position.set(reach, drop + 0.2, 0);

      let tiesCount = 0;
      for (const h of TIE_HEIGHTS) if (h < s.structureTop - 2 && h < top - 8) tiesCount++;
      ties.count = tiesCount * 2;

      lightMat.color.copy(red).multiplyScalar(0.8 + 5 * s.night);
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
