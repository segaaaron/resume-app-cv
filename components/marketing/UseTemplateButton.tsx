"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { isProTemplate } from "@/components/editor/template-switcher"
import PendingScreen from "@/components/shared/PendingScreen"

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
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)

  async function handleClick() {
    track("template_use_clicked", { template_id: templateId, is_pro: isProTemplate(templateId) })
    if (!session?.user) {
      setLeaving(true)
      router.push(`/${locale}/login`)
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
      track("resume_created", { method: "template", template_id: templateId })
      setLeaving(true)
      router.push(`/${locale}/editor/${resume.id}`)
    } catch {
      toast.error(t("create_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PendingScreen show={loading || leaving} />
      <button
      onClick={handleClick}
      disabled={loading}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-primary font-semibold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
      </button>
    </>
  )
}
