import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
const protectedRoutes = ["/dashboard", "/editor", "/cover-letter", "/resume", "/accept-terms"]

// Auth cookie names NextAuth v5 uses (dev + prod variants)
const AUTH_COOKIE_NAMES = [
  "__Host-authjs.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-authjs.csrf-token",
  "authjs.csrf-token",
  "__Host-authjs.callback-url",
  "authjs.callback-url",
]

const REDIRECT_LOOP_COOKIE = "__rd"
const REDIRECT_LOOP_MAX   = 3

function getIsAuth(request: NextRequest): boolean {
  return !!(
    request.cookies.get("__Host-authjs.session-token") ??
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token")
  )
}

function clearAuthCookiesAndRedirect(request: NextRequest, locale: string): NextResponse {
  const url = new URL(`/${locale}/login?cleared=1`, request.url)
  const res = NextResponse.redirect(url, { status: 307 })
  for (const name of AUTH_COOKIE_NAMES) {
    res.cookies.set(name, "", { maxAge: 0, path: "/" })
  }
  res.cookies.set(REDIRECT_LOOP_COOKIE, "", { maxAge: 0, path: "/" })
  return res
}

export async function middleware(request: NextRequest) {
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
    const redirectCount = parseInt(request.cookies.get(REDIRECT_LOOP_COOKIE)?.value ?? "0", 10)
    if (redirectCount >= REDIRECT_LOOP_MAX) {
      return clearAuthCookiesAndRedirect(request, locale)
    }
    const res = NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    res.cookies.set(REDIRECT_LOOP_COOKIE, String(redirectCount + 1), {
      maxAge: 10, // 10 segundos — ventana corta para detectar loop
      path: "/",
      sameSite: "lax",
    })
    return res
  }

  // Terms acceptance guard: Google OAuth users without termsAcceptedAt must accept first.
  // Only enforced when termsAcceptedAt is explicitly null in the JWT (not undefined = old token).
  if (
    protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    isAuth &&
    !pathnameWithoutLocale.startsWith("/accept-terms")
  ) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
    if (token && token.termsAcceptedAt === null) {
      return NextResponse.redirect(new URL(`/${locale}/accept-terms`, request.url))
    }
  }

  // Reset redirect counter when user reaches a protected page successfully (has cookie)
  if (
    protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    isAuth &&
    request.cookies.get(REDIRECT_LOOP_COOKIE)
  ) {
    const res = intlMiddleware(request)
    res.cookies.set(REDIRECT_LOOP_COOKIE, "", { maxAge: 0, path: "/" })
    return res
  }

  // Reset redirect counter when user reaches login/register normally (no loop)
  if (
    authRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    request.cookies.get(REDIRECT_LOOP_COOKIE)
  ) {
    const res = intlMiddleware(request)
    res.cookies.set(REDIRECT_LOOP_COOKIE, "", { maxAge: 0, path: "/" })
    return res
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
