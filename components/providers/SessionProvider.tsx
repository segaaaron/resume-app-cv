"use client"

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react"
import { logoutAction } from "@/lib/actions/logout"
import type { Session } from "next-auth"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

const SESSION_EXPIRED: Record<string, string> = {
  en: "Your session expired. Please sign in again.",
  es: "Tu sesión expiró. Inicia sesión de nuevo.",
}

function SessionWatcher() {
  const { status } = useSession()
  const signingOut = useRef(false)
  // useRef resets on every page load — prevents stale sessionStorage from triggering
  // logoutAction on refresh when the user is still authenticated.
  const wasAuthenticated = useRef(false)
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticated.current = true
      return
    }
    if (status === "loading") return
    if (status === "unauthenticated" && wasAuthenticated.current) {
      wasAuthenticated.current = false
      const lang = document.documentElement.lang ?? "es"
      logoutAction(`/${lang}/login`)
    }
  }, [status])

  // Global fetch interceptor: any API 401 → session expired → force logout
  useEffect(() => {
    const original = window.fetch
    window.fetch = async (...args) => {
      const res = await original(...args)
      if (res.status === 401 && !signingOut.current && wasAuthenticated.current) {
        signingOut.current = true
        const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : args[0] instanceof Request ? args[0].url : ""
        // Only intercept internal API calls, not NextAuth endpoints (avoid loop)
        if (url.startsWith("/api/") && !url.startsWith("/api/auth/")) {
          const lang = document.documentElement.lang ?? "es"
          toast.error(SESSION_EXPIRED[lang] ?? SESSION_EXPIRED.es)
          wasAuthenticated.current = false
          const lang2 = document.documentElement.lang ?? "es"
          logoutTimeoutRef.current = setTimeout(() => logoutAction(`/${lang2}/login`), 1_500)
        } else {
          signingOut.current = false
        }
      }
      return res
    }
    return () => {
      window.fetch = original
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
    }
  }, [])

  return null
}


export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  // Optional: when omitted, NextAuth fetches the session client-side. This keeps
  // the root layout static-render-friendly (no server-side `auth()` cookie read).
  session?: Session | null
}) {
  return (
    <NextAuthSessionProvider session={session} refetchOnWindowFocus>
      <SessionWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
