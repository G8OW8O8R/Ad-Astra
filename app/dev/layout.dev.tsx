import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/brand/fonts";

export const metadata: Metadata = {
  title: "Ad Astra — strony robocze",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Osobny root layout dla /dev/* (poza i18n). Trasy istnieją tylko w `next dev`.
 * Arkusze stylów importuje każda strona sama (marka = produkcyjne tokeny, typografia = własny).
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={`${fontVariables} antialiased`}>
      {/* suppressHydrationWarning: rozszerzenia przeglądarki dopisują atrybuty do <body> przed
          hydratacją (np. data-titans-quick-view-extension-id). Dotyczy tylko atrybutów tego
          jednego elementu, nie dzieci. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
