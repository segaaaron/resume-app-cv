import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { type NextRequest, NextResponse } from "next/server"

const intlMiddleware = createMiddleware(routing)

const skipPaths = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/og-image.png",
  "/sitemap.xml",
  "/robots.txt",
]

const authRoutes = ["/login", "/register"]
const protectedRoutes = ["/dashboard", "/editor", "/cover-letter", "/resume"]

function getIsAuth(request: NextRequest): boolean {
  return !!(
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token")
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip locale routing for non-public paths
  if (skipPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Strip locale prefix to check the real path (/es/login → /login)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, "") || "/"

  const isAuth = getIsAuth(request)

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) && isAuth) {
    return NextResponse.redirect(new URL("/es/dashboard/resumes", request.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) && !isAuth) {
    return NextResponse.redirect(new URL("/es/login", request.url))
  }

  // Apply i18n locale routing for public pages
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
  ],
}
