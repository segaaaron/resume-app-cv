"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

function TemplateSkeleton() {
  return (
    <div className="w-full min-h-[297mm] bg-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
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
  casual:                dynamic(() => import("./templates/Casual"),                { ssr: false, loading }),
  luxurious:             dynamic(() => import("./templates/Luxurious"),             { ssr: false, loading }),
  metro:                 dynamic(() => import("./templates/Metro"),                 { ssr: false, loading }),
  ats:                   dynamic(() => import("./templates/ATS"),                   { ssr: false, loading }),
  atsmeridian:           dynamic(() => import("./templates/AtsMeridian"),           { ssr: false, loading }),
  atsverdant:            dynamic(() => import("./templates/AtsVerdant"),            { ssr: false, loading }),
  atscardinal:           dynamic(() => import("./templates/AtsCardinal"),           { ssr: false, loading }),
  atscobalt:             dynamic(() => import("./templates/AtsCobalt"),             { ssr: false, loading }),
  atsslate:              dynamic(() => import("./templates/AtsSlate"),              { ssr: false, loading }),
  atsnordic:             dynamic(() => import("./templates/AtsNordic"),             { ssr: false, loading }),
  atsonyx:               dynamic(() => import("./templates/AtsOnyx"),               { ssr: false, loading }),
  atssable:              dynamic(() => import("./templates/AtsSable"),              { ssr: false, loading }),
  atscerulean:           dynamic(() => import("./templates/AtsCerulean"),           { ssr: false, loading }),
  atsgarnet:             dynamic(() => import("./templates/AtsGarnet"),             { ssr: false, loading }),
  atscopper:             dynamic(() => import("./templates/AtsCopper"),             { ssr: false, loading }),
  atsharbor:             dynamic(() => import("./templates/AtsHarbor"),             { ssr: false, loading }),
  atsgraphite:           dynamic(() => import("./templates/AtsGraphite"),           { ssr: false, loading }),
  atssequoia:            dynamic(() => import("./templates/AtsSequoia"),            { ssr: false, loading }),
  sharp:                 dynamic(() => import("./templates/Sharp"),                 { ssr: false, loading }),
  glass:                 dynamic(() => import("./templates/Glass"),                 { ssr: false, loading }),
  neon:                  dynamic(() => import("./templates/Neon"),                  { ssr: false, loading }),
  sidebar:               dynamic(() => import("./templates/Sidebar"),               { ssr: false, loading }),
  fold:                  dynamic(() => import("./templates/Fold"),                  { ssr: false, loading }),
  bauhaus:               dynamic(() => import("./templates/Bauhaus"),               { ssr: false, loading }),
  outline:               dynamic(() => import("./templates/Outline"),               { ssr: false, loading }),
  spark:                 dynamic(() => import("./templates/Spark"),                 { ssr: false, loading }),
  carbon:                dynamic(() => import("./templates/Carbon"),                { ssr: false, loading }),
  riviera:               dynamic(() => import("./templates/Riviera"),               { ssr: false, loading }),
  stripe:                dynamic(() => import("./templates/Stripe"),                { ssr: false, loading }),
  vogue:                 dynamic(() => import("./templates/Vogue"),                 { ssr: false, loading }),
  coral:                 dynamic(() => import("./templates/Coral"),                 { ssr: false, loading }),
  aurora:                dynamic(() => import("./templates/Aurora"),                { ssr: false, loading }),
  lumiere:               dynamic(() => import("./templates/Lumiere"),               { ssr: false, loading }),
  consul:                dynamic(() => import("./templates/Consul"),                { ssr: false, loading }),
  rose:                  dynamic(() => import("./templates/Rose"),                  { ssr: false, loading }),
  minimal:               dynamic(() => import("./templates/Minimal"),               { ssr: false, loading }),
  banner:                dynamic(() => import("./templates/Banner"),                { ssr: false, loading }),
  vertex:                dynamic(() => import("./templates/Vertex"),                { ssr: false, loading }),
  kyoto:                 dynamic(() => import("./templates/Kyoto"),                 { ssr: false, loading }),
  geneva:                dynamic(() => import("./templates/Geneva"),                { ssr: false, loading }),
  windsor:               dynamic(() => import("./templates/Windsor"),               { ssr: false, loading }),
  milan:                 dynamic(() => import("./templates/Milan"),                 { ssr: false, loading }),
  porto:                 dynamic(() => import("./templates/Porto"),                 { ssr: false, loading }),
  vienna:                dynamic(() => import("./templates/Vienna"),                { ssr: false, loading }),
  berlin:                dynamic(() => import("./templates/Berlin"),                { ssr: false, loading }),
  stockholm:             dynamic(() => import("./templates/Stockholm"),             { ssr: false, loading }),
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
  sagebotanical:         dynamic(() => import("./templates/SageBotanical"),         { ssr: false, loading }),
  datadriven:            dynamic(() => import("./templates/DataDriven"),            { ssr: false, loading }),
  legalbrief:            dynamic(() => import("./templates/LegalBrief"),            { ssr: false, loading }),
  engraved:              dynamic(() => import("./templates/Engraved"),              { ssr: false, loading }),
  academiccv:            dynamic(() => import("./templates/AcademicCV"),            { ssr: false, loading }),
  translatorcv:          dynamic(() => import("./templates/TranslatorCV"),          { ssr: false, loading }),
  risodesigner:          dynamic(() => import("./templates/RisoDesigner"),          { ssr: false, loading }),
  uxtokens:              dynamic(() => import("./templates/UXTokens"),              { ssr: false, loading }),
  blueprintcv:           dynamic(() => import("./templates/BlueprintCV"),           { ssr: false, loading }),
  salespitch:            dynamic(() => import("./templates/SalesPitch"),            { ssr: false, loading }),
  cobalt:                dynamic(() => import("./templates/Cobalt"),                { ssr: false, loading }),
  duality:               dynamic(() => import("./templates/Duality"),               { ssr: false, loading }),
  havana:                dynamic(() => import("./templates/Havana"),                { ssr: false, loading }),
  helix:                 dynamic(() => import("./templates/Helix"),                 { ssr: false, loading }),
  lisbon:                dynamic(() => import("./templates/Lisbon"),                { ssr: false, loading }),
  nautical:              dynamic(() => import("./templates/Nautical"),              { ssr: false, loading }),
  prism:                 dynamic(() => import("./templates/Prism"),                 { ssr: false, loading }),
  tokyo:                 dynamic(() => import("./templates/Tokyo"),                 { ssr: false, loading }),
  vitae:                 dynamic(() => import("./templates/Vitae"),                 { ssr: false, loading }),
  // ─── Elite / Exec / Luxe (planillas-lujosas-Jun-2026) ───
  "elite-atlas":         dynamic(() => import("./templates/EliteAtlas"),            { ssr: false, loading }),
  "exec-porcelain":      dynamic(() => import("./templates/ExecPorcelain"),         { ssr: false, loading }),
  "luxe-noir":           dynamic(() => import("./templates/LuxeNoir"),              { ssr: false, loading }),
  "elite-counsel":       dynamic(() => import("./templates/EliteCounsel"),          { ssr: false, loading }),
  "elite-aura":          dynamic(() => import("./templates/EliteAura"),             { ssr: false, loading }),
  "elite-pulse":         dynamic(() => import("./templates/ElitePulse"),            { ssr: false, loading }),
  "elite-cuvee":         dynamic(() => import("./templates/EliteCuvee"),            { ssr: false, loading }),
  "elite-cadence":       dynamic(() => import("./templates/EliteCadence"),          { ssr: false, loading }),
  "elite-meridian":      dynamic(() => import("./templates/EliteMeridian"),         { ssr: false, loading }),
  "luxe-vellum":         dynamic(() => import("./templates/LuxeVellum"),            { ssr: false, loading }),
  "luxe-regent":         dynamic(() => import("./templates/LuxeRegent"),            { ssr: false, loading }),
  "luxe-apex":           dynamic(() => import("./templates/LuxeApex"),              { ssr: false, loading }),
  "exec-regency":        dynamic(() => import("./templates/ExecRegency"),           { ssr: false, loading }),
  "exec-sovereign":      dynamic(() => import("./templates/ExecSovereign"),         { ssr: false, loading }),
  "exec-citadel":        dynamic(() => import("./templates/ExecCitadel"),           { ssr: false, loading }),
  "exec-dynasty":        dynamic(() => import("./templates/ExecDynasty"),           { ssr: false, loading }),
  "exec-cobalt":         dynamic(() => import("./templates/ExecCobalt"),            { ssr: false, loading }),
  "exec-nocturne":       dynamic(() => import("./templates/ExecNocturne"),          { ssr: false, loading }),
  "exec-platine":        dynamic(() => import("./templates/ExecPlatine"),           { ssr: false, loading }),
  // ─── Signature / Tpl series (planillas-lujosas-Jun-2026) ───
  "atelier":             dynamic(() => import("./templates/TplAtelier"),            { ssr: false, loading }),
  "bloom":               dynamic(() => import("./templates/TplBloom"),              { ssr: false, loading }),
  "velvet":              dynamic(() => import("./templates/TplVelvet"),             { ssr: false, loading }),
  "sahara":              dynamic(() => import("./templates/TplSahara"),             { ssr: false, loading }),
  "pearl":               dynamic(() => import("./templates/TplPearl"),              { ssr: false, loading }),
  // ─── Flagship Premium ───
  "editorial2":          dynamic(() => import("./templates/TplGazette"),            { ssr: false, loading }),
  "confetti":            dynamic(() => import("./templates/TplConfetti"),           { ssr: false, loading }),
  "frame":               dynamic(() => import("./templates/TplFrame"),              { ssr: false, loading }),
  // ─── Showcase ───
  "show-cameo":          dynamic(() => import("./templates/ShowCameo"),             { ssr: false, loading }),
  "show-marquis":        dynamic(() => import("./templates/ShowMarquis"),           { ssr: false, loading }),
  "show-soiree":         dynamic(() => import("./templates/ShowSoiree"),            { ssr: false, loading }),
  "show-plume":          dynamic(() => import("./templates/ShowPlume"),             { ssr: false, loading }),
  // ─── By Profession — A ───
  "chef":                dynamic(() => import("./templates/TplChef"),               { ssr: false, loading }),
  "teacher":             dynamic(() => import("./templates/TplTeacher"),            { ssr: false, loading }),
  "journalist":          dynamic(() => import("./templates/TplJournalist"),         { ssr: false, loading }),
  "communicator":        dynamic(() => import("./templates/TplCommunicator"),       { ssr: false, loading }),
  "filmmaker":           dynamic(() => import("./templates/TplFilmmaker"),          { ssr: false, loading }),
  // ─── By Profession — B ───
  "photographer":        dynamic(() => import("./templates/TplPhotographer"),       { ssr: false, loading }),
  "architect":           dynamic(() => import("./templates/TplArchitect"),          { ssr: false, loading }),
  "doctor":              dynamic(() => import("./templates/TplDoctor"),             { ssr: false, loading }),
  "fashion":             dynamic(() => import("./templates/TplFashion"),            { ssr: false, loading }),
  "writer":              dynamic(() => import("./templates/TplWriter"),             { ssr: false, loading }),
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
  const { config } = useResumeStore(useShallow((s) => ({ config: s.config })))
  const [mounted, setMounted] = useState(false)

  // The canonical mounted guard: the preview reads browser-only APIs below, and the
  // server has no equivalent to render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const existingLink = document.head.querySelector(`link[data-font="${config.fontFamily}"]`)
    if (existingLink) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = buildFontUrl(config.fontFamily)
    link.setAttribute("data-font", config.fontFamily)
    document.head.appendChild(link)
    // No remover — las fonts se acumulan en cache del browser, está bien
  }, [config.fontFamily])

  const effectiveTemplateId = overrideTemplateId ?? config.templateId
  const Template = TEMPLATE_MAP[effectiveTemplateId] ?? TEMPLATE_MAP["classic"]

  const scale = config.fontSize / BASE_FONT
  // Compensated dimensions: visually always 210×297mm regardless of zoom
  const cssWidth = `${(210 / scale).toFixed(4)}mm`
  const cssMinHeight = `${(297 / scale).toFixed(4)}mm`

  return (
    <>
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
