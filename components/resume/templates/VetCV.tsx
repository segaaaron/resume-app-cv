"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function VetCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const sand = "#f5e6cc"
  const ink = "#3b2a1a"
  const brown = config.colorScheme || "#8a4a1c"
  const accent = "#5a8c4a"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 22,
        color: brown,
        margin: "18px 0 10px",
        fontWeight: 400,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: sand,
      color: ink,
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      fontSize: 11,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{
        background: brown,
        color: sand,
        padding: "30px 40px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        {/* Cat/pet SVG illustration */}
        <svg width="84" height="84" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
          <circle cx="40" cy="46" r="20" fill={sand} />
          <ellipse cx="22" cy="28" rx="8" ry="12" fill={sand} />
          <ellipse cx="58" cy="28" rx="8" ry="12" fill={sand} />
          <ellipse cx="14" cy="56" rx="6" ry="10" fill={sand} />
          <ellipse cx="66" cy="56" rx="6" ry="10" fill={sand} />
          <circle cx="34" cy="44" r="2" fill={brown} />
          <circle cx="46" cy="44" r="2" fill={brown} />
          <path d="M36 52 Q40 55 44 52" stroke={brown} strokeWidth="1.5" fill="none" />
        </svg>
        <div>
          {pd.jobTitle && (
            <div style={{ fontSize: 11, letterSpacing: "0.25em", color: sand, opacity: 0.85 }}>{pd.jobTitle.toUpperCase()}</div>
          )}
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 40, lineHeight: 1, margin: "8px 0 0" }}>
            {fullName}
          </h1>
          {(pd.email || pd.phone || location) && (
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
              {[pd.email, pd.phone, location].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ marginLeft: "auto", width: 80, height: 80, borderRadius: "50%", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: sand, fontWeight: 900, fontSize: 26 }}>{initials || "N"}</span>}
            </div>
          )
        })()}
      </header>

      {/* Main */}
      <main style={{ padding: "30px 40px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, flex: 1 }}>
        <section>
          {visible("summary") && summary && (
            <>
              <H>{label("summary")}</H>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65 }}>{summary}</p>
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
                  <div key={job.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px dashed ${brown}` }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: brown }}>{yr}</div>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.jobTitle}</div>
                    <div style={{ fontSize: 11 }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
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
                  <span key={sk.id} style={{ background: accent, color: "#fff", padding: "4px 10px", borderRadius: 100, fontSize: 10.5, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
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

          <H>{L.contact}</H>
          <div style={{ fontSize: 11.5, lineHeight: 1.85 }}>
            {pd.email && <div>✉ {pd.email}</div>}
            {pd.phone && <div>📞 {pd.phone}</div>}
            {location && <div>📍 {location}</div>}
            {pd.linkedin && <div>🔗 {pd.linkedin}</div>}
            {pd.website && <div>🌐 {pd.website}</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
