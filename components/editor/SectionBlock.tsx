"use client"

import { useTranslations } from "next-intl"
import {
  createContext,
  memo,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  Scissors,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections } from "@/types/resume"
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
const BORDER = "#E2E8F0"
const MUTED = "#475569"
const SUBTLE = "#94A3B8"
const SUCCESS = "#10B981"
const SURFACE2 = "#F1F5F9"

const EXPANDED_GRADIENT =
  "linear-gradient(135deg, #E8F4FD 0%, #EDF6FB 50%, #E6F0FA 100%)"

// ---- Single-active-dropdown context ----
interface SectionDropdownContextValue {
  openId: string | null
  setOpenId: (id: string | null) => void
}

const SectionDropdownContext = createContext<SectionDropdownContextValue>({
  openId: null,
  setOpenId: () => {},
})

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
  const [openId, setOpenId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>("personalDetails")
  const dropdownValue = useMemo(() => ({ openId, setOpenId }), [openId])
  const accordionValue = useMemo(() => ({ expandedId, setExpandedId }), [expandedId])
  return (
    <SectionDropdownContext.Provider value={dropdownValue}>
      <SectionAccordionContext.Provider value={accordionValue}>
        {children}
      </SectionAccordionContext.Provider>
    </SectionDropdownContext.Provider>
  )
}

function getItemCount(section: ResumeSection, data: ResumeSections | undefined): number | null {
  if (!data) return null
  const type = section.type as keyof ResumeSections
  const value = (data as unknown as Record<string, unknown>)[type]
  if (Array.isArray(value)) return value.length
  return null
}

const SectionBlock = memo(function SectionBlock({ section }: { section: ResumeSection }) {
  const t = useTranslations("editor")
  const [hovered, setHovered] = useState(false)
  const { toggleSection, togglePageBreak, moveSectionToColumn, sectionData } = useResumeStore()
  const { openId, setOpenId } = useContext(SectionDropdownContext)
  const { expandedId, setExpandedId } = useContext(SectionAccordionContext)
  const open = expandedId === section.id
  const setOpen = (val: boolean) => setExpandedId(val ? section.id : null)
  const menuOpen = openId === section.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.visible ? 1 : 0.6,
  }

  const SectionIcon =
    SECTION_ICONS[section.type] ?? <Layout className="w-5 h-5" strokeWidth={1.8} />

  const itemCount = getItemCount(section, sectionData as ResumeSections | undefined)
  const descriptionText =
    itemCount !== null && itemCount > 0
      ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
      : section.label

  // Container styles
  const containerStyle: CSSProperties = {
    border: open || hovered ? "1px solid transparent" : `1px solid ${BORDER}`,
    borderRadius: 12,
    marginBottom: 12,
    background: open ? EXPANDED_GRADIENT : "#FFFFFF",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
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

  const headStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    cursor: "pointer",
    userSelect: "none",
    gap: 12,
  }

  const gripStyle: CSSProperties = {
    color: hovered ? NAVY : SUBTLE,
    opacity: hovered ? 0.8 : 0.3,
    cursor: "grab",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "none",
    padding: 0,
  }

  const iconBoxStyle: CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: hovered ? CYAN_DIM : SURFACE2,
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

  const infoStyle: CSSProperties = {
    flex: 1,
    marginLeft: 4,
    minWidth: 0,
  }

  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: "-0.015em",
    lineHeight: 1.2,
  }

  const descStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: MUTED,
    fontWeight: 500,
    marginTop: 3,
  }

  const dotStyle: CSSProperties = {
    width: 6,
    height: 6,
    background: SUCCESS,
    borderRadius: "50%",
    boxShadow: "0 0 6px rgba(16,185,129,0.5)",
    display: "inline-block",
    flexShrink: 0,
  }

  const expandBtnStyle: CSSProperties = {
    width: 32,
    height: 32,
    border: "none",
    background: open ? CYAN_DIM : hovered ? SURFACE2 : "transparent",
    color: open ? CYAN : hovered ? NAVY : SUBTLE,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transform: open ? "rotate(90deg)" : "rotate(0)",
    cursor: "pointer",
    flexShrink: 0,
  }

  const moreBtnStyle: CSSProperties = {
    width: 28,
    height: 28,
    border: "none",
    background: hovered ? SURFACE2 : "transparent",
    color: hovered ? NAVY : SUBTLE,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
  }

  const bodyStyle: CSSProperties = {
    display: "block",
    padding: "20px 24px 24px",
    borderTop: `1px solid ${SURFACE2}`,
    background: open ? EXPANDED_GRADIENT : "#FFF",
    borderRadius: "0 0 12px 12px",
  }

  return (
    <div
      ref={setNodeRef}
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      suppressHydrationWarning
    >
      {/* Header */}
      <div
        style={headStyle}
        onClick={(e) => {
          if ((e.target as Element).closest("[data-no-toggle]")) return
          setOpen(!open)
        }}
      >
        <button
          {...attributes}
          {...listeners}
          style={gripStyle}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical style={{ width: 14, height: 20 }} />
        </button>

        <div style={iconBoxStyle}>{SectionIcon}</div>

        <div style={infoStyle}>
          <div style={nameStyle}>{section.label}</div>
          <div style={descStyle}>
            {section.visible && <span style={dotStyle} />}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {descriptionText}
            </span>
          </div>
        </div>

        <div data-no-toggle="">
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(o) => setOpenId(o ? section.id : null)}
          >
            <DropdownMenuTrigger
              style={moreBtnStyle}
              aria-label="Section actions"
            >
              <MoreHorizontal style={{ width: 16, height: 16 }} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toggleSection(section.id)}>
                {section.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {section.visible ? t("section.hide") : t("section.show")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => togglePageBreak(section.id)}>
                <Scissors className="h-3.5 w-3.5" />
                {section.pageBreakBefore ? t("section.remove_page_break") : t("section.add_page_break")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => moveSectionToColumn(section.id, "main")}>
                {t("section.move_to_main")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => moveSectionToColumn(section.id, "side")}>
                {t("section.move_to_side")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          type="button"
          style={expandBtnStyle}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          aria-label={open ? "Collapse section" : "Expand section"}
          aria-expanded={open}
        >
          <ChevronRight style={{ width: 20, height: 20 }} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      {open && (
        <div style={bodyStyle} className="editor-section-body">
          <SectionContent section={section} />
        </div>
      )}
    </div>
  )
})
export default SectionBlock
