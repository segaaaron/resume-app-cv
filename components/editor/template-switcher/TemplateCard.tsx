"use client"

import { memo } from "react"
import dynamic from "next/dynamic"
import { Lock, Check } from "lucide-react"
import { TEMPLATES, TemplateId } from "@/types/resume"

const ResumeThumbnail = dynamic(
  () => import("./thumbnails").then((m) => ({ default: m.ResumeThumbnail })),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" /> }
)

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number]
  locked: boolean
  isSelected: boolean
  colorScheme: string
  onSelect: (templateId: TemplateId, locked: boolean) => void
}

export const TemplateCard = memo(function TemplateCard({
  template,
  locked,
  isSelected,
  colorScheme,
  onSelect,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id, locked)}
      className="flex flex-col items-center gap-1.5 w-full"
      style={{ cursor: locked ? "not-allowed" : "pointer" }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          aspectRatio: "210/297",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
          background: isSelected && !locked ? "rgba(0,212,255,0.12)" : "#b0c4de",
          border: isSelected && !locked ? "2px solid #00D4FF" : "1.5px solid #E2ECF7",
          boxShadow: isSelected && !locked
            ? "0 0 0 3px rgba(0,212,255,0.2), 0 4px 16px rgba(0,212,255,0.15)"
            : "0 1px 4px rgba(26,46,74,0.06)",
          padding: 25,
          transition: "all 0.18s ease",
          opacity: locked ? 0.55 : 1,
        }}
      >
        {isSelected && !locked && (
          <div
            style={{
              position: "absolute", top: 5, right: 5, zIndex: 10,
              width: 18, height: 18, borderRadius: "50%",
              background: "#00D4FF",
              boxShadow: "0 1px 6px rgba(0,212,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Check style={{ width: 11, height: 11, color: "#fff", strokeWidth: 3 }} />
          </div>
        )}

        <div style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }}>
          <ResumeThumbnail id={template.id} color={locked ? "#9ca3af" : colorScheme} />
        </div>

        {locked && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.5)" }}>
            <Lock style={{ width: 14, height: 14, color: "#00D4FF" }} />
          </div>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10, fontWeight: 600,
          color: isSelected && !locked ? "#00A8CC" : locked ? "#9ca3af" : "#4A6A8A",
          transition: "color 0.15s ease",
          maxWidth: "100%", textAlign: "center", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      >
        {template.name}
      </span>
    </button>
  )
})
