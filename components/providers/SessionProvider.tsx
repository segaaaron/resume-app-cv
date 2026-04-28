"use client"

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { useEffect } from "react"

function SessionWatcher() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      sessionStorage.setItem("wasAuthenticated", "1")
      return
    }
    if (status === "unauthenticated" && sessionStorage.getItem("wasAuthenticated")) {
      sessionStorage.removeItem("wasAuthenticated")
      signOut({ redirect: true, callbackUrl: "/login" })
    }
  }, [status])

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
    <NextAuthSessionProvider session={session}>
      <SessionWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
