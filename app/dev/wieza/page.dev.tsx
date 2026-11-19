import type { Metadata } from "next";
import { TowerViewer } from "../_wieza/TowerViewer";
import "../../globals.css";
import "../_wieza/wieza.css";

export const metadata: Metadata = {
  title: "Wieża — silnik sceny",
  robots: { index: false, follow: false, nocache: true },
};

/** Strona robocza silnika sceny 3D (tylko `next dev`): postęp budowy, pora dnia, presety kamery. */
export default function TowerPage() {
  return (
    <main className="wieza">
      <h1 className="wieza-sr">Ad Astra — podgląd silnika sceny 3D</h1>
      <TowerViewer />
    </main>
  );
}
