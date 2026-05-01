"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

function Sec({ title, gold, children }: { title: string; gold: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.25em", color: gold, marginBottom: 8, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 10.5, color: "#dde3ea", lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function MainBlock({ title, navy, gold, children }: { title: string; navy: string; gold: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: navy, margin: "0 0 8px", fontWeight: 700 }}>{title}</h2>
      <div style={{ height: 1, background: gold, width: 36, marginBottom: 10, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      {children}
    </section>
  )
}

export default function NavyExecutiveTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, volunteer } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const navy = "#0e2a44"
  const ivory = "#f7f3e8"
  const gold = "#b48a3c"
  const ink = "#1a1a1a"

  return (
    <div style={{
      minHeight: "297mm", background: ivory, color: ink,
      fontFamily: "'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.55,
      display: "grid", gridTemplateColumns: "260px 1fr",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Sidebar */}
      <aside style={{ background: navy, color: ivory, padding: "44px 24px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {config.photoUrl ? (
          <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 20}%` }} />
          </div>
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: "50%", background: "#1a3956", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        )}

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, lineHeight: 1.05, margin: "22px 0 4px", color: ivory }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        <div style={{ width: 28, height: 2, background: gold, margin: "8px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        {pd.jobTitle && (
          <div style={{ fontSize: 10.5, letterSpacing: "0.18em", color: gold, textTransform: "uppercase" }}>{pd.jobTitle}</div>
        )}

        <Sec title="Contact" gold={gold}>
          {pd.phone && <div>{pd.phone}</div>}
          {pd.email && <div>{pd.email}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
          {pd.linkedin && <div>{pd.linkedin}</div>}
          {pd.website && <div>{pd.website}</div>}
        </Sec>

        {visible("education") && education.length > 0 && (
          <Sec title={label("education")} gold={gold}>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                {(edu.startDate || edu.endDate) && (
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: gold }}>
                    {edu.startDate}{edu.currentlyStudying ? ` — ${present}` : edu.endDate ? ` — ${edu.endDate}` : ""}
                  </div>
                )}
                <div style={{ fontWeight: 600, color: ivory }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                {edu.institution && <div style={{ color: "#bdc7d2" }}>{edu.institution}</div>}
              </div>
            ))}
          </Sec>
        )}

        {visible("skills") && skills.length > 0 && (
          <Sec title={label("skills")} gold={gold}>
            {skills.map((sk) => {
              const pct = SKILL_PCT[sk.level] ?? 50
              return (
                <div key={sk.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: ivory }}>
                    <span>{sk.name}</span>
                    <span style={{ color: gold }}>{pct}</span>
                  </div>
                  <div style={{ height: 3, background: "#1a3956", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ height: 3, width: `${pct}%`, background: gold, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                </div>
              )
            })}
          </Sec>
        )}

        {visible("languages") && languages.length > 0 && (
          <Sec title={label("languages")} gold={gold}>
            {languages.map((lang) => (
              <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
            ))}
          </Sec>
        )}
      </aside>

      {/* Main */}
      <main style={{ padding: "44px 40px" }}>
        <div style={{ borderBottom: `2px solid ${navy}`, paddingBottom: 8, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontStyle: "italic", color: navy }}>Curriculum Vitæ</span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: gold, letterSpacing: "0.2em" }}>
            {new Date().getFullYear()}
          </span>
        </div>

        {visible("summary") && summary && (
          <MainBlock title={label("summary")} navy={navy} gold={gold}>
            <p style={{ margin: 0 }}>{summary}</p>
          </MainBlock>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <MainBlock title={label("workExperience")} navy={navy} gold={gold}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #d9d2bf" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{job.jobTitle}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: gold }}>
                    {job.startDate}{job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontStyle: "italic", color: navy, marginTop: 2 }}>
                  {job.employer}{job.city ? ` · ${job.city}` : ""}
                </div>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: 10.5, color: "#3a3a3a", marginTop: 6, lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </MainBlock>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <MainBlock title={label("certifications")} navy={navy} gold={gold}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {certifications.map((cert) => (
                <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
              ))}
            </ul>
          </MainBlock>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <MainBlock title={label("volunteer")} navy={navy} gold={gold}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {volunteer.map((vol) => (
                <li key={vol.id}>{vol.role}{vol.organization ? ` · ${vol.organization}` : ""}</li>
              ))}
            </ul>
          </MainBlock>
        )}
      </main>
    </div>
  )
}
