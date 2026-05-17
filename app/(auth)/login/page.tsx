import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "es"
  redirect(`/${locale}/login`)
}
