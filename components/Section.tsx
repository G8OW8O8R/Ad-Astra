import type { ReactNode } from "react";
import type { SectionId } from "@/content/sections";

interface Props {
  id: SectionId;
  title: string;
  children?: ReactNode;
}

/**
 * Kontener sekcji. Nagłówek jest zawsze w HTML (SEO, czytniki ekranu);
 * na tym etapie ukryty wizualnie — sekcje są pustymi kontenerami.
 */
export function Section({ id, title, children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="min-h-svh scroll-mt-20">
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      {children}
    </section>
  );
}
