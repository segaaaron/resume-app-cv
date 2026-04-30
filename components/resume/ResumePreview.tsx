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
import LumiereTemplate from "./templates/Lumiere"
import ConsulTemplate from "./templates/Consul"
import RoseTemplate from "./templates/Rose"
import MinimalTemplate from "./templates/Minimal"
import WaveTemplate from "./templates/Wave"
import BannerTemplate from "./templates/Banner"
import VertexTemplate from "./templates/Vertex"
import PrestigeTemplate from "./templates/Prestige"
import OsloTemplate from "./templates/Oslo"
import KyotoTemplate from "./templates/Kyoto"
import GenevaTemplate from "./templates/Geneva"
import WindsorTemplate from "./templates/Windsor"
import MilanTemplate from "./templates/Milan"
import ZurichTemplate from "./templates/Zurich"
import PortoTemplate from "./templates/Porto"
import BarcelonaTemplate from "./templates/Barcelona"
import ViennaTemplate from "./templates/Vienna"
import BerlinTemplate from "./templates/Berlin"
import StockholmTemplate from "./templates/Stockholm"
import DublinTemplate from "./templates/Dublin"
import HelsinkiTemplate from "./templates/Helsinki"
import LagosTemplate from "./templates/Lagos"
import SeoulTemplate from "./templates/Seoul"
import CopenhagenTemplate from "./templates/Copenhagen"
import GenevanoirTemplate from "./templates/GenevaNoir"
import ReykjavikTemplate from "./templates/Reykjavik"
import ApexTemplate from "./templates/Apex"
import NovaTemplate from "./templates/Nova"
import CascadeTemplate from "./templates/Cascade"
import OnyxTemplate from "./templates/Onyx"
import MosaicTemplate from "./templates/Mosaic"
import LarssonTemplate from "./templates/Larsson"
import ThompsonTemplate from "./templates/Thompson"
import ClassicMonoTemplate from "./templates/ClassicMono"
import EditorialSerifTemplate from "./templates/EditorialSerif"
import BoldBlockTemplate from "./templates/BoldBlock"
import TimelineVerticalTemplate from "./templates/TimelineVertical"
import SwissGridTemplate from "./templates/SwissGrid"
import CharcoalClassicTemplate from "./templates/CharcoalClassic"
import NavyExecutiveTemplate from "./templates/NavyExecutive"
import CoralSidebarTemplate from "./templates/CoralSidebar"
import NeoBrutalistTemplate from "./templates/NeoBrutalist"
import SageBotanicalTemplate from "./templates/SageBotanical"
import TerminalCVTemplate from "./templates/TerminalCV"
import IOSAppCVTemplate from "./templates/IOSAppCV"
import DataDrivenTemplate from "./templates/DataDriven"
import BoardingPassTemplate from "./templates/BoardingPass"
import MagazineSpreadTemplate from "./templates/MagazineSpread"
import LegalBriefTemplate from "./templates/LegalBrief"
import EngravedTemplate from "./templates/Engraved"
import ChalkboardTemplate from "./templates/Chalkboard"
import AcademicCVTemplate from "./templates/AcademicCV"
import PsychologistTemplate from "./templates/Psychologist"
import ChefMenuTemplate from "./templates/ChefMenu"
import SommelierTemplate from "./templates/Sommelier"
import HotelCVTemplate from "./templates/HotelCV"
import BartenderCVTemplate from "./templates/BartenderCV"
import PostcardCVTemplate from "./templates/PostcardCV"
import FrontPageTemplate from "./templates/FrontPage"
import VinylCVTemplate from "./templates/VinylCV"
import CallSheetTemplate from "./templates/CallSheet"
import CopywriterMagTemplate from "./templates/CopywriterMag"
import AnimatorCVTemplate from "./templates/AnimatorCV"
import CodeEditorTemplate from "./templates/CodeEditor"
import CivilEngTemplate from "./templates/CivilEng"
import MechanicalTemplate from "./templates/Mechanical"
import DevOpsTerminalTemplate from "./templates/DevOpsTerminal"
import ProcessFlowTemplate from "./templates/ProcessFlow"
import MedicalChartTemplate from "./templates/MedicalChart"
import VitalSignsTemplate from "./templates/VitalSigns"
import VetCVTemplate from "./templates/VetCV"
import FieldJournalTemplate from "./templates/FieldJournal"
import NotebookCVTemplate from "./templates/NotebookCV"
import PilotLogTemplate from "./templates/PilotLog"
import OnboardingFormTemplate from "./templates/OnboardingForm"
import AthleteCardTemplate from "./templates/AthleteCard"
import TranslatorCVTemplate from "./templates/TranslatorCV"
import HerbariumCVTemplate from "./templates/HerbariumCV"
import RisoDesignerTemplate from "./templates/RisoDesigner"
import UXTokensTemplate from "./templates/UXTokens"
import SketchbookIllustratorTemplate from "./templates/SketchbookIllustrator"
import BlueprintCVTemplate from "./templates/BlueprintCV"
import ContactSheetTemplate from "./templates/ContactSheet"
import AnnualReportTemplate from "./templates/AnnualReport"
import FinanceTerminalTemplate from "./templates/FinanceTerminal"
import CampaignPosterTemplate from "./templates/CampaignPoster"
import SalesPitchTemplate from "./templates/SalesPitch"
import LedgerCVTemplate from "./templates/LedgerCV"

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
  lumiere: LumiereTemplate,
  consul: ConsulTemplate,
  rose: RoseTemplate,
  minimal: MinimalTemplate,
  wave: WaveTemplate,
  banner: BannerTemplate,
  vertex: VertexTemplate,
  prestige: PrestigeTemplate,
  oslo: OsloTemplate,
  kyoto: KyotoTemplate,
  geneva: GenevaTemplate,
  windsor: WindsorTemplate,
  milan: MilanTemplate,
  zurich: ZurichTemplate,
  porto: PortoTemplate,
  barcelona: BarcelonaTemplate,
  vienna: ViennaTemplate,
  berlin: BerlinTemplate,
  stockholm: StockholmTemplate,
  dublin: DublinTemplate,
  helsinki: HelsinkiTemplate,
  lagos: LagosTemplate,
  seoul: SeoulTemplate,
  copenhagen: CopenhagenTemplate,
  genevanoir: GenevanoirTemplate,
  reykjavik: ReykjavikTemplate,
  apex: ApexTemplate,
  nova: NovaTemplate,
  cascade: CascadeTemplate,
  onyx: OnyxTemplate,
  mosaic: MosaicTemplate,
  larsson: LarssonTemplate,
  thompson: ThompsonTemplate,
  classicmono: ClassicMonoTemplate,
  editorialserif: EditorialSerifTemplate,
  boldblock: BoldBlockTemplate,
  timelinevertical: TimelineVerticalTemplate,
  swissgrid: SwissGridTemplate,
  charcoalclassic: CharcoalClassicTemplate,
  navyexecutive: NavyExecutiveTemplate,
  coralsidebar: CoralSidebarTemplate,
  neobrutalist: NeoBrutalistTemplate,
  sagebotanical: SageBotanicalTemplate,
  terminalcv: TerminalCVTemplate,
  iosappcv: IOSAppCVTemplate,
  datadriven: DataDrivenTemplate,
  boardingpass: BoardingPassTemplate,
  magazinespread: MagazineSpreadTemplate,
  legalbrief: LegalBriefTemplate,
  engraved: EngravedTemplate,
  chalkboard: ChalkboardTemplate,
  academiccv: AcademicCVTemplate,
  psychologist: PsychologistTemplate,
  chefmenu: ChefMenuTemplate,
  sommelier: SommelierTemplate,
  hotelcv: HotelCVTemplate,
  bartendercv: BartenderCVTemplate,
  postcardcv: PostcardCVTemplate,
  frontpage: FrontPageTemplate,
  vinylcv: VinylCVTemplate,
  callsheet: CallSheetTemplate,
  copywritermag: CopywriterMagTemplate,
  animatorcv: AnimatorCVTemplate,
  codeeditor: CodeEditorTemplate,
  civileng: CivilEngTemplate,
  mechanical: MechanicalTemplate,
  devopsterminal: DevOpsTerminalTemplate,
  processflow: ProcessFlowTemplate,
  medicalchart: MedicalChartTemplate,
  vitalsigns: VitalSignsTemplate,
  vetcv: VetCVTemplate,
  fieldjournal: FieldJournalTemplate,
  notebookcv: NotebookCVTemplate,
  pilotlog: PilotLogTemplate,
  onboardingform: OnboardingFormTemplate,
  athletecard: AthleteCardTemplate,
  translatorcv: TranslatorCVTemplate,
  herbariumcv: HerbariumCVTemplate,
  risodesigner: RisoDesignerTemplate,
  uxtokens: UXTokensTemplate,
  sketchbookillustrator: SketchbookIllustratorTemplate,
  blueprintcv: BlueprintCVTemplate,
  contactsheet: ContactSheetTemplate,
  annualreport: AnnualReportTemplate,
  financeterminal: FinanceTerminalTemplate,
  campaignposter: CampaignPosterTemplate,
  salespitch: SalesPitchTemplate,
  ledgercv: LedgerCVTemplate,
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

export default function ResumePreview({ overrideTemplateId }: { overrideTemplateId?: string }) {
  const { config } = useResumeStore()
  const effectiveTemplateId = overrideTemplateId ?? config.templateId
  const Template = TEMPLATE_MAP[effectiveTemplateId as keyof typeof TEMPLATE_MAP] ?? ClassicTemplate

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
        className="bg-white shadow-2xl print:shadow-none resume-pages"
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
