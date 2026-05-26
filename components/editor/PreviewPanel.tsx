"use client"

import ResumePreview from "@/components/resume/ResumePreview"
import { ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

export default function PreviewPanel() {
  const [scale, setScale] = useState(0.5)

  return (
    <div className="canvas-and-strip flex-1 relative flex flex-col bg-gradient-to-br from-[#E0F2F7] to-[#D4EBF5] overflow-hidden">
      <style>{`
        @keyframes ambientDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 40px) scale(1.1); }
        }
        .canvas-and-strip .canvas-scroller::-webkit-scrollbar { width: 10px; height: 10px; }
        .canvas-and-strip .canvas-scroller::-webkit-scrollbar-thumb {
          background: rgba(11,27,61,0.18); border-radius: 8px;
        }
        .canvas-and-strip .canvas-scroller::-webkit-scrollbar-thumb:hover {
          background: rgba(11,27,61,0.32);
        }
      `}</style>

      <div aria-hidden className="absolute rounded-full pointer-events-none" style={{ filter: "blur(120px)", opacity: 0.4, background: "#00E5FF", width: 600, height: 600, top: -150, left: -100, animation: "ambientDrift 20s infinite alternate", zIndex: 0 }} />
      <div aria-hidden className="absolute rounded-full pointer-events-none" style={{ filter: "blur(120px)", opacity: 0.4, background: "#B300FF", width: 800, height: 800, bottom: -200, right: -150, animation: "ambientDrift 20s infinite alternate", zIndex: 0 }} />

      {/* Zoom controls */}
      <div className="zoom-controls absolute top-6 right-6 flex items-center bg-white/85 backdrop-blur-[16px] border border-[#E2E8F0] rounded-[24px] p-1 z-[100] shadow-[0_4px_16px_rgba(11,27,61,0.08)]">
        <button type="button" onClick={() => setScale((s) => Math.max(0.3, s - 0.1))} className="w-8 h-8 rounded-full border-none bg-transparent text-[#0B1B3D] cursor-pointer flex items-center justify-center transition-[background] duration-[150ms] hover:bg-[rgba(11,27,61,0.06)]" aria-label="Zoom out">
          <ZoomOut size={16} />
        </button>
        <span className="text-[13px] font-bold text-[#0B1B3D] px-3 min-w-[54px] text-center">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => setScale((s) => Math.min(1.2, s + 0.1))} className="w-8 h-8 rounded-full border-none bg-transparent text-[#0B1B3D] cursor-pointer flex items-center justify-center transition-[background] duration-[150ms] hover:bg-[rgba(11,27,61,0.06)]" aria-label="Zoom in">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="canvas-scroller flex-1 min-h-0 overflow-auto flex flex-col relative z-[1]">
        <div className="flex items-start justify-center min-h-full min-w-full px-10 pt-6 pb-10">
          <div className="shrink-0 relative rounded-[4px] bg-transparent" style={{ width: `calc(210mm * ${scale})`, height: `calc(297mm * ${scale})`, transition: "width 0.2s ease, height 0.2s ease", boxShadow: "0 30px 80px rgba(11,27,61,0.18), 0 10px 30px rgba(11,27,61,0.10)" }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", transition: "transform 0.2s ease", width: "210mm", minHeight: "297mm" }}>
              <ResumePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
