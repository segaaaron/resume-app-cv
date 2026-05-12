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

  // Redirect non-www to www in production
  const host = request.headers.get("host") ?? ""
  if (process.env.NODE_ENV === "production" && host === "readycvv.com") {
    const url = request.nextUrl.clone()
    url.host = "www.readycvv.com"
    return NextResponse.redirect(url, { status: 301 })
  }

  // Skip locale routing for non-public paths
  if (skipPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Strip locale prefix to check the real path (/es/login → /login)
  const localeMatch = pathname.match(/^\/(es|en)/)
  const locale = localeMatch ? localeMatch[1] : "es"
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, "") || "/"

  const isAuth = getIsAuth(request)

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) && isAuth) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/resumes`, request.url))
  }

  // Allow PDF print pages with a signed print token — Puppeteer has no session cookie
  const isPrintPath =
    /^\/resume\/[^/]+\/print$/.test(pathnameWithoutLocale) ||
    /^\/cover-letter\/[^/]+\/print$/.test(pathnameWithoutLocale)
  const hasPrintToken = request.nextUrl.searchParams.has("pt")

  // Redirect unauthenticated users away from protected pages
  if (
    protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    !isAuth &&
    !(isPrintPath && hasPrintToken)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // Auto-detect language on first visit (no NEXT_LOCALE cookie = no preference set yet)
  const localePreference = request.cookies.get("NEXT_LOCALE")?.value
  if (!localePreference && !localeMatch) {
    const acceptLanguage = request.headers.get("accept-language") ?? ""
    const preferEs = acceptLanguage.toLowerCase().includes("es")
    const detectedLocale = preferEs ? "es" : "en"
    const url = request.nextUrl.clone()
    url.pathname = `/${detectedLocale}${pathname === "/" ? "" : pathname}`
    const response = NextResponse.redirect(url, { status: 302 })
    response.cookies.set("NEXT_LOCALE", detectedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return response
  }

  // Apply i18n locale routing for public pages
  return intlMiddleware(request)
}

// NOTE: /api/ routes are intentionally excluded from this middleware.
// API routes handle their own auth (via `auth()`) and rate limiting
// (via `checkRateLimit()` in `lib/ai-client.ts`). Including /api/ here
// would add in-memory middleware rate limiting that resets on each deploy
// and runs on the Edge, where per-user DB lookups are not feasible.
export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
  ],
}
