"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import SectionBlock, { SectionDropdownProvider } from "./SectionBlock"
import DesignPanel from "./DesignPanel"
import ATSScorePanel from "./ATSScorePanel"
import CVReviewPanel from "./CVReviewPanel"
import AIProGate from "./AIProGate"
import AIProfileFillPanel from "./AIProfileFillPanel"
import { LayoutTemplate, Settings2, Target, MessageSquare } from "lucide-react"

// Tokens
const NAVY = "#0B1B3D"
const CYAN = "#00E5FF"
const BORDER = "#E2E8F0"
const SUBTLE = "#94A3B8"

type TabKey = "content" | "design" | "ats" | "review"

interface TabDef {
  key: TabKey
  label: string
  icon: ReactNode
}

export default function FormPanel() {
  const t = useTranslations("editor")
  const { sections, reorderSections } = useResumeStore()
  const visibleSections = sections.filter((s) => s.visible)
  const hiddenSections = sections.filter((s) => !s.visible)
  const [activeTab, setActiveTab] = useState<TabKey>("content")
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = sections.findIndex((s) => s.id === active.id)
    const toIndex = sections.findIndex((s) => s.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) reorderSections(fromIndex, toIndex)
  }

  const tabs: TabDef[] = [
    {
      key: "content",
      label: t("form.content_tab") || "Content",
      icon: <LayoutTemplate style={{ width: 18, height: 18 }} strokeWidth={1.8} />,
    },
    {
      key: "design",
      label: t("form.design_tab") || "Design",
      icon: <Settings2 style={{ width: 18, height: 18 }} strokeWidth={1.8} />,
    },
    {
      key: "ats",
      label: t("form.ats_tab") || "ATS",
      icon: <Target style={{ width: 18, height: 18 }} strokeWidth={1.8} />,
    },
    {
      key: "review",
      label: t("form.review_tab") || "AI Review",
      icon: <MessageSquare style={{ width: 18, height: 18 }} strokeWidth={1.8} />,
    },
  ]

  // Sidebar container
  const sidebarStyle: CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    borderRight: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    boxShadow: "2px 0 12px rgba(0,0,0,0.02)",
    height: "100%",
    overflow: "hidden",
  }

  const tabsBarStyle: CSSProperties = {
    display: "flex",
    borderBottom: `1px solid ${BORDER}`,
    background: "#FFF",
    flexShrink: 0,
  }

  const getTabStyle = (key: TabKey): CSSProperties => {
    const isActive = activeTab === key
    const isHover = hoveredTab === key
    return {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "16px 4px 12px",
      fontSize: 10,
      fontWeight: 700,
      color: isActive || isHover ? NAVY : SUBTLE,
      borderBottom: isActive ? `2px solid ${CYAN}` : "2px solid transparent",
      cursor: "pointer",
      transition: "all 0.2s ease",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      background: "transparent",
      boxShadow: isActive
        ? "inset 0 -8px 12px -8px rgba(0,212,255,0.4)"
        : "none",
    }
  }

  const scrollAreaStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${BORDER} transparent`,
    minHeight: 0,
  }

  const contentPadStyle: CSSProperties = { padding: "16px 24px 20px" }
  const otherPadStyle: CSSProperties = { padding: "6px 24px 20px" }

  return (
    <aside style={sidebarStyle}>
      {/* Tabs bar */}
      <div style={tabsBarStyle} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            onMouseEnter={() => setHoveredTab(tab.key)}
            onMouseLeave={() => setHoveredTab(null)}
            style={getTabStyle(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={scrollAreaStyle}>
        {activeTab === "content" && (
          <div style={contentPadStyle}>
            <SectionDropdownProvider>
            <DndContext
              id="form-panel-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {visibleSections.map((section) => (
                  <SectionBlock key={section.id} section={section} />
                ))}
              </SortableContext>
            </DndContext>

            {hiddenSections.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p
                  style={{
                    fontSize: 10,
                    color: SUBTLE,
                    fontWeight: 700,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t("form.hidden_sections")}
                </p>
                {hiddenSections.map((section) => (
                  <SectionBlock key={section.id} section={section} />
                ))}
              </div>
            )}

            <div style={{ paddingTop: 12 }}>
              <AIProGate>
                <AIProfileFillPanel />
              </AIProGate>
            </div>
            </SectionDropdownProvider>
          </div>
        )}

        {activeTab === "design" && (
          <div style={otherPadStyle}>
            <DesignPanel />
          </div>
        )}

        {activeTab === "ats" && (
          <div style={otherPadStyle}>
            <AIProGate>
              <ATSScorePanel />
            </AIProGate>
          </div>
        )}

        {activeTab === "review" && (
          <div style={otherPadStyle}>
            <AIProGate>
              <CVReviewPanel />
            </AIProGate>
          </div>
        )}
      </div>
    </aside>
  )
}
