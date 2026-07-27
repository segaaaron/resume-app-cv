import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { LOCALE_COOKIE, resolveLocale } from "@/lib/locale"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  // An explicit choice wins; otherwise honour the browser. This used to fall straight
  // back to Spanish, so every visitor — including one whose browser only speaks
  // English — landed on Spanish.
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"))
  redirect(`/${locale}/login`)
}
