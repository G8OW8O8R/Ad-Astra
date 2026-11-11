import { create } from "zustand";
import { clampProgress } from "@/lib/scene";

/**
 * Wspólny stan doświadczenia: postęp przewijania sceny i tryb wyświetlania.
 * `mode` = "static" → wersja bez WebGL / reduced motion (lista etapów z kadrami).
 */
export type ExperienceMode = "pending" | "webgl" | "static";

interface ExperienceState {
  progress: number;
  mode: ExperienceMode;
  setProgress: (progress: number) => void;
  setMode: (mode: ExperienceMode) => void;
}

export const useExperience = create<ExperienceState>()((set) => ({
  progress: 0,
  mode: "pending",
  setProgress: (progress) => set({ progress: clampProgress(progress) }),
  setMode: (mode) => set({ mode }),
}));
