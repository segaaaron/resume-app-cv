"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function SketchbookIllustratorTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#f9f4e8"
  const ink = "#1c1814"
  const red = config.colorScheme || "#cc3a2a"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Caveat', 'Georgia', cursive", fontSize: 16,
      padding: 48, position: "relative",
      backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
      backgroundSize: "100% 28px",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Left margin line */}
      <div style={{
        position: "absolute", left: 28, top: 0, bottom: 0, width: 1,
        background: red, opacity: 0.4,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }} />

      <div style={{ marginLeft: 40 }}>
        {/* Date header */}
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, transform: "rotate(-2deg)" }}>
          ~ {config.language === "en" ? "notebook" : "cuaderno"} · {new Date().getFullYear()} ~
        </div>

        {/* Name */}
        <h1 style={{
          fontFamily: "'Caveat', cursive", fontSize: 92, lineHeight: 0.9,
          margin: "8px 0", fontWeight: 700, letterSpacing: "-0.01em",
        }}>
          {pd.firstName || "First"}<br />{pd.lastName || "Last"}
        </h1>

        {pd.jobTitle && (
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, transform: "rotate(-1deg)", color: red }}>
            {pd.jobTitle}
          </div>
        )}

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 28 }}>
          {/* Left content */}
          <div style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 19, lineHeight: 1.4 }}>
            {visible("summary") && summary && (
              <p style={{ margin: "0 0 20px" }}>{summary}</p>
            )}

            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 32, margin: "24px 0 8px", color: red }}>
                  {label("workExperience")} —
                </h2>
                <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.55 }}>
                  {workExperience.map((job) => (
                    <li key={job.id} style={{ marginBottom: 8 }}>
                      {job.startDate?.match(/\d{4}/)?.[0]}
                      {job.currentlyWorking
                        ? ` — ${present}`
                        : job.endDate?.match(/\d{4}/)?.[0]
                        ? ` — ${job.endDate.match(/\d{4}/)?.[0]}`
                        : ""}
                      {" · "}
                      <strong>{job.employer}</strong>
                      {job.jobTitle ? ` · ${job.jobTitle}` : ""}
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 15, lineHeight: 1.45, marginTop: 2, color: "#3a3a3a" }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {visible("projects") && projects.length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 32, margin: "24px 0 8px", color: red }}>
                  {label("projects")} —
                </h2>
                <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.55 }}>
                  {projects.map((p) => (
                    <li key={p.id}>{p.name}{p.description ? ` · ${p.description}` : ""}</li>
                  ))}
                </ul>
              </>
            )}

            {visible("education") && education.length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 32, margin: "24px 0 8px", color: red }}>
                  {label("education")} —
                </h2>
                {education.map((edu) => (
                  <p key={edu.id} style={{ margin: "0 0 4px" }}>
                    {edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}
                    {" · "}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </p>
                ))}
              </>
            )}

            <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 32, margin: "24px 0 8px", color: red }}>
              {config.language === "en" ? "Contact —" : "Hablemos —"}
            </h2>
            <p style={{ margin: 0 }}>
              {pd.email && <>{pd.email}<br /></>}
              {pd.phone && <>{pd.phone}<br /></>}
              {pd.website && <>{pd.website}<br /></>}
              {pd.linkedin && <>{pd.linkedin}<br /></>}
              {(pd.city || pd.country) && <>{[pd.city, pd.country].filter(Boolean).join(", ")}</>}
            </p>
          </div>

          {/* Right column — photo + tools */}
          <div style={{ width: 200, flexShrink: 0 }}>
            {(() => {
              const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
              return (
                <div style={{
                  width: 200, height: 200, background: "#e8d5b7", borderRadius: 8,
                  transform: "rotate(3deg)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "'Caveat', cursive",
                  fontSize: 72, color: ink, fontWeight: 700,
                  boxShadow: "4px 6px 0 rgba(0,0,0,0.1)",
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                }}>
                  {initials || "N"}
                </div>
              )
            })()}

            {visible("skills") && skills.length > 0 && (
              <div style={{ marginTop: 30, transform: "rotate(-2deg)", fontFamily: "'Caveat', cursive", fontSize: 20, lineHeight: 1.3 }}>
                <div style={{ color: red, fontSize: 24 }}>{label("skills")} ❤</div>
                {skills.map((sk) => (
                  <div key={sk.id}>· {sk.name}</div>
                ))}
              </div>
            )}

            {visible("languages") && languages.length > 0 && (
              <div style={{
                marginTop: 24, fontFamily: "'Caveat', cursive", fontSize: 22,
                transform: "rotate(2deg)", border: `2px solid ${ink}`,
                padding: 10, textAlign: "center",
              }}>
                ✿ {label("languages")} ✿<br />
                {languages.map((lang, i) => (
                  <span key={lang.id} style={{ fontSize: 16 }}>
                    {lang.name} · {lang.level}{i < languages.length - 1 ? <br /> : ""}
                  </span>
                ))}
              </div>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <div style={{
                marginTop: 20, fontFamily: "'Caveat', cursive", fontSize: 18,
                transform: "rotate(-1deg)", border: `2px dashed ${red}`,
                padding: 10, textAlign: "center",
              }}>
                ★ {label("certifications")} ★<br />
                {certifications.map((cert) => (
                  <span key={cert.id} style={{ fontSize: 15 }}>
                    {cert.name}<br />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
