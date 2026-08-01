"use client"

/**
 * Pearl — soft ivory rose-gold luxe.
 * Source: planillas-lujosas-Jun-29026/cv-templates-d.jsx (TplPearl).
 *
 * Design:
 *  - Ivory (#fdfaf7) with radial peach glow top-right.
 *  - Centered avatar/initials, serif display name, fleuron (❦) divider.
 *  - Italic centered summary, two-col body (1.4fr / 1fr).
 *
 * Font mapping:
 *  - "DM Serif Display" (source) → Georgia serif stack.
 *  - "Geist" (source) → Jakarta sans stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF = 'var(--font-dm-serif), "DM Serif Display", Georgia, "Times New Roman", serif'

export default function TplPearlTemplate() {
  const paper = "#fdfaf7"
  const ink = "#3a2e30"
  const muted = "#5a4a4c"
  const subtle = "#a08a8c"
  const stone = "#8a7a7c"
  const rule = "#e8d8d4"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#b76e79")
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

  const PeH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: accent,
        margin: "18px 0 12px",
        fontWeight: 600,
      }}
    >
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
    </div>
  )

  const contacts: Array<[string, string]> = []
  if (pd.email) contacts.push(["✉", pd.email])
  if (pd.phone) contacts.push(["☎", pd.phone])
  if (place) contacts.push(["⌖", place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: paper,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        padding: "52px 56px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(ellipse at top right, #faf0ec, transparent 55%)",
          pointerEvents: "none",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", position: "relative", marginBottom: 8 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: `linear-gradient(145deg,#d8a3ab,${accent})`,
            border: "5px solid #fff",
            boxShadow: "0 4px 18px rgba(183,110,121,0.25)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 34,
            fontWeight: 400,
            overflow: "hidden",
            margin: "0 auto 18px",
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
        <h1 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, margin: 0, lineHeight: 1, color: ink, letterSpacing: "0.01em" }}>
          {fullName}
        </h1>
        {pd.jobTitle && (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: 12.5,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: accent,
              marginTop: 12,
            }}
          >
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ fontFamily: "inherit", display: "flex", justifyContent: "center", gap: 20, marginTop: 16, fontSize: 11.5, color: stone, flexWrap: "wrap" }}>
            {contacts.map(([icon, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: accent, fontSize: 13 }}>{icon}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Fleuron divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0", position: "relative" }}>
        <span style={{ flex: 1, height: 1, background: rule, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <span style={{ color: accent, fontSize: 14 }}>❦</span>
        <span style={{ flex: 1, height: 1, background: rule, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      </div>

      {visible("summary") && summary && (
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.5,
            textAlign: "center",
            color: muted,
            margin: "0 auto 26px",
            maxWidth: 540,
            fontStyle: "italic",
          }}
        >
          {summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 38, position: "relative" }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <PeH id="workExperience">{labelFor("workExperience")}</PeH>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 16, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontSize: 20, color: ink }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: "inherit", fontSize: 11, color: accent, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 12, color: subtle, marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 12, color: muted, lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <PeH id="projects">{labelFor("projects")}</PeH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontFamily: "inherit", fontSize: 12, color: muted, marginBottom: 5 }}>
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
              <PeH id="skills">{labelFor("skills")}</PeH>
              <div style={{ fontFamily: "inherit", display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11,
                      color: accent,
                      border: `1px solid ${accent}55`,
                      padding: "4px 11px",
                      borderRadius: 20,
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
              <PeH id="languages">{labelFor("languages")}</PeH>
              <div style={{ fontFamily: "inherit" }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: muted }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: subtle }}>{l.level}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <PeH id="education">{labelFor("education")}</PeH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontSize: 16, color: ink }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 11.5, color: subtle }}>
                    {ed.institution}
                    {ed.startDate ? ` · ${ed.startDate}` : ""}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <PeH id="certifications">{labelFor("certifications")}</PeH>
              <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: muted }}>
                {certifications.map((c) => (
                  <div key={c.id}>{c.name}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
