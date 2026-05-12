"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
const LANG_PCT: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function ClassicMonoTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, volunteer } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const ink = "#1a1a1a"
  const sub = "#6b6b6b"
  const rule = "#e4e4e1"
  const bg = "#fbfaf7"

  const now = new Date().getFullYear()
  const monthStr = String(new Date().getMonth() + 1).padStart(2, "0")

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: ink,
      fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.55,
      display: "grid", gridTemplateColumns: "260px 1fr",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Sidebar */}
      <aside style={{ padding: "44px 28px", borderRight: `1px solid ${rule}` }}>
        {/* Photo */}
        {config.photoUrl ? (
          <div style={{ width: 150, height: 150, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 20}%` }} />
          </div>
        ) : (
          <div style={{ width: 150, height: 150, borderRadius: "50%", background: "repeating-linear-gradient(135deg, #d8d4cc 0 6px, #c9c4ba 6px 12px)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        )}

        {/* Name & title */}
        <div style={{ marginTop: 28 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: "-0.01em" }}>
            {pd.firstName || "First"}<br />{pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 9.5, letterSpacing: "0.22em", color: sub, marginTop: 8, textTransform: "uppercase" }}>{pd.jobTitle}</div>
          )}
        </div>

        {/* Contact */}
        <SideSection title="Contacto" rule={rule} sub={sub}>
          {pd.phone && <LineRow k="Tel" v={pd.phone} sub={sub} />}
          {pd.email && <LineRow k="Mail" v={pd.email} sub={sub} />}
          {pd.website && <LineRow k="Web" v={pd.website} sub={sub} />}
          {pd.linkedin && <LineRow k="In" v={pd.linkedin} sub={sub} />}
          {pd.github && <LineRow k="Git" v={pd.github} sub={sub} />}
          {(pd.city || pd.country) && <LineRow k="Loc" v={[pd.city, pd.country].filter(Boolean).join(", ")} sub={sub} />}
        </SideSection>

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <SideSection title={label("education")} rule={rule} sub={sub}>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 12 }}>
                {(edu.startDate || edu.endDate) && (
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: sub }}>
                    {edu.startDate}{edu.currentlyStudying ? `—${present}` : edu.endDate ? `—${edu.endDate}` : ""}
                  </div>
                )}
                <div style={{ fontWeight: 600, marginTop: 2 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                {edu.institution && <div style={{ color: sub, fontSize: 10 }}>{edu.institution}</div>}
              </div>
            ))}
          </SideSection>
        )}

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <SideSection title={label("skills")} rule={rule} sub={sub}>
            {skills.map((sk) => {
              const pct = SKILL_PCT[sk.level] ?? 50
              return (
                <div key={sk.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                    <span>{sk.name}</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: sub }}>{pct}</span>
                  </div>
                  <div style={{ height: 2, background: rule, position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: 2, width: `${pct}%`, background: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                </div>
              )
            })}
          </SideSection>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <SideSection title={label("languages")} rule={rule} sub={sub}>
            {languages.map((lang) => (
              <LineRow key={lang.id} k={lang.name.slice(0, 2).toUpperCase()} v={lang.level.toUpperCase()} sub={sub} />
            ))}
          </SideSection>
        )}
      </aside>

      {/* Main */}
      <main style={{ padding: "44px 40px" }}>
        {/* Header bar */}
        <div style={{
          background: ink, color: bg, padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.3em", fontSize: 11 }}>CURRICULUM VITAE</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, opacity: 0.7 }}>{now} / {monthStr}</div>
        </div>

        {/* Summary */}
        {visible("summary") && summary && (
          <MainBlock title={label("summary")} rule={rule} accent={accent}>
            <p style={{ margin: 0, color: "#3a3a3a" }}>{summary}</p>
          </MainBlock>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <MainBlock title={label("workExperience")} rule={rule} accent={accent}>
            {workExperience.map((job) => (
              <li key={job.id} className="resume-entry" style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{job.jobTitle}</div>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: sub }}>
                    {job.startDate}{job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                  </div>
                </div>
                <div style={{ color: sub, fontSize: 10.5, marginBottom: 6 }}>
                  {job.employer}{job.city ? ` · ${job.city}` : ""}
                </div>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: 10.5, color: "#3a3a3a", lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </li>
            ))}
          </MainBlock>
        )}

        {/* Certifications / Volunteer as "Reconocimientos" */}
        {(visible("certifications") && certifications.length > 0) || (visible("volunteer") && volunteer.length > 0) ? (
          <MainBlock title={certifications.length > 0 ? label("certifications") : label("volunteer")} rule={rule} accent={accent}>
            {certifications.map((cert) => (
              <li key={cert.id} style={{ marginBottom: 4 }}>
                {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}
              </li>
            ))}
            {volunteer.map((vol) => (
              <li key={vol.id} style={{ marginBottom: 4 }}>
                {vol.role}{vol.organization ? ` · ${vol.organization}` : ""}
              </li>
            ))}
          </MainBlock>
        ) : null}
      </main>
    </div>
  )
}

function SideSection({ title, rule, sub, children }: { title: string; rule: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.22em", color: sub, textTransform: "uppercase", paddingBottom: 8, borderBottom: `1px solid ${rule}`, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function LineRow({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 6, padding: "3px 0", fontSize: 10 }}>
      <span style={{ color: sub, fontFamily: "ui-monospace, monospace", fontSize: 9 }}>{k}</span>
      <span>{v}</span>
    </div>
  )
}

function MainBlock({ title, rule, accent, children }: { title: string; rule: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", margin: 0, fontWeight: 600 }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: rule }} />
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "#3a3a3a" }}>{children}</ul>
    </div>
  )
}
