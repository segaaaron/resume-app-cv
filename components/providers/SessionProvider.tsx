"use client"

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { useEffect, useRef } from "react"

function SessionWatcher() {
  const { status } = useSession()
  // Debounce: require 2 consecutive unauthenticated ticks before signing out.
  // Prevents false logout when server is slow during a background refetch.
  const unauthCount = useRef(0)

  useEffect(() => {
    if (status === "authenticated") {
      sessionStorage.setItem("wasAuthenticated", "1")
      unauthCount.current = 0
      return
    }
    if (status === "loading") {
      // Mid-refetch — do not act, but don't count as unauthenticated tick
      return
    }
    if (status === "unauthenticated" && sessionStorage.getItem("wasAuthenticated")) {
      unauthCount.current += 1
      if (unauthCount.current >= 3) {
        // 3 consecutive unauth ticks (270s) required before forced logout — resilient to mobile handoffs
        sessionStorage.removeItem("wasAuthenticated")
        signOut({ redirect: true, callbackUrl: "/login" })
      }
    }
  }, [status])

  return null
}

function SessionVersionWatcher() {
  const { update } = useSession()
  // Use a ref to read the latest version without adding session to deps (which would reset the interval on every refetch)
  const versionRef = useRef<number | undefined>(undefined)
  const { data: session } = useSession()

  useEffect(() => {
    versionRef.current = session?.user?.sessionVersion
  }, [session?.user?.sessionVersion])

  useEffect(() => {
    if (!session?.user?.id) return

    const check = async () => {
      try {
        const res = await fetch("/api/billing/version")
        if (!res.ok) return
        const { version } = await res.json() as { version: number }
        const knownVersion = versionRef.current
        if (knownVersion !== undefined && version !== knownVersion) {
          await update()
        }
      } catch {
        // silent — non-critical heartbeat
      }
    }

    check() // immediate check on mount / user change
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  // Only re-run when the user id changes (login/logout), not on every session object update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, update])

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
    <NextAuthSessionProvider session={session} refetchInterval={90} refetchOnWindowFocus>
      <SessionWatcher />
      <SessionVersionWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
