"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe } from "lucide-react"

export default function MinimalTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstName = pd.firstName || "Alejandro"
  const lastName = pd.lastName || "Pérez"
  const title = pd.jobTitle || "Director de Marketing"
  const email = pd.email || "alejandro@email.com"
  const phone = pd.phone || "+52 55 9876 5432"
  const addr = pd.city || pd.address || "Ciudad de México"
  const website = pd.website || "alejandro.dev"
  const sum = summary || "Profesional con más de 8 años de experiencia en marketing digital, branding y estrategia de contenidos."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Director de Marketing", employer: "TechCorp", startDate: "2020", endDate: "", currentlyWorking: true, city: "", description: "Liderazgo de equipo de 12 personas. Incremento de conversiones en un 45%." },
    { id: "2", jobTitle: "Marketing Manager", employer: "Startup XYZ", startDate: "2017", endDate: "2020", currentlyWorking: false, city: "", description: "Desarrollo de estrategia digital y gestión de presupuesto publicitario." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "MBA", institution: "ITESM", startDate: "2015", endDate: "2017", fieldOfStudy: "Marketing", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Marketing Digital", level: "expert" as const },
    { id: "2", name: "SEO/SEM", level: "advanced" as const },
    { id: "3", name: "Análisis de Datos", level: "advanced" as const },
    { id: "4", name: "Liderazgo", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
  ]

  const navy = config.colorScheme || "#1a2744"
  const present = config.language === "en" ? "Present" : "Presente"
  const SKILL_DOTS: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
  const LANG_DOTS: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 3, c1: 4, c2: 5, native: 5 }

  const Dots = ({ filled, total }: { filled: number; total: number }) => (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: i < filled ? navy : "#ddd" }} />
      ))}
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "32px 30px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>{title}</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: navy, lineHeight: 1.05 }}>{firstName}</h1>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: navy, lineHeight: 1.05 }}>{lastName}</h1>
        </div>
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0, backgroundColor: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ fontWeight: 900, fontSize: 24, color: navy }}>{initials || "N"}</span>}
            </div>
          )
        })()}
      </div>

      <div style={{ height: 2, backgroundColor: navy, marginBottom: 20 }} />

      {/* Body */}
      <div style={{ display: "flex", gap: 28 }}>
        {/* Left column */}
        <div style={{ width: "32%", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9.5, color: "#555", marginBottom: 18 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} color={navy} />{phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} color={navy} />{email}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={9} color={navy} />{addr}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={9} color={navy} />{website}</span>
          </div>

          {visible("skills") && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 8 }}>Habilidades</p>
              {sks.map((sk) => (
                <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, color: "#444" }}>{sk.name}</span>
                  <Dots filled={SKILL_DOTS[sk.level] ?? 2} total={4} />
                </div>
              ))}
            </div>
          )}

          {visible("languages") && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 8 }}>Idiomas</p>
              {langs.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, color: "#444" }}>{l.name}</span>
                  <Dots filled={LANG_DOTS[l.level] ?? 3} total={5} />
                </div>
              ))}
            </div>
          )}

          {visible("hobbies") && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 8 }}>Hobbies</p>
              <p style={{ fontSize: 9.5, color: "#555", lineHeight: 1.7 }}>{hobbies || "Fotografía, Running, Ajedrez"}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 1 }}>
          {visible("summary") && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 6 }}>Objetivo</p>
              <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7 }}>{sum}</p>
            </div>
          )}

          {visible("workExperience") && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 8 }}>Experiencia</p>
              {jobs.map((job) => (
                <div key={job.id} className="resume-entry" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                    <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: navy }}>{job.employer}</p>
                  {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                </div>
              ))}
            </div>
          )}

          {visible("education") && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy, marginBottom: 8 }}>Educación</p>
              {edus.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: navy }}>{edu.institution}</p>
                  <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
