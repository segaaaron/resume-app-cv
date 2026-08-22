"use client"

/**
 * Plume — writer · warm editorial.
 * Source: planillas-lujosas-Jun-29026/cv-showcase.jsx (ShowPlume).
 *
 * Palette: ink #211c17, wine #8a3b3b, accent #a8533f, paper #f5f0e6, mute #8a8071.
 * Header: title + italic surname + tilted rounded photo card. Drop initial on summary. Numbered work entries.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Cormorant Garamond", "Playfair Display", "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function ShowPlumeTemplate() {
  const ink = "#211c17"
  const wine = "#8a3b3b"
  const paper = "#f5f0e6"
  const mute = "#8a8071"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#a8533f")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const PlH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "16px 0 11px", fontWeight: 600 }}>
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
        overflow: "hidden",
        position: "relative",
        padding: "48px 50px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
        <div style={{ flex: 1 }}>
          {pd.jobTitle && (
            <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.18em", color: accent, marginBottom: 12, textTransform: "uppercase" }}>
              {pd.jobTitle}
            </div>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 500, margin: 0, lineHeight: 0.9 }}>
            {pd.firstName || "Your"}<br />
            <span style={{ fontStyle: "italic", color: wine }}>{pd.lastName || "Name"}</span>
          </h1>
        </div>
        <div style={{ padding: 5, background: "#fff", borderRadius: 16, boxShadow: "0 12px 30px rgba(120,80,60,0.16)", transform: "rotate(2deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 128, height: 150, objectFit: "cover", borderRadius: 12,
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                filter: "grayscale(0.25)",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: 128, height: 150, borderRadius: 12, background: `${wine}22`, display: "grid", placeItems: "center", color: wine, fontSize: 44, fontWeight: 600 }}>
              {initials}
            </div>
          )}
        </div>
      </div>

      {visible("summary") && summary && (
        <p style={{ fontSize: 16, lineHeight: 1.55, color: "#4a4234", margin: "20px 0 26px", maxWidth: 480 }}>
          <span style={{ float: "left", fontFamily: SERIF, fontSize: 58, lineHeight: 0.7, color: wine, paddingRight: 10, paddingTop: 6 }}>
            {summary.charAt(0).toUpperCase()}
          </span>
          {summary.slice(1)}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <PlH id="workExperience">{labelFor("workExperience")}</PlH>
              {workExperience.map((e, i) => (
                <div key={e.id} className="resume-entry" style={{ display: "flex", gap: 14, marginBottom: 14, breakInside: "avoid" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 24, fontStyle: "italic", color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 17 }}>{e.jobTitle}</span>
                      <span style={{ fontFamily: "inherit", fontSize: 10, color: accent, marginLeft: 12, whiteSpace: "nowrap" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      </span>
                    </div>
                    <div style={{ fontFamily: "inherit", fontSize: 10, color: mute, fontStyle: "italic", marginBottom: 3 }}>
                      {e.employer}{e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontFamily: "inherit", fontSize: 10.5, color: "#5a5142", lineHeight: 1.55 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ fontFamily: "inherit" }}>
          {visible("skills") && skills.length > 0 && (
            <>
              <PlH id="skills">{labelFor("skills")}</PlH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 10, background: ink, color: paper, padding: "4px 10px", borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <PlH id="education">{labelFor("education")}</PlH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 15 }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: mute }}>
                    {ed.institution} · {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <PlH id="certifications">{labelFor("certifications")}</PlH>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontFamily: "inherit", fontSize: 15, fontStyle: "italic", color: "#4a4234", marginBottom: 4 }}>
                  {c.name}
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <PlH id="projects">{labelFor("projects")}</PlH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontFamily: "inherit", fontSize: 15, fontStyle: "italic", color: "#4a4234", marginBottom: 4 }}>
                  {p.name}{p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <PlH id="languages">{labelFor("languages")}</PlH>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5142", padding: "3px 0" }}>
                  <span>{l.name}</span>
                  <span style={{ color: accent, fontWeight: 600 }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}

          <PlH id="personalDetails">{config.language === "en" ? "Contact" : "Contacto"}</PlH>
          <div style={{ fontSize: 10.5, color: "#5a5142", lineHeight: 1.9 }}>
            {pd.email}
            {pd.email && <br />}
            {pd.phone}
            {pd.phone && place ? " · " : ""}
            {place}
            {pd.website && (
              <>
                {(pd.phone || place) && <br />}
                {pd.website}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
