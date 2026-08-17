"use client"

import { useEffect, useState } from "react"
import "@/styles/print-cover-letter.css"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
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
// ── 30 premium templates (cover-letter v2) ───────────────────────────────
import EchoTemplate from "./templates/EchoTemplate"
import LumenTemplate from "./templates/LumenTemplate"
import AtlasTemplate from "./templates/AtlasTemplate"
import ConsulTemplate from "./templates/ConsulTemplate"
import SterlingTemplate from "./templates/SterlingTemplate"
import FortisTemplate from "./templates/FortisTemplate"
import PrismTemplate from "./templates/PrismTemplate"
import EmberTemplate from "./templates/EmberTemplate"
import VantageTemplate from "./templates/VantageTemplate"
import MosaicTemplate from "./templates/MosaicTemplate"
import VertexTemplate from "./templates/VertexTemplate"
import FolioTemplate from "./templates/FolioTemplate"
import GazetteTemplate from "./templates/GazetteTemplate"
import VersoTemplate from "./templates/VersoTemplate"
import AurumTemplate from "./templates/AurumTemplate"
import OnyxTemplate from "./templates/OnyxTemplate"
import VelvetTemplate from "./templates/VelvetTemplate"
import SignalTemplate from "./templates/SignalTemplate"
import MeridianTemplate from "./templates/MeridianTemplate"
import NovaTemplate from "./templates/NovaTemplate"
import ObsidianTemplate from "./templates/ObsidianTemplate"
import CodexTemplate from "./templates/CodexTemplate"
import AxiomTemplate from "./templates/AxiomTemplate"
import TerraTemplate from "./templates/TerraTemplate"
import FlareTemplate from "./templates/FlareTemplate"
import HeraldTemplate from "./templates/HeraldTemplate"
import BloomTemplate from "./templates/BloomTemplate"
import LtrMeridian from "./templates/LtrMeridian"
import LtrVerdant from "./templates/LtrVerdant"
import LtrCardinal from "./templates/LtrCardinal"
import LtrCobalt from "./templates/LtrCobalt"
import LtrSlate from "./templates/LtrSlate"
import LtrNordic from "./templates/LtrNordic"
import LtrOnyx from "./templates/LtrOnyx"
import LtrSable from "./templates/LtrSable"
import LtrCerulean from "./templates/LtrCerulean"
import LtrIvory from "./templates/LtrIvory"
import LtrGarnet from "./templates/LtrGarnet"
import LtrCopper from "./templates/LtrCopper"
import LtrHarbor from "./templates/LtrHarbor"
import LtrGraphite from "./templates/LtrGraphite"
import LtrSequoia from "./templates/LtrSequoia"
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
  isPro?: boolean
  /** Free tier may download, bounded per day by the route (same rule as the résumé). */
  canDownloadFree?: boolean
}

export default function CoverLetterPrintLayout({ letterId, title, colorScheme, fontFamily, templateId, content, candidate, locale, isPro = false, canDownloadFree = false }: Props) {
  const t = useTranslations("cover_letter_editor")
  const [downloading, setDownloading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("auto") === "true" && (isPro || canDownloadFree)) {
      handleDownload()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDownload() {
    // `canDownloadFree` mirrors what the route now allows for UNSUBSCRIBED. Keeping the
    // button locked while the server hands over the file is the drift that turns a
    // working feature into a support ticket.
    if (!isPro && !canDownloadFree) {
      toast.error(t("pdf_pro_required"), {
        action: { label: t("see_plans"), onClick: () => { window.location.href = `/${locale}/pricing` } },
      })
      return
    }
    setDownloading(true)
    try {
      const res = await apiFetch(`/api/cover-letters/${letterId}/pdf?locale=${locale}`)
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
    // ── 30 premium templates (cover-letter v2) ──
    if (templateId === "echo") return <EchoTemplate {...props} />
    if (templateId === "lumen") return <LumenTemplate {...props} />
    if (templateId === "atlas") return <AtlasTemplate {...props} />
    if (templateId === "consul") return <ConsulTemplate {...props} />
    if (templateId === "sterling") return <SterlingTemplate {...props} />
    if (templateId === "fortis") return <FortisTemplate {...props} />
    if (templateId === "prism") return <PrismTemplate {...props} />
    if (templateId === "ember") return <EmberTemplate {...props} />
    if (templateId === "vantage") return <VantageTemplate {...props} />
    if (templateId === "mosaic") return <MosaicTemplate {...props} />
    if (templateId === "vertex") return <VertexTemplate {...props} />
    if (templateId === "folio") return <FolioTemplate {...props} />
    if (templateId === "gazette") return <GazetteTemplate {...props} />
    if (templateId === "verso") return <VersoTemplate {...props} />
    if (templateId === "aurum") return <AurumTemplate {...props} />
    if (templateId === "onyx") return <OnyxTemplate {...props} />
    if (templateId === "velvet") return <VelvetTemplate {...props} />
    if (templateId === "signal") return <SignalTemplate {...props} />
    if (templateId === "meridian") return <MeridianTemplate {...props} />
    if (templateId === "nova") return <NovaTemplate {...props} />
    if (templateId === "obsidian") return <ObsidianTemplate {...props} />
    if (templateId === "codex") return <CodexTemplate {...props} />
    if (templateId === "axiom") return <AxiomTemplate {...props} />
    if (templateId === "terra") return <TerraTemplate {...props} />
    if (templateId === "flare") return <FlareTemplate {...props} />
    if (templateId === "herald") return <HeraldTemplate {...props} />
    if (templateId === "bloom") return <BloomTemplate {...props} />
    if (templateId === "ltrmeridian") return <LtrMeridian {...props} />
    if (templateId === "ltrverdant") return <LtrVerdant {...props} />
    if (templateId === "ltrcardinal") return <LtrCardinal {...props} />
    if (templateId === "ltrcobalt") return <LtrCobalt {...props} />
    if (templateId === "ltrslate") return <LtrSlate {...props} />
    if (templateId === "ltrnordic") return <LtrNordic {...props} />
    if (templateId === "ltronyx") return <LtrOnyx {...props} />
    if (templateId === "ltrsable") return <LtrSable {...props} />
    if (templateId === "ltrcerulean") return <LtrCerulean {...props} />
    if (templateId === "ltrivory") return <LtrIvory {...props} />
    if (templateId === "ltrgarnet") return <LtrGarnet {...props} />
    if (templateId === "ltrcopper") return <LtrCopper {...props} />
    if (templateId === "ltrharbor") return <LtrHarbor {...props} />
    if (templateId === "ltrgraphite") return <LtrGraphite {...props} />
    if (templateId === "ltrsequoia") return <LtrSequoia {...props} />
    return <ElegantTemplate {...props} />
  }

  return (
    <>
      <div className="print:hidden bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/cover-letter/${letterId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back_to_editor")}
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <Button onClick={handleDownload} size="sm" className="gap-2" disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t("download")}
        </Button>
      </div>

      <div className="print:p-0 flex justify-center bg-gray-100 min-h-screen print:bg-white py-8 print:block print:min-h-0">
        <div
          // web app — PDF contract class: "cover-letter-page" is queried by pdf-generator microservice.
          // Do NOT rename without updating services/pdf-generator/src/contracts.ts
          className="cover-letter-page bg-white shadow-2xl print:shadow-none overflow-hidden shrink-0"
          style={{ width: "210mm", minHeight: "297mm", fontFamily }}
        >
          {renderTemplate()}
        </div>
      </div>

    </>
  )
}
