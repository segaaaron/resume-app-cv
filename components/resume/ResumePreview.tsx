"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useResumeStore } from "@/stores/resumeStore"

function TemplateSkeleton() {
  return (
    <div className="w-full min-h-[297mm] bg-white relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-100/80 to-transparent" />
    </div>
  )
}

function TemplateError({ retry }: { retry?: () => void }) {
  return (
    <div className="w-full min-h-[297mm] bg-white flex flex-col items-center justify-center gap-2 text-sm text-red-600">
      <span>Template failed to load.</span>
      {retry && <button onClick={retry} className="underline">Retry</button>}
    </div>
  )
}

const loading = ({ error, retry }: { error?: Error | null; retry?: () => void }) =>
  error ? <TemplateError retry={retry} /> : <TemplateSkeleton />

const TEMPLATE_MAP: Record<string, React.ComponentType> = {
  classic:               dynamic(() => import("./templates/Classic"),               { ssr: false, loading }),
  modern:                dynamic(() => import("./templates/Modern"),                { ssr: false, loading }),
  professional:          dynamic(() => import("./templates/Professional"),          { ssr: false, loading }),
  elegant:               dynamic(() => import("./templates/Elegant"),               { ssr: false, loading }),
  circular:              dynamic(() => import("./templates/Circular"),              { ssr: false, loading }),
  vertical:              dynamic(() => import("./templates/Vertical"),              { ssr: false, loading }),
  horizontal:            dynamic(() => import("./templates/Horizontal"),            { ssr: false, loading }),
  simple:                dynamic(() => import("./templates/Simple"),                { ssr: false, loading }),
  chrono:                dynamic(() => import("./templates/Chrono"),                { ssr: false, loading }),
  casual:                dynamic(() => import("./templates/Casual"),                { ssr: false, loading }),
  luxurious:             dynamic(() => import("./templates/Luxurious"),             { ssr: false, loading }),
  metro:                 dynamic(() => import("./templates/Metro"),                 { ssr: false, loading }),
  ats:                   dynamic(() => import("./templates/ATS"),                   { ssr: false, loading }),
  sharp:                 dynamic(() => import("./templates/Sharp"),                 { ssr: false, loading }),
  glass:                 dynamic(() => import("./templates/Glass"),                 { ssr: false, loading }),
  neon:                  dynamic(() => import("./templates/Neon"),                  { ssr: false, loading }),
  nordic:                dynamic(() => import("./templates/Nordic"),                { ssr: false, loading }),
  executive:             dynamic(() => import("./templates/Executive"),             { ssr: false, loading }),
  sidebar:               dynamic(() => import("./templates/Sidebar"),               { ssr: false, loading }),
  fold:                  dynamic(() => import("./templates/Fold"),                  { ssr: false, loading }),
  bauhaus:               dynamic(() => import("./templates/Bauhaus"),               { ssr: false, loading }),
  outline:               dynamic(() => import("./templates/Outline"),               { ssr: false, loading }),
  spark:                 dynamic(() => import("./templates/Spark"),                 { ssr: false, loading }),
  carbon:                dynamic(() => import("./templates/Carbon"),                { ssr: false, loading }),
  blueprint:             dynamic(() => import("./templates/Blueprint"),             { ssr: false, loading }),
  riviera:               dynamic(() => import("./templates/Riviera"),               { ssr: false, loading }),
  stripe:                dynamic(() => import("./templates/Stripe"),                { ssr: false, loading }),
  vogue:                 dynamic(() => import("./templates/Vogue"),                 { ssr: false, loading }),
  coral:                 dynamic(() => import("./templates/Coral"),                 { ssr: false, loading }),
  aurora:                dynamic(() => import("./templates/Aurora"),                { ssr: false, loading }),
  lumiere:               dynamic(() => import("./templates/Lumiere"),               { ssr: false, loading }),
  consul:                dynamic(() => import("./templates/Consul"),                { ssr: false, loading }),
  rose:                  dynamic(() => import("./templates/Rose"),                  { ssr: false, loading }),
  minimal:               dynamic(() => import("./templates/Minimal"),               { ssr: false, loading }),
  wave:                  dynamic(() => import("./templates/Wave"),                  { ssr: false, loading }),
  banner:                dynamic(() => import("./templates/Banner"),                { ssr: false, loading }),
  vertex:                dynamic(() => import("./templates/Vertex"),                { ssr: false, loading }),
  prestige:              dynamic(() => import("./templates/Prestige"),              { ssr: false, loading }),
  oslo:                  dynamic(() => import("./templates/Oslo"),                  { ssr: false, loading }),
  kyoto:                 dynamic(() => import("./templates/Kyoto"),                 { ssr: false, loading }),
  geneva:                dynamic(() => import("./templates/Geneva"),                { ssr: false, loading }),
  windsor:               dynamic(() => import("./templates/Windsor"),               { ssr: false, loading }),
  milan:                 dynamic(() => import("./templates/Milan"),                 { ssr: false, loading }),
  zurich:                dynamic(() => import("./templates/Zurich"),                { ssr: false, loading }),
  porto:                 dynamic(() => import("./templates/Porto"),                 { ssr: false, loading }),
  barcelona:             dynamic(() => import("./templates/Barcelona"),             { ssr: false, loading }),
  vienna:                dynamic(() => import("./templates/Vienna"),                { ssr: false, loading }),
  berlin:                dynamic(() => import("./templates/Berlin"),                { ssr: false, loading }),
  stockholm:             dynamic(() => import("./templates/Stockholm"),             { ssr: false, loading }),
  dublin:                dynamic(() => import("./templates/Dublin"),                { ssr: false, loading }),
  helsinki:              dynamic(() => import("./templates/Helsinki"),              { ssr: false, loading }),
  lagos:                 dynamic(() => import("./templates/Lagos"),                 { ssr: false, loading }),
  seoul:                 dynamic(() => import("./templates/Seoul"),                 { ssr: false, loading }),
  copenhagen:            dynamic(() => import("./templates/Copenhagen"),            { ssr: false, loading }),
  genevanoir:            dynamic(() => import("./templates/GenevaNoir"),            { ssr: false, loading }),
  reykjavik:             dynamic(() => import("./templates/Reykjavik"),             { ssr: false, loading }),
  apex:                  dynamic(() => import("./templates/Apex"),                  { ssr: false, loading }),
  nova:                  dynamic(() => import("./templates/Nova"),                  { ssr: false, loading }),
  cascade:               dynamic(() => import("./templates/Cascade"),               { ssr: false, loading }),
  onyx:                  dynamic(() => import("./templates/Onyx"),                  { ssr: false, loading }),
  mosaic:                dynamic(() => import("./templates/Mosaic"),                { ssr: false, loading }),
  larsson:               dynamic(() => import("./templates/Larsson"),               { ssr: false, loading }),
  thompson:              dynamic(() => import("./templates/Thompson"),              { ssr: false, loading }),
  classicmono:           dynamic(() => import("./templates/ClassicMono"),           { ssr: false, loading }),
  editorialserif:        dynamic(() => import("./templates/EditorialSerif"),        { ssr: false, loading }),
  boldblock:             dynamic(() => import("./templates/BoldBlock"),             { ssr: false, loading }),
  timelinevertical:      dynamic(() => import("./templates/TimelineVertical"),      { ssr: false, loading }),
  swissgrid:             dynamic(() => import("./templates/SwissGrid"),             { ssr: false, loading }),
  charcoalclassic:       dynamic(() => import("./templates/CharcoalClassic"),       { ssr: false, loading }),
  navyexecutive:         dynamic(() => import("./templates/NavyExecutive"),         { ssr: false, loading }),
  coralsidebar:          dynamic(() => import("./templates/CoralSidebar"),          { ssr: false, loading }),
  neobrutalist:          dynamic(() => import("./templates/NeoBrutalist"),          { ssr: false, loading }),
  sagebotanical:         dynamic(() => import("./templates/SageBotanical"),         { ssr: false, loading }),
  terminalcv:            dynamic(() => import("./templates/TerminalCV"),            { ssr: false, loading }),
  iosappcv:              dynamic(() => import("./templates/IOSAppCV"),              { ssr: false, loading }),
  datadriven:            dynamic(() => import("./templates/DataDriven"),            { ssr: false, loading }),
  boardingpass:          dynamic(() => import("./templates/BoardingPass"),          { ssr: false, loading }),
  magazinespread:        dynamic(() => import("./templates/MagazineSpread"),        { ssr: false, loading }),
  legalbrief:            dynamic(() => import("./templates/LegalBrief"),            { ssr: false, loading }),
  engraved:              dynamic(() => import("./templates/Engraved"),              { ssr: false, loading }),
  chalkboard:            dynamic(() => import("./templates/Chalkboard"),            { ssr: false, loading }),
  academiccv:            dynamic(() => import("./templates/AcademicCV"),            { ssr: false, loading }),
  psychologist:          dynamic(() => import("./templates/Psychologist"),          { ssr: false, loading }),
  chefmenu:              dynamic(() => import("./templates/ChefMenu"),              { ssr: false, loading }),
  sommelier:             dynamic(() => import("./templates/Sommelier"),             { ssr: false, loading }),
  hotelcv:               dynamic(() => import("./templates/HotelCV"),               { ssr: false, loading }),
  bartendercv:           dynamic(() => import("./templates/BartenderCV"),           { ssr: false, loading }),
  postcardcv:            dynamic(() => import("./templates/PostcardCV"),            { ssr: false, loading }),
  frontpage:             dynamic(() => import("./templates/FrontPage"),             { ssr: false, loading }),
  vinylcv:               dynamic(() => import("./templates/VinylCV"),               { ssr: false, loading }),
  callsheet:             dynamic(() => import("./templates/CallSheet"),             { ssr: false, loading }),
  copywritermag:         dynamic(() => import("./templates/CopywriterMag"),         { ssr: false, loading }),
  animatorcv:            dynamic(() => import("./templates/AnimatorCV"),            { ssr: false, loading }),
  codeeditor:            dynamic(() => import("./templates/CodeEditor"),            { ssr: false, loading }),
  civileng:              dynamic(() => import("./templates/CivilEng"),              { ssr: false, loading }),
  mechanical:            dynamic(() => import("./templates/Mechanical"),            { ssr: false, loading }),
  devopsterminal:        dynamic(() => import("./templates/DevOpsTerminal"),        { ssr: false, loading }),
  processflow:           dynamic(() => import("./templates/ProcessFlow"),           { ssr: false, loading }),
  medicalchart:          dynamic(() => import("./templates/MedicalChart"),          { ssr: false, loading }),
  vitalsigns:            dynamic(() => import("./templates/VitalSigns"),            { ssr: false, loading }),
  vetcv:                 dynamic(() => import("./templates/VetCV"),                 { ssr: false, loading }),
  fieldjournal:          dynamic(() => import("./templates/FieldJournal"),          { ssr: false, loading }),
  notebookcv:            dynamic(() => import("./templates/NotebookCV"),            { ssr: false, loading }),
  pilotlog:              dynamic(() => import("./templates/PilotLog"),              { ssr: false, loading }),
  onboardingform:        dynamic(() => import("./templates/OnboardingForm"),        { ssr: false, loading }),
  athletecard:           dynamic(() => import("./templates/AthleteCard"),           { ssr: false, loading }),
  translatorcv:          dynamic(() => import("./templates/TranslatorCV"),          { ssr: false, loading }),
  herbariumcv:           dynamic(() => import("./templates/HerbariumCV"),           { ssr: false, loading }),
  risodesigner:          dynamic(() => import("./templates/RisoDesigner"),          { ssr: false, loading }),
  uxtokens:              dynamic(() => import("./templates/UXTokens"),              { ssr: false, loading }),
  sketchbookillustrator: dynamic(() => import("./templates/SketchbookIllustrator"), { ssr: false, loading }),
  blueprintcv:           dynamic(() => import("./templates/BlueprintCV"),           { ssr: false, loading }),
  contactsheet:          dynamic(() => import("./templates/ContactSheet"),          { ssr: false, loading }),
  annualreport:          dynamic(() => import("./templates/AnnualReport"),          { ssr: false, loading }),
  financeterminal:       dynamic(() => import("./templates/FinanceTerminal"),       { ssr: false, loading }),
  campaignposter:        dynamic(() => import("./templates/CampaignPoster"),        { ssr: false, loading }),
  salespitch:            dynamic(() => import("./templates/SalesPitch"),            { ssr: false, loading }),
  ledgercv:              dynamic(() => import("./templates/LedgerCV"),              { ssr: false, loading }),
  cobalt:                dynamic(() => import("./templates/Cobalt"),                { ssr: false, loading }),
  duality:               dynamic(() => import("./templates/Duality"),               { ssr: false, loading }),
  havana:                dynamic(() => import("./templates/Havana"),                { ssr: false, loading }),
  helix:                 dynamic(() => import("./templates/Helix"),                 { ssr: false, loading }),
  lisbon:                dynamic(() => import("./templates/Lisbon"),                { ssr: false, loading }),
  nautical:              dynamic(() => import("./templates/Nautical"),              { ssr: false, loading }),
  obsidian:              dynamic(() => import("./templates/Obsidian"),              { ssr: false, loading }),
  prism:                 dynamic(() => import("./templates/Prism"),                 { ssr: false, loading }),
  tokyo:                 dynamic(() => import("./templates/Tokyo"),                 { ssr: false, loading }),
  vitae:                 dynamic(() => import("./templates/Vitae"),                 { ssr: false, loading }),
  meridian:              dynamic(() => import("./templates/Meridian"),              { ssr: false, loading }),
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const effectiveTemplateId = overrideTemplateId ?? config.templateId
  const Template = TEMPLATE_MAP[effectiveTemplateId] ?? TEMPLATE_MAP["classic"]

  const scale = config.fontSize / BASE_FONT
  // Compensated dimensions: visually always 210×297mm regardless of zoom
  const cssWidth = `${(210 / scale).toFixed(4)}mm`
  const cssMinHeight = `${(297 / scale).toFixed(4)}mm`

  return (
    <>
      {/* Dynamically load the selected Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('${buildFontUrl(config.fontFamily)}');`}</style>

      {/* web app — PDF contract class: "resume-pages" is queried by pdf-generator microservice.
          Do NOT rename without updating services/pdf-generator/src/contracts.ts */}
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
        {mounted ? <Template /> : <TemplateSkeleton />}
      </div>
    </>
  )
}
