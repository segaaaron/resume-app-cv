"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function MedicalChartTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#f4f6f4"
  const ink = "#1a1a1a"
  const green = config.colorScheme || "#0d7a4f"
  const red = "#c1352e"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.22em",
        color: green,
        margin: "18px 0 10px",
        textTransform: "uppercase",
        borderBottom: "1px solid #cfd6cf",
        paddingBottom: 4,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(" · ")

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "inherit",
      fontSize: 10.5,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <div style={{
        background: green,
        color: "#fff",
        padding: "16px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Cross icon */}
          <div style={{ width: 30, height: 30, border: "2.5px solid #fff", borderRadius: 6, position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", left: "50%", top: 4, bottom: 4, width: 4, background: "#fff", transform: "translateX(-50%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
            <div style={{ position: "absolute", top: "50%", left: 4, right: 4, height: 4, background: "#fff", transform: "translateY(-50%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          </div>
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em" }}>
              {config.language === "en" ? "PATIENT-FACING RECORD · CV" : "REGISTRO PROFESIONAL · CV"}
            </div>
            <div style={{ fontFamily: "inherit", fontWeight: 800, fontSize: 22, marginTop: 2 }}>
              {fullName.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
          FILE · {new Date().getFullYear()}-001
        </div>
      </div>

      {/* Name & title block */}
      <div style={{ padding: "30px 36px 0" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#777", letterSpacing: "0.2em" }}>
              {config.language === "en" ? "PROFESSIONAL NAME" : "NOMBRE PROFESIONAL"}
            </div>
            <h1 style={{ fontFamily: "inherit", fontSize: 38, fontWeight: 800, margin: "4px 0 0", letterSpacing: "-0.02em" }}>
              {fullName}
            </h1>
            {pd.jobTitle && (
              <div style={{ fontSize: 13, color: green, fontWeight: 600 }}>{pd.jobTitle}</div>
            )}
          </div>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{ width: 80, height: 80, borderRadius: 6, flexShrink: 0, backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 800, fontSize: 26 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", margin: "20px 36px 0", border: "1px solid #cfd6cf", fontSize: 10.5 }}>
        {[
          [config.language === "en" ? "EMAIL" : "EMAIL", pd.email || "—"],
          [config.language === "en" ? "PHONE" : "TELÉFONO", pd.phone || "—"],
          [config.language === "en" ? "LOCATION" : "UBICACIÓN", location || "—"],
          [config.language === "en" ? "WEBSITE" : "WEB", pd.website || pd.linkedin || "—"],
        ].map((c) => (
          <div key={c[0]} style={{ padding: "10px 12px", borderRight: "1px solid #cfd6cf" }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8.5, color: "#777", letterSpacing: "0.18em" }}>{c[0]}</div>
            <div style={{ fontWeight: 700, marginTop: 2, fontSize: 10, wordBreak: "break-all" }}>{c[1]}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <main style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, flex: 1 }}>
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "1 · ANAMNESIS" : "1 · ANAMNESIS"}</H>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{config.language === "en" ? "2 · WORK HISTORY" : "2 · HISTORIA LABORAL"}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? "→" : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear}—${endYear}` : startYear || endYear
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px dashed #aab" }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: green }}>{yr}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{job.jobTitle}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", marginTop: 4, lineHeight: 1.55 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{config.language === "en" ? "3 · PROJECTS" : "3 · PROYECTOS"}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7 }}>
                {projects.map((p) => (
                  <li key={p.id}><strong>{p.name}</strong>{p.description ? ` · ${p.description}` : ""}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H>{config.language === "en" ? "4 · SKILLS" : "4 · HABILIDADES"}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, lineHeight: 1.85 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{config.language === "en" ? "5 · CERTIFICATIONS" : "5 · CERTIFICACIONES"}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{config.language === "en" ? "6 · EDUCATION" : "6 · FORMACIÓN"}</H>
              {education.map((edu) => {
                const startYear = edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = edu.currentlyStudying ? present : (edu.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear}—${endYear}` : startYear || endYear
                return (
                  <p key={edu.id} style={{ margin: "0 0 6px 0", fontSize: 11.5, lineHeight: 1.7 }}>
                    {yr && <><b>{yr}</b> · </>}{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}{edu.institution ? ` · ${edu.institution}` : ""}
                  </p>
                )
              })}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{config.language === "en" ? "LANGUAGES" : "IDIOMAS"}</H>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
                ))}
              </div>
            </>
          )}

          <H>{config.language === "en" ? "7 · CONTACT" : "7 · CONTACTO"}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {location && <div>{location}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: green,
        color: "#fff",
        padding: "10px 36px",
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.2em",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <span>{config.language === "en" ? "SIGNED" : "FIRMADO"} · {fullName.toUpperCase()}</span>
        <span>{new Date().getMonth() + 1 < 10 ? "0" : ""}{new Date().getMonth() + 1}·{String(new Date().getFullYear()).slice(2)}</span>
        <span>CV ✓</span>
      </footer>
    </div>
  )
}
