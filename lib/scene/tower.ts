/**
 * Proceduralna wieża Ad Astra. Wszystko, co powtarzalne, jest instancjonowane (lamele, szkło,
 * słupy, donice, zieleń) albo scalone w jedną geometrię (stropy, korona, daszek holu).
 * Odsłanianie elementów robi shader (shader-patch.ts) — CPU zmienia tylko kilka mundurów na klatkę.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  type IUniform,
  type Material,
  type Object3D,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { basisMatrix, fixWinding, merge, paint, prism, radial, rng, roundedRect, shearMatrix, tangent } from "./geometry";
import { depthMaterialFor, needsDepthMaterial, patchMaterial, type PatchOptions, type SharedUniforms } from "./shader-patch";
import {
  FOUNDATION_TOP,
  LEVEL_COUNT,
  PANES_PER_LAMELLA,
  SLOT_ANGLE,
  TYPICAL_FLOOR_HEIGHT,
  TERRACES,
  TOWER,
  glassRadius,
  lamellaInTerrace,
  lamellaRadius,
  level,
  levelY,
  outerRadius,
  slabRadius,
  columnRadius,
  terraceAtSlot,
  twistAt,
} from "./tower-config";
import { REVEAL_SPAN } from "./timeline";

/** Kolory materiałów (sRGB). Pochodne marki: złoto lamel bliskie --gold / --gold-soft. */
export const PALETTE = {
  concrete: "#d8cfc2",
  concreteSoffit: "#cbc1b3",
  /** Czoło stropu — ciepła biel. */
  slabEdge: "#f4ecdd",
  /** Satynowe szampańskie złoto lamel, korony i poręczy. */
  gold: "#d2b787",
  glass: "#1e2b30",
  mullion: "#b8955a",
  planter: "#e3d9c9",
  soil: "#5a4636",
  leaves: ["#4f7f45", "#5f8f4e", "#6f9a4c", "#3f6e44", "#7da552", "#56824a"],
  grass: ["#9aa65a", "#b3ae6a", "#7f9b4e", "#c4b673", "#8fa35e"],
  olive: ["#8c9c6a", "#7d9163", "#9aa877", "#86956b"],
  trunk: "#6e5340",
  windowWarm: "#ffcf96",
  formwork: "#f3eee4",
  formworkDeck: "#9c8f7e",
  lantern: "#f4e3c4",
} as const;

export interface TowerFronts {
  structure: IUniform<number>;
  facade: IUniform<number>;
  terraces: IUniform<number>;
  crown: IUniform<number>;
  coreTop: IUniform<number>;
  formworkDissolve: IUniform<number>;
  windows: IUniform<number>;
  crownGlow: IUniform<number>;
}

export interface TowerUpdate {
  formworkY: number;
  formworkVisible: boolean;
  spire: number;
  star: number;
  starNight: number;
  crown: number;
  crownGlow: number;
  canopyLights: number;
  time: number;
}

export interface Tower {
  group: Group;
  fronts: TowerFronts;
  update(u: TowerUpdate): void;
  dispose(): void;
}

const c = (hex: string) => new Color(hex);

interface Built {
  objects: Object3D[];
  disposables: { dispose(): void }[];
}

function makeMaterial<T extends Material>(b: Built, material: T, options: PatchOptions): { material: T; depth?: Material } {
  patchMaterial(material, options);
  b.disposables.push(material);
  if (!needsDepthMaterial(options)) return { material };
  const depth = depthMaterialFor(options);
  b.disposables.push(depth);
  return { material, depth };
}

function addMesh(b: Built, mesh: Mesh, depth?: Material, shadows: { cast?: boolean; receive?: boolean } = {}) {
  mesh.castShadow = shadows.cast ?? true;
  mesh.receiveShadow = shadows.receive ?? true;
  if (depth) mesh.customDepthMaterial = depth;
  b.objects.push(mesh);
  b.disposables.push(mesh.geometry);
}

// ---------------------------------------------------------------------------------------------
// Stropy (geometria łączona): 96 wycinków na strop. Czoło stropu = jasny pas 45 cm (czytelne
// 42 piętra), pod nim kapinos. AO zapieczone w kolorach wierzchołków: przy ścianie tarasu
// i pod stropem przy szkle ciemniej. Atrybut aWash = 1 na czole (nocne doświetlenie od dołu).

function slabGeometry(): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const order: number[] = [];
  const pivot: number[] = [];
  const wash: number[] = [];
  const top = c(PALETTE.concrete);
  const soffit = c(PALETTE.concreteSoffit);
  const edge = c(PALETTE.slabEdge);
  const rIn = TOWER.core.outerRadius + 0.04;
  const t = TOWER.slab.thickness;
  const e = TOWER.slab.edge;
  const n = TOWER.facade.panes;
  const penthouseTerrace = TERRACES.find((x) => x.penthouse);

  const quad = (
    v: [Vector3, Vector3, Vector3, Vector3],
    nn: Vector3 | null,
    colors: [Color, Color, Color, Color],
    o: number,
    pv: Vector3,
    w = 0,
  ) => {
    const [a, b2, c2, d] = v;
    const normal = nn ?? new Vector3().subVectors(b2, a).cross(new Vector3().subVectors(d, a)).normalize();
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const p = v[k] as Vector3;
      const cc = colors[k] as Color;
      pos.push(p.x, p.y, p.z);
      nor.push(normal.x, normal.y, normal.z);
      col.push(cc.r, cc.g, cc.b);
      order.push(o);
      pivot.push(pv.x, pv.y, pv.z);
      wash.push(w);
    }
  };
  const P = (r: number, th: number, y: number) => new Vector3(r * Math.sin(th), y, r * Math.cos(th));
  const up = new Vector3(0, 1, 0);
  const down = new Vector3(0, -1, 0);
  const shade = (base: Color, k: number) => base.clone().multiplyScalar(k);
  const ring = (radii: number[], ao: number[], a0: number, a1: number, y: number, base: Color, normal: Vector3, o: number, pv: Vector3) => {
    for (let k = 0; k < radii.length - 1; k++) {
      const r0 = radii[k] as number;
      const r1 = radii[k + 1] as number;
      if (r1 - r0 < 1e-3) continue;
      const c0 = shade(base, ao[k] as number);
      const c1 = shade(base, ao[k + 1] as number);
      if (normal.y > 0) quad([P(r0, a1, y), P(r0, a0, y), P(r1, a0, y), P(r1, a1, y)], normal, [c0, c0, c1, c1], o, pv);
      else quad([P(r0, a0, y), P(r0, a1, y), P(r1, a1, y), P(r1, a0, y)], normal, [c0, c0, c1, c1], o, pv);
    }
  };

  for (let i = 0; i <= LEVEL_COUNT; i++) {
    const y = i === 0 ? 0.15 : levelY(i);
    const rOut = slabRadius(y);
    const rGlass = glassRadius(y);
    const rDrop = rOut - 0.3;
    const tw = twistAt(y);
    for (let s = 0; s < n; s++) {
      if (i === LEVEL_COUNT && penthouseTerrace) {
        const rel = (s - penthouseTerrace.startSlot + n) % n;
        if (rel < penthouseTerrace.slots) continue; // taras penthouse'u jest pod gołym niebem
      }
      const a0 = s * SLOT_ANGLE + tw;
      const a1 = (s + 1) * SLOT_ANGLE + tw;
      const o = i + 1 + (s / n) * 0.6;
      const pv = P(rIn, (a0 + a1) / 2, y);
      // wierzch: taras na tej kondygnacji = podłoga wcięcia; przy ścianie szkła ciemniej (AO)
      const below = terraceAtSlot(i, s);
      const rWall = below ? rGlass - below.depth : rGlass;
      const rAo = Math.min(rOut - 0.02, rWall + 1.1);
      ring([rIn, rWall, rAo, rOut], [1, below ? 0.58 : 0.8, 1, 1], a0, a1, y, top, up, o, pv);
      // spód: sufit tarasu poniżej albo okap przed szkłem — ciemniej przy szkle
      const above = terraceAtSlot(i - 1, s);
      const rSoffitWall = above ? rGlass - above.depth : rGlass;
      ring([rIn, rSoffitWall, Math.min(rDrop, rSoffitWall + 0.9), rDrop], [1, 0.62, 0.86, 0.92], a0, a1, y - t, soffit, down, o, pv);
      // wewnętrzna ścianka kapinosa
      const mid = (a0 + a1) / 2;
      const nIn = new Vector3(-Math.sin(mid), 0, -Math.cos(mid));
      const sc = shade(soffit, 0.85);
      quad([P(rDrop, a0, y - t), P(rDrop, a1, y - t), P(rDrop, a1, y - e), P(rDrop, a0, y - e)], nIn, [sc, sc, sc, sc], o, pv);
      // spód kapinosa
      const ec = shade(edge, 0.82);
      quad([P(rDrop, a0, y - e), P(rDrop, a1, y - e), P(rOut, a1, y - e), P(rOut, a0, y - e)], down, [ec, ec, ec, ec], o, pv);
      // czoło stropu — jasny pas 45 cm, ciepła biel
      quad([P(rOut, a0, y - e + 0.03), P(rOut, a1, y - e + 0.03), P(rOut, a1, y + 0.03), P(rOut, a0, y + 0.03)], null, [edge, edge, edge, edge], o, pv, 1);
      quad([P(rOut, a0, y + 0.03), P(rOut, a1, y + 0.03), P(rOut - 0.08, a1, y + 0.03), P(rOut - 0.08, a0, y + 0.03)], up, [edge, edge, edge, edge], o, pv, 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setAttribute("aOrder", new Float32BufferAttribute(order, 1));
  g.setAttribute("aPivot", new Float32BufferAttribute(pivot, 3));
  g.setAttribute("aWash", new Float32BufferAttribute(wash, 1));
  // poprawka kolejności wierzchołków względem normalnych (ręcznie składane czworokąty)
  g.setIndex([...Array(pos.length / 3).keys()]);
  fixWinding(g);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Rdzeń: rura żelbetowa od płyty fundamentowej do 3 m nad dach, przycinana od góry.

function coreGeometry(): BufferGeometry {
  const { outerRadius: ro, wall, aboveRoof } = TOWER.core;
  const ri = ro - wall;
  const top = TOWER.roofHeight + aboveRoof;
  const h = top - FOUNDATION_TOP;
  const segments = Math.ceil(h / 1.6);
  const outer = new CylinderGeometry(ro, ro, h, 64, segments, true);
  const inner = new CylinderGeometry(ri, ri, h, 64, segments, true);
  // wnętrze: odwrócone normalne i kolejność
  const n = inner.getAttribute("normal");
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  const idx = inner.getIndex();
  if (idx) {
    const a = idx.array as Uint16Array | Uint32Array;
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i + 1] as number;
      a[i + 1] = a[i + 2] as number;
      a[i + 2] = t;
    }
  }
  const cap = new RingGeometry(ri, ro, 64, 1);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, h / 2, 0);
  const g = merge([outer, inner, cap], ["position", "normal"]);
  g.translate(0, FOUNDATION_TOP + h / 2, 0);
  return g;
}

// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// Rośliny (geometrie do instancji, wymiary w metrach). Kolor instancji mnoży kolory wierzchołków,
// w których zapieczone jest AO (ciemniej u podstawy i w głębi kępy) i jaśniejsze końcówki.

interface PlantGeometries {
  shrub: BufferGeometry;
  olive: BufferGeometry;
  spill: BufferGeometry;
  grass: BufferGeometry;
  lavender: BufferGeometry;
  trunk: BufferGeometry;
}

/** Miękka bryła liści: dwudziestościan z szumem, normalne częściowo „od środka kępy”. */
function leafLump(r: () => number, center: Vector3, radius: number, clusterCenter: Vector3, detail = 1): BufferGeometry {
  const g = new IcosahedronGeometry(1, detail);
  const p = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // nieregularny brzeg: kilka „liściastych” wybrzuszeń
    const k = 1 + 0.16 * Math.sin(v.x * 7.1 + v.y * 3.3) * Math.cos(v.z * 6.2 - v.y * 2.1) + (r() - 0.5) * 0.12;
    v.multiplyScalar(radius * k).add(center);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const n = g.getAttribute("normal");
  const col = new Float32Array(p.count * 3);
  const cn = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    cn.copy(v).sub(clusterCenter).normalize();
    const ln = new Vector3().fromBufferAttribute(n, i).lerp(cn, 0.65).normalize();
    n.setXYZ(i, ln.x, ln.y, ln.z);
    // AO: ciemniej w dole i w środku kępy, jaśniej na górze i brzegach
    const height = Math.min(1, Math.max(0, (v.y - clusterCenter.y + radius) / (radius * 3)));
    const ao = 0.55 + 0.5 * height + 0.12 * Math.max(0, cn.y);
    col.set([ao, ao, ao * 0.97], i * 3);
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  return g;
}

/** Kępa źdźbeł: zwężające się paski od ciemnej nasady do jasnej końcówki (opcjonalnie kwiat). */
function bladeTuft(r: () => number, count: number, height: [number, number], spread: number, tip?: Color): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const base = new Color(0.5, 0.5, 0.46);
  const top = new Color(1.12, 1.1, 0.95);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const lean = 0.15 + r() * spread;
    const h = height[0] + r() * (height[1] - height[0]);
    const w = 0.035 + r() * 0.025;
    const ox = Math.cos(a) * r() * 0.22;
    const oz = Math.sin(a) * r() * 0.22;
    const dir = new Vector3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize();
    const side = new Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(w);
    const out = new Vector3(Math.cos(a), 0.9, Math.sin(a)).normalize();
    const segs = 3;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs;
      const t1 = (k + 1) / segs;
      const bend = (t: number) => new Vector3(ox, 0, oz).addScaledVector(dir, h * t).add(new Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(t * t * lean * h * 0.6));
      const p0 = bend(t0);
      const p1 = bend(t1);
      const w0 = 1 - t0 * 0.85;
      const w1 = 1 - t1 * 0.85;
      const quadV = [
        p0.clone().addScaledVector(side, -w0),
        p0.clone().addScaledVector(side, w0),
        p1.clone().addScaledVector(side, w1),
        p1.clone().addScaledVector(side, -w1),
      ];
      const colors = [t0, t0, t1, t1].map((t) => {
        const cc = base.clone().lerp(top, t);
        return tip && t > 0.7 ? tip.clone().multiplyScalar(0.9 + (t - 0.7)) : cc;
      });
      for (const idx of [0, 1, 2, 0, 2, 3]) {
        const v = quadV[idx] as Vector3;
        const cc = colors[idx] as Color;
        pos.push(v.x, v.y, v.z);
        nor.push(out.x, out.y, out.z);
        col.push(cc.r, cc.g, cc.b);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  return g;
}

function createPlantGeometries(): PlantGeometries {
  const r = rng(7);
  // krzew: 7 brył różnej wielkości, niski i szeroki (0,5–0,8 m)
  const shrubCenter = new Vector3(0, 0.3, 0);
  const shrub = merge(
    Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + r();
      const d = i === 0 ? 0 : 0.18 + r() * 0.16;
      const rad = i === 0 ? 0.3 : 0.17 + r() * 0.1;
      return leafLump(r, new Vector3(Math.cos(a) * d, 0.22 + r() * 0.22 + (i === 0 ? 0.12 : 0), Math.sin(a) * d), rad, shrubCenter);
    }),
  );
  // korona oliwki: luźna, płaska, z prześwitami (5 brył)
  const oliveCenter = new Vector3(0, 0.25, 0);
  const olive = merge(
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + r() * 0.6;
      const d = i === 0 ? 0 : 0.42 + r() * 0.2;
      return leafLump(r, new Vector3(Math.cos(a) * d, 0.15 + r() * 0.35, Math.sin(a) * d), i === 0 ? 0.42 : 0.26 + r() * 0.1, oliveCenter);
    }),
  );
  // pnącze: kaskada malejących brył za krawędzią donicy (w dół, na zewnątrz = +z)
  const spillCenter = new Vector3(0, -0.4, 0.15);
  const spill = merge(
    Array.from({ length: 5 }, (_, i) =>
      leafLump(r, new Vector3((r() - 0.5) * 0.3, 0.05 - i * 0.24, 0.12 + i * 0.03), 0.17 - i * 0.022, spillCenter, 0),
    ),
  );
  const grass = bladeTuft(r, 22, [0.45, 0.85], 0.55);
  const lavender = merge([
    bladeTuft(r, 26, [0.38, 0.62], 0.35, new Color("#a58fd0")),
    leafLump(r, new Vector3(0, 0.12, 0), 0.2, new Vector3(0, 0.05, 0), 0),
  ]);
  // pień oliwki: dwa odcinki, lekko wygięty, ciemniejszy u dołu
  const t1 = new CylinderGeometry(0.07, 0.1, 0.55, 7, 1, true);
  t1.translate(0, 0.275, 0);
  const t2 = new CylinderGeometry(0.045, 0.07, 0.5, 7, 1, true);
  t2.rotateZ(0.25);
  t2.translate(-0.06, 0.78, 0);
  const trunk = merge([t1, t2], ["position", "normal"]);
  return { shrub, olive, spill, grass, lavender, trunk };
}

