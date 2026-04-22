import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

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
    redirect(`/${locale}/login`)
  }
  return <>{children}</>
}
