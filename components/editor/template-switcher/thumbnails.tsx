import React from "react"
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
import {
  ClassicMonoThumb, EditorialSerifThumb, BoldBlockThumb, TimelineVerticalThumb,
  SwissGridThumb, ApexThumb, NovaThumb, CascadeThumb, OnyxThumb, MosaicThumb,
  ThompsonThumb, LarssonThumb, CharcoalClassicThumb, NavyExecutiveThumb,
  CoralSidebarThumb, SageBotanicalThumb,
  IOSAppCVThumb, DataDrivenThumb, MagazineSpreadThumb,
  CivilEngThumb,
  ProcessFlowThumb, FrontPageThumb, VinylCVThumb, CallSheetThumb,
  CopywriterMagThumb, AnimatorCVThumb, ChefMenuThumb, SommelierThumb,
  HotelCVThumb, BartenderCVThumb, LegalBriefThumb,
  EngravedThumb, ChalkboardThumb, AcademicCVThumb, PsychologistThumb,
  PilotLogThumb, OnboardingFormThumb, AthleteCardThumb, TranslatorCVThumb,
  HerbariumCVThumb, RisoDesignerThumb, UXTokensThumb,
  BlueprintCVThumb, AnnualReportThumb, FinanceTerminalThumb,
  CampaignPosterThumb, SalesPitchThumb, LedgerCVThumb, CobaltThumb,
  DualityThumb, HavanaThumb, HelixThumb, LisbonThumb, NauticalThumb,
  PrismThumb, TokyoThumb, VitaeThumb, MedicalChartThumb,
  VitalSignsThumb, VetCVThumb,
  ATSThumb, CasualThumb, CircularThumb, CoralThumb,
  FoldThumb, LuxuriousThumb, MetroThumb, RivieraThumb, SharpThumb,
  SparkThumb, VogueThumb,
} from "./thumbnails-pro-c"

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
    case "apex":         return <ApexThumb color={color} />
    case "nova":         return <NovaThumb color={color} />
    case "cascade":      return <CascadeThumb color={color} />
    case "onyx":         return <OnyxThumb color={color} />
    case "mosaic":       return <MosaicThumb color={color} />
    case "larsson":         return <LarssonThumb color={color} />
    case "thompson":        return <ThompsonThumb color={color} />
    case "classicmono":     return <ClassicMonoThumb color={color} />
    case "editorialserif":  return <EditorialSerifThumb color={color} />
    case "boldblock":       return <BoldBlockThumb color={color} />
    case "timelinevertical":return <TimelineVerticalThumb color={color} />
    case "swissgrid":       return <SwissGridThumb color={color} />
    case "charcoalclassic":  return <CharcoalClassicThumb color={color} />
    case "navyexecutive":    return <NavyExecutiveThumb color={color} />
    case "coralsidebar":     return <CoralSidebarThumb color={color} />
    case "sagebotanical":    return <SageBotanicalThumb color={color} />
    case "iosappcv":         return <IOSAppCVThumb color={color} />
    case "datadriven":       return <DataDrivenThumb color={color} />
    case "magazinespread":   return <MagazineSpreadThumb color={color} />
    case "legalbrief":       return <LegalBriefThumb color={color} />
    case "engraved":         return <EngravedThumb color={color} />
    case "chalkboard":       return <ChalkboardThumb color={color} />
    case "academiccv":       return <AcademicCVThumb color={color} />
    case "psychologist":     return <PsychologistThumb color={color} />
    case "chefmenu":         return <ChefMenuThumb color={color} />
    case "sommelier":        return <SommelierThumb color={color} />
    case "hotelcv":          return <HotelCVThumb color={color} />
    case "bartendercv":      return <BartenderCVThumb color={color} />
    case "medicalchart":     return <MedicalChartThumb color={color} />
    case "vitalsigns":       return <VitalSignsThumb color={color} />
    case "vetcv":            return <VetCVThumb color={color} />
    case "pilotlog":         return <PilotLogThumb color={color} />
    case "onboardingform":   return <OnboardingFormThumb color={color} />
    case "athletecard":      return <AthleteCardThumb color={color} />
    case "translatorcv":     return <TranslatorCVThumb color={color} />
    case "herbariumcv":      return <HerbariumCVThumb color={color} />
    case "frontpage":        return <FrontPageThumb color={color} />
    case "vinylcv":          return <VinylCVThumb color={color} />
    case "callsheet":        return <CallSheetThumb color={color} />
    case "copywritermag":    return <CopywriterMagThumb color={color} />
    case "animatorcv":       return <AnimatorCVThumb color={color} />
    case "civileng":         return <CivilEngThumb color={color} />
    case "processflow":           return <ProcessFlowThumb color={color} />
    case "risodesigner":          return <RisoDesignerThumb color={color} />
    case "uxtokens":              return <UXTokensThumb color={color} />
    case "blueprintcv":           return <BlueprintCVThumb color={color} />
    case "annualreport":          return <AnnualReportThumb color={color} />
    case "financeterminal":       return <FinanceTerminalThumb color={color} />
    case "campaignposter":        return <CampaignPosterThumb color={color} />
    case "salespitch":            return <SalesPitchThumb color={color} />
    case "ledgercv":              return <LedgerCVThumb color={color} />
    case "cobalt":         return <CobaltThumb color={color} />
    case "duality":        return <DualityThumb color={color} />
    case "havana":         return <HavanaThumb color={color} />
    case "helix":          return <HelixThumb color={color} />
    case "lisbon":         return <LisbonThumb color={color} />
    case "nautical":       return <NauticalThumb color={color} />
    case "prism":          return <PrismThumb color={color} />
    case "tokyo":          return <TokyoThumb color={color} />
    case "vitae":          return <VitaeThumb color={color} />
    case "ats":          return <ATSThumb color={color} />
    case "casual":       return <CasualThumb color={color} />
    case "circular":     return <CircularThumb color={color} />
    case "coral":        return <CoralThumb color={color} />
    case "fold":         return <FoldThumb color={color} />
    case "luxurious":    return <LuxuriousThumb color={color} />
    case "metro":        return <MetroThumb color={color} />
    case "riviera":      return <RivieraThumb color={color} />
    case "sharp":        return <SharpThumb color={color} />
    case "spark":        return <SparkThumb color={color} />
    case "vogue":        return <VogueThumb color={color} />
    default:             return <ClassicThumb color={color} />
  }
}
