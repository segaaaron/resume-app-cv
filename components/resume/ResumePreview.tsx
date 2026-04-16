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
}

export default function ResumePreview() {
  const { config } = useResumeStore()
  const Template = TEMPLATE_MAP[config.templateId] ?? ClassicTemplate

  return (
    <div
      className="bg-white shadow-2xl resume-pages"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: config.fontFamily,
        fontSize: `${config.fontSize}px`,
      }}
    >
      <Template />
    </div>
  )
}
