import { NextResponse, type NextRequest } from "next/server";
import { isDevToolPath, localeRedirectPath } from "@/lib/i18n/config";

/** Adresy bez prefiksu języka trafiają do wersji domyślnej (/pl). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Strony robocze /dev/* istnieją tylko w `next dev` (patrz next.config.ts).
  if (process.env.NODE_ENV !== "production" && isDevToolPath(pathname)) return;

  const target = localeRedirectPath(pathname);
  if (!target) return;

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  // Pomija zasoby Next.js, pliki z rozszerzeniem (favicon, robots.txt, obrazy) i API.
  matcher: ["/((?!_next/|api/|.*\\.[^/]+$).*)"],
};
