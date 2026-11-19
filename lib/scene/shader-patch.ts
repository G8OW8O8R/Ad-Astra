/**
 * Łatki shaderów dla materiałów three.js (onBeforeCompile):
 * - odsłanianie elementów za czołem budowy (atrybut `aOrder` + mundur czoła), w kilku trybach,
 * - przycinanie wysokości (rdzeń, ściany wykopu),
 * - mgiełka atmosferyczna zależna od wysokości (całkowana wzdłuż promienia), z poświatą od słońca,
 * - rozpuszczanie (dither) — dźwig, szalunek; działa też w mapie cieni.
 * Ta sama łatka idzie do materiału głębi, więc cienie zgadzają się z tym, co widać.
 */
import { MeshDepthMaterial, RGBADepthPacking, type IUniform, type Material, type WebGLProgramParametersWithUniforms } from "three";

export type RevealMode = "grow" | "scale" | "radial";

export interface SharedUniforms {
  uTime: IUniform<number>;
  uFogColor: IUniform<import("three").Color>;
  uFogSunColor: IUniform<import("three").Color>;
  uFogDensity: IUniform<number>;
  uFogFalloff: IUniform<number>;
  uSunDir: IUniform<import("three").Vector3>;
}

export interface PatchOptions {
  /** Unikalny klucz programu (inne łatki = inne programy). */
  key: string;
  shared: SharedUniforms;
  fog?: boolean;
  reveal?: {
    mode: RevealMode;
    front: IUniform<number>;
    span: number;
    /** Geometria łączona: punkt odniesienia w atrybucie `aPivot` (inaczej 0,0,0 lokalnie). */
    pivot?: boolean;
  };
  /** Przycięcie lokalnego y do zakresu [min, max]. */
  clipY?: { min?: IUniform<number>; max?: IUniform<number> };
  dissolve?: IUniform<number>;
  /** Kołysanie zieleni (tylko instancje). */
  wind?: boolean;
  uniforms?: Record<string, IUniform>;
  vertexHead?: string;
  /** Po odsłonięciu, przed rzutowaniem (lokalne `transformed`). */
  vertexMain?: string;
  fragmentHead?: string;
  /** Po roughness/metalness: można zmieniać diffuseColor, roughnessFactor, metalnessFactor. */
  fragmentSurface?: string;
  /** Po emissivemap: można dodać do totalEmissiveRadiance (normal dostępne). */
  fragmentEmissive?: string;
  /** Po lights_fragment_maps: można podmienić `radiance` (odbicie otoczenia) — `iblIrradiance` dostępne. */
  fragmentRadiance?: string;
}

const HASH = /* glsl */ `
float aaHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

function vertexHead(o: PatchOptions): string {
  let s = "";
  if (o.reveal) {
    s += `attribute float aOrder;\nuniform float uRevealFront;\n`;
    if (o.reveal.pivot) s += `attribute vec3 aPivot;\n`;
  }
  if (o.clipY?.min) s += `uniform float uClipMin;\n`;
  if (o.clipY?.max) s += `uniform float uClipMax;\n`;
  if (o.wind) s += `uniform float uTime;\n`;
  if (o.fog !== false) s += `varying vec3 vAaWorld;\n`;
  return s + (o.vertexHead ?? "");
}

function vertexReveal(o: PatchOptions): string {
  let s = "";
  if (o.reveal) {
    const pivot = o.reveal.pivot ? "aPivot" : "vec3(0.0)";
    const span = o.reveal.span.toFixed(4);
    let apply = "";
    if (o.reveal.mode === "grow") apply = `transformed.y = rvPivot.y + (transformed.y - rvPivot.y) * rvE;`;
    if (o.reveal.mode === "scale") apply = `transformed = rvPivot + (transformed - rvPivot) * rvE;`;
    if (o.reveal.mode === "radial") apply = `transformed.xz = rvPivot.xz + (transformed.xz - rvPivot.xz) * rvE;`;
    s += `
    {
      float rvT = clamp((uRevealFront - aOrder) / ${span}, 0.0, 1.0);
      float rvE = 1.0 - pow(1.0 - rvT, 3.0);
      vec3 rvPivot = ${pivot};
      if (rvT <= 0.0) { transformed = rvPivot; } else { ${apply} }
    }`;
  }
  if (o.clipY?.min) s += `\ntransformed.y = max(transformed.y, uClipMin);`;
  if (o.clipY?.max) s += `\ntransformed.y = min(transformed.y, uClipMax);`;
  if (o.wind) {
    s += `
    #ifdef USE_INSTANCING
    {
      vec3 wp = instanceMatrix[3].xyz;
      float sway = sin(uTime * 1.1 + wp.x * 0.35 + wp.z * 0.27) + 0.5 * sin(uTime * 2.3 + wp.y * 0.6);
      transformed.x += sway * 0.035 * max(transformed.y, 0.0);
      transformed.z += sway * 0.02 * max(transformed.y, 0.0);
    }
    #endif`;
  }
  return s + (o.vertexMain ?? "");
}

