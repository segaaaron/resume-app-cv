"use client"

import { useEffect, useRef, useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import ResumePreview from "./ResumePreview"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, FileText, Loader2 } from "lucide-react"
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
}

export default function PrintLayout({ resumeId, title, sections, sectionData, config }: Props) {
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
      // Wait for fonts/images to load before printing
      const timer = setTimeout(() => window.print(), 800)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

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
          <Button onClick={() => window.print()} size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            {t("print_pdf")}
          </Button>
        </div>
      </div>

      {/* Resume — centered on screen, full width when printing */}
      <div className="print:p-0 flex justify-center bg-gray-100 min-h-screen print:bg-white py-8">
        <div className="print:shadow-none">
          <ResumePreview />
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
