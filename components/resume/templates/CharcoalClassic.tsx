"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
const LANG_PCT: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

function SideSection({ title, ink, rule, children }: { title: string; ink: string; rule: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: "0.22em", margin: "0 0 8px", paddingBottom: 6, borderBottom: `1px solid ${rule}`, textTransform: "uppercase", color: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10.5 }}>{children}</ul>
    </section>
  )
}

function MainBlock({ title, ink, rule, accent, children }: { title: string; ink: string; rule: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, letterSpacing: "0.22em", margin: "0 0 12px", textTransform: "uppercase", paddingBottom: 8, borderBottom: `1px solid ${ink}`, color: ink }}>{title}</h2>
      {children}
    </section>
  )
}

export default function CharcoalClassicTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, hobbies } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const ink = "#2a2a2a"
  const sub = "#7a7a7a"
  const rule = "#e9e7e2"
  const bg = "#fbfaf6"

  return (
    <div style={{
      minHeight: "297mm", background: bg, color: ink,
      fontFamily: "'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.55,
      padding: "32px 36px", display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header pill */}
      <header style={{
        background: ink, color: bg, borderRadius: 80,
        padding: "16px 28px 16px 16px", display: "flex", alignItems: "center", gap: 22, marginBottom: 30,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {config.photoUrl ? (
          <div style={{ width: 108, height: 108, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 20}%` }} />
          </div>
        ) : (
          <div style={{ width: 108, height: 108, borderRadius: "50%", background: "#cfd5db", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1, color: bg }}>
            {(pd.firstName || "First").toUpperCase()} {(pd.lastName || "Last").toUpperCase()}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 10.5, letterSpacing: "0.28em", color: "#bdbdbd", marginTop: 6 }}>{pd.jobTitle.toUpperCase()}</div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "#dcdcdc", flexWrap: "wrap" }}>
            {pd.phone && <span>📞 {pd.phone}</span>}
            {pd.email && <span>✉ {pd.email}</span>}
            {(pd.city || pd.country) && <span>📍 {[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 36, flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ color: ink }}>
          {/* Education */}
          {visible("education") && education.length > 0 && (
            <SideSection title={label("education")} ink={ink} rule={rule}>
              {education.map((edu) => (
                <li key={edu.id} style={{ marginBottom: 12 }}>
                  {(edu.startDate || edu.endDate) && (
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: sub }}>{edu.startDate}{edu.currentlyStudying ? `—${present}` : edu.endDate ? `—${edu.endDate}` : ""}</div>
                  )}
                  <div style={{ fontWeight: 700, color: ink }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                  {edu.institution && <div style={{ color: sub, fontSize: 10 }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</div>}
                </li>
              ))}
            </SideSection>
          )}

          {/* Skills with bars */}
          {visible("skills") && skills.length > 0 && (
            <SideSection title={label("skills")} ink={ink} rule={rule}>
              {skills.map((sk) => {
                const pct = SKILL_PCT[sk.level] ?? 50
                return (
                  <div key={sk.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                      <span style={{ color: ink }}>{sk.name}</span>
                      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: sub }}>{pct}</span>
                    </div>
                    <div style={{ height: 3, background: rule, borderRadius: 2, position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: 3, width: `${pct}%`, background: ink, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </SideSection>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <SideSection title={label("languages")} ink={ink} rule={rule}>
              {languages.map((lang) => (
                <li key={lang.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: ink, fontSize: 10.5 }}>
                  <span>{lang.name}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: sub }}>{lang.level.toUpperCase()}</span>
                </li>
              ))}
            </SideSection>
          )}

          {/* Hobbies */}
          {visible("hobbies") && hobbies && (
            <SideSection title={label("hobbies")} ink={ink} rule={rule}>
              {hobbies.split(/[\n,]+/).filter(Boolean).map((h, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", color: ink, fontSize: 10.5 }}>
                  <span style={{ fontSize: 8, color: ink }}>●</span> {h.trim()}
                </li>
              ))}
            </SideSection>
          )}

          {/* Contact */}
          {(pd.linkedin || pd.github || pd.website) && (
            <SideSection title="Links" ink={ink} rule={rule}>
              {pd.linkedin && <li style={{ padding: "2px 0", color: sub, fontSize: 10, wordBreak: "break-all" }}>{pd.linkedin}</li>}
              {pd.github && <li style={{ padding: "2px 0", color: sub, fontSize: 10, wordBreak: "break-all" }}>{pd.github}</li>}
              {pd.website && <li style={{ padding: "2px 0", color: sub, fontSize: 10, wordBreak: "break-all" }}>{pd.website}</li>}
            </SideSection>
          )}
        </aside>

        {/* Main */}
        <main>
          {/* Summary */}
          {visible("summary") && summary && (
            <MainBlock title={label("summary")} ink={ink} rule={rule} accent={accent}>
              <p style={{ margin: 0, color: "#3a3a3a" }}>{summary}</p>
            </MainBlock>
          )}

          {/* Work Experience */}
          {visible("workExperience") && workExperience.length > 0 && (
            <MainBlock title={label("workExperience")} ink={ink} rule={rule} accent={accent}>
              {workExperience.map((job) => (
                <div key={job.id} style={{ marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.jobTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: sub, fontSize: 10.5, marginBottom: 6 }}>
                    <span>{job.employer}{job.city ? ` · ${job.city}` : ""}</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5 }}>
                      {job.startDate}{job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                    </span>
                  </div>
                  {job.description && (
                    <div className="cc-desc" style={{ fontSize: 10.5, color: "#3a3a3a", lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </MainBlock>
          )}

          {/* Projects */}
          {visible("projects") && projects.length > 0 && (
            <MainBlock title={label("projects")} ink={ink} rule={rule} accent={accent}>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{proj.name}{proj.role ? ` · ${proj.role}` : ""}</div>
                  {proj.description && <p style={{ margin: "4px 0 0", fontSize: 10.5, color: "#3a3a3a" }}>{proj.description}</p>}
                </div>
              ))}
            </MainBlock>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <MainBlock title={label("certifications")} ink={ink} rule={rule} accent={accent}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ marginBottom: 4, fontSize: 10.5 }}>
                  {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}
                </div>
              ))}
            </MainBlock>
          )}

          {/* Volunteer */}
          {visible("volunteer") && volunteer.length > 0 && (
            <MainBlock title={label("volunteer")} ink={ink} rule={rule} accent={accent}>
              {volunteer.map((vol) => (
                <div key={vol.id} style={{ marginBottom: 4, fontSize: 10.5 }}>
                  {vol.role}{vol.organization ? ` · ${vol.organization}` : ""}
                </div>
              ))}
            </MainBlock>
          )}
        </main>
      </div>
    </div>
  )
}