export function createTower(shared: SharedUniforms, quality: "high" | "low"): Tower {
  const b: Built = { objects: [], disposables: [] };
  const group = new Group();
  group.name = "tower";
  const random = rng(42);

  const fronts: TowerFronts = {
    structure: { value: 0 },
    facade: { value: 0 },
    terraces: { value: 0 },
    crown: { value: 0 },
    coreTop: { value: FOUNDATION_TOP },
    formworkDissolve: { value: 0 },
    windows: { value: 0 },
    crownGlow: { value: 0 },
  };

  const tmpA = new Vector3();
  const tmpB = new Vector3();
  const tmpC = new Vector3();
  const tmpO = new Vector3();

  // --- stropy ----------------------------------------------------------------------------------
  {
    const { material, depth } = makeMaterial(
      b,
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 }),
      {
        key: "slab",
        shared,
        reveal: { mode: "radial", front: fronts.structure, span: REVEAL_SPAN, pivot: true },
        uniforms: { uWash: fronts.windows, uWashColor: { value: c("#ffc98f") } },
        vertexHead: `attribute float aWash;
varying float vWash;
`,
        vertexMain: `vWash = aWash;`,
        fragmentHead: `uniform float uWash;
uniform vec3 uWashColor;
varying float vWash;
`,
        // nocą czoło stropu delikatnie doświetlone (ta sama oprawa, która świeci na lamele)
        fragmentEmissive: `totalEmissiveRadiance += uWashColor * uWash * vWash * 0.16;`,
      },
    );
    addMesh(b, new Mesh(slabGeometry(), material), depth);
  }

  // --- słupy -----------------------------------------------------------------------------------
  {
    const geo = new CylinderGeometry(TOWER.columns.diameter / 2, TOWER.columns.diameter / 2, 1, 14, 1, true);
    geo.translate(0, 0.5, 0);
    const n = TOWER.columns.count;
    const items: { m: Matrix4; order: number }[] = [];
    for (let L = -1; L < LEVEL_COUNT; L++) {
      const y0 = L < 0 ? FOUNDATION_TOP : L === 0 ? 0.15 : levelY(L);
      const y1 = (L < 0 ? 0.15 : levelY(L + 1)) - TOWER.slab.thickness;
      const recess = L === 0 ? TOWER.lobby.recess : 0;
      for (let j = 0; j < n; j++) {
        const slot = j * (96 / n) + 3;
        const th0 = slot * SLOT_ANGLE + twistAt(Math.max(0, y0));
        const th1 = slot * SLOT_ANGLE + twistAt(Math.max(0, y1));
        const r0 = columnRadius(Math.max(0, y0)) - recess;
        const r1 = columnRadius(Math.max(0, y1)) - recess;
        items.push({
          m: shearMatrix(new Matrix4(), th0, th1, r0, r1, y0, y1),
          order: L + 1 + 0.55 + (j / n) * 0.3,
        });
      }
    }
    const { material, depth } = makeMaterial(
      b,
      new MeshStandardMaterial({ color: PALETTE.concrete, roughness: 0.85 }),
      { key: "column", shared, reveal: { mode: "grow", front: fronts.structure, span: REVEAL_SPAN * 0.8 } },
    );
    const mesh = new InstancedMesh(geo, material, items.length);
    const ord = new Float32Array(items.length);
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      ord[i] = it.order;
    });
    geo.setAttribute("aOrder", new InstancedBufferAttribute(ord, 1));
    addMesh(b, mesh, depth);
  }

  // --- rdzeń -----------------------------------------------------------------------------------
  {
    const { material, depth } = makeMaterial(
      b,
      new MeshStandardMaterial({ color: PALETTE.concrete, roughness: 0.9 }),
      {
        key: "core",
        shared,
        clipY: { max: fronts.coreTop },
        fragmentSurface: /* glsl */ `
          {
            float lift = floor((vAaWorld.y + 4.0) / 3.3125);
            float tone = fract(sin(lift * 12.9898) * 43758.5453);
            float joint = 1.0 - smoothstep(0.0, 0.05, abs(fract((vAaWorld.y + 4.0) / 3.3125) - 0.02));
            diffuseColor.rgb *= (0.96 + 0.06 * tone) * (1.0 - 0.12 * joint);
          }`,
      },
    );
    addMesh(b, new Mesh(coreGeometry(), material), depth);
  }

  // --- szalunek samowznoszący: jasny pierścień na szczycie rdzenia ------------------------------
  let formwork: Mesh;
  {
    const { outerRadius: ro, wall, formworkHeight: fh } = TOWER.core;
    const ivory = c(PALETTE.formwork);
    const deck = c(PALETTE.formworkDeck);
    const outer = paint(new CylinderGeometry(ro + 0.55, ro + 0.55, fh, 64, 1, false), ivory);
    outer.translate(0, fh / 2, 0);
    const innerR = ro - wall - 0.45;
    const inner = paint(new CylinderGeometry(innerR, innerR, fh, 48, 1, true), ivory);
    inner.translate(0, fh / 2, 0);
    const platform = paint(new CylinderGeometry(ro + 1.5, ro + 1.5, 0.22, 64, 1, false), deck);
    platform.translate(0, -0.6, 0);
    const lower = paint(new CylinderGeometry(ro + 1.1, ro + 1.1, 0.16, 64, 1, false), deck);
    lower.translate(0, -2.6, 0);
    const posts: BufferGeometry[] = [];
    for (let i = 0; i < 24; i++) {
      const th = (i / 24) * Math.PI * 2;
      const g = paint(new CylinderGeometry(0.05, 0.05, 2.2, 5), deck);
      g.translate(Math.sin(th) * (ro + 1.4), -1.6, Math.cos(th) * (ro + 1.4));
      posts.push(g);
    }
    const geo = merge([outer, inner, platform, lower, ...posts]);
    const { material, depth } = makeMaterial(
      b,
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: new Color(PALETTE.windowWarm), emissiveIntensity: 0 }),
      { key: "formwork", shared, dissolve: fronts.formworkDissolve },
    );
    formwork = new Mesh(geo, material);
    addMesh(b, formwork, depth);
  }

  // --- szkło -----------------------------------------------------------------------------------
  {
    const geo = new PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const mats: Matrix4[] = [];
    const order: number[] = [];
    const lit: number[] = [];
    const pane: number[] = [];
    const fin: number[] = [];
    const n = TOWER.facade.panes;
    const half = SLOT_ANGLE / 2;

    // Mieszkania: na piętrze 6–9 lokali o różnej szerokości. Lokal świeci w całości albo wcale,
    // a pokoje (2–3 tafle) różnią się jasnością — bez przypadkowych „łat” pojedynczych szyb.
    const lightPlan = new Map<string, { level: number; tone: number }>();
    for (let L = 1; L < LEVEL_COUNT; L++) {
      let s = Math.floor(random() * 6);
      while (s < n + 6) {
        const width = 8 + Math.floor(random() * 9);
        const home = random() < (L === TOWER.floors ? 1 : 0.58);
        const tone = random(); // barwa światła lokalu (2700–3500 K)
        let k = 0;
        while (k < width) {
          const room = 2 + Math.floor(random() * 2);
          const level = home ? (random() < 0.2 ? 0 : 0.45 + random() * 0.75) : random() < 0.05 ? 0.35 : 0;
          for (let j = 0; j < room && k < width; j++, k++) lightPlan.set(`${L}:${(s + k) % n}`, { level, tone });
        }
        s += width;
      }
    }
    const plan = (L: number, s: number) => (L === 0 ? { level: 1.35, tone: 0.6 } : lightPlan.get(`${L}:${s}`) ?? { level: 0, tone: 0.5 });

    const push = (m: Matrix4, o: number, p: { level: number; tone: number }, mullion: number, side: number) => {
      mats.push(m);
      order.push(o);
      lit.push(p.level);
      pane.push(mullion, random(), p.tone);
      fin.push(side);
    };

    for (let L = 0; L < LEVEL_COUNT; L++) {
      const lv = level(L);
      const y0 = L === 0 ? 0.15 : lv.base;
      const y1 = levelY(L + 1);
      const mullion = lv.kind === "lobby" ? 0.5 : lv.kind === "penthouse" ? TOWER.penthouse.doorHeight / lv.height : 0;
      for (let s = 0; s < n; s++) {
        const terrace = terraceAtSlot(L, s);
        const recess = L === 0 ? TOWER.lobby.recess : terrace ? terrace.depth : 0;
        const rg0 = glassRadius(y0) - recess;
        const rg1 = glassRadius(y1) - recess;
        const th0 = (s + 0.5) * SLOT_ANGLE + twistAt(y0);
        const th1 = (s + 0.5) * SLOT_ANGLE + twistAt(y1);
        const width = 2 * rg0 * Math.sin(half) + 0.01;
        // lamela przy lewej (parzyste pole) albo prawej krawędzi tafli; w tarasie i w holu — brak
        const even = s % PANES_PER_LAMELLA === 0;
        const lamSlot = even ? s : (s + 1) % n;
        const side = recess > 0 || lamellaInTerrace(L, lamSlot) ? 0 : even ? -1 : 1;
        push(
          shearMatrix(new Matrix4(), th0, th1, rg0 * Math.cos(half), rg1 * Math.cos(half), y0, y1, width, 1),
          L + (s / n) * 0.7,
          plan(L, s),
          mullion,
          side,
        );
      }
      // boczne ściany wcięć tarasowych
      for (const t of TERRACES) {
        if (t.level !== L) continue;
        for (const end of [0, 1] as const) {
          const slot = t.startSlot + (end ? t.slots : 0);
          const th0 = slot * SLOT_ANGLE + twistAt(y0);
          const th1 = slot * SLOT_ANGLE + twistAt(y1);
          const rMid0 = glassRadius(y0) - t.depth / 2;
          const rMid1 = glassRadius(y1) - t.depth / 2;
          const sign = end ? 1 : -1;
          radial(th0, tmpA).multiplyScalar(sign * t.depth);
          tmpB.copy(radial(th1, tmpC).multiplyScalar(rMid1)).setY(y1);
          tmpO.copy(radial(th0, tmpC).multiplyScalar(rMid0)).setY(y0);
          tmpB.sub(tmpO);
          const z = tangent(th0, tmpC).multiplyScalar(-sign);
          push(basisMatrix(new Matrix4(), tmpA.clone(), tmpB.clone(), z.clone(), tmpO.clone()), L + 0.7, plan(L, t.startSlot), mullion, 0);
        }
      }
    }

    const { material, depth } = makeMaterial(
      b,
      // Szkło: ciemne i chłodne na wprost (widać wnętrze), lustrzane pod kątem (Fresnel; ior 2,0 = powłoka
      // selektywna). Bez metaliczności i bez szerokiego połysku — to one dawały wygląd plastiku.
      new MeshPhysicalMaterial({ color: PALETTE.glass, metalness: 0, roughness: 0.03, ior: 2.0, envMapIntensity: 1.2 }),
      {
        key: "glass",
        shared,
        reveal: { mode: "grow", front: fronts.facade, span: REVEAL_SPAN * 0.7 },
        uniforms: {
          uWindows: fronts.windows,
          uWindowColor: { value: c(PALETTE.windowWarm) },
          uMullion: { value: c(PALETTE.mullion) },
          uSoffit: { value: c(PALETTE.concreteSoffit) },
          uSlabTop: { value: c(PALETTE.slabEdge) },
          uFin: { value: c(PALETTE.gold) },
          uWarm2700: { value: c("#ffb46b") },
          uWarm3500: { value: c("#ffd6a8") },
        },
        vertexHead: /* glsl */ `
          attribute float aLit;
          attribute vec3 aPane;
          attribute float aFin;
          varying float vFin;
          varying float vLit;
          varying vec3 vPane;
          varying vec2 vPaneUv;
          varying vec3 vGlassT;
          varying vec3 vGlassN;
          varying vec2 vGlassSize;
        `,
        vertexMain: /* glsl */ `
          vLit = aLit; vPane = aPane; vPaneUv = uv; vFin = aFin;
          vGlassT = vec3(1.0, 0.0, 0.0);
          vGlassN = vec3(0.0, 0.0, 1.0);
          vGlassSize = vec2(1.0);
          #ifdef USE_INSTANCING
          {
            // rama tafli w świecie: x = szerokość, y = wysokość (ze skrętem), z = na zewnątrz
            vec3 gx = (modelMatrix * vec4(instanceMatrix[0].xyz, 0.0)).xyz;
            vec3 gy = (modelMatrix * vec4(instanceMatrix[1].xyz, 0.0)).xyz;
            vec3 gz = (modelMatrix * vec4(instanceMatrix[2].xyz, 0.0)).xyz;
            vGlassSize = vec2(length(gx), gy.y);
            vGlassT = gx / max(vGlassSize.x, 1e-4);
            vGlassN = normalize(gz);
          }
          #endif
        `,
        fragmentHead: /* glsl */ `
          uniform float uWindows;
          uniform vec3 uWindowColor;
          uniform vec3 uMullion;
          uniform vec3 uSoffit;
          uniform vec3 uSlabTop;
          uniform vec3 uFin;
          uniform vec3 uWarm2700;
          uniform vec3 uWarm3500;
          varying float vFin;
          varying float vLit;
          varying vec3 vPane;
          varying vec2 vPaneUv;
          varying vec3 vGlassT;
          varying vec3 vGlassN;
          varying vec2 vGlassSize;

          float glHash(float n) { return fract(sin(n * 91.345) * 47453.21); }

          // Wnętrze za szybą (interior mapping): promień z oka trafia w sufit, podłogę, ściany
          // albo tylną ścianę pokoju o losowej głębokości — paralaksa bez dodatkowej geometrii.
          vec3 glassInterior(vec3 viewDirW, out float depthFade) {
            float W = vGlassSize.x;
            float H = vGlassSize.y;
            vec3 d = -viewDirW;
            float dx = dot(d, vGlassT);
            float dy = d.y;
            float dz = max(dot(d, -vGlassN), 0.05);
            float px = (vPaneUv.x - 0.5) * W;
            float py = vPaneUv.y * H;
            float seed = floor(vPane.y * 997.0);
            float roomD = 4.5 + 4.0 * glHash(seed);
            float x0 = -W * (0.5 + floor(glHash(seed + 1.0) * 3.0));
            float x1 = W * (0.5 + floor(glHash(seed + 2.0) * 3.0));
            float ceilY = H - 0.55;
            float tBack = roomD / dz;
            float tSide = dx > 0.0 ? (x1 - px) / dx : (x0 - px) / min(dx, -1e-4);
            float tVert = dy > 0.0 ? (ceilY - py) / dy : -py / min(dy, -1e-4);
            float t = min(tBack, min(tSide, tVert));
            vec3 hit = vec3(px + dx * t, py + dy * t, dz * t);
            depthFade = clamp(hit.z / roomD, 0.0, 1.0);
            vec3 col;
            if (t == tVert && dy > 0.0) {
              // sufit: lampy w rzędach co ok. 1,8 m
              vec2 lamp = fract(vec2(hit.x, hit.z) / 1.8 + 0.5) - 0.5;
              col = vec3(0.62) + vec3(1.4) * exp(-dot(lamp, lamp) * 60.0);
            } else if (t == tVert) {
              col = vec3(0.34) * (0.8 + 0.2 * glHash(seed + 5.0)); // podłoga
            } else if (t == tSide) {
              col = vec3(0.5);
            } else {
              // tylna ściana z meblem (sofa / regał) w części pokoi
              col = vec3(0.56);
              float k = glHash(seed + 7.0);
              float u = hit.x / W;
              if (k > 0.45 && hit.y < 0.85 && abs(u - (k - 0.7) * 3.0) < 1.1) col = vec3(0.18);
              if (k < 0.2 && hit.y < 2.1 && abs(u + 0.4) < 0.35) col = vec3(0.24);
            }
            // światło słabnie w głąb pokoju
            col *= mix(1.0, 0.55, depthFade);
            // rolety (jasny ekran od góry) i zasłony (półprzezroczysta tkanina przy szybie)
            float blind = glHash(seed + 9.0);
            if (blind > 0.8 && vPaneUv.y > 1.0 - (blind - 0.8) * 3.5) col = vec3(0.82, 0.74, 0.62);
            float drape = glHash(seed + 11.0);
            if (drape < 0.28) {
              float fold = 0.75 + 0.25 * sin(vPaneUv.x * 40.0 + seed);
              col = mix(col, vec3(0.7, 0.62, 0.52) * fold, 0.55 + drape);
            }
            return col;
          }
        `,
        fragmentSurface: /* glsl */ `
          diffuseColor.rgb *= 0.88 + 0.22 * vPane.y;
          roughnessFactor = clamp(roughnessFactor + (fract(vPane.y * 31.0) - 0.5) * 0.03, 0.02, 1.0);
          float mBand = vPane.x > 0.0 ? 1.0 - smoothstep(0.006, 0.014, abs(vPaneUv.y - vPane.x)) : 0.0;
          // pionowe słupki ramy na krawędziach tafli (5 cm)
          float mEdge = min(vPaneUv.x, 1.0 - vPaneUv.x) * vGlassSize.x;
          mBand = max(mBand, 1.0 - smoothstep(0.02, 0.035, mEdge));
          diffuseColor.rgb = mix(diffuseColor.rgb, uMullion, mBand);
          metalnessFactor = mix(metalnessFactor, 0.85, mBand);
          roughnessFactor = mix(roughnessFactor, 0.35, mBand);
          vec3 glView = normalize(cameraPosition - vAaWorld);
        `,
        fragmentEmissive: /* glsl */ `
          {
            float glDepth;
            vec3 room = glassInterior(glView, glDepth);
            // noc: ciepłe wnętrza (losowo zapalone mieszkania); dzień: przyciemnione wnętrze za szybą
            // barwa 2700–3500 K, różna w każdym lokalu
            vec3 warm = mix(uWarm2700, uWarm3500, vPane.z);
            float night = vLit * uWindows;
            vec3 lit = room * warm * night * 1.3;
            vec3 day = room * vec3(0.86, 0.84, 0.8) * 0.07 * (1.0 - uWindows);
            // pod ostrym kątem szkło więcej odbija, a mniej przepuszcza
            float facing = clamp(dot(glView, vGlassN), 0.0, 1.0);
            totalEmissiveRadiance += (lit + day) * (1.0 - mBand) * (0.35 + 0.65 * facing);
          }
        `,
        fragmentRadiance: /* glsl */ `
          {
            // Odbicia sąsiednich elementów elewacji: promień odbity od szyby trafia w kapinos stropu
            // nad nią, w strop pod nią albo w złote lamele po bokach, zanim ucieknie w niebo.
            vec3 R = reflect(-glView, vGlassN);
            float rn = max(dot(R, vGlassN), 1e-3);
            float rt = dot(R, vGlassT);
            float W = vGlassSize.x;
            float H = vGlassSize.y;
            float px = (vPaneUv.x - 0.5) * W;
            float py = vPaneUv.y * H;
            const float SLAB_OUT = 0.34; // szkło → czoło stropu
            const float FIN_OUT = 0.6;   // szkło → zewnętrzna krawędź lameli
            float tUp = R.y > 0.0 ? (H - 0.46 - py) / R.y : 1e4;
            float tDown = R.y < 0.0 ? (py - 0.04) / -R.y : 1e4;
            // lamela stoi tylko przy jednej krawędzi tafli (vFin = −1 lewa, +1 prawa, 0 brak)
            float tFin = abs(rt) > 1e-3 && sign(rt) == vFin ? (W * 0.5 - sign(rt) * px) / abs(rt) : 1e4;
            float hitUp = smoothstep(0.03, -0.03, rn * tUp - SLAB_OUT);
            float hitDown = smoothstep(0.03, -0.03, rn * tDown - SLAB_OUT);
            float hitFin = smoothstep(0.04, -0.04, rn * tFin - FIN_OUT);
            vec3 amb = iblIrradiance * RECIPROCAL_PI;
            // kapinos: rozproszone światło nieba + ciepło z wnętrz nocą
            vec3 soffit = uSoffit * (amb * 0.75 + uWindowColor * uWindows * vLit * 0.35);
            vec3 slabTop = uSlabTop * amb * 1.35;
            vec3 fin = uFin * (radiance * 0.7 + amb * 0.3);
            // najbliższe trafienie wygrywa
            float tMin = min(tFin, min(tUp, tDown));
            vec3 hitC = tMin == tFin ? fin : (tMin == tUp ? soffit : slabTop);
            float hit = tMin == tFin ? hitFin : (tMin == tUp ? hitUp : hitDown);
            radiance = mix(radiance, hitC, hit * (1.0 - mBand));
          }
        `,
      },
    );
    const mesh = new InstancedMesh(geo, material, mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    geo.setAttribute("aOrder", new InstancedBufferAttribute(new Float32Array(order), 1));
    geo.setAttribute("aLit", new InstancedBufferAttribute(new Float32Array(lit), 1));
    geo.setAttribute("aPane", new InstancedBufferAttribute(new Float32Array(pane), 3));
    geo.setAttribute("aFin", new InstancedBufferAttribute(new Float32Array(fin), 1));
    addMesh(b, mesh, depth, { cast: false, receive: true });
  }

  // --- lamele: 48 na obwodzie, 12 × 45 cm, 60 cm przed szkłem; przerwane na wysokości tarasów -----
  // Satynowe szampańskie złoto: wyraźny połysk przy słońcu, nocą delikatnie doświetlone od dołu.
  const washPatch = (amount: string) => ({
    vertexHead: `varying float vLocalY;\n`,
    vertexMain: `vLocalY = position.y;`,
    fragmentHead: `uniform float uWash;\nuniform vec3 uWashColor;\nvarying float vLocalY;\n`,
    fragmentEmissive: /* glsl */ `
      {
        // oprawa w czole stropu świeci w górę: najjaśniej przy stropie, gaśnie ku górze piętra
        float w = pow(1.0 - clamp(vLocalY, 0.0, 1.0), 2.6);
        totalEmissiveRadiance += uWashColor * uWash * (${amount}) * (0.08 + 0.9 * w);
      }`,
  });
  const washUniforms = { uWash: fronts.windows, uWashColor: { value: c("#ffc98f") } };
  const goldMaterial = () =>
    new MeshStandardMaterial({ color: PALETTE.gold, metalness: 1, roughness: 0.3, envMapIntensity: 1.05 });
  {
    const { lamellaWidth: w, lamellaDepth: d, lamellas } = TOWER.facade;
    const geo = prism(roundedRect(w, d, 0.025, 1), false);
    const items: { m: Matrix4; order: number }[] = [];
    for (let L = 0; L < LEVEL_COUNT; L++) {
      const y0 = L === 0 ? 0 : levelY(L);
      const y1 = levelY(L + 1);
      for (let k = 0; k < lamellas; k++) {
        if (L === 0 && k % 2 !== 0) continue; // hol: kolumnada co druga lamela
        const slot = k * PANES_PER_LAMELLA;
        if (lamellaInTerrace(L, slot)) continue;
        const th0 = slot * SLOT_ANGLE + twistAt(y0);
        const th1 = slot * SLOT_ANGLE + twistAt(y1);
        items.push({
          m: shearMatrix(new Matrix4(), th0, th1, lamellaRadius(y0), lamellaRadius(y1), y0, y1),
          order: L + 0.3 + (k / lamellas) * 0.7,
        });
      }
    }
    const { material, depth } = makeMaterial(b, goldMaterial(), {
      key: "lamella",
      shared,
      reveal: { mode: "grow", front: fronts.facade, span: REVEAL_SPAN * 0.7 },
      uniforms: washUniforms,
      ...washPatch("0.55"),
    });
    const mesh = new InstancedMesh(geo, material, items.length);
    const ord = new Float32Array(items.length);
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      ord[i] = it.order;
    });
    geo.setAttribute("aOrder", new InstancedBufferAttribute(ord, 1));
    addMesh(b, mesh, depth);
  }

  // --- tarasy: wcięcia z płytą, szklaną balustradą ze złotą poręczą, donice i zieleń -------------
  // Zieleń = mieszanka instancjonowanych kęp: trawy, krzewy, lawenda, oliwki, pnącza za krawędzią.
  // Gęsta i wysoka na tyle, by z daleka czytała się jako dwie zielone spirale.
  {
    const { planterDepth: pd, planterHeight: ph } = TOWER.terraces;
    const planterGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.05);
    planterGeo.translate(0, 0.5, 0);
    // ziemia na wierzchu donicy, ciemniejszy dół (AO przy płycie)
    {
      const pc = planterGeo.getAttribute("position");
      const pn = planterGeo.getAttribute("normal");
      const colors = new Float32Array(pc.count * 3);
      const planterC = c(PALETTE.planter);
      const soilC = c(PALETTE.soil);
      for (let i = 0; i < pc.count; i++) {
        const isSoil = pn.getY(i) > 0.7 && pc.getY(i) > 0.97 && Math.abs(pc.getX(i)) < 0.45 && Math.abs(pc.getZ(i)) < 0.42;
        const ao = 0.72 + 0.28 * Math.min(1, pc.getY(i) * 2.5);
        const col = (isSoil ? soilC : planterC).clone().multiplyScalar(ao);
        colors.set([col.r, col.g, col.b], i * 3);
      }
      planterGeo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    }

    const plants = createPlantGeometries();
    type Item = { m: Matrix4; o: number; c?: Color };
    const planters: Item[] = [];
    const shrubs: Item[] = [];
    const grasses: Item[] = [];
    const lavenders: Item[] = [];
    const spills: Item[] = [];
    const trunks: Item[] = [];
    const crowns: Item[] = [];
    const panels: Item[] = [];
    const rails: Item[] = [];
    const pick = (list: readonly string[]) => c(list[Math.floor(random() * list.length)] ?? (list[0] as string));
    const place = (p: Vector3, rotY: number, sx: number, sy: number, sz: number) =>
      new Matrix4().makeTranslation(p.x, p.y, p.z).multiply(new Matrix4().makeRotationY(rotY)).multiply(new Matrix4().makeScale(sx, sy, sz));
    const pos = new Vector3();

    for (const t of TERRACES) {
      const y = levelY(t.level);
      const rs = slabRadius(y);
      const rp = rs - 0.14 - pd / 2;
      const tw = twistAt(y);
      const width = 2 * rp * Math.sin(SLOT_ANGLE / 2) + 0.02;
      const treeAt = new Set<number>();
      if (t.penthouse) [2, t.slots - 3].forEach((k) => treeAt.add(k));
      else {
        treeAt.add(2 + Math.floor(random() * 3));
        if (random() < 0.6) treeAt.add(t.slots - 3 - Math.floor(random() * 3));
      }
      for (let k = 0; k < t.slots; k++) {
        const slot = t.startSlot + k;
        const th = (slot + 0.5) * SLOT_ANGLE + tw;
        const o = t.level + (k / t.slots) * 0.6;
        const x = tangent(th, tmpA).clone();
        const z = radial(th, tmpB).clone();

        // balustrada: tafla szkła 1,1 m i złota poręcz na krawędzi stropu
        const rr = rs - 0.06;
        const wr = 2 * rr * Math.sin(SLOT_ANGLE / 2) + 0.005;
        pos.copy(z).multiplyScalar(rr).setY(y);
        panels.push({ m: basisMatrix(new Matrix4(), x.clone().multiplyScalar(wr), new Vector3(0, 1.1, 0), z.clone(), pos.clone()), o: o + 0.2 });
        rails.push({ m: basisMatrix(new Matrix4(), x.clone().multiplyScalar(wr + 0.01), new Vector3(0, 0.06, 0), z.clone().multiplyScalar(0.07), pos.clone().setY(y + 1.1)), o: o + 0.25 });

        // penthouse: donice tylko przy końcach, środek tarasu wolny
        if (t.penthouse && k > 3 && k < t.slots - 4) continue;

        pos.copy(z).multiplyScalar(rp).setY(y);
        planters.push({ m: basisMatrix(new Matrix4(), x.clone().multiplyScalar(width), new Vector3(0, ph, 0), z.clone().multiplyScalar(pd), pos.clone()), o });
        const soil = y + ph - 0.04;
        const along = (v: number) => pos.clone().addScaledVector(x, v * width * 0.5).addScaledVector(z, (random() - 0.5) * pd * 0.5).setY(soil);

        if (treeAt.has(k)) {
          // oliwka: krzywy pień i srebrzystozielona korona, 2,4–3,4 m nad płytą
          const h = (t.penthouse ? 2.4 : 1.7) + random() * 0.7;
          const p = along(0);
          trunks.push({ m: place(p, random() * 6.28, 1, h, 1), o: o + 0.3 });
          const s = (t.penthouse ? 1.25 : 0.95) + random() * 0.3;
          crowns.push({ m: place(p.clone().setY(soil + h - 0.15), random() * 6.28, s * 1.15, s * 0.85, s), o: o + 0.4, c: pick(PALETTE.olive) });
          continue;
        }
        const roll = random();
        if (roll < 0.5) {
          const s = 0.85 + random() * 0.6;
          shrubs.push({ m: place(along((random() - 0.5) * 0.6), random() * 6.28, s * 1.15, s * (0.8 + random() * 0.5), s), o: o + 0.15, c: pick(PALETTE.leaves) });
        } else if (roll < 0.68) {
          const s = 0.8 + random() * 0.4;
          lavenders.push({ m: place(along((random() - 0.5) * 0.5), random() * 6.28, s, s * (0.9 + random() * 0.3), s), o: o + 0.15, c: c("#ffffff") });
        } else {
          const s = 0.9 + random() * 0.5;
          grasses.push({ m: place(along((random() - 0.5) * 0.6), random() * 6.28, s, s * (0.9 + random() * 0.5), s), o: o + 0.15, c: pick(PALETTE.grass) });
        }
        // druga, niższa kępa traw między krzewami
        if (random() < 0.55) {
          const s = 0.7 + random() * 0.4;
          grasses.push({ m: place(along(random() < 0.5 ? -0.7 : 0.7), random() * 6.28, s, s * 0.8, s), o: o + 0.18, c: pick(PALETTE.grass) });
        }
        // pnącza przewieszone za krawędź donicy
        if (random() < 0.5) {
          const s = 0.8 + random() * 0.5;
          const p = z.clone().multiplyScalar(rp + pd * 0.5).addScaledVector(x, (random() - 0.5) * width * 0.7).setY(soil);
          spills.push({ m: place(p, th, s, s * (0.8 + random() * 0.8), s), o: o + 0.3, c: pick(PALETTE.leaves) });
        }
      }
    }

    const instanced = (geo: BufferGeometry, material: Material, depth: Material | undefined, items: Item[], shadows = { cast: true, receive: true }) => {
      const mesh = new InstancedMesh(geo, material, items.length);
      const ord = new Float32Array(items.length);
      items.forEach((it, i) => {
        mesh.setMatrixAt(i, it.m);
        if (it.c) mesh.setColorAt(i, it.c);
        ord[i] = it.o;
      });
      geo.setAttribute("aOrder", new InstancedBufferAttribute(ord, 1));
      addMesh(b, mesh, depth, shadows);
      return mesh;
    };

    const reveal = { mode: "scale" as const, front: fronts.terraces, span: REVEAL_SPAN * 0.6 };
    const pm = makeMaterial(b, new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), { key: "planter", shared, reveal });
    instanced(planterGeo, pm.material, pm.depth, planters);

    // liście: miękkie, rozproszone światło (normalne „kępy” policzone od środka bryły)
    const foliage = (key: string, double = false) => {
      const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, envMapIntensity: 0.8, side: double ? DoubleSide : FrontSide });
      return makeMaterial(b, m, {
        key,
        shared,
        reveal,
        wind: true,
        fragmentSurface: /* glsl */ `
          // prześwit słońca przez liście: cieplejsze i jaśniejsze na krawędziach pod światło
          {
            float back = pow(max(dot(normalize(vAaWorld - cameraPosition), uSunDir), 0.0), 3.0);
            diffuseColor.rgb *= 1.0 + back * vec3(0.35, 0.3, 0.05);
          }`,
      });
    };
    const shrubM = foliage("shrub");
    instanced(plants.shrub, shrubM.material, shrubM.depth, shrubs);
    const crownM = foliage("olive");
    instanced(plants.olive, crownM.material, crownM.depth, crowns);
    const spillM = foliage("spill");
    instanced(plants.spill, spillM.material, spillM.depth, spills, { cast: false, receive: true });
    const grassM = foliage("grass", true);
    instanced(plants.grass, grassM.material, grassM.depth, grasses, { cast: false, receive: true });
    const lavM = foliage("lavender", true);
    instanced(plants.lavender, lavM.material, lavM.depth, lavenders, { cast: false, receive: true });
    const km = makeMaterial(b, new MeshStandardMaterial({ color: PALETTE.trunk, roughness: 0.9 }), {
      key: "trunk",
      shared,
      reveal: { ...reveal, mode: "grow" },
    });
    instanced(plants.trunk, km.material, km.depth, trunks);

    // balustrada: szkło (bez cienia) i złota poręcz
    const panelGeo = new PlaneGeometry(1, 1);
    panelGeo.translate(0, 0.5, 0);
    const glassRail = makeMaterial(
      b,
      new MeshStandardMaterial({ color: "#cfe3e6", metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }),
      { key: "railing", shared, reveal: { mode: "grow", front: fronts.terraces, span: 0.6 } },
    );
    instanced(panelGeo, glassRail.material, undefined, panels, { cast: false, receive: false });
    const railGeo = new BoxGeometry(1, 1, 1);
    railGeo.translate(0, 0.5, 0);
    const railM = makeMaterial(b, goldMaterial(), { key: "handrail", shared, reveal: { mode: "grow", front: fronts.terraces, span: 0.6 } });
    instanced(railGeo, railM.material, railM.depth, rails, { cast: false, receive: true });
  }

  // --- złote wstęgi wzdłuż obu krawędzi każdej spirali tarasów (jak na wzorcu) ------------------
  {
    const pos: number[] = [];
    const nor: number[] = [];
    const order: number[] = [];
    const pivot: number[] = [];
    const { widthSlots, spirals } = TOWER.terraces;
    const halfH = 0.42;
    const SUB = 6;
    const edgeAngle = (L: number, spiral: number, end: 0 | 1) => {
      const t = TERRACES.find((x) => x.level === Math.min(TOWER.floors, L) && x.spiral === spiral);
      const startSlot = t ? t.startSlot + (L > TOWER.floors ? TOWER.terraces.advanceSlots : 0) : 0;
      return (startSlot + end * widthSlots) * SLOT_ANGLE + twistAt(levelY(Math.min(L, LEVEL_COUNT)));
    };
    const unwrap = (a: number, ref: number) => a + Math.round((ref - a) / (Math.PI * 2)) * Math.PI * 2;
    const push = (p: Vector3, n: Vector3, o: number, pv: Vector3) => {
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      order.push(o);
      pivot.push(pv.x, pv.y, pv.z);
    };
    const quad = (a: Vector3, b2: Vector3, c2: Vector3, d: Vector3, n: Vector3, o: number, pv: Vector3) => {
      for (const v of [a, b2, c2, a, c2, d]) push(v, n, o, pv);
    };
    for (let spiral = 0; spiral < spirals; spiral++) {
      for (const end of [0, 1] as const) {
        for (let L = 1; L <= TOWER.floors; L++) {
          const a0 = edgeAngle(L, spiral, end);
          const a1 = unwrap(edgeAngle(L + 1, spiral, end), a0);
          const y0 = levelY(L);
          const y1 = levelY(L + 1);
          const pv = radial(a0, new Vector3()).multiplyScalar(glassRadius(y0)).setY(y0);
          for (let k = 0; k < SUB; k++) {
            const u0 = k / SUB;
            const u1 = (k + 1) / SUB;
            const ring = (u: number) => {
              const a = a0 + (a1 - a0) * u;
              const y = y0 + (y1 - y0) * u;
              const R = radial(a, new Vector3());
              const ri = glassRadius(y) - 0.05;
              const ro = outerRadius(y) + 0.08;
              return {
                R,
                ib: R.clone().multiplyScalar(ri).setY(y - halfH),
                ob: R.clone().multiplyScalar(ro).setY(y - halfH),
                ot: R.clone().multiplyScalar(ro).setY(y + halfH),
                it: R.clone().multiplyScalar(ri).setY(y + halfH),
              };
            };
            const A = ring(u0);
            const B = ring(u1);
            const o = L + 0.85;
            const nOut = A.R.clone().add(B.R).normalize();
            quad(A.ob, B.ob, B.ot, A.ot, nOut, o, pv);
            quad(A.it, A.ot, B.ot, B.it, new Vector3(0, 1, 0), o, pv);
            quad(A.ib, B.ib, B.ob, A.ob, new Vector3(0, -1, 0), o, pv);
          }
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
    g.setAttribute("aOrder", new Float32BufferAttribute(order, 1));
    g.setAttribute("aPivot", new Float32BufferAttribute(pivot, 3));
    g.setIndex([...Array(pos.length / 3).keys()]);
    fixWinding(g);
    const { material, depth } = makeMaterial(b, goldMaterial(), {
      key: "ribbon",
      shared,
      reveal: { mode: "grow", front: fronts.facade, span: REVEAL_SPAN, pivot: true },
      uniforms: washUniforms,
      fragmentHead: `uniform float uWash;\nuniform vec3 uWashColor;\n`,
      fragmentEmissive: `totalEmissiveRadiance += uWashColor * uWash * 0.12;`,
    });
    addMesh(b, new Mesh(g, material), depth);
  }

  // --- hol: daszek nad wejściem i złoty portal ---------------------------------------------------
  const canopyLights: MeshBasicMaterial[] = [];
  {
    const { recess, canopyArcDeg, canopyDepth, canopyHeight } = TOWER.lobby;
    const arc = (canopyArcDeg * Math.PI) / 180;
    const rIn = glassRadius(0) - recess;
    const rOut = outerRadius(0) + canopyDepth;
    const steps = 24;
    const shape: number[] = [];
    const P = (r: number, a: number, y: number) => [r * Math.sin(a), y, r * Math.cos(a)];
    const th = 0.34;
    const concrete = c(PALETTE.slabEdge);
    const goldC = c(PALETTE.gold);
    const colors: number[] = [];
    const tri = (pts: number[][], col: Color) => {
      for (const p of pts) {
        shape.push(...(p as [number, number, number]));
        colors.push(col.r, col.g, col.b);
      }
    };
    // daszek: zaokrąglony przód — promień zewnętrzny maleje ku końcom łuku
    const edgeR = (u: number) => rIn + (rOut - rIn) * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 8));
    for (let i = 0; i < steps; i++) {
      const u0 = i / steps;
      const u1 = (i + 1) / steps;
      const a0 = -arc / 2 + arc * u0;
      const a1 = -arc / 2 + arc * u1;
      const r0 = Math.max(rIn + 0.4, edgeR(u0));
      const r1 = Math.max(rIn + 0.4, edgeR(u1));
      const yT = canopyHeight;
      const yB = canopyHeight - th;
      tri([P(rIn, a1, yT), P(rIn, a0, yT), P(r0, a0, yT), P(rIn, a1, yT), P(r0, a0, yT), P(r1, a1, yT)], concrete);
      tri([P(rIn, a0, yB), P(rIn, a1, yB), P(r0, a0, yB), P(r0, a0, yB), P(rIn, a1, yB), P(r1, a1, yB)], concrete);
      tri([P(r0, a0, yB), P(r1, a1, yB), P(r1, a1, yT), P(r0, a0, yB), P(r1, a1, yT), P(r0, a0, yT)], goldC);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(shape, 3));
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    g.setIndex([...Array(shape.length / 3).keys()]);
    // normalne płaskie: wierzch w górę, spód w dół
    const nAttr = g.getAttribute("normal");
    for (let i = 0; i < nAttr.count; i++) {
      const y = shape[i * 3 + 1] as number;
      const isTop = Math.abs(y - canopyHeight) < 1e-3;
      const isBottom = Math.abs(y - (canopyHeight - th)) < 1e-3;
      const isEdge = (colors[i * 3] as number) === goldC.r && (colors[i * 3 + 1] as number) === goldC.g;
      if (!isEdge && isTop) nAttr.setXYZ(i, 0, 1, 0);
      else if (!isEdge && isBottom) nAttr.setXYZ(i, 0, -1, 0);
      else if (isEdge) {
        // czoło daszka: normalna na zewnątrz (od osi wieży)
        const x = shape[i * 3] as number;
        const z = shape[i * 3 + 2] as number;
        if (nAttr.getX(i) * x + nAttr.getZ(i) * z < 0) nAttr.setXYZ(i, -nAttr.getX(i), -nAttr.getY(i), -nAttr.getZ(i));
      }
    }
    fixWinding(g);
    // portal wejścia: dwa złote pylony i nadproże
    const portal: BufferGeometry[] = [];
    for (const a of [-0.075, 0.075]) {
      const p = new RoundedBoxGeometry(0.5, canopyHeight - th, 0.6, 2, 0.08);
      p.translate(0, (canopyHeight - th) / 2, 0);
      p.rotateY(a);
      p.translate(Math.sin(a) * (rIn + 0.3), 0, Math.cos(a) * (rIn + 0.3));
      portal.push(paint(p, goldC));
    }
    const all = merge([g, ...portal]);
    const count = all.getAttribute("position").count;
    all.setAttribute("aOrder", new Float32BufferAttribute(new Float32Array(count).fill(0.75), 1));
    const pv = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) pv.set([0, canopyHeight, rIn], i * 3);
    all.setAttribute("aPivot", new Float32BufferAttribute(pv, 3));
    const { material, depth } = makeMaterial(
      b,
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.35 }),
      { key: "canopy", shared, reveal: { mode: "scale", front: fronts.facade, span: 0.6, pivot: true } },
    );
    addMesh(b, new Mesh(all, material), depth);

    // światła pod daszkiem
    const lightGeo = new RingGeometry(0, 0.22, 16);
    lightGeo.rotateX(Math.PI / 2);
    const lights: BufferGeometry[] = [];
    for (let i = 0; i < 11; i++) {
      const a = -arc / 2 + arc * ((i + 0.5) / 11);
      for (const rr of [rIn + 1.8, rIn + 4.3]) {
        if (rr > edgeR((i + 0.5) / 11) - 0.6) continue;
        const l = lightGeo.clone();
        l.translate(rr * Math.sin(a), canopyHeight - th - 0.01, rr * Math.cos(a));
        lights.push(l);
      }
    }
    const lg = merge(lights, ["position", "normal"]);
    lightGeo.dispose();
    const lm = new MeshBasicMaterial({ color: c(PALETTE.windowWarm), toneMapped: false });
    patchMaterial(lm, { key: "canopy-lights", shared });
    canopyLights.push(lm);
    b.disposables.push(lm);
    const lmesh = new Mesh(lg, lm);
    addMesh(b, lmesh, undefined, { cast: false, receive: false });
  }

  // --- korona: 48 lamel przechodzi ponad dach, wysokość rośnie po dwóch spiralach (7 → 21 m), ----
  // góra lekko pochylona do środka; wewnątrz 12 żeber zbiega się w podstawę szpicu.
  const roof = TOWER.roofHeight;
  const { lamellas: crownCount, minHeight, maxHeight, inward, ribs, ribBaseRadius } = TOWER.crown;
  const spireBase = TOWER.spire.base;
  {
    const segs = quality === "high" ? 14 : 9;
    const pos: number[] = [];
    const nor: number[] = [];
    const glow: number[] = [];
    const order: number[] = [];
    const pivot: number[] = [];
    const idx: number[] = [];
    const tw0 = twistAt(roof);
    const twistPerM = ((TOWER.twistPerFloorDeg * Math.PI) / 180) / TYPICAL_FLOOR_HEIGHT;
    const spiralStart = (TERRACES.find((t) => t.level === TOWER.floors && t.spiral === 0)?.startSlot ?? 0) / PANES_PER_LAMELLA;

    /** Zamiata prostokątny profil wzdłuż krzywej; normalne liczone z ram (styczna, „na zewnątrz”). */
    const sweep = (
      curve: (t: number) => Vector3,
      outward: (t: number) => Vector3,
      w: (t: number) => number,
      d: (t: number) => number,
      steps: number,
      o: number,
      pv: Vector3,
      glowAt: (t: number) => number,
    ) => {
      const ring: Vector3[][] = [];
      const ringN: Vector3[][] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const p = curve(t);
        const along = curve(Math.min(1, t + 1e-3)).sub(curve(Math.max(0, t - 1e-3))).normalize();
        const D = outward(t).projectOnPlane(along).normalize();
        const T = new Vector3().crossVectors(along, D).normalize();
        const hw = w(t) / 2;
        const hd = d(t) / 2;
        ring.push([
          p.clone().addScaledVector(T, hw).addScaledVector(D, hd),
          p.clone().addScaledVector(T, -hw).addScaledVector(D, hd),
          p.clone().addScaledVector(T, -hw).addScaledVector(D, -hd),
          p.clone().addScaledVector(T, hw).addScaledVector(D, -hd),
        ]);
        ringN.push([D, T.clone().negate(), D.clone().negate(), T]);
      }
      for (let side = 0; side < 4; side++) {
        const start = pos.length / 3;
        for (let k = 0; k <= steps; k++) {
          const cs = ring[k] as Vector3[];
          const n = (ringN[k] as Vector3[])[side] as Vector3;
          for (const v of [cs[side] as Vector3, cs[(side + 1) % 4] as Vector3]) {
            pos.push(v.x, v.y, v.z);
            nor.push(n.x, n.y, n.z);
            glow.push(glowAt(k / steps));
            order.push(o);
            pivot.push(pv.x, pv.y, pv.z);
          }
        }
        for (let k = 0; k < steps; k++) {
          const a = start + k * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
    };

    // lamele korony
    for (let i = 0; i < crownCount; i++) {
      const th0 = i * PANES_PER_LAMELLA * SLOT_ANGLE + tw0;
      // dwie spirale: wysokość rośnie przez pół obwodu i opada na początku następnej spirali
      const u = (((i - spiralStart) / crownCount) * 2 + 2) % 1;
      const h = minHeight + (maxHeight - minHeight) * u ** 1.15;
      const r0 = lamellaRadius(roof);
      const curve = (t: number) => {
        const y = roof + h * t;
        const lean = inward * ((h * t) / maxHeight) ** 2;
        return radial(th0 + twistPerM * h * t, new Vector3()).multiplyScalar(r0 - lean).setY(y);
      };
      const out = (t: number) => radial(th0 + twistPerM * h * t, new Vector3());
      const pv = radial(th0, new Vector3()).multiplyScalar(r0).setY(roof);
      sweep(
        curve,
        out,
        (t) => TOWER.facade.lamellaWidth * (1 - 0.3 * t),
        (t) => TOWER.facade.lamellaDepth * (1 - 0.45 * t),
        segs,
        (i / crownCount) * 0.6,
        pv,
        (t) => (t * h) / maxHeight,
      );
    }

    // żebra: od pierścienia na dachu do podstawy szpicu, wklęsły profil („rozkloszowana” nasada)
    for (let i = 0; i < ribs; i++) {
      const th0 = (i / ribs) * Math.PI * 2 + tw0;
      const top = spireBase + 1.2;
      const curve = (t: number) => {
        const r = 0.32 + (ribBaseRadius - 0.32) * (1 - t) ** 2.3;
        return radial(th0 + t * 0.5, new Vector3()).multiplyScalar(r).setY(roof + 0.3 + (top - roof - 0.3) * t);
      };
      const out = (t: number) => radial(th0 + t * 0.5, new Vector3());
      const pv = new Vector3(0, roof, 0);
      sweep(curve, out, () => 0.16, (t) => 0.34 * (1 - 0.6 * t), segs + 4, 0.55 + (i / ribs) * 0.3, pv, (t) => 0.4 + 0.6 * t);
    }

    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
    g.setAttribute("aGlow", new Float32BufferAttribute(glow, 1));
    g.setAttribute("aOrder", new Float32BufferAttribute(order, 1));
    g.setAttribute("aPivot", new Float32BufferAttribute(pivot, 3));
    g.setIndex(idx);
    fixWinding(g);
    const { material, depth } = makeMaterial(b, goldMaterial(), {
      key: "crown",
      shared,
      reveal: { mode: "grow", front: fronts.crown, span: 0.25, pivot: true },
      uniforms: { uCrownGlow: fronts.crownGlow, uGlowColor: { value: c("#ffd9a0") } },
      vertexHead: `attribute float aGlow;\nvarying float vGlow;\n`,
      vertexMain: `vGlow = aGlow;`,
      fragmentHead: `uniform float uCrownGlow;\nuniform vec3 uGlowColor;\nvarying float vGlow;\n`,
      // nocą korona podświetlona od środka: wewnętrzne ściany lamel jaśniejsze, ku górze mocniej
      fragmentEmissive: `totalEmissiveRadiance += uGlowColor * uCrownGlow * (0.12 + 1.6 * pow(vGlow, 1.6));`,
    });
    material.side = DoubleSide;
    addMesh(b, new Mesh(g, material), depth);
  }

  // --- świetlik nad salonem penthouse'u: niska kopuła z promienistymi żebrami (świeci nocą) --------
  let skylight: Mesh;
  const skylightMat = new MeshStandardMaterial({
    color: "#c9d6d4",
    roughness: 0.15,
    metalness: 0.2,
    emissive: new Color(PALETTE.windowWarm),
    emissiveIntensity: 0,
  });
  {
    const pts: Vector2[] = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push(new Vector2(Math.max(0.02, 5.6 * Math.cos((t * Math.PI) / 2)), 1.5 * Math.sin((t * Math.PI) / 2)));
    }
    const dome = new LatheGeometry(pts, 48);
    patchMaterial(skylightMat, {
      key: "skylight",
      shared,
      fragmentSurface: /* glsl */ `
        {
          // promieniste żebra co 15°
          float a = atan(vAaWorld.z, vAaWorld.x);
          float rib = 1.0 - smoothstep(0.02, 0.05, abs(fract(a / 0.2618) - 0.5) * 0.2618 * length(vAaWorld.xz));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.64, 0.4), rib);
        }`,
    });
    b.disposables.push(skylightMat);
    skylight = new Mesh(dome, skylightMat);
    skylight.position.y = roof + 0.05;
    addMesh(b, skylight, undefined, { cast: false, receive: true });
  }

  // --- szpic -----------------------------------------------------------------------------------
  let spire: Mesh;
  {
    const h = TOWER.spireTop - spireBase;
    const pts: Vector2[] = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      pts.push(new Vector2(TOWER.spire.baseRadius * (1 - t) ** 1.3 + 0.03, h * t));
    }
    const g = new LatheGeometry(pts, 20);
    const { material } = makeMaterial(b, goldMaterial(), { key: "spire", shared });
    spire = new Mesh(g, material);
    spire.position.y = spireBase;
    addMesh(b, spire);
  }

  // --- gwiazda na szczycie: czteroramienna, jak w znaku Ad Astra --------------------------------
  const starUniforms = {
    uIntensity: { value: 0 },
    uNight: { value: 0 },
    uTime: shared.uTime,
    uColor: { value: c("#fff1d0") },
  };
  const starMat = new ShaderMaterial({
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uIntensity;
      void main() {
        vUv = uv * 2.0 - 1.0;
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        // stały rozmiar w świecie + minimalny rozmiar na ekranie (z daleka nie znika)
        float size = 14.0 * max(1.0, -mv.z / 260.0);
        mv.xy += position.xy * size;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uIntensity;
      uniform float uNight;
      uniform float uTime;
      uniform vec3 uColor;
      void main() {
        vec2 p = vUv;
        float r = length(p);
        // cztery ramiona z wąską talią (znak marki: ramię pionowe dłuższe)
        float ax = abs(p.x), ay = abs(p.y);
        float armV = exp(-ax * 38.0) * (1.0 - smoothstep(0.0, 1.0, ay));
        float armH = exp(-ay * 38.0) * (1.0 - smoothstep(0.0, 0.62, ax));
        float core = exp(-r * 26.0);
        float halo = exp(-r * 5.0) * 0.25 * uNight;
        float tw = 0.93 + 0.07 * sin(uTime * 2.1);
        float v = (core * 6.0 + (armV + armH) * 2.4 * tw + halo) * uIntensity;
        if (v < 0.002) discard;
        gl_FragColor = vec4(uColor * v, 1.0);
      }
    `,
  });
  b.disposables.push(starMat);
  const starGeo = new PlaneGeometry(1, 1);
  const star = new Mesh(starGeo, starMat);
  star.position.y = TOWER.spireTop + 0.3;
  star.frustumCulled = false;
  star.renderOrder = 10;
  b.objects.push(star);
  b.disposables.push(starGeo);

  const crownLight = new PointLight(c("#ffcf96"), 0, 46, 2);
  crownLight.position.set(0, roof + 7, 0);
  b.objects.push(crownLight);

  for (const o of b.objects) group.add(o);

  return {
    group,
    fronts,
    update(u) {
      formwork.visible = u.formworkVisible;
      formwork.position.y = u.formworkY;
      (formwork.material as MeshStandardMaterial).emissiveIntensity = u.crownGlow * 0.15;

      spire.visible = u.spire > 0.001;
      spire.scale.set(1, Math.max(0.001, u.spire), 1);

      skylight.visible = u.crown > 0.02;
      skylight.scale.set(1, Math.max(0.001, Math.min(1, u.crown * 2)), 1);
      skylightMat.emissiveIntensity = u.crownGlow * 1.4 * Math.min(1, u.crown);

      starUniforms.uIntensity.value = u.star;
      starUniforms.uNight.value = u.starNight;
      star.visible = u.star > 0.001;

      crownLight.intensity = u.crownGlow * u.crown * 260;
      crownLight.visible = crownLight.intensity > 1;

      for (const m of canopyLights) {
        m.color.set(PALETTE.windowWarm).multiplyScalar(0.6 + 5 * u.canopyLights);
      }
    },
    dispose() {
      for (const d of b.disposables) d.dispose();
      group.clear();
    },
  };
}
