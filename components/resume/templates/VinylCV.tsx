"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function VinylCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const black = "#0a0a0a"
  const cream = "#f0e9d2"
  const gold = config.colorScheme || "#d4a942"
  const red = "#c1352e"

  return (
    <div style={{
      minHeight: "297mm",
      background: cream,
      color: black,
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header — vinyl sleeve */}
      <header style={{
        background: "#0a0a0a",
        color: cream,
        padding: "32px 40px",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 24,
        alignItems: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        {/* Vinyl SVG */}
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
          <circle cx="60" cy="60" r="58" fill="#1a1a1a"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#555" strokeWidth="0.5"/>
          <circle cx="60" cy="60" r="44" fill="none" stroke="#555" strokeWidth="0.5"/>
          <circle cx="60" cy="60" r="36" fill="none" stroke="#555" strokeWidth="0.5"/>
          <circle cx="60" cy="60" r="22" fill={red}/>
          <circle cx="60" cy="60" r="3" fill="#111"/>
          <text x="60" y="58" fontSize="6" fill={cream} fontFamily="ui-monospace" textAnchor="middle" letterSpacing="0.1em">SIDE A</text>
          <text x="60" y="68" fontSize="5" fill={cream} fontFamily="ui-monospace" textAnchor="middle">33⅓ RPM</text>
        </svg>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: cream }}>★ LP · DEBUT REISSUE · {new Date().getFullYear()} ★</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 46, fontWeight: 800, margin: "8px 0 2px", letterSpacing: "-0.01em", color: "#fff" }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontStyle: "italic", color: cream }}>{pd.jobTitle}</div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: "30px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, flex: 1 }}>
        {/* Side A */}
        <section>
          {visible("summary") && summary && (
            <>
              <H red={red}>Side A · Liner Notes</H>
              <p style={{ margin: 0, lineHeight: 1.65, fontSize: 12 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H red={red}>Side A · {label("workExperience")}</H>
              {workExperience.map((job, i) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "30px 60px 1fr", padding: "7px 0", borderBottom: "1px dashed #aaa", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>A{i + 1}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#555" }}>
                    {job.startDate?.match(/\d{4}/)?.[0] || ""}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {job.jobTitle}{job.employer ? ` · ${job.employer}` : ""}{job.city ? ` · ${job.city}` : ""}
                      {job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate.match(/\d{4}/)?.[0] || ""}` : ""}
                    </div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 11, color: "#444", marginTop: 3 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H red={red}>Side A · {label("projects")}</H>
              {projects.map((proj, i) => (
                <div key={proj.id} style={{ display: "grid", gridTemplateColumns: "30px 60px 1fr", padding: "7px 0", borderBottom: "1px dashed #aaa", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>P{i + 1}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#555" }}>
                    {proj.startDate?.match(/\d{4}/)?.[0] || ""}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{proj.name}</span>
                </div>
              ))}
            </>
          )}
        </section>

        {/* Side B */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H red={red}>Side B · {label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H red={red}>Side B · {label("education")}</H>
              <div style={{ margin: 0, lineHeight: 1.7, fontSize: 11.5 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    {edu.endDate?.match(/\d{4}/)?.[0] && <b>{edu.endDate.match(/\d{4}/)?.[0]} · </b>}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}{edu.institution ? ` · ${edu.institution}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H red={red}>Side B · {label("certifications")}</H>
              <div style={{ lineHeight: 1.7, fontSize: 11.5 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] && <b>{cert.date.match(/\d{4}/)?.[0]} · </b>}
                    {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H red={red}>Side B · {label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>{i > 0 ? " · " : ""}{lang.name} {lang.level.toUpperCase()}</span>
                ))}
              </p>
            </>
          )}

          <H red={red}>Side B · {config.language === "en" ? "Contact" : "Contacto"}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: "#0a0a0a",
        color: cream,
        padding: "10px 40px",
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: "0.3em",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <span>℗ {new Date().getFullYear()} {(pd.lastName || "RECORDS").toUpperCase()} RECORDS</span>
        <span>CAT. NO. CV-LP-001</span>
        <span>·  ALL RIGHTS  ·</span>
      </footer>
    </div>
  )
}

function H({ children, red }: { children: React.ReactNode; red: string }) {
  return (
    <h2 style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: 20,
      color: red,
      margin: "16px 0 10px",
      fontWeight: 800,
      fontStyle: "italic",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>{children}</h2>
  )
}
