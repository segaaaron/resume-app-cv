"use client"

import { useEffect, useRef, useState } from "react"
import "@/styles/print-resume.css"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import ResumePreview from "./ResumePreview"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
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
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const t = useTranslations("editor.print")
  const locale = useLocale()
  propsRef.current = { resumeId, title, sections, sectionData, config }
  const searchParams = useSearchParams()
  const isScreenshot = searchParams.get("screenshot") === "1"

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

  useEffect(() => {
    const ok = (bg: string) => !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"

    function resolveBg(): string {
      const layoutEl = document.querySelector<HTMLElement>("[data-print-layout]")
      if (!layoutEl) return "white"
      const layout = layoutEl.dataset.printLayout ?? "single-column"
      if (layout === "sidebar-left" || layout === "sidebar-right") {
        const sidebarEl = (layout === "sidebar-left" ? layoutEl.firstElementChild : layoutEl.lastElementChild) as HTMLElement
        const mainEl   = (layout === "sidebar-left" ? layoutEl.lastElementChild  : layoutEl.firstElementChild) as HTMLElement
        if (!sidebarEl || !mainEl) return "white"
        const cs = window.getComputedStyle(layoutEl)
        const varSidebarBg = cs.getPropertyValue("--pdf-sidebar-bg").trim()
        const varMainBg    = cs.getPropertyValue("--pdf-main-bg").trim()
        const varWidth     = cs.getPropertyValue("--pdf-sidebar-width").trim()
        const sidebarBg = varSidebarBg || window.getComputedStyle(sidebarEl).backgroundColor
        if (!ok(sidebarBg)) return "white"
        const rawMain = window.getComputedStyle(mainEl).backgroundColor
        const rootBg  = window.getComputedStyle(layoutEl).backgroundColor
        const mainBg  = varMainBg || (ok(rawMain) ? rawMain : ok(rootBg) ? rootBg : "white")
        let ratio: number
        if (varWidth) {
          const rootW     = layoutEl.offsetWidth
          const sidebarPx = varWidth.endsWith("px") ? parseFloat(varWidth) : (parseFloat(varWidth) / 100) * rootW
          ratio = rootW > 0 ? (sidebarPx / rootW) * 100 : 33
        } else {
          ratio = layoutEl.offsetWidth > 0 ? (sidebarEl.offsetWidth / layoutEl.offsetWidth) * 100 : 33
        }
        return layout === "sidebar-left"
          ? `linear-gradient(to right, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%)`
          : `linear-gradient(to left, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%)`
      }
      const rootBg = window.getComputedStyle(layoutEl).backgroundColor
      return ok(rootBg) ? rootBg : "white"
    }

    const applyBg = () => {
      const el = document.documentElement
      el.style.background = resolveBg()
      el.style.setProperty("-webkit-print-color-adjust", "exact")
      el.style.setProperty("print-color-adjust", "exact")

      // Stretch columns to fill complete pages so the last page isn't half-empty.
      // Measure PAGE_H, compute ceil(pages), force minHeight on the layout root.
      const layoutEl = document.querySelector<HTMLElement>("[data-print-layout]")
      if (layoutEl) {
        const ruler = document.createElement("div")
        ruler.style.cssText = "position:fixed;top:-9999px;left:0;height:297mm;visibility:hidden;pointer-events:none;"
        document.body.appendChild(ruler)
        const PAGE_H = ruler.offsetHeight
        document.body.removeChild(ruler)
        if (PAGE_H > 0) {
          const numPages = Math.ceil(layoutEl.scrollHeight / PAGE_H)
          layoutEl.dataset.printPriorMinHeight = layoutEl.style.minHeight
          layoutEl.style.minHeight = `${numPages * PAGE_H}px`
        }
      }
    }
    const removeBg = () => {
      const el = document.documentElement
      el.style.removeProperty("background")
      el.style.removeProperty("-webkit-print-color-adjust")
      el.style.removeProperty("print-color-adjust")
      const layoutEl = document.querySelector<HTMLElement>("[data-print-layout]")
      if (layoutEl && "printPriorMinHeight" in layoutEl.dataset) {
        const prior = layoutEl.dataset.printPriorMinHeight ?? ""
        if (prior) layoutEl.style.minHeight = prior
        else layoutEl.style.removeProperty("min-height")
        delete layoutEl.dataset.printPriorMinHeight
      }
    }
    window.addEventListener("beforeprint", applyBg)
    window.addEventListener("afterprint", removeBg)
    return () => {
      window.removeEventListener("beforeprint", applyBg)
      window.removeEventListener("afterprint", removeBg)
      removeBg()
    }
  }, [])

  async function handleDownloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf?locale=${locale}`)
      if (!res.ok) { toast.error(t("error_pdf")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("error_pdf"))
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <>
      {/* Print toolbar — hidden when printing or taking screenshot */}
      <div className={`${isScreenshot ? "hidden" : "print:hidden"} bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/editor/${resumeId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadPdf} size="sm" className="gap-2" disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("print_pdf")}
          </Button>
        </div>
      </div>

      {/* Upgrade banner for free users — hidden when printing or taking screenshot */}
      {!isPro && !isScreenshot && (
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
      <div className="print:p-0 flex justify-center bg-gray-100 min-h-screen print:bg-white py-8 print:block print:min-h-0">
        <div className="print:shadow-none relative print:w-full">
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

    </>
  )
}
