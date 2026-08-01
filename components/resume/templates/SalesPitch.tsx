"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function SalesPitchTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const ink = "#101010"
  const cream = "#f5f1e8"
  const accent = designAccent(config.colorScheme, "#ff7a00")

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h3 style={{
        fontWeight: 800, fontSize: 18, margin: "22px 0 10px", letterSpacing: "-0.01em",
      }}>
        {children}
      </h3>
    )
  }

  function Row({ y, co, s, desc }: { y: string; co: string; s?: string; desc?: string }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "60px 1fr", gap: 12,
        padding: "8px 0", borderBottom: "1px solid #ddd",
      }}>
        <span style={{
          fontFamily: "ui-monospace, monospace", fontSize: 11, color: accent,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>{y}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{co}</div>
          {s && <div style={{ fontSize: 11, color: "#555" }}>{s}</div>}
          {desc && <div className="resume-desc" style={{ fontSize: 11, color: "#444", marginTop: 4 }} dangerouslySetInnerHTML={{ __html: desc }} />}
        </div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}·${String(now.getFullYear()).slice(2)}`

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "inherit", fontSize: 11, padding: 0,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Top bar */}
      <div style={{
        background: ink, color: cream, padding: "12px 36px",
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>SLIDE 01 / 01</span>
        <span>★ {config.language === "en" ? "PITCH" : "PRESENTACIÓN"} ★</span>
        <span>{dateStr}</span>
      </div>

      <div style={{ padding: "44px 56px", flex: 1 }}>
        {/* Hero */}
        <div style={{
          fontFamily: "ui-monospace, monospace", fontSize: 11,
          letterSpacing: "0.25em", color: accent,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {config.language === "en" ? "THE OPPORTUNITY" : "LA OPORTUNIDAD"}
        </div>
        <h1 style={{
          fontWeight: 900, fontSize: 80, lineHeight: 0.9,
          margin: "12px 0 12px", letterSpacing: "-0.04em",
        }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        {pd.jobTitle && (
          <div style={{
            fontWeight: 700, fontSize: 22, color: accent,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            {pd.jobTitle}
          </div>
        )}

        {/* Metrics box */}
        <div style={{
          marginTop: 30, padding: 24, background: ink, color: cream, borderRadius: 4,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          <div style={{
            fontFamily: "ui-monospace, monospace", fontSize: 10,
            letterSpacing: "0.2em", color: accent, marginBottom: 8,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            {config.language === "en" ? "THE NUMBERS" : "LOS NÚMEROS"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {[
              [workExperience.length > 0 ? `${workExperience.length}` : "—", config.language === "en" ? "positions" : "posiciones"],
              [education.length > 0 ? `${education.length}` : "—", config.language === "en" ? "degrees" : "estudios"],
              [skills.length > 0 ? `${skills.length}` : "—", config.language === "en" ? "skills" : "habilidades"],
              [languages.length > 0 ? `${languages.length}` : "—", config.language === "en" ? "languages" : "idiomas"],
            ].map((m) => (
              <div key={m[1]}>
                <div style={{ fontWeight: 900, fontSize: 36, letterSpacing: "-0.03em" }}>{m[0]}</div>
                <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{m[1]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, marginTop: 28 }}>
          {/* Left */}
          <section>
            {visible("summary") && summary && (
              <>
                <H>{config.language === "en" ? "The pitch" : "El perfil"}</H>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{summary}</p>
              </>
            )}

            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <H><SectionIcon sectionId="workExperience" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("workExperience")}</H>
                {workExperience.map((job) => {
                  const startY = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                  const endY = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                  return (
                    <Row
                      key={job.id}
                      y={startY}
                      co={job.employer || ""}
                      s={`${job.jobTitle}${job.city ? ` · ${job.city}` : ""}`}
                      desc={job.description ? fmtDesc(job.description) : undefined}
                    />
                  )
                })}
              </>
            )}
          </section>

          {/* Right */}
          <section>
            {visible("skills") && skills.length > 0 && (
              <>
                <H><SectionIcon sectionId="skills" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("skills")}</H>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {skills.map((sk) => (
                    <span key={sk.id} style={{
                      background: ink, color: cream, padding: "4px 9px",
                      fontSize: 10, fontFamily: "ui-monospace, monospace",
                      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                    }}>
                      {sk.name}
                    </span>
                  ))}
                </div>
              </>
            )}

            {visible("languages") && languages.length > 0 && (
              <>
                <H><SectionIcon sectionId="languages" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("languages")}</H>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, lineHeight: 1.85 }}>
                  {languages.map((l) => (
                    <li key={l.id}>{l.name} · {l.level}</li>
                  ))}
                </ul>
              </>
            )}

            {visible("education") && education.length > 0 && (
              <>
                <H><SectionIcon sectionId="education" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("education")}</H>
                <p style={{ margin: 0, fontSize: 11.5 }}>
                  {education.map((edu) => (
                    [edu.degree, edu.fieldOfStudy, edu.institution, edu.endDate?.match(/\d{4}/)?.[0]].filter(Boolean).join(" · ")
                  )).join("\n")}
                </p>
              </>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <>
                <H><SectionIcon sectionId="certifications" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("certifications")}</H>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, lineHeight: 1.85 }}>
                  {certifications.map((cert) => (
                    <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
                  ))}
                </ul>
              </>
            )}

            <H>{config.language === "en" ? "Get in touch" : "Contacto"}</H>
            <div style={{ fontSize: 11, lineHeight: 1.7, fontFamily: "ui-monospace, monospace" }}>
              {pd.email && <div>{pd.email}</div>}
              {pd.phone && <div>{pd.phone}</div>}
              {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
              {pd.linkedin && <div>{pd.linkedin}</div>}
              {pd.website && <div>{pd.website}</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
