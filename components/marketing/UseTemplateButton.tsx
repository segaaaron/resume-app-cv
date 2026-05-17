"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"

interface Props {
  templateId: string
  label: string
}

export default function UseTemplateButton({ templateId, label }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("templates_page")
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!session?.user) {
      router.push(`/${locale}/register`)
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? t("create_error"))
        return
      }

      const resume = await res.json()
      router.push(`/${locale}/editor/${resume.id}`)
    } catch {
      toast.error(t("create_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-primary font-semibold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </button>
  )
}
