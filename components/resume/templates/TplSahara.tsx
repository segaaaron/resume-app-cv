"use client"

/**
 * Sahara — warm earth tones, editorial serif.
 * Source: planillas-lujosas-Jun-29026/cv-templates-b.jsx (TplSahara).
 *
 * Design:
 *  - Cream paper (#f4ece0) left, terracotta gradient sidebar right.
 *  - Oversized serif name with italic last in accent (#b5562e).
 *  - Geist sans for meta + bullets, Cormorant serif for headings.
 *
 * Font mapping:
 *  - "Cormorant Garamond" (source) → Georgia serif stack.
 *  - "Geist" (source) → Jakarta sans stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-cormorant), "Cormorant Garamond", Georgia, "Times New Roman", serif'

export default function TplSaharaTemplate() {
  const paper = "#f4ece0"
  const ink = "#3a2e24"
  const stone = "#8a7458"
  const muted = "#5a4a3a"
  const rule = "#d4c4ac"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#b5562e")
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
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const SaH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "inherit",
        fontSize: 12,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: accent,
        fontWeight: 600,
        margin: "26px 0 16px",
      }}
    >
      <span><SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}</span>
      <span style={{ flex: 1, height: 1, background: rule, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )

  const SaSideH = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#f0d9c4",
        marginBottom: 12,
        fontWeight: 600,
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        paddingBottom: 6,
      }}
    >
      {children}
    </div>
  )

  const contacts: Array<[string, string]> = []
  if (pd.email) contacts.push(["✉", pd.email])
  if (pd.phone) contacts.push(["☎", pd.phone])
  if (place) contacts.push(["⌖", place])
  if (pd.website) contacts.push(["⌘", pd.website])

  return (
    <div
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: paper,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 230px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Main */}
      <div style={{ padding: "50px 44px" }}>
        <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: accent, marginBottom: 10 }}>
          {config.language === "en" ? "Curriculum Vitae" : "Currículum Vitae"}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 600, margin: 0, lineHeight: 0.95, letterSpacing: "-0.01em", color: ink }}>
          {firstLine}
          <br />
          <span style={{ fontStyle: "italic", color: accent }}>{lastLine}</span>
        </h1>
        {pd.jobTitle && (
          <div style={{ fontFamily: "inherit", fontSize: 14, letterSpacing: "0.06em", color: "#6a5a48", marginTop: 14 }}>{pd.jobTitle}</div>
        )}
        {visible("summary") && summary && (
          <p style={{ fontSize: 17, lineHeight: 1.5, color: muted, marginTop: 22 }}>{summary}</p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <SaH id="workExperience">{labelFor("workExperience")}</SaH>
            {workExperience.map((e) => (
              <div
                key={e.id}
                className="resume-entry"
                style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "90px 1fr", gap: 14, breakInside: "avoid" }}
              >
                <div style={{ fontFamily: "inherit", fontSize: 11, color: accent, fontWeight: 600, paddingTop: 4, letterSpacing: "0.04em" }}>
                  {e.startDate}
                  {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                </div>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 600, color: ink }}>{e.jobTitle}</div>
                  <div style={{ fontFamily: "inherit", fontSize: 12, color: stone, marginBottom: 5, fontStyle: "italic" }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 12, color: muted, lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("projects") && projects.length > 0 && (
          <>
            <SaH id="projects">{labelFor("projects")}</SaH>
            {projects.map((p) => (
              <div key={p.id} style={{ fontFamily: "inherit", fontSize: 12.5, color: muted, marginBottom: 5 }}>
                <strong style={{ color: ink }}>{p.name}</strong>
                {p.role ? ` — ${p.role}` : ""}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Sidebar */}
      <div
        style={{
          background: "linear-gradient(180deg,#b5562e,#8f3f1d)",
          color: paper,
          padding: "50px 26px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "4px solid rgba(255,255,255,0.35)",
              display: "grid",
              placeItems: "center",
              color: paper,
              fontSize: 42,
              fontWeight: 600,
              overflow: "hidden",
              fontFamily: SERIF,
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
        </div>

        {contacts.length > 0 && (
          <>
            <SaSideH>{config.language === "en" ? "Contact" : "Contacto"}</SaSideH>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 9, fontSize: 11.5, marginBottom: 26 }}>
              {contacts.map(([icon, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 9, color: "#f0e3d2" }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {t}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <SaSideH>{labelFor("skills")}</SaSideH>
            <div style={{ fontFamily: "inherit", display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 26 }}>
              {skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    fontSize: 11,
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "3px 9px",
                    borderRadius: 14,
                    color: paper,
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
            <SaSideH>{labelFor("languages")}</SaSideH>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, marginBottom: 26 }}>
              {languages.map((l) => (
                <div key={l.id}>
                  <div style={{ color: paper, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ color: "#e6c9b0", fontSize: 10.5 }}>{l.level}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <SaSideH>{labelFor("education")}</SaSideH>
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ fontFamily: "inherit", fontSize: 12, color: paper, fontWeight: 600 }}>
                  {ed.degree}
                  {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 10.5, color: "#e6c9b0" }}>{ed.institution}</div>
                <div style={{ fontFamily: "inherit", fontSize: 10.5, color: "#e6c9b0" }}>
                  {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <SaSideH>{labelFor("certifications")}</SaSideH>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ color: "#f0e3d2" }}>
                  {c.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
