/**
 * Plac budowy: ziemia (tymczasowa — świat wokół to zadanie 4), wykop, pale, zbrojenie płyty
 * fundamentowej, płyta, zasypka wokół wieży i miękki cień kontaktowy u podstawy.
 */
import {
  BackSide,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  Vector3,
  type IUniform,
} from "three";
import { depthMaterialFor, patchMaterial, type SharedUniforms } from "./shader-patch";
import { FOUNDATION_TOP, TOWER, columnRadius, slabRadius } from "./tower-config";

export const SITE_PALETTE = {
  ground: "#cdbfa3",
  earth: "#a88b6a",
  earthDeep: "#8a6f55",
  concreteWet: "#9d978d",
  concrete: "#d3cabd",
  rebar: "#8a5634",
} as const;

export interface SiteState {
  pitDepth: number;
  piles: number;
  rebar: number;
  pour: number;
  backfill: number;
  /** 0–1: ile wieży już stoi (cień kontaktowy). */
  presence: number;
  night: number;
}

export interface Site {
  group: Group;
  update(s: SiteState): void;
  dispose(): void;
}

export function createSite(shared: SharedUniforms): Site {
  const group = new Group();
  group.name = "site";
  const disposables: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };
  const { radius: pitR, depth: pitD } = TOWER.pit;
  const bottom = FOUNDATION_TOP - TOWER.foundation.thickness; // −6,8

  // ziemia: jaśniejszy plac przy wieży, dalej cieplejsza ziemia ginąca we mgle
  const groundMat = own(
    patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.ground, roughness: 1, metalness: 0 }), {
      key: "ground",
      shared,
      fragmentSurface: /* glsl */ `
        {
          float d = length(vAaWorld.xz);
          diffuseColor.rgb *= mix(1.04, 0.86, smoothstep(45.0, 220.0, d));
        }`,
    }),
  );
  const ground = new Mesh(own(new RingGeometry(pitR, 2600, 128, 4).rotateX(-Math.PI / 2)), groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  const earthMat = own(
    patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.earth, roughness: 1 }), {
      key: "earth",
      shared,
      fragmentSurface: /* glsl */ `
        diffuseColor.rgb *= 0.9 + 0.1 * sin(vAaWorld.y * 2.3 + sin(atan(vAaWorld.z, vAaWorld.x) * 9.0) * 0.6);
      `,
    }),
  );
  earthMat.side = BackSide;
  const pitWall = new Mesh(own(new CylinderGeometry(pitR, pitR, 1, 128, 1, true).translate(0, -0.5, 0)), earthMat);
  pitWall.receiveShadow = true;
  group.add(pitWall);

  const pitFloorMat = own(
    patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.earthDeep, roughness: 1 }), { key: "pit-floor", shared }),
  );
  const pitFloor = new Mesh(own(new CircleGeometry(pitR, 96).rotateX(-Math.PI / 2)), pitFloorMat);
  pitFloor.receiveShadow = true;
  group.add(pitFloor);

  // zasypka: pierścień od krawędzi parteru do ściany wykopu, podnosi się do poziomu placu
  const backfillMesh = new Mesh(own(new RingGeometry(slabRadius(0) - 0.02, pitR + 0.02, 96, 1).rotateX(-Math.PI / 2)), groundMat);
  backfillMesh.receiveShadow = true;
  group.add(backfillMesh);

  // pale: 64 głowice w trzech pierścieniach, wystają 0,6 m nad dno wykopu
  const pileFront: IUniform<number> = { value: 0 };
  const pileOpts = { key: "piles", shared, reveal: { mode: "grow" as const, front: pileFront, span: 0.15 } };
  const pileMat = own(patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.concrete, roughness: 0.9 }), pileOpts));
  const pileGeo = own(new CylinderGeometry(TOWER.foundation.pileDiameter / 2, TOWER.foundation.pileDiameter / 2, 1, 16).translate(0, 0.5, 0));
  const rings = [
    [12, 6.5],
    [20, 11.5],
    [32, 17],
  ] as const;
  const piles = new InstancedMesh(pileGeo, pileMat, TOWER.foundation.piles);
  {
    let i = 0;
    const ord = new Float32Array(TOWER.foundation.piles);
    for (const [n, r] of rings) {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r;
        piles.setMatrixAt(i, new Matrix4().makeTranslation(Math.sin(a) * r, bottom, Math.cos(a) * r).multiply(new Matrix4().makeScale(1, 0.6, 1)));
        ord[i] = (i / TOWER.foundation.piles) * 0.85;
        i++;
      }
    }
    pileGeo.setAttribute("aOrder", new InstancedBufferAttribute(ord, 1));
  }
  piles.castShadow = true;
  piles.receiveShadow = true;
  piles.customDepthMaterial = own(depthMaterialFor(pileOpts));
  group.add(piles);

  // zbrojenie: dwie siatki prętów w płycie + pręty startowe rdzenia i słupów
  const rebarFront: IUniform<number> = { value: 0 };
  const rebarOpts = { key: "rebar", shared, reveal: { mode: "grow" as const, front: rebarFront, span: 0.12 } };
  const rebarMat = own(patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.rebar, roughness: 0.55, metalness: 0.45 }), rebarOpts));
  const rebarGeo = own(new CylinderGeometry(0.06, 0.06, 1, 6, 1, true).translate(0, 0.5, 0));
  const bars: { m: Matrix4; o: number }[] = [];
  {
    const R = TOWER.foundation.radius - 0.4;
    const spacing = 1.1;
    const q = new Quaternion();
    const toX = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(1, 0, 0));
    const toZ = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, 1));
    const mats = [bottom + 0.35, bottom + TOWER.foundation.thickness - 0.3];
    mats.forEach((y, mi) => {
      for (const dir of [0, 1] as const) {
        for (let v = -R + spacing / 2; v < R; v += spacing) {
          const half = Math.sqrt(Math.max(0, R * R - v * v));
          if (half < 0.5) continue;
          const start = dir === 0 ? new Vector3(-half, y + dir * 0.13, v) : new Vector3(v, y + dir * 0.13, -half);
          q.copy(dir === 0 ? toX : toZ);
          const m = new Matrix4().compose(start, q, new Vector3(1, half * 2, 1));
          const f = (v + R) / (2 * R);
          bars.push({ m, o: mi * 0.4 + dir * 0.18 + f * 0.2 });
        }
      }
    });
    // pręty startowe
    const starter = (x: number, z: number, o: number) =>
      bars.push({ m: new Matrix4().compose(new Vector3(x, bottom + 0.3, z), q.identity(), new Vector3(1.4, FOUNDATION_TOP - bottom + 1.5, 1.4)), o });
    for (const r of [TOWER.core.outerRadius - 0.15, TOWER.core.outerRadius - TOWER.core.wall + 0.15]) {
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        starter(Math.sin(a) * r, Math.cos(a) * r, 0.78 + (k / 40) * 0.08);
      }
    }
    for (let j = 0; j < TOWER.columns.count; j++) {
      const a = (j * 6 + 3) * ((Math.PI * 2) / 96);
      const r = columnRadius(0);
      for (const [dx, dz] of [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]] as const) {
        starter(Math.sin(a) * r + dx, Math.cos(a) * r + dz, 0.8 + (j / 16) * 0.05);
      }
    }
  }
  const rebar = new InstancedMesh(rebarGeo, rebarMat, bars.length);
  {
    const ord = new Float32Array(bars.length);
    bars.forEach((b, i) => {
      rebar.setMatrixAt(i, b.m);
      ord[i] = b.o;
    });
    rebarGeo.setAttribute("aOrder", new InstancedBufferAttribute(ord, 1));
  }
  rebar.castShadow = true;
  rebar.customDepthMaterial = own(depthMaterialFor(rebarOpts));
  group.add(rebar);

  // płyta fundamentowa: betonowanie od dna w górę, świeży beton ciemnieje i jaśnieje przy wiązaniu
  const slabMat = own(patchMaterial(new MeshStandardMaterial({ color: SITE_PALETTE.concreteWet, roughness: 0.7 }), { key: "foundation", shared }));
  const foundation = new Mesh(
    own(new CylinderGeometry(TOWER.foundation.radius, TOWER.foundation.radius, TOWER.foundation.thickness, 128).translate(0, TOWER.foundation.thickness / 2, 0)),
    slabMat,
  );
  foundation.position.y = bottom;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  group.add(foundation);
  const wet = new Color(SITE_PALETTE.concreteWet);
  const dry = new Color(SITE_PALETTE.concrete);

  // cień kontaktowy: miękkie przyciemnienie gruntu przy podstawie wieży
  const contactMat = own(
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uOpacity;
        void main(){
          float r = length(vUv);
          float a = (1.0 - smoothstep(0.36, 1.0, r)) * uOpacity;
          gl_FragColor = vec4(0.08, 0.07, 0.09, a);
        }`,
    }),
  );
  const contact = new Mesh(own(new PlaneGeometry(64, 64).rotateX(-Math.PI / 2)), contactMat);
  contact.position.y = 0.05;
  contact.renderOrder = 1;
  group.add(contact);

  return {
    group,
    update(s) {
      const depth = s.pitDepth;
      const fillY = -pitD + (pitD + 0.0) * s.backfill;
      // przed wykopem dno leży tuż pod placem i zamyka otwór w ziemi
      pitFloor.position.y = -Math.max(0.004, depth);
      pitFloor.visible = s.backfill < 1;
      // ściana wykopu od poziomu zasypki do placu
      const wallBottom = s.backfill > 0 ? Math.max(-depth, fillY) : -depth;
      pitWall.visible = -wallBottom > 0.02;
      pitWall.scale.y = Math.max(0.001, -wallBottom);
      backfillMesh.visible = s.backfill > 0;
      backfillMesh.position.y = Math.min(-0.01, fillY);

      pileFront.value = s.piles * 1.0;
      piles.visible = s.piles > 0 && s.pour < 1;
      rebarFront.value = s.rebar * 1.12;
      rebar.visible = s.rebar > 0 && s.backfill < 1;

      foundation.visible = s.pour > 0.002;
      foundation.scale.y = Math.max(0.001, s.pour);
      slabMat.color.copy(wet).lerp(dry, Math.min(1, Math.max(0, (s.pour - 0.6) / 0.4)));

      contactMat.uniforms.uOpacity!.value = 0.32 * s.presence * (1 - 0.5 * s.night);
      contact.visible = s.presence > 0.01;
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
