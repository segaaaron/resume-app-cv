"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

function SH({ children, accentColor, style = {} }: { children: React.ReactNode; accentColor: string; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: "italic", fontSize: 22, color: accentColor, margin: "0 0 12px", fontWeight: 400, ...style }}>
      {children}
    </h2>
  )
}

export default function SageBotanicalTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#f1ede4"
  const sage = config.colorScheme
  const dark = "#2a3a29"
  const accent = "#c2774a"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: dark,
      fontFamily: "'DM Sans', 'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.6,
      padding: 0, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Curved hero header */}
      <header style={{
        background: sage, color: bg,
        padding: "44px 48px 90px",
        borderBottomLeftRadius: "50% 80px", borderBottomRightRadius: "50% 80px",
        position: "relative",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{ width: 130, height: 130, borderRadius: "50%", background: "rgba(0,0,0,0.15)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: bg, fontWeight: 900, fontSize: 44 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
          <div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: "italic", fontSize: 16, opacity: 0.85 }}>— curriculum vitæ</div>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 52, lineHeight: 1, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
              {pd.firstName || "First"} {pd.lastName || "Last"}
            </h1>
            {pd.jobTitle && <div style={{ fontSize: 14 }}>{pd.jobTitle}</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: "ui-monospace, monospace", fontSize: 10, opacity: 0.95, flexWrap: "wrap" }}>
              {pd.email && <span>{pd.email}</span>}
              {pd.email && pd.phone && <span>·</span>}
              {pd.phone && <span>{pd.phone}</span>}
              {(pd.city || pd.country) && <><span>·</span><span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></>}
            </div>
          </div>
        </div>
      </header>

      {/* Two-column body */}
      <main style={{ padding: "10px 56px 44px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, flex: 1 }}>
        <section>
          {visible("summary") && summary && (
            <>
              <SH accentColor={accent}>{label("summary")}</SH>
              <p style={{ margin: "0 0 28px" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <SH accentColor={accent} style={{ marginTop: 28 }}>{label("workExperience")}</SH>
              {workExperience.map((job) => (
                <div key={job.id} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: `2px solid ${accent}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: accent, letterSpacing: "0.15em" }}>
                    {job.startDate}{job.currentlyWorking ? ` →` : job.endDate ? ` — ${job.endDate}` : ""}
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16 }}>{job.jobTitle}</div>
                  <div style={{ fontStyle: "italic", color: sage }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10, color: dark, marginTop: 4, lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        <section>
          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <>
              <SH accentColor={accent}>{label("skills")}</SH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{ background: "transparent", border: `1px solid ${dark}`, padding: "5px 10px", borderRadius: 100, fontSize: 10.5 }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Education */}
          {visible("education") && education.length > 0 && (
            <>
              <SH accentColor={accent} style={{ marginTop: 28 }}>{label("education")}</SH>
              {education.map((edu) => (
                <p key={edu.id} style={{ margin: "0 0 10px" }}>
                  <b>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</b>
                  {edu.institution && <><br />{edu.institution}{edu.startDate ? ` · ${edu.startDate}${edu.currentlyStudying ? `—${present}` : edu.endDate ? `—${edu.endDate}` : ""}` : ""}</>}
                </p>
              ))}
            </>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <>
              <SH accentColor={accent} style={{ marginTop: 28 }}>{label("languages")}</SH>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>{i > 0 ? " · " : ""}{lang.name} · {lang.level.toUpperCase()}</span>
                ))}
              </p>
            </>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <>
              <SH accentColor={accent} style={{ marginTop: 28 }}>{label("certifications")}</SH>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {/* Projects */}
          {visible("projects") && projects.length > 0 && (
            <>
              <SH accentColor={accent} style={{ marginTop: 28 }}>{label("projects")}</SH>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {projects.map((proj) => (
                  <li key={proj.id}>{proj.name}{proj.role ? ` · ${proj.role}` : ""}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
