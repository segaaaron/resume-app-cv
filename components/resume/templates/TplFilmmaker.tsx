"use client"

/**
 * Reel — Filmmaker · Cinematic dark with film perforations.
 * Source: planillas-lujosas-Jun-29026/cv-professions-a.jsx (TplFilmmaker, 2026-06-03).
 *
 * Design fidelity:
 *  - Palette: bg #0c0b0a, panel #1a1815, accent #e8a33d, body #c3bbab. Preserved exactly.
 *  - 16 film perforations top + bottom (background panels with cut-outs).
 *  - Clapperboard SVG @ 60px above title.
 *  - Amber-accented section dot headings.
 *  - Two-column body: Filmography left, Craft/Genre/Training/Award right.
 *  - Amber award pill at bottom of side column.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Print warning: dark backgrounds add ink usage. We keep #0c0b0a (not pure black) so
 * Chromium's print engine antialiases edges cleanly; pure #000 can render banded.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"


export default function TplFilmmakerTemplate() {
  // White canvas — the dark ground is what made this illegible on paper. Panels keep a
  // faint tint so the structure survives; text values were re-grounded to be readable.
  const bg = "#ffffff"
  const panel = "#f4f2ef"
  const text = "#1a1815"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#e8a33d")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const perfs = Array.from({ length: 16 })

  const Mail = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  )
  const Phone = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
  const Pin = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
  const Globe = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  )
  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const FilmH = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#15171c",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          background: accent,
          borderRadius: "50%",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      />
      {children}
    </div>
  )

  const PerfRow = ({ side }: { side: "top" | "bottom" }) => (
    <div
      style={{
        position: "absolute",
        [side]: 0,
        left: 0,
        right: 0,
        height: 20,
        background: panel,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {perfs.map((_, i) => (
        <span
          key={i}
          style={{
            width: 22,
            height: 9,
            background: bg,
            borderRadius: 2,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      ))}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: text,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <PerfRow side="top" />
      <PerfRow side="bottom" />

      <div style={{ padding: "46px 50px 30px" }}>
        {/* Clapperboard */}
        <svg viewBox="0 0 60 60" width="60" height="60" style={{ marginBottom: 16 }}>
          <g>
            <rect x="6" y="22" width="48" height="30" rx="3" fill={panel} stroke={accent} strokeWidth="2" />
            <path d="M6 22 L14 10 L24 14 L20 26 Z M22 13 L32 17 L28 27 L18 25 M30 16 L40 20 L36 28" fill={panel} stroke={accent} strokeWidth="1.6" />
            <line x1="14" y1="36" x2="46" y2="36" stroke={accent} strokeWidth="1" opacity="0.5" />
          </g>
        </svg>

        <div style={{ fontSize: 12, letterSpacing: "0.18em", color: accent, marginBottom: 12 }}>
          ● {config.language === "en" ? "SCENE 01 — DIRECTOR" : "ESCENA 01 — DIRECTOR/A"}
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 700, margin: 0, lineHeight: 0.92, letterSpacing: "-0.03em", color: "#15171c" }}>
          {firstLine}
          <br />
          {lastLine}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 15, marginTop: 12, color: "#757064" }}>{pd.jobTitle}</div>
        )}

        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 12, color: "#7c7568", flexWrap: "wrap" }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: accent, fontSize: 13, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}

        {visible("summary") && summary && (
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "#736e65",
              margin: "20px 0",
              borderLeft: `3px solid ${accent}`,
              paddingLeft: 16,
              maxWidth: 600,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            {summary}
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
          {/* Filmography */}
          <div>
            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <FilmH>{config.language === "en" ? "Filmography" : "Filmografía"}</FilmH>
                {workExperience.map((e) => (
                  <div key={e.id} className="resume-entry" style={{ marginBottom: 15, breakInside: "avoid" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: "#15171c" }}>{e.jobTitle}</div>
                      <div style={{ fontSize: 11.5, color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#7c7568", marginBottom: 5 }}>
                      {e.employer}
                      {e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 12, color: "#736e65", lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Side */}
          <div>
            {visible("skills") && skills.length > 0 && (
              <>
                <FilmH>{labelFor("skills")}</FilmH>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {skills.map((s) => (
                    <span
                      key={s.id}
                      style={{
                        fontSize: 11,
                        border: `1px solid ${accent}55`,
                        color: accent,
                        padding: "4px 10px",
                        borderRadius: 4,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </>
            )}

            {visible("projects") && projects.length > 0 && (
              <>
                <FilmH>{labelFor("projects")}</FilmH>
                {projects.map((s) => (
                  <div key={s.id} style={{ fontSize: 12.5, color: "#736e65", marginBottom: 3, display: "flex", gap: 8 }}>
                    <span style={{ color: accent }}>◆</span>
                    <span>
                      <strong style={{ color: "#15171c", fontWeight: 700 }}>{s.name}</strong>
                      {s.role ? ` — ${s.role}` : ""}
                    </span>
                  </div>
                ))}
              </>
            )}

            {visible("education") && education.length > 0 && (
              <>
                <FilmH>{labelFor("education")}</FilmH>
                {education.map((ed) => (
                  <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontSize: 13, color: "#15171c", fontWeight: 700 }}>
                      {ed.degree}
                      {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#7c7568" }}>
                      {ed.institution}
                      {ed.city ? ` · ${ed.city}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>
                      {ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </>
            )}

            {visible("languages") && languages.length > 0 && (
              <>
                <FilmH>{labelFor("languages")}</FilmH>
                {languages.map((l) => (
                  <div
                    key={l.id}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#736e65" }}
                  >
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: "#7c7568" }}>{l.level}</span>
                  </div>
                ))}
              </>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  background: accent,
                  color: bg,
                  padding: "11px 14px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {certifications.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <span style={{ fontSize: 16, display: "grid", placeItems: "center" }}><Award /></span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
