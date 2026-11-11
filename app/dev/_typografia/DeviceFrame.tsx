"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  width: number;
  height: number;
  label: string;
  children: ReactNode;
}

/**
 * Podgląd „urządzenia”: treść renderowana w pudełku o stałym rozmiarze
 * (np. 1440×900 albo 390×844) i skalowana CSS transform do dostępnego miejsca.
 * Układ wewnątrz reaguje na szerokość pudełka (container queries), nie okna.
 */
export function DeviceFrame({ width, height, label, children }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.min(1, entry.contentRect.width / width));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  return (
    <figure ref={boxRef} className="w-full" style={{ maxWidth: width }}>
      <div
        className="relative overflow-hidden rounded-lg ring-1 ring-white/15"
        style={{ height: height * scale }}
      >
        <div
          className="@container absolute top-0 left-0 origin-top-left overflow-hidden"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-white/50">
        {label} · {width} × {height} px
        {scale < 1 ? ` · skala ${Math.round(scale * 100)}%` : ""}
      </figcaption>
    </figure>
  );
}
