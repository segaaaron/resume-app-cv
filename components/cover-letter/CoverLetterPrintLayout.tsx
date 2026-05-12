"use client"

import { useEffect, useState } from "react"
import "@/styles/print-cover-letter.css"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import ElegantTemplate from "./templates/ElegantTemplate"
import SidebarTemplate from "./templates/SidebarTemplate"
import SplitTemplate from "./templates/SplitTemplate"
import ExecutiveBoldTemplate from "./templates/ExecutiveBoldTemplate"
import MaterialCardTemplate from "./templates/MaterialCardTemplate"
import GradientHorizonTemplate from "./templates/GradientHorizonTemplate"
import TwoToneTemplate from "./templates/TwoToneTemplate"
import TimelineTemplate from "./templates/TimelineTemplate"
import MinimalLineTemplate from "./templates/MinimalLineTemplate"
import MonogramTemplate from "./templates/MonogramTemplate"
import ArchitectTemplate from "./templates/ArchitectTemplate"
import DiagonalTemplate from "./templates/DiagonalTemplate"
import NewspaperTemplate from "./templates/NewspaperTemplate"
import type { CandidateData, CoverLetterContent } from "./templates/types"

interface Props {
  letterId: string
  title: string
  colorScheme: string
  fontFamily: string
  templateId: string
  content: CoverLetterContent
  candidate: CandidateData
  locale: string
}

export default function CoverLetterPrintLayout({ letterId, title, colorScheme, fontFamily, templateId, content, candidate, locale }: Props) {
  const t = useTranslations("cover_letter_editor")
  const [downloading, setDownloading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("auto") === "true") {
      handleDownload()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/cover-letters/${letterId}/pdf?locale=${locale}`)
      if (!res.ok) { toast.error(t("pdf_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title || "carta"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("pdf_error"))
    } finally {
      setDownloading(false)
    }
  }

  const candidateWithPosition = { ...candidate }

  function renderTemplate() {
    const props = { content, candidate: candidateWithPosition, colorScheme }
    if (templateId === "elegant" || templateId === "classic") return <ElegantTemplate {...props} />
    if (templateId === "sidebar") return <SidebarTemplate {...props} />
    if (templateId === "split") return <SplitTemplate {...props} />
    if (templateId === "executive") return <ExecutiveBoldTemplate {...props} />
    if (templateId === "material") return <MaterialCardTemplate {...props} />
    if (templateId === "gradient") return <GradientHorizonTemplate {...props} />
    if (templateId === "twotone") return <TwoToneTemplate {...props} />
    if (templateId === "timeline") return <TimelineTemplate {...props} />
    if (templateId === "minimal") return <MinimalLineTemplate {...props} />
    if (templateId === "monogram") return <MonogramTemplate {...props} />
    if (templateId === "architect") return <ArchitectTemplate {...props} />
    if (templateId === "diagonal") return <DiagonalTemplate {...props} />
    if (templateId === "newspaper") return <NewspaperTemplate {...props} />
    return <ElegantTemplate {...props} />
  }

  return (
    <>
      <div className="print:hidden bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/cover-letter/${letterId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver al editor
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <Button onClick={handleDownload} size="sm" className="gap-2" disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar PDF
        </Button>
      </div>

      <div className="print:p-0 flex justify-center bg-gray-100 min-h-screen print:bg-white py-8 print:block print:min-h-0">
        <div
          className="cover-letter-page bg-white shadow-2xl print:shadow-none overflow-hidden shrink-0"
          style={{ width: "210mm", minHeight: "297mm", fontFamily }}
        >
          {renderTemplate()}
        </div>
      </div>

    </>
  )
}
