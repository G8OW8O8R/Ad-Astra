/**
 * Silnik sceny: renderer, światło, niebo, wieża, plac budowy, dźwig, kamera, postprodukcja
 * i jedna pętla requestAnimationFrame (pauza poza ekranem i przy ukrytej karcie).
 * Ładowany dynamicznie z lib/scene/index.ts — three.js nie trafia do paczki strony, póki
 * scena nie jest potrzebna.
 */
import {
  Color,
  DirectionalLight,
  NoToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CAMERA_PRESETS, easeInOutCubic, isCameraPreset, transitionDuration, type CameraPose } from "./cameras";
import { CRANE_ANGLE, CRANE_DISTANCE, createCrane } from "./crane";
import { createPost } from "./post";
import type { SharedUniforms } from "./shader-patch";
import { createSite } from "./site";
import { createSky } from "./sky";
import { sampleTimeOfDay, type TimeOfDayState } from "./time-of-day";
import {
  backfill,
  coreTop,
  craneGone,
  craneTop,
  front,
  phase,
  pitDepth,
  smoothstep,
  structureTop,
} from "./timeline";
import { createTower } from "./tower";
import { FOUNDATION_TOP } from "./tower-config";
import type { CameraTarget, EngineOptions, SceneEngine, SceneStats } from "./index";

const DAMPING = 7; // 1/s — wygładzanie postępu i pory dnia (suwak/przewijanie nie szarpie)

