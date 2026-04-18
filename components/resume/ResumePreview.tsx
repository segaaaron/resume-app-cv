"use client"

import { useResumeStore } from "@/stores/resumeStore"
import ClassicTemplate from "./templates/Classic"
import ModernTemplate from "./templates/Modern"
import ProfessionalTemplate from "./templates/Professional"
import ElegantTemplate from "./templates/Elegant"
import CircularTemplate from "./templates/Circular"
import VerticalTemplate from "./templates/Vertical"
import HorizontalTemplate from "./templates/Horizontal"
import SimpleTemplate from "./templates/Simple"
import ChronoTemplate from "./templates/Chrono"
import CasualTemplate from "./templates/Casual"
import LuxuriousTemplate from "./templates/Luxurious"
import MetroTemplate from "./templates/Metro"
import ATSTemplate from "./templates/ATS"
import SharpTemplate from "./templates/Sharp"
import GlassTemplate from "./templates/Glass"
import NeonTemplate from "./templates/Neon"
import NordicTemplate from "./templates/Nordic"
import ExecutiveTemplate from "./templates/Executive"
import SidebarTemplate from "./templates/Sidebar"
import FoldTemplate from "./templates/Fold"
import BauhausTemplate from "./templates/Bauhaus"
import OutlineTemplate from "./templates/Outline"
import SparkTemplate from "./templates/Spark"
import CarbonTemplate from "./templates/Carbon"
import BlueprintTemplate from "./templates/Blueprint"
import RivieraTemplate from "./templates/Riviera"
import StripeTemplate from "./templates/Stripe"
import VogueTemplate from "./templates/Vogue"
import CoralTemplate from "./templates/Coral"
import AuroraTemplate from "./templates/Aurora"
import HelixTemplate from "./templates/Helix"
import LumiereTemplate from "./templates/Lumiere"
import PrismTemplate from "./templates/Prism"
import ConsulTemplate from "./templates/Consul"
import RoseTemplate from "./templates/Rose"
import MinimalTemplate from "./templates/Minimal"
import NauticalTemplate from "./templates/Nautical"
import WaveTemplate from "./templates/Wave"
import CobaltTemplate from "./templates/Cobalt"
import BannerTemplate from "./templates/Banner"
import DualityTemplate from "./templates/Duality"
import ObsidianTemplate from "./templates/Obsidian"
import VertexTemplate from "./templates/Vertex"
import PrestigeTemplate from "./templates/Prestige"

const TEMPLATE_MAP: Record<string, React.ComponentType> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  elegant: ElegantTemplate,
  circular: CircularTemplate,
  vertical: VerticalTemplate,
  horizontal: HorizontalTemplate,
  simple: SimpleTemplate,
  chrono: ChronoTemplate,
  casual: CasualTemplate,
  luxurious: LuxuriousTemplate,
  metro: MetroTemplate,
  ats: ATSTemplate,
  sharp: SharpTemplate,
  glass: GlassTemplate,
  neon: NeonTemplate,
  nordic: NordicTemplate,
  executive: ExecutiveTemplate,
  sidebar: SidebarTemplate,
  fold: FoldTemplate,
  bauhaus: BauhausTemplate,
  outline: OutlineTemplate,
  spark: SparkTemplate,
  carbon: CarbonTemplate,
  blueprint: BlueprintTemplate,
  riviera: RivieraTemplate,
  stripe: StripeTemplate,
  vogue: VogueTemplate,
  coral: CoralTemplate,
  aurora: AuroraTemplate,
  helix: HelixTemplate,
  lumiere: LumiereTemplate,
  prism: PrismTemplate,
  consul: ConsulTemplate,
  rose: RoseTemplate,
  minimal: MinimalTemplate,
  nautical: NauticalTemplate,
  wave: WaveTemplate,
  cobalt: CobaltTemplate,
  banner: BannerTemplate,
  duality: DualityTemplate,
  obsidian: ObsidianTemplate,
  vertex: VertexTemplate,
  prestige: PrestigeTemplate,
}

// Google Fonts dynamic loader
function buildFontUrl(family: string) {
  const encoded = family.replace(/ /g, "+")
  return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`
}

// Font size is applied via CSS zoom so it scales EVERYTHING:
// Tailwind rem-based classes, inline px styles, images, paddings.
// Base reference = 14px (default fontSize). zoom = config.fontSize / 14.
// Compensate dimensions so the visual A4 size stays 210×297mm.
const BASE_FONT = 14

export default function ResumePreview() {
  const { config } = useResumeStore()
  const Template = TEMPLATE_MAP[config.templateId] ?? ClassicTemplate

  const scale = config.fontSize / BASE_FONT
  // Compensated dimensions: visually always 210×297mm regardless of zoom
  const cssWidth = `${(210 / scale).toFixed(4)}mm`
  const cssMinHeight = `${(297 / scale).toFixed(4)}mm`

  return (
    <>
      {/* Dynamically load the selected Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('${buildFontUrl(config.fontFamily)}');`}</style>

      <div
        className="bg-white shadow-2xl resume-pages"
        style={{
          // zoom scales everything including Tailwind rem classes and inline px styles
          zoom: scale,
          width: cssWidth,
          minHeight: cssMinHeight,
          // fontFamily cascades to all children that don't override it
          fontFamily: `'${config.fontFamily}', sans-serif`,
          // lineHeight controls text line spacing (spacing slider)
          lineHeight: config.spacing * 1.4,
        }}
      >
        <Template />
      </div>
    </>
  )
}
