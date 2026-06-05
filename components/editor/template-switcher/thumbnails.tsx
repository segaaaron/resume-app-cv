import React from "react"
import dynamic from "next/dynamic"
import {
  ClassicThumb, ModernThumb, SidebarResumeThumb, ElegantResumeThumb,
  ProfessionalThumb, ExecutiveResumeThumb, MinimalResumeThumb,
  CarbonThumb, VerticalThumb, HorizontalThumb, GlassThumb, NeonThumb,
  BauhausThumb, OutlineThumb, StripeThumb,
} from "./thumbnails-free"
import {
  AuroraThumb, LumiereThumb, ConsulThumb, RoseThumb,
  BannerThumb, VertexThumb,
} from "./thumbnails-pro-a"
import {
  KyotoThumb, GenevaThumb, WindsorThumb, MilanThumb,
  ZurichThumb, PortoThumb, BarcelonaThumb, ViennaThumb, BerlinThumb,
  StockholmThumb, DublinThumb, HelsinkiThumb, LagosThumb, SeoulThumb,
  CopenhagenThumb, GenevanoirThumb, ReykjavikThumb,
} from "./thumbnails-pro-b"

// Pro-C is split into 3 lazy chunks. Each chunk loads only when one of its
// templates is requested, keeping initial bundle small. PRO-C templates are
// ~100 SVGs; loading them all eagerly was the bottleneck before this split.
const Skeleton = () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />

const ProC1 = dynamic(() => import("./thumbnails-pro-c1"), { ssr: false, loading: () => <Skeleton /> })
const ProC2 = dynamic(() => import("./thumbnails-pro-c2"), { ssr: false, loading: () => <Skeleton /> })
const ProC3 = dynamic(() => import("./thumbnails-pro-c3"), { ssr: false, loading: () => <Skeleton /> })

export function ResumeThumbnail({ id, color }: { id: string; color: string }) {
  switch (id) {
    case "classic":      return <ClassicThumb color={color} />
    case "modern":       return <ModernThumb color={color} />
    case "sidebar":      return <SidebarResumeThumb color={color} />
    case "elegant":      return <ElegantResumeThumb color={color} />
    case "professional": return <ProfessionalThumb color={color} />
    case "executive":    return <ExecutiveResumeThumb color={color} />
    case "minimal":      return <MinimalResumeThumb color={color} />
    case "carbon":       return <CarbonThumb color={color} />
    case "vertical":     return <VerticalThumb color={color} />
    case "horizontal":   return <HorizontalThumb color={color} />
    case "glass":        return <GlassThumb color={color} />
    case "neon":         return <NeonThumb color={color} />
    case "bauhaus":      return <BauhausThumb color={color} />
    case "outline":      return <OutlineThumb color={color} />
    case "stripe":       return <StripeThumb color={color} />
    // Pro
    case "aurora":       return <AuroraThumb color={color} />
    case "lumiere":      return <LumiereThumb color={color} />
    case "consul":       return <ConsulThumb color={color} />
    case "rose":         return <RoseThumb color={color} />
    case "banner":       return <BannerThumb color={color} />
    case "vertex":       return <VertexThumb color={color} />
    case "kyoto":        return <KyotoThumb color={color} />
    case "geneva":       return <GenevaThumb color={color} />
    case "windsor":      return <WindsorThumb color={color} />
    case "milan":        return <MilanThumb color={color} />
    case "zurich":       return <ZurichThumb color={color} />
    case "porto":        return <PortoThumb color={color} />
    case "barcelona":    return <BarcelonaThumb color={color} />
    case "vienna":       return <ViennaThumb color={color} />
    case "berlin":       return <BerlinThumb color={color} />
    case "stockholm":    return <StockholmThumb color={color} />
    case "dublin":       return <DublinThumb color={color} />
    case "helsinki":     return <HelsinkiThumb color={color} />
    case "lagos":        return <LagosThumb color={color} />
    case "seoul":        return <SeoulThumb color={color} />
    case "copenhagen":   return <CopenhagenThumb color={color} />
    case "genevanoir":   return <GenevanoirThumb color={color} />
    case "reykjavik":    return <ReykjavikThumb color={color} />

    // ── Pro-C Group 1 (specialty/creative) — lazy-loaded ──
    case "classicmono":
    case "editorialserif":
    case "boldblock":
    case "timelinevertical":
    case "swissgrid":
    case "apex":
    case "nova":
    case "cascade":
    case "onyx":
    case "mosaic":
    case "thompson":
    case "larsson":
    case "charcoalclassic":
    case "navyexecutive":
    case "coralsidebar":
    case "sagebotanical":
    case "iosappcv":
    case "datadriven":
    case "magazinespread":
    case "civileng":
    case "processflow":
    case "frontpage":
    case "vinylcv":
    case "callsheet":
    case "copywritermag":
    case "animatorcv":
    case "chefmenu":
    case "sommelier":
    case "hotelcv":
    case "bartendercv":
    case "legalbrief":
    case "engraved":
    case "chalkboard":
    case "academiccv":
    case "psychologist":
    case "pilotlog":
    case "onboardingform":
    case "athletecard":
    case "translatorcv":
    case "herbariumcv":
    case "risodesigner":
    case "uxtokens":
    case "blueprintcv":
    case "annualreport":
    case "financeterminal":
    case "campaignposter":
    case "salespitch":
    case "ledgercv":
      return <ProC1 id={id} color={color} />

    // ── Pro-C Group 2 (city/style) — lazy-loaded ──
    case "cobalt":
    case "duality":
    case "havana":
    case "helix":
    case "lisbon":
    case "nautical":
    case "prism":
    case "tokyo":
    case "vitae":
    case "medicalchart":
    case "vitalsigns":
    case "vetcv":
    case "ats":
    case "casual":
    case "circular":
    case "coral":
    case "fold":
    case "luxurious":
    case "metro":
    case "riviera":
    case "sharp":
    case "spark":
    case "vogue":
      return <ProC2 id={id} color={color} />

    // ── Pro-C Group 3 (elite/exec/luxe/tpl/show) — lazy-loaded ──
    case "elite-atlas":
    case "exec-porcelain":
    case "luxe-noir":
    case "elite-counsel":
    case "elite-aura":
    case "elite-pulse":
    case "elite-cuvee":
    case "elite-cadence":
    case "elite-meridian":
    case "luxe-aurum":
    case "luxe-vellum":
    case "luxe-regent":
    case "luxe-apex":
    case "exec-regency":
    case "exec-sovereign":
    case "exec-citadel":
    case "exec-dynasty":
    case "exec-oxblood":
    case "exec-cobalt":
    case "exec-terra":
    case "exec-nocturne":
    case "exec-platine":
    case "atelier":
    case "bloom":
    case "velvet":
    case "sahara":
    case "pearl":
    case "editorial2":
    case "confetti":
    case "frame":
    case "show-cameo":
    case "show-marquis":
    case "show-soiree":
    case "show-plume":
    case "chef":
    case "teacher":
    case "journalist":
    case "communicator":
    case "filmmaker":
    case "photographer":
    case "architect":
    case "doctor":
    case "fashion":
    case "writer":
      return <ProC3 id={id} color={color} />

    default: return <ClassicThumb color={color} />
  }
}
