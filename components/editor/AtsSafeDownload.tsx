"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Download, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { useResumeStore } from "@/stores/resumeStore"

type Format = "pdf" | "txt"

/**
 * "Your design for people · your ATS version for machines."
 * The user keeps their two-column template for human eyes; this hands them the plain,
 * single-column, standard-label twin that parses clean in every engine — generated
 * deterministically from the SAME resume (toAtsSafeResumeText server-side). PDF for
 * portals that demand a PDF; .txt for the plainest, most portable form.
 */
export default function AtsSafeDownload() {
  const t = useTranslations("editor.ats")
  const locale = useLocale()
  const [busy, setBusy] = useState<Format | null>(null)

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const download = async (format: Format) => {
    if (busy) return
    const state = useResumeStore.getState()
    if (!state.resumeId) {
      toast.error(t("export_error"))
      return
    }
    setBusy(format)
    try {
      // Render from the SAVED resume (same source verifyReal scores), so the file the
      // user downloads matches the version we told them parses clean.
      await state.save({ skipThumbnail: true })
      const res = await apiFetch("/api/ai/ats-safe-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: state.resumeId, locale, format }),
      })
      if (!res.ok) {
        toast.error(res.status === 403 ? t("pro_only") : t("export_error"))
        return
      }
      const safeTitle = (state.title || "resume").replace(/[^\w.-]+/g, "_").slice(0, 60)
      if (format === "pdf") {
        triggerDownload(await res.blob(), `${safeTitle}_ATS.pdf`)
      } else {
        const data: { text: string } = await res.json()
        triggerDownload(new Blob([data.text], { type: "text/plain;charset=utf-8" }), `${safeTitle}_ATS.txt`)
      }
      track("ats_export_downloaded", { format })
      toast.success(t("export_done"))
    } catch {
      toast.error(t("export_error"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-blue-50/60 p-3.5">
      <div className="flex items-start gap-2.5">
        <div
          className="shrink-0 rounded-xl p-2 text-white"
          style={{ background: "linear-gradient(135deg,#00D4FF,#1a2e4a)", boxShadow: "0 4px 12px -4px rgba(0,212,255,0.6)" }}
        >
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11.5px] font-black text-[#1a2e4a] leading-snug">{t("export_title")}</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-slate-600">{t("export_hint")}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => download("pdf")}
          disabled={busy !== null}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#00D4FF,#00A8CC)", boxShadow: "0 4px 14px -4px rgba(0,212,255,0.7)" }}
        >
          {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {busy === "pdf" ? t("export_loading") : t("export_button_pdf")}
        </button>
        <button
          type="button"
          onClick={() => download("txt")}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-white/70 px-3 py-2 text-[11px] font-bold text-cyan-700 transition-all hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy === "txt" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          {t("export_button_txt")}
        </button>
      </div>
    </div>
  )
}
