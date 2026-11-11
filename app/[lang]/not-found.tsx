import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-sm tracking-[0.3em] uppercase text-ink/60">404</p>
      <h1 className="font-display text-3xl">
        <span lang="pl">Nie ma takiej strony</span>
        <span className="mx-3 text-gold" aria-hidden="true">
          ·
        </span>
        <span lang="en">Page not found</span>
      </h1>
      <p className="flex gap-6 text-sm uppercase tracking-[0.2em]">
        <Link href="/pl" hrefLang="pl" className="underline underline-offset-4">
          Ad Astra (PL)
        </Link>
        <Link href="/en" hrefLang="en" className="underline underline-offset-4">
          Ad Astra (EN)
        </Link>
      </p>
    </main>
  );
}
