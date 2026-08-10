"use client"

import { useTranslations, useLocale } from "next-intl"
import { SECTION_LABELS } from "@/types/resume"
import {
  createContext,
  memo,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  ChevronRight,
  User,
  FileText,
  Briefcase,
  BookOpen,
  CheckCircle2,
  Star,
  Users,
  UserPlus,
  Smile,
  BarChart2,
  Globe,
  Layout,
} from "lucide-react"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection } from "@/types/resume"
import SectionContent from "./SectionContent"

const SECTION_ICONS: Record<string, React.ReactNode> = {
  personalDetails: <User className="w-5 h-5" strokeWidth={1.8} />,
  summary: <FileText className="w-5 h-5" strokeWidth={1.8} />,
  workExperience: <Briefcase className="w-5 h-5" strokeWidth={1.8} />,
  education: <BookOpen className="w-5 h-5" strokeWidth={1.8} />,
  certifications: <CheckCircle2 className="w-5 h-5" strokeWidth={1.8} />,
  projects: <Star className="w-5 h-5" strokeWidth={1.8} />,
  volunteer: <Users className="w-5 h-5" strokeWidth={1.8} />,
  references: <UserPlus className="w-5 h-5" strokeWidth={1.8} />,
  hobbies: <Smile className="w-5 h-5" strokeWidth={1.8} />,
  skills: <BarChart2 className="w-5 h-5" strokeWidth={1.8} />,
  languages: <Globe className="w-5 h-5" strokeWidth={1.8} />,
}

// Tokens
const NAVY = "#0B1B3D"
const CYAN = "#00E5FF"
const CYAN_DIM = "rgba(0,229,255,0.12)"
const SUBTLE = "#94A3B8"
const SURFACE2 = "#F1F5F9"

const COLLAPSED_BG = "linear-gradient(135deg, rgba(236,254,255,0.7) 0%, rgba(239,246,255,0.5) 100%)"
const COLLAPSED_BORDER = "#cffafe"
const EXPANDED_GRADIENT =
  "linear-gradient(135deg, #E8F4FD 0%, #EDF6FB 50%, #E6F0FA 100%)"

// ---- Single-active-accordion context ----
interface SectionAccordionContextValue {
  expandedId: string | null
  setExpandedId: (id: string | null) => void
}

const SectionAccordionContext = createContext<SectionAccordionContextValue>({
  expandedId: null,
  setExpandedId: () => {},
})

export function SectionDropdownProvider({ children }: { children: ReactNode }) {
  const pd = useResumeStore.getState().sectionData.personalDetails as
    | { firstName?: string; lastName?: string; email?: string; jobTitle?: string }
    | undefined
  const hasData = pd && (pd.firstName || pd.lastName || pd.email || pd.jobTitle)
  const [expandedId, setExpandedId] = useState<string | null>(hasData ? null : "personalDetails")
  const accordionValue = useMemo(() => ({ expandedId, setExpandedId }), [expandedId])
  return (
    <SectionAccordionContext.Provider value={accordionValue}>
      {children}
    </SectionAccordionContext.Provider>
  )
}


const SectionBlock = memo(function SectionBlock({ section }: { section: ResumeSection }) {
  const t = useTranslations("editor")
  const locale = useLocale()
  const localizedLabel = SECTION_LABELS[locale as "es" | "en"]?.[section.type] ?? section.label
  const [hovered, setHovered] = useState(false)
  const itemCount = useResumeStore((s) => {
    const val = (s.sectionData as unknown as Record<string, unknown>)[section.type]
    return Array.isArray(val) ? val.length : null
  })
  const { expandedId, setExpandedId } = useContext(SectionAccordionContext)
  const open = expandedId === section.id
  const setOpen = (val: boolean) => setExpandedId(val ? section.id : null)

  const sortableStyle: CSSProperties = {}

  const SectionIcon =
    SECTION_ICONS[section.type] ?? <Layout className="w-5 h-5" strokeWidth={1.8} />
  const descriptionText =
    itemCount !== null && itemCount > 0
      ? t(itemCount === 1 ? "section_item_one" : "section_item_other", { count: itemCount })
      : localizedLabel

  // Container — all values are conditional on state, keep inline
  const containerStyle: CSSProperties = {
    border: open || hovered ? "1px solid transparent" : `1px solid ${COLLAPSED_BORDER}`,
    borderRadius: 12,
    marginBottom: 12,
    background: open || hovered ? EXPANDED_GRADIENT : COLLAPSED_BG,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    /**
     * The OPEN section sits above its siblings.
     *
     * Every card is `position: relative` with no z-index, so painting order was
     * pure DOM order: a popover inside one section (the skills autocomplete) was
     * covered by the cards that happen to come after it, no matter how high its
     * own z-index went — z-index only competes inside the same stacking context.
     * Only one section is open at a time, so lifting it is unambiguous, and
     * hover gets a smaller lift because `transform` already creates a context.
     */
    zIndex: open ? 20 : hovered ? 1 : undefined,
    boxShadow: open
      ? "0 0 0 2px #93C5E8, 0 12px 32px rgba(59,130,180,0.12)"
      : hovered
      ? "0 8px 24px rgba(0,0,0,0.05)"
      : section.pageBreakBefore
      ? `inset 0 2px 0 0 ${CYAN}`
      : "none",
    transform: hovered && !open ? "translateY(-1.5px)" : "translateY(0)",
    ...sortableStyle,
  }

  // Icon box — transform/bg are state-driven, keep inline
  const iconBoxStyle: CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: hovered ? "rgba(0,100,180,0.18)" : SURFACE2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: NAVY,
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    border: "1px solid transparent",
    transform: hovered ? "scale(1.15) rotate(-3deg)" : "scale(1) rotate(0)",
    boxShadow: hovered ? "0 4px 12px rgba(0,229,255,0.1)" : "none",
    flexShrink: 0,
  }

  // Expand button — bg/color/rotation are state-driven, keep inline
  const expandBtnStyle: CSSProperties = {
    width: 32,
    height: 32,
    border: "none",
    background: open ? CYAN_DIM : hovered ? SURFACE2 : "transparent",
    color: open ? NAVY : SUBTLE,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transform: open ? "rotate(90deg)" : "rotate(0)",
    cursor: "pointer",
    flexShrink: 0,
  }

  // Body: all static values — expressed via className below

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      suppressHydrationWarning
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-[14px] cursor-pointer select-none"
        onClick={(e) => {
          if ((e.target as Element).closest("[data-no-toggle]")) return
          setOpen(!open)
        }}
      >
        <div style={iconBoxStyle}>{SectionIcon}</div>

        <div className="flex-1 ml-1 min-w-0">
          <div className="text-[14px] font-bold text-[#0B1B3D] tracking-[-0.015em] leading-[1.2]">
            {localizedLabel}
          </div>
          <div className="flex items-center gap-[6px] text-[11px] text-[#475569] font-medium mt-[3px]">
            {section.visible && (
              <span className="w-[6px] h-[6px] rounded-full shrink-0 inline-block bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            )}
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {descriptionText}
            </span>
          </div>
        </div>

        <button
          type="button"
          style={expandBtnStyle}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          aria-label={open ? t("section_collapse") : t("section_expand")}
          aria-expanded={open}
        >
          <ChevronRight style={{ width: 20, height: 20 }} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="editor-section-body block px-6 pt-5 pb-6 border-t border-[#F1F5F9] bg-white rounded-b-xl">
          <SectionContent section={section} />
        </div>
      )}
    </div>
  )
})
export default SectionBlock
