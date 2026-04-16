"use client"

import { useResumeStore } from "@/stores/resumeStore"
import ResumePreview from "@/components/resume/ResumePreview"
import TemplateSwitcher from "./TemplateSwitcher"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function PreviewPanel() {
  const [scale, setScale] = useState(0.65)

  return (
    <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden relative">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white rounded-lg border border-border shadow-sm p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs w-12 text-center font-medium">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.min(1.2, s + 0.1))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center pt-8 pb-24 px-8">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: "210mm",
            minHeight: "297mm",
          }}
        >
          <ResumePreview />
        </div>
      </div>

      {/* Template switcher at bottom */}
      <TemplateSwitcher />
    </div>
  )
}
