"use client"

import { useEffect, useRef, useState } from "react"
// pdf via window.print() — no html2canvas/jsPDF needed
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import ResumePreview from "./ResumePreview"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

interface Props {
  resumeId: string
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
  isPro?: boolean
}

export default function PrintLayout({ resumeId, title, sections, sectionData, config, isPro = false }: Props) {
  const init = useResumeStore((s) => s.init)
  const propsRef = useRef({ resumeId, title, sections, sectionData, config })
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const t = useTranslations("editor.print")
  propsRef.current = { resumeId, title, sections, sectionData, config }
  const searchParams = useSearchParams()

  useEffect(() => {
    const { resumeId, title, sections, sectionData, config } = propsRef.current
    init(resumeId, title, sections, sectionData, config)
  }, [resumeId, init])

  useEffect(() => {
    if (searchParams.get("auto") === "true") {
      handleDownloadPdf()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDownloadPdf() {
    window.print()
  }

  async function handleDownloadDocx() {
    setDownloadingDocx(true)
    try {
      const res = await fetch(`/api/export/docx?id=${resumeId}`)
      if (res.status === 403) {
        toast.error(t("pro_only_word"))
        return
      }
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("error_word"))
    } finally {
      setDownloadingDocx(false)
    }
  }

  return (
    <>
      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/editor/${resumeId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadDocx} disabled={downloadingDocx}>
            {downloadingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t("export_word")}
          </Button>
          <Button onClick={handleDownloadPdf} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t("print_pdf")}
          </Button>
        </div>
      </div>

      {/* Upgrade banner for free users — hidden when printing */}
      {!isPro && (
        <div className="print:hidden bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Plan Free:</span> {t("watermark_upgrade")}
          </p>
          <a
            href="/pricing"
            className="text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            Actualizar a Pro →
          </a>
        </div>
      )}

      {/* Resume — centered on screen, full width when printing */}
      <div className="print:p-0 flex justify-center bg-gray-100 min-h-screen print:bg-white py-8">
        <div className="print:shadow-none relative">
          <ResumePreview />
          {/* Watermark — only shown in print for free users */}
          {!isPro && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden hidden print:flex items-center justify-center"
            >
              {/* Diagonal repeated text watermark */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  alignContent: "center",
                  gap: "48px 32px",
                  transform: "rotate(-35deg) scale(1.5)",
                  opacity: 0.1,
                  pointerEvents: "none",
                }}
              >
                {Array.from({ length: 30 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      whiteSpace: "nowrap",
                      fontFamily: "sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t("watermark_text")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 14mm 0;
        }
        @page :first {
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
          }
        }
      `}</style>
    </>
  )
}
