"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function ChefMenuTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f4ecd8"
  const ink = "#1a120a"
  const red = config.colorScheme || "#8a2a1c"
  const olive = "#6b6029"

  function Course({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: "italic", color: red, fontWeight: 600, lineHeight: 1 }}>{n}.</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: "0.04em" }}>{t}</span>
          <div style={{ flex: 1, borderBottom: `1px dotted ${ink}`, marginBottom: 6 }}></div>
        </div>
        {children}
      </div>
    )
  }

  function Dish({ n, t, p, desc }: { n: string; t: string; p?: string; desc?: string }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "5px 0", fontSize: 12, lineHeight: 1.4 }}>
        <div>
          <span style={{ fontStyle: "italic", color: olive }}>{n}</span>&nbsp;&nbsp;<b>{t}</b>
          {desc && <div className="resume-desc" style={{ fontSize: 11, color: "#555", fontStyle: "italic" }} dangerouslySetInnerHTML={{ __html: desc }} />}
        </div>
        {p && <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>{p}</div>}
      </div>
    )
  }

  let courseNum = 0
  const nextCourse = () => {
    courseNum++
    const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
    return roman[courseNum - 1] || String(courseNum)
  }

  const summaryLabel = L.aboutMe
  const expLabel = label("workExperience")
  const skillsLabel = label("skills")
  const eduLabel = label("education")
  const certLabel = label("certifications")
  const langLabel = label("languages")
  const contactLabel = L.contact

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: cream,
      color: ink,
      fontFamily: "'EB Garamond', serif",
      fontSize: 12,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ textAlign: "center", padding: "44px 56px 20px", borderBottom: `1px solid ${ink}` }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.4em", color: red }}>
          ★ {config.language === "en" ? "MENU" : "MENÚ"} ★
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 600, margin: "10px 0 4px", letterSpacing: "0.02em", color: ink }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontStyle: "italic", fontSize: 16 }}>{pd.jobTitle}</div>
        )}
        <div style={{ marginTop: 10, fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.35em" }}>—  ≋  —</div>
      </header>

      {/* Main two-column content */}
      <main style={{ padding: "26px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, flex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <Course n={nextCourse()} t={summaryLabel}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55 }}>{summary}</p>
            </Course>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <Course n={nextCourse()} t={expLabel}>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const dateRange = startYear && endYear ? `${startYear} — ${endYear}` : startYear || endYear
                return (
                  <Dish
                    key={job.id}
                    n={dateRange}
                    t={`${job.jobTitle}${job.employer ? ` · ${job.employer}` : ""}`}
                    p={job.city || undefined}
                    desc={job.description ? fmtDesc(job.description) : undefined}
                  />
                )
              })}
            </Course>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <Course n={nextCourse()} t={label("projects")}>
              {projects.map((proj) => (
                <div key={proj.id} style={{ padding: "5px 0", fontSize: 12, lineHeight: 1.4 }}>
                  <b>{proj.name}</b>
                  {proj.description && (
                    <div className="resume-desc" style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                  )}
                </div>
              ))}
            </Course>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <Course n={nextCourse()} t={skillsLabel}>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.85 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </Course>
          )}

          {visible("education") && education.length > 0 && (
            <Course n={nextCourse()} t={eduLabel}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7 }}>
                {education.map((edu, i) => {
                  const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                  return (
                    <span key={edu.id}>
                      {year && <><i>{year}</i> · </>}
                      {edu.institution && <>{edu.institution}</>}
                      {edu.degree && <> · {edu.degree}</>}
                      {edu.fieldOfStudy && <>, {edu.fieldOfStudy}</>}
                      {i < education.length - 1 && <br />}
                    </span>
                  )
                })}
              </p>
            </Course>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <Course n={nextCourse()} t={certLabel}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7 }}>
                {certifications.map((cert, i) => (
                  <span key={cert.id}>
                    {cert.date && <><i>{cert.date?.match(/\d{4}/)?.[0] ?? cert.date}</i> · </>}
                    {cert.name}
                    {cert.issuer && <> · {cert.issuer}</>}
                    {i < certifications.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </Course>
          )}

          {visible("languages") && languages.length > 0 && (
            <Course n={nextCourse()} t={langLabel}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} · {lang.level}
                    {i < languages.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </Course>
          )}

          <Course n={nextCourse()} t={contactLabel}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, fontFamily: "ui-monospace, monospace" }}>
              {pd.email && <>{pd.email}<br /></>}
              {pd.phone && <>{pd.phone}<br /></>}
              {(pd.city || pd.country) && <>{[pd.city, pd.country].filter(Boolean).join(" · ")}<br /></>}
              {pd.linkedin && <>{pd.linkedin}<br /></>}
              {pd.website && <>{pd.website}</>}
            </p>
          </Course>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${ink}`,
        padding: "16px 56px",
        textAlign: "center",
        fontFamily: "'Pinyon Script', cursive",
        fontSize: 28,
        color: red,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        {config.language === "en" ? "~ bon appétit ~" : "~ buen provecho ~"}
      </footer>
    </div>
  )
}
