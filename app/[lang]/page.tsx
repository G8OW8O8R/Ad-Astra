import { notFound } from "next/navigation";
import { Section } from "@/components/Section";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { sectionIds } from "@/content/sections";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        {dict.common.skipToContent}
      </a>
      <SiteHeader locale={lang} dict={dict} />
      <main id="main" tabIndex={-1}>
        <h1 className="sr-only">{dict.meta.title}</h1>
        {sectionIds.map((id) => (
          <Section key={id} id={id} title={dict.sections[id].title} />
        ))}
      </main>
      <SiteFooter dict={dict.footer} />
    </>
  );
}
