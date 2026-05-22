"use client"

import { useResumeStore } from "@/stores/resumeStore"
import ResumePreview from "@/components/resume/ResumePreview"
import TemplateSwitcher from "./TemplateSwitcher"
import { ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

interface Props {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
}

export default function PreviewPanel({ plan, subscriptionStatus, subscriptionEndsAt, role }: Props) {
  const [scale, setScale] = useState(0.5)

  return (
    <div
      className="canvas-and-strip"
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #E0F2F7 0%, #D4EBF5 100%)",
        overflow: "hidden",
      }}
    >
      {/* Ambient drift keyframes (screen-only editor UI; not used in print) */}
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

      {/* Cyan ambient light */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.4,
          pointerEvents: "none",
          background: "#00E5FF",
          width: 600,
          height: 600,
          top: -150,
          left: -100,
          animation: "ambientDrift 20s infinite alternate",
          zIndex: 0,
        }}
      />
      {/* Purple ambient light */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.4,
          pointerEvents: "none",
          background: "#B300FF",
          width: 800,
          height: 800,
          bottom: -200,
          right: -150,
          animation: "ambientDrift 20s infinite alternate",
          zIndex: 0,
        }}
      />

      {/* Zoom controls */}
      <div
        className="zoom-controls"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid #E2E8F0",
          borderRadius: 24,
          padding: 4,
          zIndex: 100,
          boxShadow: "0 4px 16px rgba(11,27,61,0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "#0B1B3D",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,27,61,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0B1B3D",
            padding: "0 12px",
            minWidth: 54,
            textAlign: "center",
          }}
        >
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(1.2, s + 0.1))}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "#0B1B3D",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,27,61,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Canvas scroller */}
      <div
        className="canvas-scroller"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Canvas centerer — bottom padding clears the 230px absolute strip */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            minHeight: "100%",
            minWidth: "100%",
            padding: "24px 40px 320px",
          }}
        >
          {/* CV sheet wrapper (scaled dimensions so the scroll area matches the visual size) */}
          <div
            style={{
              width: `calc(210mm * ${scale})`,
              height: `calc(297mm * ${scale})`,
              flexShrink: 0,
              position: "relative",
              transition: "width 0.2s ease, height 0.2s ease",
              boxShadow:
                "0 30px 80px rgba(11,27,61,0.18), 0 10px 30px rgba(11,27,61,0.10)",
              borderRadius: 4,
              background: "transparent",
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                transition: "transform 0.2s ease",
                width: "210mm",
                minHeight: "297mm",
              }}
            >
              <ResumePreview />
            </div>
          </div>
        </div>
      </div>

      {/* Template switcher — fixed-height flex child at bottom */}
      <TemplateSwitcher
        plan={plan}
        subscriptionStatus={subscriptionStatus}
        subscriptionEndsAt={subscriptionEndsAt}
        role={role}
      />
    </div>
  )
}
