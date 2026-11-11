import type { Metadata } from "next";
import { Comparison } from "../_typografia/Comparison";
import { fontSets } from "../_typografia/fonts";
import { SetPreview } from "../_typografia/SetPreview";
import "../_typografia/typografia.css";

export const metadata: Metadata = {
  title: "Typografia — porównanie zestawów",
  robots: { index: false, follow: false, nocache: true },
};

export default function TypographyPage() {
  return (
    <Comparison
      sets={fontSets.map(({ id, heading, ui }) => ({ id, heading, ui }))}
      previews={Object.fromEntries(fontSets.map((set) => [set.id, <SetPreview key={set.id} set={set} />]))}
    />
  );
}
