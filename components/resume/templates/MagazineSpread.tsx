"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

function Col({ title, accent, rule, children }: { title: string; accent: string; rule: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: accent, fontWeight: 700 }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{children}</ul>
    </div>
  )
}

function Entry({ y, h, s, accent, rule, children }: { y: string; h: string; s?: string; accent: string; rule: string; children?: React.ReactNode }) {
  return (
    <li style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: accent, letterSpacing: "0.15em" }}>{y}</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{h}</div>
      {s && <div style={{ fontStyle: "italic", color: "#6b5e4d", fontSize: 10.5 }}>{s}</div>}
      {children && <div style={{ marginTop: 4, fontSize: 10 }}>{children}</div>}
    </li>
  )
}

export default function MagazineSpreadTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const cream = "#f5efe4"
  const ink = "#211c16"
  const accent = config.colorScheme
  const rule = "#d9d0bf"

  const firstName = pd.firstName || "First"
  const lastName = pd.lastName || "Last"

  const now = new Date()
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  const monthNamesES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const monthStr = config.language === "en" ? monthNames[now.getMonth()] : monthNamesES[now.getMonth()]

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "inherit", fontSize: 10.5, lineHeight: 1.6,
      padding: "56px 64px", display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ borderBottom: `2px solid ${ink}`, paddingBottom: 16, marginBottom: 24 }}>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 84, lineHeight: 0.9, margin: 0, letterSpacing: "-0.03em", fontStyle: "italic" }}>
          {firstName}<br /><span style={{ fontStyle: "normal" }}>{lastName}</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
          {pd.jobTitle && (
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, color: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {pd.jobTitle}
            </div>
          )}
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: "#6b5e4d", textAlign: "right" }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && pd.phone}
            {pd.city || pd.country ? <span> · {[pd.city, pd.country].filter(Boolean).join(", ")}</span> : null}
          </div>
        </div>
      </header>

      {/* Drop cap summary */}
      {visible("summary") && summary && (
        <section style={{ marginBottom: 28, columnCount: 2, columnGap: 28 }}>
          <p style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13.5, lineHeight: 1.55 }}>
            <span style={{ float: "left", fontSize: 56, lineHeight: 0.8, paddingRight: 6, paddingTop: 4, fontWeight: 900, color: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {summary.charAt(0).toUpperCase()}
            </span>
            {summary.slice(1)}
          </p>
        </section>
      )}

      {/* Three-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, flex: 1 }}>
        {/* Experience column */}
        {visible("workExperience") && (
          <Col title={label("workExperience")} accent={accent} rule={rule}>
            {workExperience.map((job) => (
              <Entry
                key={job.id}
                y={`${job.startDate || "?"}${job.currentlyWorking ? " →" : job.endDate ? ` — ${job.endDate}` : ""}`}
                h={job.jobTitle}
                s={job.employer + (job.city ? ` · ${job.city}` : "")}
                accent={accent}
                rule={rule}
              >
                {job.description && (
                  <div className="resume-desc" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </Entry>
            ))}
          </Col>
        )}

        {/* Skills / Languages column */}
        <Col title={label("skills")} accent={accent} rule={rule}>
          {visible("skills") && skills.length > 0 && skills.map((sk) => (
            <li key={sk.id} style={{ marginBottom: 6, fontSize: 11 }}>
              <em>{sk.level} — </em>{sk.name}
            </li>
          ))}
          {visible("languages") && languages.length > 0 && (
            <>
              <li style={{ marginBottom: 6, marginTop: 16, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 15, color: accent, listStyle: "none" }}>
                {label("languages")}
              </li>
              {languages.map((lang) => (
                <li key={lang.id} style={{ marginBottom: 6, fontSize: 11 }}>
                  <em>{lang.name} —</em> {lang.level.toUpperCase()}
                </li>
              ))}
            </>
          )}
        </Col>

        {/* Education / Certifications column */}
        <Col title={label("education")} accent={accent} rule={rule}>
          {visible("education") && education.map((edu) => (
            <Entry
              key={edu.id}
              y={edu.startDate || ""}
              h={edu.degree + (edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : "")}
              s={edu.institution}
              accent={accent}
              rule={rule}
            />
          ))}
          {visible("certifications") && certifications.length > 0 && (
            <>
              <li style={{ marginBottom: 6, marginTop: 16, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 15, color: accent, listStyle: "none" }}>
                {label("certifications")}
              </li>
              {certifications.map((cert) => (
                <Entry key={cert.id} y={cert.date || ""} h={cert.name} s={cert.issuer} accent={accent} rule={rule} />
              ))}
            </>
          )}
          {visible("projects") && projects.length > 0 && (
            <>
              <li style={{ marginBottom: 6, marginTop: 16, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 15, color: accent, listStyle: "none" }}>
                {label("projects")}
              </li>
              {projects.map((proj) => (
                <Entry key={proj.id} y="" h={proj.name} s={proj.role} accent={accent} rule={rule} />
              ))}
            </>
          )}
        </Col>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 28, borderTop: `1px solid ${ink}`, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em", color: "#6b5e4d" }}>
        {skills.map((sk, i) => (
          <span key={sk.id}>{i > 0 ? "·" : ""} {sk.name.toUpperCase()}</span>
        ))}
      </footer>
    </div>
  )
}
