import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./dev.css";

export const metadata: Metadata = {
  title: "Ad Astra — strony robocze",
  robots: { index: false, follow: false, nocache: true },
};

/** Osobny root layout dla /dev/* (poza i18n). Trasy istnieją tylko w `next dev`. */
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
