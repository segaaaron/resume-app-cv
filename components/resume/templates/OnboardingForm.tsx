"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function OnboardingFormTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fff"
  const ink = "#1a1a1a"
  const purple = config.colorScheme || "#6b3aa0"
  const line = "#dcd6e8"

  function Field({ fieldLabel, value }: { fieldLabel: string; value: string }) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: purple, letterSpacing: "0.18em", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {fieldLabel.toUpperCase()}
        </div>
        <div style={{ borderBottom: `1.5px solid ${ink}`, padding: "4px 2px", fontSize: 13, fontWeight: 600 }}>
          {value}
        </div>
      </div>
    )
  }

  function Section({ t, children }: { t: string; children: React.ReactNode }) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{
          background: "#f4eef9", padding: "5px 10px",
          fontFamily: "ui-monospace, monospace", fontSize: 9,
          letterSpacing: "0.2em", color: purple, marginBottom: 8,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {t.toUpperCase()}
        </div>
        {children}
      </div>
    )
  }

  const formId = `CV-${(pd.firstName?.[0] ?? "X")}${(pd.lastName?.[0] ?? "X")}-${new Date().getFullYear()}`

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "inherit", fontSize: 11,
      padding: 36, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header banner */}
      <div style={{
        background: purple, color: paper, padding: "14px 20px",
        borderRadius: 8, marginBottom: 18,
        display: "flex", justifyContent: "space-between",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em" }}>
            {config.language === "en" ? "EMPLOYEE FORM · 001" : "FORMULARIO CANDIDATO · 001"}
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, marginTop: 4 }}>
            {config.language === "en" ? "Bring me on board" : "Súmame al equipo"}
          </div>
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, textAlign: "right", lineHeight: 1.7 }}>
          {config.language === "en" ? "DATE" : "FECHA"} · {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}<br />
          FORM-ID · {formId}
        </div>
      </div>

      {/* Personal fields */}
      <Field
        fieldLabel={config.language === "en" ? "full name" : "nombre completo"}
        value={`${pd.firstName || ""} ${pd.lastName || ""}`.trim() || "—"}
      />
      {pd.jobTitle && (
        <Field
          fieldLabel={config.language === "en" ? "role" : "cargo"}
          value={pd.jobTitle}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field fieldLabel={config.language === "en" ? "email" : "correo"} value={pd.email || "—"} />
        <Field fieldLabel={config.language === "en" ? "phone" : "teléfono"} value={pd.phone || "—"} />
      </div>
      {(pd.city || pd.country) && (
        <Field
          fieldLabel={config.language === "en" ? "city / country" : "ciudad / país"}
          value={[pd.city, pd.country].filter(Boolean).join(", ")}
        />
      )}
      {(pd.linkedin || pd.website) && (
        <Field fieldLabel="linkedin / web" value={[pd.linkedin, pd.website].filter(Boolean).join("  ·  ")} />
      )}

      {/* Summary */}
      {visible("summary") && summary && (
        <Section t={label("summary")}>
          <p style={{ margin: 0, lineHeight: 1.65, fontSize: 11.5 }}>{summary}</p>
        </Section>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Section t={label("workExperience")}>
          {workExperience.map((job) => {
            const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? job.startDate ?? ""
            const endStr = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? job.endDate ?? "")
            return (
              <div key={job.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr", padding: "8px 0", borderBottom: `1px solid ${line}`, gap: 12, fontSize: 11 }}>
                <span style={{ fontFamily: "ui-monospace, monospace", color: purple, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {startYear}{endStr ? `→${endStr}` : "→"}
                </span>
                <div>
                  <div style={{ fontWeight: 700 }}>{job.jobTitle}</div>
                  <div style={{ color: "#666" }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ color: "#555", marginTop: 4, fontSize: 10.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              </div>
            )
          })}
        </Section>
      )}

      {/* Skills as checkboxes */}
      {visible("skills") && skills.length > 0 && (
        <Section t={config.language === "en" ? "check all that apply" : label("skills")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11.5 }}>
            {skills.map((sk) => (
              <div key={sk.id}>
                <span style={{
                  display: "inline-block", width: 14, height: 14,
                  border: `1.5px solid ${ink}`, marginRight: 8,
                  verticalAlign: "middle", textAlign: "center",
                  lineHeight: "12px", color: purple, fontWeight: 800,
                }}>✓</span>
                <span>{sk.name}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education & Certifications */}
      {(visible("education") || visible("certifications")) && (education.length > 0 || certifications.length > 0) && (
        <Section t={config.language === "en" ? "education & certifications" : `${label("education")} y ${label("certifications")}`}>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            {education.map((edu) => (
              <span key={edu.id}>
                <b>{edu.startDate?.match(/\d{4}/)?.[0] ?? edu.startDate ?? ""}</b>
                {" · "}{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                {edu.institution ? ` · ${edu.institution}` : ""}<br />
              </span>
            ))}
            {certifications.map((cert) => (
              <span key={cert.id}>
                <b>{cert.date?.match(/\d{4}/)?.[0] ?? cert.date ?? ""}</b>
                {" · "}{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}<br />
              </span>
            ))}
          </p>
        </Section>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <Section t={label("languages")}>
          <div style={{ display: "flex", gap: 24, fontSize: 11, flexWrap: "wrap" }}>
            {languages.map((lang) => (
              <div key={lang.id}><b>{lang.name}</b> · {lang.level.toUpperCase()}</div>
            ))}
          </div>
        </Section>
      )}

      {/* Signature footer */}
      <div style={{
        marginTop: "auto", paddingTop: 14,
        borderTop: `2px solid ${ink}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div style={{ fontFamily: "'Pinyon Script', 'Brush Script MT', cursive", fontSize: 28, color: purple, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {pd.firstName || ""} {pd.lastName || ""}
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: "#666" }}>
          {config.language === "en" ? "SIGNED · APPLICANT" : "FIRMADO · CANDIDATO/A"}
        </div>
      </div>
    </div>
  )
}
