"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function CobaltTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const name = [pd.firstName || "Carlos", pd.lastName || "García Ruiz"].join(" ")
  const title = pd.jobTitle || "Graphic Designer"
  const email = pd.email || "carlos@email.com"
  const phone = pd.phone || "+34 912 345 678"
  const addr = pd.city || pd.address || "Madrid, España"
  const website = pd.website || "carlos.design"
  const sum = summary || "Diseñador creativo con más de 5 años de experiencia en branding y comunicación visual. Especializado en identidad corporativa y diseño editorial."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Senior Designer", employer: "CreativeAgency", startDate: "2020", endDate: "", currentlyWorking: true, city: "", description: "Dirección de arte para campañas de branding de clientes internacionales." },
    { id: "2", jobTitle: "Junior Designer", employer: "DesignStudio", startDate: "2017", endDate: "2020", currentlyWorking: false, city: "", description: "Diseño de identidades visuales, packaging y material POP." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "Grado en Diseño Gráfico", institution: "Universidad de Diseño", startDate: "2013", endDate: "2017", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Photoshop", level: "expert" as const },
    { id: "2", name: "Illustrator", level: "advanced" as const },
    { id: "3", name: "InDesign", level: "intermediate" as const },
    { id: "4", name: "Figma", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
  ]

  const sidebar = "#0d2137"
  const accent = "#1e88e5"
  const L = getResumeLabels(config.language)
  const present = L.present
  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

  return (
    <div data-print-layout="sidebar-left" style={{ minHeight: "297mm", display: "flex", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": "#0d2137", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "38%" } as React.CSSProperties}>
      {/* Sidebar */}
      <div style={{ width: "38%", backgroundColor: sidebar, padding: "28px 18px", flexShrink: 0, color: "#fff" }}>
        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          {(() => {
              const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
              return (
                <div style={{ width: 95, height: 95, borderRadius: "50%", border: `3px solid ${accent}`, backgroundColor: "#0a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: accent, fontWeight: 900, fontSize: 28 }}>{initials || "N"}</span>}
                </div>
              )
            })()}
        </div>

        <SideHead text={L.contact} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 9.5, marginBottom: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={10} color={accent} />{phone}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={10} color={accent} />{email}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={10} color={accent} />{addr}</span>
          {website && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={10} color={accent} />{website}</span>}
        </div>

        {visible("languages") && (
          <>
            <SideHead text={L.languages} />
            <div style={{ marginBottom: 16 }}>
              {langs.map((l) => <p key={l.id} style={{ fontSize: 9.5, marginBottom: 3, opacity: 0.85 }}>{l.name}</p>)}
            </div>
          </>
        )}

        {visible("skills") && (
          <>
            <SideHead text={L.skills} />
            <div style={{ marginBottom: 16 }}>
              {sks.map((sk) => (
                <div key={sk.id} style={{ marginBottom: 7 }}>
                  <span style={{ fontSize: 9.5, opacity: 0.85 }}>{sk.name}</span>
                  <div style={{ height: 4, borderRadius: 99, backgroundColor: "#ffffff18", marginTop: 3 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {visible("hobbies") && (
          <>
            <SideHead text={L.hobbies} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {(hobbies || "Gym, Gaming, Música").split(",").map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill={accent + "33"} /><circle cx="11" cy="11" r="3" fill={accent} /></svg>
                  <span style={{ fontSize: 8, opacity: 0.7 }}>{h.trim()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "28px 26px 32px 22px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1a1a2e", lineHeight: 1.1, marginBottom: 2 }}>{name}</h1>
        <p style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 14 }}>{title}</p>

        {visible("summary") && (
          <MainSection title={L.aboutMe} color={accent}>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
          </MainSection>
        )}

        {visible("workExperience") && (
          <MainSection title={L.experience} color={accent}>
            {jobs.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{job.employer}</p>
                {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </MainSection>
        )}

        {visible("education") && (
          <MainSection title={L.education} color={accent}>
            {edus.map((edu) => (
              <div key={edu.id} className="resume-entry" style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{edu.institution}</p>
                <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
              </div>
            ))}
          </MainSection>
        )}
      </div>
    </div>
  )
}

function SideHead({ text }: { text: string }) {
  return <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1e88e5", marginBottom: 8 }}>{text}</p>
}

function MainSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, backgroundColor: color + "33" }} />
      </div>
      {children}
    </div>
  )
}
