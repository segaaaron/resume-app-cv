import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authRoutes = ["/login", "/register"]
const protectedRoutes = ["/dashboard", "/editor", "/cover-letter"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Detect session: NextAuth v5 uses 'authjs.session-token' cookie
  const sessionCookie =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token") ??
    // fallback for older next-auth cookie names
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token")

  const isAuth = !!sessionCookie?.value

  if (authRoutes.some((r) => pathname.startsWith(r)) && isAuth) {
    return NextResponse.redirect(new URL("/dashboard/resumes", request.url))
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
