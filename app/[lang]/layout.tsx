import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { SmoothScroll } from "@/components/SmoothScroll";
import { fontVariables } from "@/lib/brand/fonts";
import { colors } from "@/lib/brand/tokens";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n/config";
import { INDEXING_ENABLED, SITE_URL } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

async function currentLocale() {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    robots: INDEXING_ENABLED
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        "x-default": `/${defaultLocale}`,
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      siteName: "Ad Astra",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: colors.ivory,
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await currentLocale();

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-ivory font-sans text-ink">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
