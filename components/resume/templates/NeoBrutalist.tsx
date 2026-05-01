"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

function Hard({ children, color, ink, style = {} }: { children: React.ReactNode; color: string; ink: string; style?: React.CSSProperties }) {
  return (
    <div style={{ background: color, border: `3px solid ${ink}`, boxShadow: `6px 6px 0 0 ${ink}`, padding: 14, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", ...style }}>
      {children}
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Archivo Black', 'Space Grotesk', sans-serif", fontSize: 16, marginBottom: 10, textTransform: "uppercase", fontWeight: 900 }}>
      {children}
    </div>
  )
}

export default function NeoBrutalistTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#fef6e4"
  const ink = "#0d0d0d"
  const yellow = accent
  const pink = "#f582ae"
  const blue = "#8bd3dd"
  const green = "#a8e6a3"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: ink,
      fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, lineHeight: 1.5,
      padding: 36, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignContent: "start",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Hero card */}
      <Hard color={yellow} ink={ink} style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.2em" }}>HELLO! I AM</div>
            <h1 style={{ fontFamily: "'Archivo Black', 'Space Grotesk', sans-serif", fontSize: 56, lineHeight: 0.92, margin: "8px 0 4px", letterSpacing: "-0.03em", textTransform: "uppercase", fontWeight: 900 }}>
              {pd.firstName || "First"} {pd.lastName || "Last"}
            </h1>
            {pd.jobTitle && <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{pd.jobTitle}</div>}
          </div>
          <div style={{ background: ink, color: yellow, padding: "10px 14px", border: `3px solid ${ink}`, fontFamily: "'Archivo Black', sans-serif", fontSize: 22, transform: "rotate(-3deg)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            HIRE ME!
          </div>
        </div>
      </Hard>

      {/* Contact */}
      <Hard color={pink} ink={ink}>
        <Title>// Contact</Title>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12, lineHeight: 1.85 }}>
          {pd.email && <li>📧 {pd.email}</li>}
          {pd.phone && <li>📱 {pd.phone}</li>}
          {(pd.city || pd.country) && <li>📍 {[pd.city, pd.country].filter(Boolean).join(", ")}</li>}
          {pd.linkedin && <li>🔗 {pd.linkedin}</li>}
          {pd.website && <li>🌐 {pd.website}</li>}
        </ul>
      </Hard>

      {/* Summary */}
      {visible("summary") && summary && (
        <Hard color={blue} ink={ink}>
          <Title>// {label("summary")}</Title>
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55 }}>{summary}</p>
        </Hard>
      )}

      {/* Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Hard color="#fff" ink={ink} style={{ gridColumn: "1 / 2" }}>
          <Title>// {label("workExperience")}</Title>
          {workExperience.map((job) => (
            <div key={job.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10, padding: "8px 0", borderBottom: `2px dashed ${ink}` }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, fontWeight: 700 }}>
                {job.startDate}{job.currentlyWorking ? `→${present}` : job.endDate ? `→${job.endDate}` : ""}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12.5 }}>{job.employer}</div>
                <div style={{ fontSize: 11 }}>{job.jobTitle}</div>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: 10, color: "#333", marginTop: 4, lineHeight: 1.45 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            </div>
          ))}
        </Hard>
      )}

      {/* Right column cards */}
      <div style={{ display: "grid", gap: 18, gridColumn: "2 / 3", alignContent: "start" }}>
        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <Hard color={green} ink={ink}>
            <Title>// {label("skills")}</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{ background: ink, color: green, padding: "4px 9px", fontSize: 10, fontFamily: "ui-monospace, monospace", fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {sk.name}
                </span>
              ))}
            </div>
          </Hard>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <Hard color={yellow} ink={ink}>
            <Title>// {label("education")}</Title>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                {edu.institution && <div style={{ fontSize: 11 }}>{edu.institution}</div>}
                {(edu.startDate || edu.endDate) && (
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, marginTop: 2 }}>
                    {edu.startDate}{edu.endDate ? `—${edu.endDate}` : ""}
                  </div>
                )}
              </div>
            ))}
          </Hard>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <Hard color={pink} ink={ink}>
            <Title>// {label("languages")}</Title>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.7 }}>
              {languages.map((lang) => (
                <li key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</li>
              ))}
            </ul>
          </Hard>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <Hard color={blue} ink={ink}>
            <Title>// {label("certifications")}</Title>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.7 }}>
              {certifications.map((cert) => (
                <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
              ))}
            </ul>
          </Hard>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <Hard color="#fff" ink={ink}>
            <Title>// {label("projects")}</Title>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.7 }}>
              {projects.map((proj) => (
                <li key={proj.id}>{proj.name}{proj.role ? ` · ${proj.role}` : ""}</li>
              ))}
            </ul>
          </Hard>
        )}
      </div>
    </div>
  )
}
