"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function VitalSignsTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const teal = config.colorScheme || "#0a8c8c"
  const paper = "#f1f7f7"
  const ink = "#0f2424"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 22,
        color: teal,
        margin: "16px 0 10px",
        fontWeight: 400,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  return (
    <div style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      fontSize: 10.5,
      padding: 36,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 24,
        alignItems: "center",
        borderBottom: `3px solid ${teal}`,
        paddingBottom: 16,
      }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: teal, letterSpacing: "0.22em" }}>
            {config.language === "en" ? "VITAL SIGNS · CV" : "SIGNOS VITALES · CV"}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 44, lineHeight: 1, margin: "8px 0 4px" }}>
            {fullName}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 14, color: teal }}>{pd.jobTitle}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* ECG / heartbeat SVG */}
          <svg width="120" height="60" viewBox="0 0 120 60">
            <polyline
              points="0,30 20,30 25,10 30,50 35,30 50,30 55,18 60,42 65,30 90,30 95,12 100,48 105,30 120,30"
              fill="none"
              stroke={teal}
              strokeWidth="2"
            />
          </svg>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, textAlign: "center", color: teal }}>
            {config.language === "en" ? "STABLE · ACTIVE" : "ESTABLE · ACTIVO"}
          </div>
        </div>
      </header>

      {/* Vitals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "20px 0" }}>
        {[
          [pd.email || "—", config.language === "en" ? "EMAIL" : "EMAIL"],
          [pd.phone || "—", config.language === "en" ? "PHONE" : "TEL"],
          [location || "—", config.language === "en" ? "LOCATION" : "UBICACIÓN"],
          [pd.linkedin || pd.website || "—", config.language === "en" ? "WEB" : "WEB"],
        ].map((m) => (
          <div key={m[1]} style={{ background: "#fff", borderLeft: `4px solid ${teal}`, padding: "10px 12px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <div style={{ fontWeight: 700, fontSize: 11, wordBreak: "break-all", lineHeight: 1.3 }}>{m[0]}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: teal, letterSpacing: "0.15em", marginTop: 2 }}>{m[1]}</div>
          </div>
        ))}
      </div>

      {/* Main columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, flex: 1 }}>
        <section>
          {visible("summary") && summary && (
            <>
              <H>{label("summary")}</H>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.65 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{label("workExperience")}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? "→" : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear}—${endYear}` : startYear || endYear
                return (
                  <div key={job.id} style={{ marginBottom: 10, paddingLeft: 14, borderLeft: `2px solid ${teal}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: teal }}>{yr}</div>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.jobTitle}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10.5, marginTop: 4, lineHeight: 1.55 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{ background: teal, color: "#fff", padding: "5px 11px", fontSize: 10.5, borderRadius: 100, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, lineHeight: 1.85 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              {education.map((edu) => {
                const startYear = edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = edu.currentlyStudying ? present : (edu.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear}—${endYear}` : startYear || endYear
                return (
                  <p key={edu.id} style={{ margin: "0 0 8px 0", fontSize: 11.5, lineHeight: 1.7 }}>
                    {yr && <><b>{yr}</b> · </>}{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}{edu.institution ? ` · ${edu.institution}` : ""}
                  </p>
                )
              })}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0, fontSize: 11 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>{lang.name} · {lang.level.toUpperCase()}{i < languages.length - 1 ? <br /> : null}</span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7 }}>
                {projects.map((p) => (
                  <li key={p.id}><strong>{p.name}</strong>{p.description ? ` — ${p.description}` : ""}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
