"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

function SH({ children, ink }: { children: React.ReactNode; ink: string }) {
  return (
    <h2 style={{ fontSize: 13, letterSpacing: "0.22em", margin: "0 0 14px", paddingBottom: 6, borderBottom: `2px solid ${ink}`, textTransform: "uppercase", fontWeight: 700, color: ink }}>
      {children}
    </h2>
  )
}

export default function CoralSidebarTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd
  const accent = config.colorScheme
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const coral = accent
  const cream = "#fdf6ec"
  const ink = "#2b2118"
  const sand = "#efe4d2"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.55,
      display: "grid", gridTemplateColumns: "1fr 280px",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Main column */}
      <main style={{ padding: "48px 40px" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.3em", color: coral, marginBottom: 6, textTransform: "uppercase" }}>
          {pd.jobTitle || "Curriculum 2026"}
        </div>
        <h1 style={{ fontSize: 56, lineHeight: 0.95, margin: 0, letterSpacing: "-0.025em", fontWeight: 800 }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}.
        </h1>
        <div style={{ height: 4, width: 80, background: coral, marginTop: 16, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

        {visible("summary") && summary && (
          <section style={{ marginTop: 30 }}>
            <SH ink={ink}>{label("summary")}</SH>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7 }}>{summary}</p>
          </section>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <SH ink={ink}>{label("workExperience")}</SH>
            {workExperience.map((job) => (
              <div key={job.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 14, padding: "12px 0", borderBottom: `1px solid ${sand}` }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: coral, paddingTop: 2 }}>
                  {job.startDate}{job.currentlyWorking ? ` → ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.jobTitle}</div>
                  <div style={{ color: "#5d4d3c", fontSize: 11.5 }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10.5, color: "#3a3a3a", marginTop: 4, lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {visible("projects") && projects.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <SH ink={ink}>{label("projects")}</SH>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
              {projects.map((proj) => (
                <div key={proj.id} style={{ background: sand, padding: "8px 12px", borderRadius: 8, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <div style={{ fontWeight: 700 }}>{proj.name}</div>
                  {proj.role && <div style={{ color: "#5d4d3c", fontSize: 10 }}>{proj.role}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <SH ink={ink}>{label("certifications")}</SH>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ background: sand, padding: "8px 12px", borderRadius: 8, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Right sidebar */}
      <aside style={{ background: coral, color: cream, padding: "48px 28px", display: "flex", flexDirection: "column", gap: 28, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ width: 180, height: 180, borderRadius: "50%", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: cream, fontWeight: 800, fontSize: 52 }}>
          {initials || "N"}
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.8 }}>Contact</div>
          <div style={{ height: 1, background: cream, opacity: 0.4, margin: "6px 0 10px" }} />
          <div style={{ fontSize: 11.5, lineHeight: 1.9 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
          </div>
        </div>

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.8 }}>{label("skills")}</div>
            <div style={{ height: 1, background: cream, opacity: 0.4, margin: "6px 0 10px" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{ background: "rgba(255,255,255,0.18)", padding: "4px 9px", borderRadius: 100, fontSize: 10, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{sk.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.8 }}>{label("education")}</div>
            <div style={{ height: 1, background: cream, opacity: 0.4, margin: "6px 0 10px" }} />
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                {edu.institution && <div style={{ fontSize: 11, opacity: 0.85 }}>{edu.institution}{edu.startDate ? ` · ${edu.startDate}${edu.endDate ? `—${edu.endDate}` : ""}` : ""}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.8 }}>{label("languages")}</div>
            <div style={{ height: 1, background: cream, opacity: 0.4, margin: "6px 0 10px" }} />
            <div style={{ fontSize: 11.5, lineHeight: 1.85 }}>
              {languages.map((lang) => (
                <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
