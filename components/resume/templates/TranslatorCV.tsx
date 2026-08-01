"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function TranslatorCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f5f0e3"
  const ink = "#1a1810"
  const red = designAccent(config.colorScheme, "#7a1818")

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontStyle: "italic", fontSize: 18, color: red,
        margin: "14px 0 6px", fontWeight: 700,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  function Item({ year, title, subtitle }: { year: string; title: string; subtitle?: string }) {
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontStyle: "italic", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{year}</span>
        {" — "}
        <b>{title}</b><br />
        {subtitle && <span style={{ fontSize: 11 }}>{subtitle}</span>}
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'EB Garamond', Georgia, serif", fontSize: 11.5,
      padding: 48, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Centered header */}
      <header style={{ textAlign: "center", borderBottom: `1px solid ${ink}`, paddingBottom: 14 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.4em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          CURRICULUM VITÆ · {new Date().getFullYear()}
        </div>
        <h1 style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontStyle: "italic", fontSize: 48, fontWeight: 700,
          margin: "8px 0 4px", color: ink,
        }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        <div style={{ fontSize: 14 }}>
          <span style={{ color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {pd.jobTitle || ""}
          </span>
          {(pd.city || pd.country) && (
            <> &nbsp;·&nbsp; <i>{[pd.city, pd.country].filter(Boolean).join(", ")}</i></>
          )}
        </div>
      </header>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, marginTop: 24, flex: 1, fontSize: 11.5, lineHeight: 1.6 }}>
        {/* Left column */}
        <section style={{ borderRight: `1px solid ${ink}`, paddingRight: 24 }}>

          {visible("summary") && summary && (
            <>
              <H>{L.aboutMe}</H>
              <p style={{ margin: 0, textAlign: "justify" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H><SectionIcon sectionId="workExperience" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("workExperience")}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? job.startDate ?? ""
                const endStr = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? job.endDate ?? "")
                return (
                  <div key={job.id} style={{ marginBottom: 8 }}>
                    <Item
                      year={`${startYear}${endStr ? `–${endStr}` : ""}`}
                      title={job.employer || job.jobTitle}
                      subtitle={job.employer ? job.jobTitle : undefined}
                    />
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 11, marginTop: 2, color: "#333" }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H><SectionIcon sectionId="education" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("education")}</H>
              <p style={{ margin: 0 }}>
                {education.map((edu) => (
                  <span key={edu.id}>
                    <i>{edu.startDate?.match(/\d{4}/)?.[0] ?? edu.startDate ?? ""}</i>
                    {" · "}{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}<br />
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H><SectionIcon sectionId="languages" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} · {lang.level.toUpperCase()}{i < languages.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </>
          )}
        </section>

        {/* Right column */}
        <section>

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H><SectionIcon sectionId="certifications" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("certifications")}</H>
              <p style={{ margin: 0 }}>
                {certifications.map((cert) => (
                  <span key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] ?? cert.date ?? ""}
                    {" · "}<b>{cert.name}</b>
                    {cert.issuer ? ` · ${cert.issuer}` : ""}
                    <br />
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H><SectionIcon sectionId="projects" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("projects")}</H>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 8 }}>
                  <b>{proj.name}</b>
                  {proj.description && (
                    <div className="resume-desc" style={{ fontSize: 11, color: "#333", marginTop: 2 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H><SectionIcon sectionId="skills" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("skills")}</H>
              <p style={{ margin: 0 }}>
                {skills.map((sk, i) => (
                  <span key={sk.id}>{sk.name}{i < skills.length - 1 ? " · " : ""}</span>
                ))}
              </p>
            </>
          )}

          {/* Contact block at bottom */}
          <H>{L.contact}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${ink}`, marginTop: 14, paddingTop: 10,
        textAlign: "center", fontFamily: "ui-monospace, monospace",
        fontSize: 10, letterSpacing: "0.2em",
      }}>
        {[pd.email, pd.phone, [pd.city, pd.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
      </footer>
    </div>
  )
}
