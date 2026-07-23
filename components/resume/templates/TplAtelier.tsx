"use client"

/**
 * Atelier — editorial magazine layout.
 * Source: planillas-lujosas-Jun-29026/cv-templates-a.jsx (TplAtelier).
 *
 * Design:
 *  - Cream paper (#f7f3ea) on ink (#221d16) with terracotta accent (#a8400f).
 *  - Magazine masthead (Portfolio · 2026 / № 07), oversized serif name.
 *  - Two-column body: Selected Work (left) + About/Craft/Studies/Honors (right).
 *
 * Font mapping:
 *  - "Instrument Serif" (source) → Georgia serif stack.
 *  - "Geist" (source) → var(--font-jakarta) sans stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

export default function TplAtelierTemplate() {
  const paper = "#f7f3ea"
  const ink = "#221d16"
  const stone = "#8a7d68"
  const muted = "#4a4234"
  const rule = "#cabfa8"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#a8400f"
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

  const AtH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: accent, margin: "20px 0 12px", fontWeight: 600 }}>
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: paper,
        color: ink,
        fontFamily: "inherit",
        padding: "52px 56px",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Masthead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${ink}`, paddingBottom: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase" }}>
          {config.language === "en" ? "Portfolio · 2026" : "Portafolio · 2026"}
        </span>
        <span style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase" }}>№ 07</span>
      </div>

      <h1 style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 0.92, margin: "14px 0 0", fontWeight: 400, letterSpacing: "-0.02em", color: ink }}>
        {firstLine}
        <br />
        <span style={{ fontStyle: "italic" }}>{lastLine}</span>
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 18, gap: 24 }}>
        {pd.jobTitle && (
          <div style={{ fontSize: 18, letterSpacing: "0.04em", maxWidth: 340, fontFamily: "inherit", fontStyle: "italic", color: "#5a4f40" }}>
            {pd.jobTitle}
          </div>
        )}
        <div style={{ textAlign: "right", fontSize: 12, color: "#5a4f40", lineHeight: 1.8 }}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {place && <div>{place}</div>}
          {pd.website && <div>{pd.website}</div>}
        </div>
      </div>

      <div style={{ height: 1, background: rule, margin: "26px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 40 }}>
        {/* Left — Selected Work */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <AtH id="workExperience">{labelFor("workExperience")}</AtH>
              {workExperience.map((e, i) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 18, breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: SERIF, fontSize: 26, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: ink }}>
                        {e.jobTitle}
                        {e.employer ? (
                          <>
                            , <span style={{ fontWeight: 400, fontStyle: "italic", fontFamily: "inherit", fontSize: 17 }}>{e.employer}</span>
                          </>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 11.5, color: stone, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                        {e.city ? ` · ${e.city}` : ""}
                      </div>
                    </div>
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12.5, color: muted, lineHeight: 1.55, marginTop: 4, paddingLeft: 38 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right — About / Craft / Studies / Honors */}
        <div>
          {visible("summary") && summary && (
            <>
              <AtH id="summary">{labelFor("summary")}</AtH>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: muted, marginTop: 0 }}>{summary}</p>
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <AtH id="skills">{labelFor("skills")}</AtH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11.5,
                      background: ink,
                      color: paper,
                      padding: "4px 10px",
                      borderRadius: 1,
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

          {visible("education") && education.length > 0 && (
            <>
              <AtH id="education">{labelFor("education")}</AtH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: ink }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: stone }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                    {ed.startDate ? `, ${ed.startDate}` : ""}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <AtH id="languages">{labelFor("languages")}</AtH>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: muted }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: stone }}>{l.level}</span>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <AtH id="certifications">{labelFor("certifications")}</AtH>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: muted, marginBottom: 4 }}>
                  {c.name}
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <AtH id="projects">{labelFor("projects")}</AtH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 13.5, color: muted, fontStyle: "italic", fontFamily: "inherit", marginBottom: 4 }}>
                  {p.name}
                  {p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
