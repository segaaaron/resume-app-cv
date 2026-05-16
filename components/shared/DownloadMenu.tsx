"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, FileDown, FileText, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export interface DownloadOption {
  format: "pdf" | "docx"
  label: string
  sublabel: string
  isLoading: boolean
  onDownload: () => Promise<void> | void
}

export interface DownloadMenuProps {
  options: DownloadOption[]
  filename: string
  size?: "sm" | "default"
  triggerLabel?: string
  generatingPdfLabel?: string
  generatingWordLabel?: string
  successLabel?: (filename: string) => string
  phaseLabels?: {
    preparing: string
    applyingStyles: string
    almostDone: string
  }
  disabled?: boolean
}

const DEFAULT_PHASES = {
  preparing: "Preparando documento...",
  applyingStyles: "Aplicando estilos...",
  almostDone: "Casi listo...",
}

function PhaseText({ active, labels }: { active: boolean; labels: { preparing: string; applyingStyles: string; almostDone: string } }) {
  const [phase, setPhase] = useState<"preparing" | "applyingStyles" | "almostDone">("preparing")

  useEffect(() => {
    if (!active) {
      setPhase("preparing")
      return
    }
    const t1 = setTimeout(() => setPhase("applyingStyles"), 3_000)
    const t2 = setTimeout(() => setPhase("almostDone"), 8_000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [active])

  return <span className="text-[10px] text-amber-600">{labels[phase]}</span>
}

export default function DownloadMenu({
  options,
  filename,
  size = "sm",
  triggerLabel = "Descargar",
  generatingPdfLabel = "Generando PDF...",
  generatingWordLabel = "Generando Word...",
  successLabel = (f) => `${f} descargado`,
  phaseLabels = DEFAULT_PHASES,
  disabled = false,
}: DownloadMenuProps) {
  const [open, setOpen] = useState(false)
  const [recentSuccess, setRecentSuccess] = useState<"pdf" | "docx" | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const prevLoading = useRef<Record<string, boolean>>({})

  const anyLoading = options.some((o) => o.isLoading)
  const loadingFormat = options.find((o) => o.isLoading)?.format ?? null

  useEffect(() => {
    options.forEach((o) => {
      const prev = prevLoading.current[o.format] ?? false
      if (prev && !o.isLoading) {
        setRecentSuccess(o.format)
        toast.success(successLabel(filename))
        setTimeout(() => setRecentSuccess(null), 1_500)
      }
      prevLoading.current[o.format] = o.isLoading
    })
  }, [options, filename, successLabel])

  useEffect(() => {
    if (anyLoading) setOpen(false)
  }, [anyLoading])

  useEffect(() => {
    if (!open || anyLoading) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open, anyLoading])

  const triggerText = anyLoading
    ? loadingFormat === "pdf"
      ? generatingPdfLabel
      : generatingWordLabel
    : triggerLabel

  return (
    <div className="relative" ref={ref}>
      <Button
        size={size}
        className="gap-1.5"
        disabled={disabled}
        onClick={() => {
          if (!anyLoading) setOpen((v) => !v)
        }}
      >
        {anyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {triggerText}
        {!anyLoading && <ChevronDown className="h-3 w-3 ml-0.5" />}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl min-w-[220px] overflow-hidden">
          {options.map((opt) => {
            const otherLoading = anyLoading && !opt.isLoading
            const Icon = opt.format === "pdf" ? FileDown : FileText
            const iconColor = opt.format === "pdf" ? "text-red-500" : "text-blue-500"
            const justSucceeded = recentSuccess === opt.format

            return (
              <button
                key={opt.format}
                type="button"
                disabled={otherLoading || opt.isLoading}
                onClick={async () => {
                  await opt.onDownload()
                }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {opt.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
                ) : justSucceeded ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                )}
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{opt.label}</span>
                  {opt.isLoading ? (
                    <PhaseText active={opt.isLoading} labels={phaseLabels} />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{opt.sublabel}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
