"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Płynne przewijanie (Lenis). Wyłączone przy prefers-reduced-motion —
 * wtedy zostaje natywne przewijanie przeglądarki.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const apply = () => {
      if (media.matches) {
        lenis?.destroy();
        lenis = null;
      } else if (!lenis) {
        lenis = new Lenis({ autoRaf: true, anchors: true });
      }
    };

    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      lenis?.destroy();
    };
  }, []);

  return null;
}