const FOG_VERTEX = /* glsl */ `
{
  vec4 aaW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  aaW = instanceMatrix * aaW;
  #endif
  vAaWorld = (modelMatrix * aaW).xyz;
}
`;

const FOG_FRAGMENT_HEAD = /* glsl */ `
varying vec3 vAaWorld;
uniform vec3 uFogColor;
uniform vec3 uFogSunColor;
uniform float uFogDensity;
uniform float uFogFalloff;
uniform vec3 uSunDir;
`;

/** Mgiełka: gęstość maleje wykładniczo z wysokością; całka wzdłuż promienia od kamery. */
export const HEIGHT_FOG_GLSL = /* glsl */ `
{
  vec3 ray = vAaWorld - cameraPosition;
  float dist = length(ray);
  float h0 = max(cameraPosition.y, 0.0);
  float h1 = max(vAaWorld.y, 0.0);
  float dh = h1 - h0;
  float e0 = exp(-h0 / uFogFalloff);
  float integ = abs(dh) > 0.05 ? (e0 - exp(-h1 / uFogFalloff)) * uFogFalloff / dh : e0;
  float fogF = 1.0 - exp(-uFogDensity * dist * integ);
  float sunAmt = pow(max(dot(ray / max(dist, 1e-3), uSunDir), 0.0), 5.0);
  vec3 fogC = mix(uFogColor, uFogSunColor, sunAmt * 0.75);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogC, clamp(fogF, 0.0, 0.94));
}
`;

function bindUniforms(shader: WebGLProgramParametersWithUniforms, o: PatchOptions) {
  const u = shader.uniforms;
  if (o.reveal) u.uRevealFront = o.reveal.front;
  if (o.clipY?.min) u.uClipMin = o.clipY.min;
  if (o.clipY?.max) u.uClipMax = o.clipY.max;
  if (o.dissolve) u.uDissolve = o.dissolve;
  if (o.wind) u.uTime = o.shared.uTime;
  if (o.fog !== false) {
    u.uFogColor = o.shared.uFogColor;
    u.uFogSunColor = o.shared.uFogSunColor;
    u.uFogDensity = o.shared.uFogDensity;
    u.uFogFalloff = o.shared.uFogFalloff;
    u.uSunDir = o.shared.uSunDir;
  }
  if (o.uniforms) Object.assign(u, o.uniforms);
}

function dissolveHead(o: PatchOptions) {
  return o.dissolve ? `uniform float uDissolve;\n${HASH}` : "";
}
const DISSOLVE_MAIN = `if (uDissolve > 0.0 && aaHash(gl_FragCoord.xy + fract(uDissolve * 7.0) * 13.0) < uDissolve) discard;\n`;

/** Łata materiał (MeshStandard/Physical/Basic) — mutuje i zwraca ten sam obiekt. */
export function patchMaterial<T extends Material>(material: T, o: PatchOptions): T {
  const fog = o.fog !== false;
  material.onBeforeCompile = (shader) => {
    bindUniforms(shader, o);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexHead(o)}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${vertexReveal(o)}`)
      .replace("#include <project_vertex>", `#include <project_vertex>\n${fog ? FOG_VERTEX : ""}`);

    let fs = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>\n${fog ? FOG_FRAGMENT_HEAD : ""}${dissolveHead(o)}${o.fragmentHead ?? ""}`,
    );
    if (o.dissolve) fs = fs.replace("void main() {", `void main() {\n${DISSOLVE_MAIN}`);
    if (o.fragmentSurface) {
      fs = fs.replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n${o.fragmentSurface}`);
    }
    if (o.fragmentEmissive) {
      fs = fs.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${o.fragmentEmissive}`);
    }
    if (o.fragmentRadiance) {
      fs = fs.replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>\n${o.fragmentRadiance}`);
    }
    if (fog) fs = fs.replace("#include <fog_fragment>", HEIGHT_FOG_GLSL);
    shader.fragmentShader = fs;
  };
  material.customProgramCacheKey = () => o.key;
  return material;
}

/** Materiał głębi do cieni z tą samą geometrią odsłaniania/przycinania/rozpuszczania. */
export function depthMaterialFor(o: PatchOptions): MeshDepthMaterial {
  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  const d: PatchOptions = {
    ...o,
    key: `${o.key}:depth`,
    fog: false,
    fragmentSurface: undefined,
    fragmentEmissive: undefined,
    fragmentRadiance: undefined,
    fragmentHead: undefined,
  };
  depth.onBeforeCompile = (shader) => {
    bindUniforms(shader, d);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vertexHead(d)}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${vertexReveal(d)}`);
    if (d.dissolve) {
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${dissolveHead(d)}`)
        .replace("void main() {", `void main() {\n${DISSOLVE_MAIN}`);
    }
  };
  depth.customProgramCacheKey = () => d.key;
  return depth;
}

/** Potrzebuje własnego materiału głębi, gdy łatka zmienia kształt albo wycina piksele. */
export function needsDepthMaterial(o: PatchOptions): boolean {
  return Boolean(o.reveal || o.clipY || o.dissolve || o.wind);
}
