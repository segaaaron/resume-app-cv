"use client"

/**
 * Velvet — purple gradient SaaS hero.
 * Source: planillas-lujosas-Jun-29026/cv-templates-b.jsx (TplVelvet).
 *
 * Design:
 *  - Full-bleed purple gradient hero (#7c3aed → #a855f7 → #c026d3).
 *  - Oversized initials watermark, avatar with translucent ring.
 *  - Body grid 1fr / 250px on ivory (#faf8ff) with purple-left summary bar.
 *
 * Font: Geist (the exact source typeface), self-hosted via the `geist` package.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-geist-sans), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

export default function TplVelvetTemplate() {
  const ink = "#2a2440"
  const muted = "#4a4366"
  const subtle = "#8a82a3"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#7c3aed")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const contacts: Array<[string, string]> = []
  if (pd.email) contacts.push(["✉", pd.email])
  if (pd.phone) contacts.push(["☎", pd.phone])
  if (pd.website) contacts.push(["⌘", pd.website])
  if (place) contacts.push(["⌖", place])

  const VeH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ fontSize: 13.5, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "20px 0 12px" }}>
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#faf8ff",
        color: ink,
        fontFamily: SANS,
        overflow: "hidden",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(120deg,${accent} 0%,#a855f7 55%,#c026d3 100%)`,
          padding: "40px 48px 44px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -20, fontSize: 200, opacity: 0.08, fontWeight: 800, lineHeight: 1, pointerEvents: "none" }}>
          {initials}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "3px solid rgba(255,255,255,0.4)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 32,
              fontWeight: 700,
              overflow: "hidden",
              flexShrink: 0,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            {config.photoUrl ? (
              <img
                src={config.photoUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${config.photoPosition ?? 15}%`,
                  display: "block",
                }}
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{fullName}</h1>
            {pd.jobTitle && <div style={{ fontSize: 15, marginTop: 6, color: "#ecd9ff", fontWeight: 500 }}>{pd.jobTitle}</div>}
          </div>
        </div>
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 18, marginTop: 20, fontSize: 12.5, position: "relative", flexWrap: "wrap" }}>
            {contacts.map(([icon, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "#f0e3ff" }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "28px 48px", display: "grid", gridTemplateColumns: "1fr 250px", gap: 32 }}>
        <div>
          {visible("summary") && summary && (
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: muted,
                margin: "0 0 4px",
                borderLeft: `3px solid ${accent}`,
                paddingLeft: 16,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              {summary}
            </p>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <VeH id="workExperience">{labelFor("workExperience")}</VeH>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 16, position: "relative", paddingLeft: 20, breakInside: "avoid" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 5,
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      background: accent,
                      transform: "rotate(45deg)",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: ink }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: subtle, marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <VeH id="projects">{labelFor("projects")}</VeH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 12.5, color: muted, marginBottom: 6 }}>
                  <strong style={{ color: ink }}>{p.name}</strong>
                  {p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <VeH id="skills">{labelFor("skills")}</VeH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11.5,
                      background: "linear-gradient(135deg,#f3e8ff,#fae8ff)",
                      color: accent,
                      padding: "5px 11px",
                      borderRadius: 8,
                      fontWeight: 600,
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

          {visible("languages") && languages.length > 0 && (
            <>
              <VeH id="languages">{labelFor("languages")}</VeH>
              {languages.map((l) => (
                <div key={l.id} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: subtle }}>{l.level}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <VeH id="education">{labelFor("education")}</VeH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: ink }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: subtle }}>{ed.institution}</div>
                  <div style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <VeH id="certifications">{labelFor("certifications")}</VeH>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: muted, marginBottom: 4 }}>
                  {c.name}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
