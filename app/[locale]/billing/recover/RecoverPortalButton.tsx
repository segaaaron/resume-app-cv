"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"

interface Props {
  locale: string
  label: string
  errorLabel: string
}

export default function RecoverPortalButton({ locale, label, errorLabel }: Props) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(errorLabel)
        return
      }
      window.location.href = data.url
    } catch {
      toast.error(errorLabel)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0f1a2e] font-bold text-base px-6 py-4 shadow-[0_8px_24px_rgba(0,212,255,0.4)] hover:shadow-[0_12px_32px_rgba(0,212,255,0.5)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
      <span>{label}</span>
    </button>
  )
}
