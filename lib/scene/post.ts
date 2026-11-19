/**
 * Jedna postprodukcja na całej klatce: render HDR (half float, MSAA) → bloom tylko dla świateł
 * (próg powyżej najjaśniejszej oświetlonej powierzchni) → tonemapping, korekcja kolorów
 * (ciepłe światła, chłodne cienie), winieta, ziarno → (FXAA na niskiej jakości).
 */
import { HalfFloatType, ShaderMaterial, Vector2, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";

const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1 },
    uTime: { value: 0 },
    uGrain: { value: 0.035 },
    uVignette: { value: 0.28 },
    uNight: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uExposure;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uNight;
    uniform vec2 uResolution;
    varying vec2 vUv;

    const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

    // ACES (dopasowanie Hilla) — miękkie ramię, bez wypalania świateł
    vec3 RRTAndODTFit(vec3 v) {
      vec3 a = v * (v + 0.0245786) - 0.000090537;
      vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
      return a / b;
    }
    vec3 aces(vec3 c) {
      const mat3 inM = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
      const mat3 outM = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
      return clamp(outM * RRTAndODTFit(inM * c), 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb * uExposure;
      // korekcja: chłodne cienie, ciepłe światła (w liniowym HDR, przed tonemappingiem)
      float l = dot(c, LUMA);
      float w = smoothstep(0.02, 0.9, l);
      vec3 shadowTint = mix(vec3(0.94, 0.99, 1.08), vec3(0.9, 0.95, 1.12), uNight);
      vec3 lightTint = vec3(1.05, 1.0, 0.93);
      c *= mix(shadowTint, lightTint, w);
      c = aces(c * 1.08);
      // delikatne nasycenie i podniesiona czerń (miękkość filmu animowanego)
      float l2 = dot(c, LUMA);
      c = mix(vec3(l2), c, 1.07);
      c = c * 0.975 + 0.012;
      c = toSRGB(c);
      // winieta
      vec2 q = vUv - 0.5;
      q.x *= uResolution.x / uResolution.y;
      float v = smoothstep(0.95, 0.22, length(q) * 0.9);
      c *= mix(1.0 - uVignette, 1.0, v);
      // ziarno — mocniejsze w ciemnych partiach
      float n = hash(vUv * uResolution + fract(uTime * 7.31) * 517.0) - 0.5;
      n += hash(vUv * uResolution * 0.5 + fract(uTime * 3.7) * 211.0) - 0.5;
      c += n * uGrain * (1.0 - 0.6 * dot(c, LUMA));
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/** Pass zapisujący liczniki renderera po samym renderze sceny (diagnostyka). */
class SnapshotPass extends Pass {
  calls = 0;
  triangles = 0;
  constructor() {
    super();
    this.needsSwap = false;
  }
  override render(renderer: WebGLRenderer) {
    this.calls = renderer.info.render.calls;
    this.triangles = renderer.info.render.triangles;
  }
}

export interface PostOptions {
  width: number;
  height: number;
  pixelRatio: number;
  msaa: number;
  fxaa: boolean;
  bloomScale: number;
}

export interface Post {
  composer: EffectComposer;
  grade: ShaderMaterial;
  bloom: UnrealBloomPass;
  snapshot: SnapshotPass;
  setSize(width: number, height: number, pixelRatio: number): void;
  render(dt: number): void;
  dispose(): void;
}

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: Camera, o: PostOptions): Post {
  const target = new WebGLRenderTarget(o.width * o.pixelRatio, o.height * o.pixelRatio, {
    type: HalfFloatType,
    samples: o.msaa,
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(o.pixelRatio);
  composer.setSize(o.width, o.height);

  composer.addPass(new RenderPass(scene, camera));
  const snapshot = new SnapshotPass();
  composer.addPass(snapshot);

  const bloom = new UnrealBloomPass(new Vector2(o.width * o.bloomScale, o.height * o.bloomScale), 0.55, 0.62, 1.6);
  composer.addPass(bloom);

  const gradePass = new ShaderPass(GRADE);
  composer.addPass(gradePass);
  const grade = gradePass.material as ShaderMaterial;

  let fxaa: ShaderPass | null = null;
  if (o.fxaa) {
    fxaa = new ShaderPass(FXAAShader);
    composer.addPass(fxaa);
  }

  const setSize = (width: number, height: number, pixelRatio: number) => {
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    bloom.setSize(width * o.bloomScale * pixelRatio, height * o.bloomScale * pixelRatio);
    (grade.uniforms.uResolution!.value as Vector2).set(width * pixelRatio, height * pixelRatio);
    if (fxaa) {
      (fxaa.material.uniforms.resolution!.value as Vector2).set(1 / (width * pixelRatio), 1 / (height * pixelRatio));
    }
  };
  setSize(o.width, o.height, o.pixelRatio);

  let time = 0;
  return {
    composer,
    grade,
    bloom,
    snapshot,
    setSize,
    render(dt) {
      time += dt;
      grade.uniforms.uTime!.value = time;
      composer.render(dt);
    },
    dispose() {
      composer.dispose();
      bloom.dispose();
      gradePass.dispose();
      fxaa?.dispose();
      target.dispose();
    },
  };
}
