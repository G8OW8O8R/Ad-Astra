/**
 * Pomocnicze funkcje geometrii: macierze ścinające dla elementów skręconej fasady,
 * profile z zaokrągleniem, belki między punktami, scalanie z kolorami wierzchołków.
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Kierunek promieniowy dla kąta θ (θ = 0 → +Z). */
export function radial(theta: number, out = new Vector3()): Vector3 {
  return out.set(Math.sin(theta), 0, Math.cos(theta));
}
/** Kierunek styczny (rosnący θ). */
export function tangent(theta: number, out = new Vector3()): Vector3 {
  return out.set(Math.cos(theta), 0, -Math.sin(theta));
}

/**
 * Macierz elementu fasady: lokalne x = styczna (× width), y = od dołu do góry ze ścięciem
 * (skręt i zwężanie w obrębie piętra), z = promieniowo na zewnątrz (× depth).
 * Lokalny początek trafia w punkt (r0, θ0, y0); lokalne y = 1 → (r1, θ1, y1).
 */
export function shearMatrix(
  out: Matrix4,
  theta0: number,
  theta1: number,
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  width = 1,
  depth = 1,
): Matrix4 {
  const s0 = Math.sin(theta0);
  const c0 = Math.cos(theta0);
  const px = r0 * s0;
  const pz = r0 * c0;
  const yx = r1 * Math.sin(theta1) - px;
  const yy = y1 - y0;
  const yz = r1 * Math.cos(theta1) - pz;
  return out.set(
    c0 * width, yx, s0 * depth, px,
    0, yy, 0, y0,
    -s0 * width, yz, c0 * depth, pz,
    0, 0, 0, 1,
  );
}

/** Macierz z dowolnymi osiami (kolumny X, Y, Z) i początkiem O. */
export function basisMatrix(out: Matrix4, x: Vector3, y: Vector3, z: Vector3, o: Vector3): Matrix4 {
  return out.set(x.x, y.x, z.x, o.x, x.y, y.y, z.y, o.y, x.z, y.z, z.z, o.z, 0, 0, 0, 1);
}

/** Zaokrąglony prostokąt w płaszczyźnie XZ (x: szerokość, z: głębokość), CCW patrząc z góry. */
export function roundedRect(width: number, depth: number, radius: number, segments: number): [number, number][] {
  const pts: [number, number][] = [];
  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(radius, hw, hd);
  const corners: [number, number, number][] = [
    [hw - r, hd - r, 0],
    [-(hw - r), hd - r, Math.PI / 2],
    [-(hw - r), -(hd - r), Math.PI],
    [hw - r, -(hd - r), (3 * Math.PI) / 2],
  ];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= segments; i++) {
      const a = a0 + (i / segments) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

/**
 * Pryzmat z profilu (XZ) od y = 0 do y = 1, gładkie normalne boków, z denkami.
 * Profil musi być wypukły i podany przeciwnie do ruchu wskazówek w płaszczyźnie (x, z).
 */
export function prism(profile: [number, number][], caps = true): BufferGeometry {
  const n = profile.length;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  // normalne wierzchołków profilu = uśrednione normalne krawędzi
  const normals = profile.map((_, i) => {
    const p = profile[(i - 1 + n) % n] as [number, number];
    const c = profile[i] as [number, number];
    const q = profile[(i + 1) % n] as [number, number];
    const e1: [number, number] = [c[0] - p[0], c[1] - p[1]];
    const e2: [number, number] = [q[0] - c[0], q[1] - c[1]];
    // Profil CCW w płaszczyźnie (x, z): normalna zewnętrzna krawędzi (dx, dz) to (dz, −dx).
    const nx = e1[1] + e2[1];
    const nz = -e1[0] - e2[0];
    const l = Math.hypot(nx, nz) || 1;
    return [nx / l, nz / l] as [number, number];
  });
  for (let i = 0; i <= n; i++) {
    const k = i % n;
    const [x, z] = profile[k] as [number, number];
    const [nx, nz] = normals[k] as [number, number];
    for (const y of [0, 1]) {
      pos.push(x, y, z);
      nor.push(nx, 0, nz);
      uv.push(i / n, y);
    }
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  if (caps) {
    for (const y of [0, 1]) {
      const start = pos.length / 3;
      for (const [x, z] of profile) {
        pos.push(x, y, z);
        nor.push(0, y === 1 ? 1 : -1, 0);
        uv.push(0.5, y);
      }
      for (let i = 1; i < n - 1; i++) {
        if (y === 1) idx.push(start, start + i + 1, start + i);
        else idx.push(start, start + i, start + i + 1);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return fixWinding(g);
}

/** Odwraca trójkąty, których kolejność nie zgadza się z normalną (bezpiecznik dla ręcznych siatek). */
export function fixWinding(g: BufferGeometry): BufferGeometry {
  const index = g.getIndex();
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  if (!index || !nor) return g;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const n = new Vector3();
  const arr = index.array as Uint16Array | Uint32Array;
  for (let i = 0; i < arr.length; i += 3) {
    const ia = arr[i] as number;
    const ib = arr[i + 1] as number;
    const ic = arr[i + 2] as number;
    a.fromBufferAttribute(pos, ia);
    b.fromBufferAttribute(pos, ib);
    c.fromBufferAttribute(pos, ic);
    const face = b.sub(a).cross(c.sub(a));
    n.fromBufferAttribute(nor, ia)
      .add(new Vector3().fromBufferAttribute(nor, ib))
      .add(new Vector3().fromBufferAttribute(nor, ic));
    if (face.dot(n) < 0) {
      arr[i + 1] = ic;
      arr[i + 2] = ib;
    }
  }
  index.needsUpdate = true;
  return g;
}

const _up = new Vector3(0, 1, 0);
const _q = new Quaternion();
const _m = new Matrix4();
const _s = new Vector3();

/** Prostopadłościan wzdłuż odcinka a → b (belka kratownicy). */
export function beam(a: Vector3, b: Vector3, thickness: number, color?: Color): BufferGeometry {
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new BoxGeometry(thickness, len, thickness);
  _q.setFromUnitVectors(_up, dir.normalize());
  _m.compose(new Vector3().addVectors(a, b).multiplyScalar(0.5), _q, _s.set(1, 1, 1));
  g.applyMatrix4(_m);
  if (color) paint(g, color);
  return g;
}

/** Prostopadłościan w danym miejscu (środek, wymiary). */
export function box(center: Vector3, size: Vector3, color?: Color): BufferGeometry {
  const g = new BoxGeometry(size.x, size.y, size.z);
  g.translate(center.x, center.y, center.z);
  if (color) paint(g, color);
  return g;
}

/** Jednolity kolor wierzchołków (atrybut `color`). */
export function paint(g: BufferGeometry, color: Color): BufferGeometry {
  const count = g.getAttribute("position").count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  g.setAttribute("color", new BufferAttribute(arr, 3));
  return g;
}

/** Scala geometrie, zachowując tylko wspólne atrybuty. Usuwa źródła. */
export function merge(parts: BufferGeometry[], keep: string[] = ["position", "normal", "color"]): BufferGeometry {
  const cleaned = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p;
    if (g !== p) p.dispose();
    for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name);
    return g;
  });
  const merged = mergeGeometries(cleaned, false);
  for (const g of cleaned) g.dispose();
  if (!merged) throw new Error("Nie udało się scalić geometrii");
  return merged;
}

/** Deterministyczny generator liczb losowych (mulberry32) — ta sama wieża przy każdym uruchomieniu. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
