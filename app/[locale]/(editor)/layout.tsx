import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

const STALE_AUTH_COOKIES = [
  "__Host-authjs.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

export default async function EditorRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) {
    const jar = await cookies()
    for (const name of STALE_AUTH_COOKIES) jar.delete(name)
    redirect(`/${locale}/login`)
  }
  return <>{children}</>
}
