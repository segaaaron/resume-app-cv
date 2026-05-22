import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function TermsPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "es"
  redirect(`/${locale}/terms`)
}
