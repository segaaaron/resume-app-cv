"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
  }, [error])

  const t = useTranslations("common")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">{t("error_title")}</h1>
      <p className="text-muted-foreground">{t("error_message")}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="underline text-sm">
          {t("retry")}
        </button>
        <Link href="/" className="underline text-sm">
          {t("home")}
        </Link>
      </div>
    </div>
  )
}
