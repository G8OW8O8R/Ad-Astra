import Link from "next/link";
import { AdAstraStar } from "@/components/brand/AdAstraLogo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <AdAstraStar className="h-10 w-10 text-gold" />
      <p className="label figures text-ink-soft">404</p>
      <h1 className="font-serif text-4xl">
        <span lang="pl">Nie ma takiej strony</span>
        <span className="mx-3 text-gold" aria-hidden="true">
          ·
        </span>
        <span lang="en">Page not found</span>
      </h1>
      <p className="label flex gap-6">
        <Link href="/pl" hrefLang="pl" className="underline decoration-gold underline-offset-4">
          Ad Astra (PL)
        </Link>
        <Link href="/en" hrefLang="en" className="underline decoration-gold underline-offset-4">
          Ad Astra (EN)
        </Link>
      </p>
    </main>
  );
}
