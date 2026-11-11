import { NextResponse, type NextRequest } from "next/server";
import { localeRedirectPath } from "@/lib/i18n/config";

/** Adresy bez prefiksu języka trafiają do wersji domyślnej (/pl). */
export function proxy(request: NextRequest) {
  const target = localeRedirectPath(request.nextUrl.pathname);
  if (!target) return;

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  // Pomija zasoby Next.js, pliki z rozszerzeniem (favicon, robots.txt, obrazy) i API.
  matcher: ["/((?!_next/|api/|.*\\.[^/]+$).*)"],
};
