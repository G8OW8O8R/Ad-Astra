"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CAMERA_PRESET_IDS, createScene, type CameraPresetId, type SceneDevController, type SceneStats } from "@/lib/scene";
import { floorsBuilt } from "@/lib/scene/timeline";

const CAMERA_LABELS: Record<CameraPresetId, string> = {
  ulica: "Ulica",
  "pietro-5": "5. piętro",
  "pietro-20": "20. piętro",
  szczyt: "Szczyt",
  dron: "Dron z daleka",
};

const PHASE_LABELS: [number, string][] = [
  [0, "Wykop i płyta"],
  [0.1, "Rdzeń"],
  [0.14, "Rdzeń, stropy i słupy"],
  [0.45, "Szkło i lamele"],
  [0.65, "Tarasy i zieleń"],
  [0.85, "Korona i szpic"],
  [1, "Gotowe"],
];

function phaseLabel(p: number): string {
  let label = PHASE_LABELS[0]?.[1] ?? "";
  for (const [start, name] of PHASE_LABELS) if (p >= start) label = name;
  return label;
}

const fmt = new Intl.NumberFormat("pl-PL");

/** Podgląd silnika sceny: suwaki postępu i pory dnia, presety kamery, orbita, licznik fps. */
export function TowerViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneDevController | null>(null);
  const [progress, setProgress] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState(0.38);
  const [camera, setCamera] = useState<CameraPresetId | null>("ulica");
  const [orbit, setOrbit] = useState(false);
  const [stats, setStats] = useState<SceneStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createScene();
    sceneRef.current = scene;
    // strona robocza: dostęp z konsoli (window.__wieza.setProgress(0.4) itd.)
    (window as unknown as { __wieza?: SceneDevController }).__wieza = scene;
    scene.setProgress(1);
    scene.setTimeOfDay(0.38);
    scene.init(canvas, { quality: "auto" }).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
    const timer = window.setInterval(() => setStats(scene.getStats()), 500);
    return () => {
      window.clearInterval(timer);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const onProgress = (v: number) => {
    setProgress(v);
    sceneRef.current?.setProgress(v);
  };
  const onTime = (v: number) => {
    setTimeOfDay(v);
    sceneRef.current?.setTimeOfDay(v);
  };
  const onCamera = (id: CameraPresetId) => {
    setCamera(id);
    sceneRef.current?.setCamera(id);
  };
  const onOrbit = () => {
    const next = !orbit;
    setOrbit(next);
    sceneRef.current?.setOrbit(next);
    if (next) setCamera(null);
  };

  const floor = String(floorsBuilt(progress)).padStart(2, "0");

  return (
    <>
      <canvas ref={canvasRef} className="wieza-canvas" aria-label="Wieża Ad Astra — scena 3D" />
      {error ? <p className="wieza-error">WebGL niedostępny: {error}</p> : null}

      <dl className="wieza-stats" aria-live="off">
        <div>
          <dt>kl./s</dt>
          <dd className="wieza-fps">{stats ? Math.round(stats.fps) : "—"}</dd>
        </div>
        <div>
          <dt>Klatka</dt>
          <dd>{stats ? `${stats.frameMs.toFixed(1)} ms` : "—"}</dd>
        </div>
        <div>
          <dt>Draw calls</dt>
          <dd>{stats ? `${stats.sceneDrawCalls} / ${stats.drawCalls}` : "—"}</dd>
        </div>
        <div>
          <dt>Trójkąty</dt>
          <dd>{stats ? fmt.format(stats.sceneTriangles) : "—"}</dd>
        </div>
        <div>
          <dt>DPR · jakość</dt>
          <dd>{stats ? `${stats.pixelRatio.toFixed(2)} · ${stats.quality}` : "—"}</dd>
        </div>
      </dl>

      <div className="wieza-ui">
        <label className="wieza-field">
          <span className="wieza-field-head">
            <span className="wieza-label">Budowa — {phaseLabel(progress)}</span>
            <span className="wieza-value">
              {floor}
              <span className="wieza-label"> / 42</span>
            </span>
          </span>
          <input
            className="wieza-range"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            style={{ "--fill": `${progress * 100}%` } as CSSProperties}
            onChange={(e) => onProgress(Number(e.target.value))}
            aria-valuetext={`${Math.round(progress * 100)}%, piętro ${floor}`}
          />
        </label>
        <label className="wieza-field">
          <span className="wieza-field-head">
            <span className="wieza-label">Pora dnia</span>
            <span className="wieza-label">{timeOfDay < 0.3 ? "dzień" : timeOfDay < 0.5 ? "złota godzina" : timeOfDay < 0.8 ? "zmierzch" : "noc"}</span>
          </span>
          <input
            className="wieza-range"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={timeOfDay}
            style={{ "--fill": `${timeOfDay * 100}%` } as CSSProperties}
            onChange={(e) => onTime(Number(e.target.value))}
          />
        </label>
        <div className="wieza-field">
          <span className="wieza-label">Kamera</span>
          <ul className="wieza-cams">
            {CAMERA_PRESET_IDS.map((id) => (
              <li key={id}>
                <button type="button" className="wieza-link" aria-pressed={camera === id} onClick={() => onCamera(id)}>
                  {CAMERA_LABELS[id]}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="wieza-link" aria-pressed={orbit} onClick={onOrbit}>
                Orbita {orbit ? "wł." : "wył."}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