export function createEngine(canvas: HTMLCanvasElement, options: EngineOptions): SceneEngine {
  const quality = options.quality;
  const high = quality === "high";
  let pixelRatio = options.pixelRatio;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.info.autoReset = false;
  renderer.setPixelRatio(pixelRatio);
  const size = () => ({ w: Math.max(1, canvas.clientWidth), h: Math.max(1, canvas.clientHeight) });
  let { w, h } = size();
  renderer.setSize(w, h, false);

  const scene = new Scene();
  scene.background = new Color("#000000");
  const camera = new PerspectiveCamera(50, w / h, 0.5, 6000);

  const shared: SharedUniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new Color() },
    uFogSunColor: { value: new Color() },
    uFogDensity: { value: 0.0016 },
    uFogFalloff: { value: 120 },
    uSunDir: { value: new Vector3(0, 1, 0) },
  };

  // --- światło --------------------------------------------------------------------------------
  const sun = new DirectionalLight(0xffffff, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(high ? 4096 : 2048, high ? 4096 : 2048);
  sun.shadow.radius = high ? 3.2 : 2.2;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.04;
  const sunTarget = new Vector3(0, 80, 0);
  sun.target.position.copy(sunTarget);
  scene.add(sun, sun.target);

  // --- świat ----------------------------------------------------------------------------------
  const sky = createSky(high ? 256 : 128);
  scene.add(sky.mesh);
  const site = createSite(shared);
  scene.add(site.group);
  const tower = createTower(shared, quality);
  scene.add(tower.group);
  const crane = createCrane(shared);
  scene.add(crane.group);

  const post = createPost(renderer, scene, camera, {
    width: w,
    height: h,
    pixelRatio,
    msaa: high ? 4 : 0,
    fxaa: !high,
    bloomScale: 0.5,
  });

  // --- kamera ---------------------------------------------------------------------------------
  const camPos = new Vector3();
  const camTarget = new Vector3();
  let camFov = 50;
  const from = { pos: new Vector3(), target: new Vector3(), fov: 50 };
  const to = { pos: new Vector3(), target: new Vector3(), fov: 50 };
  let transition = { t: 1, duration: 1 };
  const resolvePose = (c: CameraTarget): CameraPose => (isCameraPreset(c) ? CAMERA_PRESETS[c] : c);
  const setPose = (pose: CameraPose) => {
    camPos.set(...pose.pos);
    camTarget.set(...pose.target);
    camFov = pose.fov ?? camFov;
  };
  setPose(CAMERA_PRESETS.ulica);

  let controls: OrbitControls | null = null;

  // --- stan -----------------------------------------------------------------------------------
  let progress = options.progress;
  let progressTarget = options.progress;
  let tod = options.timeOfDay;
  let todTarget = options.timeOfDay;
  let todState: TimeOfDayState = sampleTimeOfDay(tod);
  let envTod = Number.NaN;
  let framesSinceEnv = 99;
  let time = 0;

  const applyTimeOfDay = (s: TimeOfDayState) => {
    sky.update(s, time);
    sun.color.setRGB(...s.lightColor);
    sun.intensity = s.lightIntensity;
    const dir = new Vector3(...s.lightDirection);
    // cienie liczone dla światła min. 4° nad horyzontem (słońce pod horyzontem i tak ma natężenie ≈ 0)
    if (dir.y < 0.07) {
      dir.y = 0.07;
      dir.normalize();
    }
    sun.position.copy(sunTarget).addScaledVector(dir, 600);
    shared.uSunDir.value.set(...s.lightDirection);
    // mgła = kolor pasa horyzontu nieba (bez szwu z tłem)
    shared.uFogColor.value.setRGB(...s.fog);
    shared.uFogSunColor.value.setRGB(...s.sunGlow).lerp(shared.uFogColor.value, 0.35);
    shared.uFogDensity.value = s.fogDensity;
    scene.environmentIntensity = s.envIntensity;
    post.grade.uniforms.uExposure!.value = s.exposure;
    post.grade.uniforms.uNight!.value = s.skyStars;
  };

  const fitShadowCamera = () => {
    // ortograficzna kamera cienia dopasowana do wieży i dźwigu w układzie światła
    const cam = sun.shadow.camera;
    sun.updateMatrixWorld();
    sun.target.updateMatrixWorld();
    cam.position.copy(sun.position);
    cam.lookAt(sun.target.position);
    cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const p = new Vector3();
    const cx = Math.sin(CRANE_ANGLE) * CRANE_DISTANCE;
    const cz = Math.cos(CRANE_ANGLE) * CRANE_DISTANCE;
    const xs = [-30, 30, cx - 4, cx + 4];
    const zs = [-30, 30, cz - 4, cz + 4];
    for (const x of xs) for (const z of zs) for (const y of [-8, 192]) {
      p.set(x, y, z).applyMatrix4(inv);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    cam.left = minX - 2;
    cam.right = maxX + 2;
    cam.bottom = minY - 2;
    cam.top = maxY + 2;
    cam.near = 1;
    cam.far = 2400;
    cam.updateProjectionMatrix();
  };

  const updateBuild = (p: number, s: TimeOfDayState) => {
    const f = tower.fronts;
    f.structure.value = front(p, "structure");
    f.facade.value = front(p, "facade");
    f.terraces.value = front(p, "terraces");
    f.crown.value = phase(p, "crown") * 1.0;
    f.coreTop.value = coreTop(p);
    const formOff = phase(p, "formworkOff");
    f.formworkDissolve.value = smoothstep(0, 1, formOff);
    f.windows.value = s.windows;
    f.crownGlow.value = s.crown;

    const starOn = smoothstep(0, 1, phase(p, "star"));
    tower.update({
      formworkY: coreTop(p) - 3.1 + formOff * 3,
      formworkVisible: phase(p, "core") > 0.002 && formOff < 1,
      spire: smoothstep(0, 1, phase(p, "spire")),
      star: starOn * (0.3 + s.star * 0.9),
      starNight: s.star,
      crown: phase(p, "crown"),
      crownGlow: s.crown * starOn,
      canopyLights: s.windows,
      time,
    });

    const sTop = structureTop(p);
    site.update({
      pitDepth: pitDepth(p),
      piles: phase(p, "piles"),
      rebar: phase(p, "rebar"),
      pour: smoothstep(0, 1, phase(p, "pour")),
      backfill: backfill(p),
      presence: smoothstep(FOUNDATION_TOP, 40, sTop),
      night: s.skyStars,
    });

    crane.update({ top: craneTop(p), gone: craneGone(p), time, structureTop: Math.max(sTop, 0), night: s.windows });
  };

  // --- pętla ----------------------------------------------------------------------------------
  let raf = 0;
  let running = false;
  let visible = true;
  let pageVisible = typeof document === "undefined" || document.visibilityState !== "hidden";
  let last = 0;
  const stats: SceneStats = { fps: 0, frameMs: 0, drawCalls: 0, triangles: 0, sceneDrawCalls: 0, sceneTriangles: 0, pixelRatio, quality };
  let fpsFrames = 0;
  let fpsTime = 0;
  let firstFrame = true;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    shared.uTime.value = time;

    const k = firstFrame ? 1 : 1 - Math.exp(-DAMPING * dt);
    progress += (progressTarget - progress) * k;
    if (Math.abs(progressTarget - progress) < 1e-5) progress = progressTarget;
    tod += (todTarget - tod) * k;
    if (Math.abs(todTarget - tod) < 1e-5) tod = todTarget;
    todState = sampleTimeOfDay(tod);
    applyTimeOfDay(todState);

    // mapa środowiska: przeliczana tylko po zmianie pory dnia, nie częściej niż co 4 klatki
    framesSinceEnv++;
    if (Number.isNaN(envTod) || (Math.abs(tod - envTod) > 0.003 && framesSinceEnv >= 4)) {
      scene.environment = sky.renderEnvironment(renderer).texture;
      envTod = tod;
      framesSinceEnv = 0;
    }

    updateBuild(progress, todState);

    // kamera
    if (transition.t < 1) {
      transition.t = Math.min(1, transition.t + dt / transition.duration);
      const e = easeInOutCubic(transition.t);
      camPos.lerpVectors(from.pos, to.pos, e);
      camTarget.lerpVectors(from.target, to.target, e);
      camFov = from.fov + (to.fov - from.fov) * e;
      if (controls) controls.target.copy(camTarget);
    } else if (controls) {
      controls.update(dt);
      camPos.copy(camera.position);
      camTarget.copy(controls.target);
    }
    if (!controls || transition.t < 1) {
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
    }
    if (camera.fov !== camFov) {
      camera.fov = camFov;
      camera.updateProjectionMatrix();
    }
    sky.mesh.position.copy(camera.position);
    fitShadowCamera();

    renderer.info.reset();
    post.render(dt);
    firstFrame = false;

    // statystyki
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      stats.fps = fpsFrames / fpsTime;
      stats.frameMs = (fpsTime / fpsFrames) * 1000;
      fpsFrames = 0;
      fpsTime = 0;
    }
    stats.drawCalls = renderer.info.render.calls;
    stats.triangles = renderer.info.render.triangles;
    stats.sceneDrawCalls = post.snapshot.calls;
    stats.sceneTriangles = post.snapshot.triangles;
  };

  const syncLoop = () => {
    const shouldRun = visible && pageVisible;
    if (shouldRun && !running) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const onVisibility = () => {
    pageVisible = document.visibilityState !== "hidden";
    syncLoop();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible = e.isIntersecting;
      syncLoop();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const resize = () => {
    ({ w, h } = size());
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post.setSize(w, h, pixelRatio);
  };
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  syncLoop();

  return {
    setProgress(p) {
      progressTarget = p;
    },
    setTimeOfDay(t) {
      todTarget = t;
    },
    setCamera(target, opts) {
      const pose = resolvePose(target);
      if (opts?.immediate) {
        setPose(pose);
        transition = { t: 1, duration: 1 };
        if (controls) {
          camera.position.copy(camPos);
          controls.target.copy(camTarget);
        }
        return;
      }
      from.pos.copy(controls ? camera.position : camPos);
      from.target.copy(controls ? controls.target : camTarget);
      from.fov = camFov;
      to.pos.set(...pose.pos);
      to.target.set(...pose.target);
      to.fov = pose.fov ?? camFov;
      const current: CameraPose = {
        pos: [from.pos.x, from.pos.y, from.pos.z],
        target: [from.target.x, from.target.y, from.target.z],
      };
      transition = { t: 0, duration: opts?.duration ?? transitionDuration(current, pose) };
    },
    setOrbit(enabled) {
      if (enabled && !controls) {
        controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 8;
        controls.maxDistance = 900;
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.target.copy(camTarget);
        camera.position.copy(camPos);
        controls.update();
      } else if (!enabled && controls) {
        controls.dispose();
        controls = null;
      }
    },
    setPixelRatio(value) {
      pixelRatio = value;
      stats.pixelRatio = value;
      resize();
    },
    resize,
    getStats() {
      return { ...stats };
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      io.disconnect();
      ro.disconnect();
      controls?.dispose();
      post.dispose();
      tower.dispose();
      site.dispose();
      crane.dispose();
      sky.dispose();
      sun.shadow.map?.dispose();
      scene.environment = null;
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
    },
  };
}
