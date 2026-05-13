"use client"

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react"
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

  useEffect(() => {
    if (status === "authenticated") {
      sessionStorage.setItem("wasAuthenticated", "1")
      return
    }
    if (status === "loading") return
    if (status === "unauthenticated" && sessionStorage.getItem("wasAuthenticated")) {
      sessionStorage.removeItem("wasAuthenticated")
      signOut({ redirect: true, callbackUrl: "/login" })
    }
  }, [status])

  // Global fetch interceptor: any API 401 → session expired → force logout
  useEffect(() => {
    const original = window.fetch
    window.fetch = async (...args) => {
      const res = await original(...args)
      if (res.status === 401 && !signingOut.current && sessionStorage.getItem("wasAuthenticated")) {
        signingOut.current = true
        const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : args[0] instanceof Request ? args[0].url : ""
        // Only intercept internal API calls, not NextAuth endpoints (avoid loop)
        if (url.startsWith("/api/") && !url.startsWith("/api/auth/")) {
          const lang = document.documentElement.lang ?? "es"
          toast.error(SESSION_EXPIRED[lang] ?? SESSION_EXPIRED.es)
          sessionStorage.removeItem("wasAuthenticated")
          setTimeout(() => signOut({ redirect: true, callbackUrl: "/login" }), 1_500)
        } else {
          signingOut.current = false
        }
      }
      return res
    }
    return () => { window.fetch = original }
  }, [])

  return null
}


export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <NextAuthSessionProvider session={session} refetchOnWindowFocus>
      <SessionWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
