/**
 * Niebo: kopuła z gradientem (zenit → pas środkowy → horyzont, ziemia poniżej), tarcza i poświata
 * słońca, gwiazdy nocą. Ta sama funkcja nieba (bez gwiazd, ze słabszą tarczą) renderowana do
 * mapy środowiska PMREM — szkło i metal odbijają dokładnie to niebo, które widać w tle.
 */
import {
  BackSide,
  Color,
  Mesh,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from "three";
import type { TimeOfDayState } from "./time-of-day";

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // zawsze na dalekiej płaszczyźnie
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uFog;
uniform vec3 uSunDir;
uniform vec3 uSunGlow;
uniform float uSunDisc;
uniform float uStars;
uniform float uEnv;
uniform float uTime;
varying vec3 vDir;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col;
  if (h >= 0.0) {
    float t = pow(h, 0.5);
    col = mix(uHorizon, uMid, smoothstep(0.0, 0.42, t));
    col = mix(col, uZenith, smoothstep(0.32, 1.0, t));
  } else {
    col = mix(uHorizon, uGround, smoothstep(0.0, 0.1, -h));
  }
  // pas mgiełki przy horyzoncie — ten sam kolor co mgła na ziemi, bez szwu
  col = mix(col, uFog, exp(-abs(h) * 22.0) * 0.85);

  float sd = max(dot(d, uSunDir), 0.0);
  float above = smoothstep(-0.12, 0.02, uSunDir.y);
  col += uSunGlow * (pow(sd, 5.0) * 0.32 + pow(sd, 40.0) * 0.5) * above;
  float disc = smoothstep(0.99955, 0.99975, sd) * uSunDisc * smoothstep(-0.02, 0.01, h);
  col += uSunGlow * disc * mix(30.0, 3.0, uEnv);

  if (uStars > 0.0 && uEnv < 0.5 && h > 0.0) {
    vec3 cell = floor(d * 260.0);
    float r = hash3(cell);
    if (r > 0.9965) {
      vec3 c = (cell + 0.5) / 260.0;
      float f = smoothstep(0.0018, 0.0, length(d - normalize(c)));
      float tw = 0.65 + 0.35 * sin(uTime * (1.5 + r * 3.0) + r * 40.0);
      col += vec3(0.95, 0.92, 1.0) * f * tw * uStars * smoothstep(0.02, 0.25, h) * 2.2;
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Sky {
  mesh: Mesh;
  update(state: TimeOfDayState, time: number): void;
  /** Przelicza mapę środowiska; zwraca nową teksturę (poprzednia jest zwalniana). */
  renderEnvironment(renderer: WebGLRenderer): WebGLRenderTarget;
  dispose(): void;
}

function skyMaterial(env: boolean): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: BackSide,
    depthWrite: false,
    depthTest: !env,
    uniforms: {
      uZenith: { value: new Color() },
      uMid: { value: new Color() },
      uHorizon: { value: new Color() },
      uGround: { value: new Color() },
      uFog: { value: new Color() },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uSunGlow: { value: new Color() },
      uSunDisc: { value: 1 },
      uStars: { value: 0 },
      uEnv: { value: env ? 1 : 0 },
      uTime: { value: 0 },
    },
  });
}

export function createSky(envSize: number): Sky {
  const geometry = new SphereGeometry(1, 48, 24);
  const material = skyMaterial(false);
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.scale.setScalar(4000);

  const envMaterial = skyMaterial(true);
  const envScene = new Scene();
  const envMesh = new Mesh(geometry, envMaterial);
  envMesh.scale.setScalar(50);
  envScene.add(envMesh);

  let pmrem: PMREMGenerator | null = null;
  let target: WebGLRenderTarget | null = null;

  const apply = (m: ShaderMaterial, s: TimeOfDayState, time: number) => {
    const u = m.uniforms as Record<string, { value: unknown }>;
    (u.uZenith!.value as Color).setRGB(...s.zenith);
    (u.uMid!.value as Color).setRGB(...s.mid);
    (u.uHorizon!.value as Color).setRGB(...s.horizon);
    (u.uGround!.value as Color).setRGB(...s.ground);
    (u.uFog!.value as Color).setRGB(...s.fog);
    (u.uSunGlow!.value as Color).setRGB(...s.sunGlow);
    (u.uSunDir!.value as Vector3).set(...s.lightDirection);
    u.uSunDisc!.value = s.sunDisc;
    u.uStars!.value = s.skyStars;
    u.uTime!.value = time;
  };

  return {
    mesh,
    update(state, time) {
      apply(material, state, time);
      apply(envMaterial, state, time);
    },
    renderEnvironment(renderer) {
      pmrem ??= new PMREMGenerator(renderer);
      const next = pmrem.fromScene(envScene, 0, 0.1, 100, { size: envSize });
      target?.dispose();
      target = next;
      return next;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      envMaterial.dispose();
      target?.dispose();
      pmrem?.dispose();
    },
  };
}
