"use client"

/**
 * Luxe Noir — Obsidian & Gold · Monogram Seal.
 * Source: planillas-lujosas-Jun-29026/cv-luxe-2026.jsx (LuxeNoir, atoms LxSeal/LxCorner/LxDivider/LxHead, 2026-06-03).
 *
 * Design fidelity:
 *  - Q5 dark softening applied: source bg #0e0d0b → #1a1814 (warm near-black, retains
 *    obsidian identity, avoids hard print contrast). Gold #c6a35a preserved exactly.
 *  - Custom SVG atoms reproduced in-component (LxSeal monogram, LxCorner filigree,
 *    LxDivider diamond). All ticks/circles geometry kept 1:1 with source.
 *  - Frame border + 4 corner brackets, centered seal masthead, italic serif summary,
 *    two-column body (Experience left, Expertise/Languages/Education right).
 *
 * Font mapping (Q3):
 *  - "Playfair Display" / "Cormorant Garamond" (display serif) → var(--font-playfair) + Georgia fallback.
 *  - "Geist" (body sans) → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Playfair Display", "Cormorant Garamond", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_PCT: Record<string, number> = {
  a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100,
}
const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

// ─── Custom SVG atoms (reproduced 1:1 from source LxSeal/LxCorner/LxDivider) ──

// Monogram seal — double ring + 72 radiating ticks + initials. Geometry from source.
function LxSeal({ size = 82, gold, cream, initials }: { size?: number; gold: string; cream: string; initials: string }) {
  const tickCount = 72
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      <circle cx="50" cy="50" r="47" fill="none" stroke={gold} strokeWidth="0.8" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={gold} strokeWidth="0.5" opacity="0.7" />
      {Array.from({ length: tickCount }).map((_, i) => {
        const a = (i / tickCount) * Math.PI * 2
        const long = i % 6 === 0
        const r1 = long ? 41.5 : 43.5
        const r2 = 45.5
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * r1}
            y1={50 + Math.sin(a) * r1}
            x2={50 + Math.cos(a) * r2}
            y2={50 + Math.sin(a) * r2}
            stroke={gold}
            strokeWidth={long ? 0.9 : 0.45}
            opacity={long ? 0.9 : 0.5}
          />
        )
      })}
      <text
        x="50" y="50"
        textAnchor="middle" dominantBaseline="central"
        fontFamily='"Playfair Display", Georgia, serif'
        fontStyle="italic"
        fontSize="30"
        fontWeight="600"
        fill={cream}
      >
        {initials}
      </text>
      <text
        x="50" y="68"
        textAnchor="middle"
        fontFamily='"Inter", system-ui, sans-serif'
        fontSize="4.4"
        letterSpacing="1.4"
        fill={gold}
      >
        EST · 2026
      </text>
    </svg>
  )
}

// Corner filigree bracket — 4 placement variants via rotation.
function LxCorner({ color, pos, size = 30 }: { color: string; pos: "tl" | "tr" | "bl" | "br"; size?: number }) {
  const map: Record<typeof pos, { top?: number; left?: number; right?: number; bottom?: number; rot: number }> = {
    tl: { top: 18, left: 18, rot: 0 },
    tr: { top: 18, right: 18, rot: 90 },
    bl: { bottom: 18, left: 18, rot: 270 },
    br: { bottom: 18, right: 18, rot: 180 },
  }
  const p = map[pos]
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: p.top,
        left: p.left,
        right: p.right,
        bottom: p.bottom,
        transform: `rotate(${p.rot}deg)`,
        pointerEvents: "none",
      }}
    >
      <path d="M2 18 V4 a2 2 0 0 1 2 -2 H18" fill="none" stroke={color} strokeWidth="1" />
      <path d="M9 18 V11 a2 2 0 0 1 2 -2 H18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.7" />
      <circle cx="4" cy="4" r="1.3" fill={color} />
    </svg>
  )
}

// Centered diamond divider
function LxDivider({ gold, line, m = "20px 0 22px" }: { gold: string; line: string; m?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: m }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${line})` }} />
      <span
        style={{
          width: 6,
          height: 6,
          background: gold,
          transform: "rotate(45deg)",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      />
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${line},transparent)` }} />
    </div>
  )
}

// Gold-label section header with hairline
function LxHead({ gold, line, children }: { gold: string; line: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 13px" }}>
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: gold,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
}

// ─── Compact contact icons (source Ico set, monoline stroke 1.7) ──────────────
const IcoMail = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
  </svg>
)
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IcoGlobe = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
  </svg>
)
const IcoAward = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
  </svg>
)

export default function LuxeNoirTemplate() {
  // Q5 — source #0e0d0b → softened to #1a1814 (warm obsidian, keeps identity)
  const bg = "#1a1814"
  const cream = "#ece7db"
  const mut = "#8c8472"
  const line = "rgba(198,163,90,0.24)"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const gold = config.colorScheme || "#c6a35a"
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langPct = (lvl: string) => LANG_LEVEL_PCT[lvl] ?? 55
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullFirst = pd.firstName || "Your"
  const fullLast = pd.lastName || "Name"
  const initials =
    ([pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "MS")

  // Contacts strip
  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<IcoMail key="m" />, pd.email])
  if (pd.phone) contacts.push([<IcoPhone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<IcoPin key="i" />, place])
  if (pd.website) contacts.push([<IcoGlobe key="g" />, pd.website])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: cream,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        padding: "44px 52px 40px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Inner frame border */}
      <div
        style={{
          position: "absolute",
          inset: 14,
          border: `1px solid ${line}`,
          pointerEvents: "none",
        }}
      />
      {/* 4 corner brackets */}
      <LxCorner color={gold} pos="tl" />
      <LxCorner color={gold} pos="tr" />
      <LxCorner color={gold} pos="bl" />
      <LxCorner color={gold} pos="br" />

      {/* MASTHEAD */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <LxSeal size={82} gold={gold} cream={cream} initials={initials} />
        {pd.jobTitle && (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: 10,
              letterSpacing: "0.5em",
              color: gold,
              margin: "14px 0 7px",
              paddingLeft: "0.5em",
              textTransform: "uppercase",
            }}
          >
            {pd.jobTitle}
          </div>
        )}
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 50,
            margin: 0,
            lineHeight: 1,
            color: "#fff",
          }}
        >
          {fullFirst} <span style={{ fontStyle: "italic" }}>{fullLast}</span>
        </h1>
        {contacts.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px 22px",
              marginTop: 15,
              fontFamily: "inherit",
              fontSize: 10.5,
              color: mut,
            }}
          >
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: gold, fontSize: 12, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <LxDivider gold={gold} line={line} />

      {/* SUMMARY (italic serif center) */}
      {visible("summary") && summary && (
        <p
          style={{
            textAlign: "center",
            fontSize: 16.5,
            fontStyle: "italic",
            lineHeight: 1.55,
            color: "#d6cfbf",
            maxWidth: 540,
            margin: "0 auto 26px",
          }}
        >
          {summary}
        </p>
      )}

      {/* TWO-COLUMN BODY */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 38 }}>
        {/* LEFT — EXPERIENCE */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <LxHead gold={gold} line={line}>{labelFor("workExperience")}</LxHead>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 18.5, color: "#fff", lineHeight: 1.1 }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: "inherit", fontSize: 9.5, color: gold, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontStyle: "italic", fontSize: 15, color: gold, marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 11, color: "#b8b1a2", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* RIGHT — EXPERTISE / LANGUAGES / EDUCATION */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <LxHead gold={gold} line={line}>{labelFor("skills")}</LxHead>
              {skills.slice(0, 7).map((s, i, a) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "inherit",
                    fontSize: 11,
                    color: "#cfc8b9",
                    padding: "5.5px 0",
                    borderBottom: i < a.length - 1 ? `1px solid ${line}` : "none",
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      background: gold,
                      transform: "rotate(45deg)",
                      flexShrink: 0,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                  {s.name}
                </div>
              ))}
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <LxHead gold={gold} line={line}>{labelFor("languages")}</LxHead>
              {languages.map((l) => (
                <div key={l.id} style={{ marginBottom: 9 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "inherit",
                      fontSize: 10.5,
                      color: "#cfc8b9",
                      marginBottom: 4,
                    }}
                  >
                    <span>{l.name}</span>
                    <span style={{ color: gold }}>{langLbl(l.level)}</span>
                  </div>
                  <div style={{ height: 2, background: "rgba(255,255,255,0.08)" }}>
                    <div
                      style={{
                        width: `${langPct(l.level)}%`,
                        height: "100%",
                        background: gold,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <LxHead gold={gold} line={line}>{labelFor("education")}</LxHead>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 14.5, color: "#fff" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 10, color: mut, marginBottom: 3 }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {certifications.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "inherit",
                    fontSize: 10.5,
                    color: gold,
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: 13, display: "grid", placeItems: "center" }}><IcoAward /></span>
                  {c.name}
                  {c.issuer ? ` — ${c.issuer}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
