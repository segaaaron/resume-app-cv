"use client"

/**
 * Atelier (TplFashion) — blush couture serif layout.
 * Source: planillas-lujosas-Jun-29026/cv-professions-b.jsx (TplFashion).
 *
 * Design fidelity:
 *  - White backdrop, blush #d98a96 accent, ink #1a1518. The cream #faf6f4 it used
 *    to carry was replaced by white (CEO, 2026-08-19): the accent, the serif and
 *    the couture composition are what make this template, and a tinted sheet also
 *    prints heavier — the blush rules and the ✦ read cleaner on white.
 *  - Centered serif hero w/ italic surname + needle & thread SVG.
 *  - Ornament divider (✦) between header and body.
 *  - Two-column body: collections + atelier sidebar.
 * Font: serif → Georgia stack (replaces Cormorant Garamond).
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Times New Roman", serif'

export default function TplFashionTemplate() {
  const ink = "#1a1518"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const blush = designAccent(config.colorScheme, "#d98a96")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

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

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const FaH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: blush, margin: "18px 0 12px", fontWeight: 600 }}>
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#ffffff",
        color: ink,
        fontFamily: "inherit",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ textAlign: "center", padding: "46px 50px 0", position: "relative" }}>
        <svg viewBox="0 0 120 40" width="160" height="50" style={{ margin: "0 auto 8px", display: "block" }}>
          <path d="M4 30 q30 -28 56 0 t56 -8" fill="none" stroke={blush} strokeWidth="1.4" strokeDasharray="3 3" />
          <line x1="116" y1="22" x2="100" y2="26" stroke={ink} strokeWidth="1.4" />
          <circle cx="116" cy="22" r="2" fill="none" stroke={ink} strokeWidth="1.2" />
        </svg>
        <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: blush, marginBottom: 8 }}>
          {pd.jobTitle || (config.language === "en" ? "Fashion Designer" : "Diseñador de Moda")}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 58, fontWeight: 600, margin: 0, lineHeight: 0.96, letterSpacing: "0.01em" }}>
          {pd.firstName || "Your"}{" "}
          <span style={{ fontStyle: "italic", color: blush }}>{pd.lastName || "Name"}</span>
        </h1>
        {pd.jobTitle && (
          <div style={{ fontFamily: "inherit", fontSize: 12, letterSpacing: "0.1em", color: "#8a7a7e", marginTop: 10 }}>
            {pd.jobTitle.toUpperCase()}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ fontFamily: "inherit", display: "flex", justifyContent: "center", gap: 18, marginTop: 14, fontSize: 11.5, color: "#8a7a7e", flexWrap: "wrap" }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: blush, fontSize: 12, display: "inline-flex" }}>{I}</span>{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 50px" }}>
        <span style={{ flex: 1, height: 1, background: "#e6d8d8", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <span style={{ color: blush }}>✦</span>
        <span style={{ flex: 1, height: 1, background: "#e6d8d8", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      </div>

      {visible("summary") && summary && (
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#4a3e42", margin: "0 50px 18px", textAlign: "center", fontStyle: "italic" }}>
          {summary}
        </p>
      )}

      <div style={{ padding: "0 50px 40px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 36 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <FaH id="workExperience">{labelFor("workExperience")}</FaH>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 16, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontSize: 21, fontWeight: 600 }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: "inherit", fontSize: 11, color: blush, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 12, color: "#a08a8e", fontStyle: "italic", marginBottom: 5 }}>
                    {e.employer}{e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 12, color: "#4a3e42", lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ fontFamily: "inherit" }}>
          {visible("skills") && skills.length > 0 && (
            <>
              <FaH id="skills">{labelFor("skills")}</FaH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 11, color: blush, border: `1px solid ${blush}55`, padding: "4px 11px", borderRadius: 20 }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <FaH id="projects">{labelFor("projects")}</FaH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 12, color: "#4a3e42", marginBottom: 3, display: "flex", gap: 8 }}>
                  <span style={{ color: blush }}>✧</span>
                  <span><strong style={{ color: ink, fontWeight: 700 }}>{p.name}</strong>{p.role ? ` — ${p.role}` : ""}</span>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <FaH id="education">{labelFor("education")}</FaH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#a08a8e" }}>
                    {ed.institution} · {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <FaH id="certifications">{labelFor("certifications")}</FaH>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: "#4a3e42", marginBottom: 3, display: "flex", gap: 8 }}>
                  <span style={{ color: blush }}>✧</span>{c.name}
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <FaH id="languages">{labelFor("languages")}</FaH>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3, color: "#4a3e42" }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: "#a08a8e" }}>{l.level?.toUpperCase()}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
