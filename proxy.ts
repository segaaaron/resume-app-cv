import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { type NextRequest, NextResponse } from "next/server"

const intlMiddleware = createMiddleware(routing)

// ── Rate limiting ────────────────────────────────────────────────────────────
const apiLimits  = new Map<string, { count: number; resetAt: number }>()
const authLimits = new Map<string, { count: number; resetAt: number }>()

function checkLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now   = Date.now()
  const entry = map.get(key)
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  // ── Rate limiting on API routes ──────────────────────────────────────────
  if (pathname.startsWith("/api/auth")) {
    if (!checkLimit(authLimits, ip, 10, 15 * 60 * 1000)) {
      console.warn(`[ratelimit] auth blocked ip=${ip} path=${pathname}`)
      return NextResponse.json(
        { error: "Demasiados intentos. Espera antes de intentarlo de nuevo." },
        { status: 429 }
      )
    }
  } else if (pathname.startsWith("/api/")) {
    if (!checkLimit(apiLimits, ip, 60, 60 * 1000)) {
      console.warn(`[ratelimit] api blocked ip=${ip} path=${pathname}`)
      return NextResponse.json(
        { error: "Demasiadas peticiones. Intenta de nuevo en un momento." },
        { status: 429 }
      )
    }
  }

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
