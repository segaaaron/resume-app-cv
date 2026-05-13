"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

export default function NotFound() {
  const t = useTranslations("common")
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">{t("not_found_title")}</h1>
      <p className="text-muted-foreground">{t("not_found_message")}</p>
      <Link href="/" className="underline text-sm">
        {t("not_found_back")}
      </Link>
    </div>
  )
}
