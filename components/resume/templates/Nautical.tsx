"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe } from "lucide-react"

export default function NauticalTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstName = pd.firstName || "Lucía"
  const lastName = pd.lastName || "Martínez Gómez"
  const title = pd.jobTitle || "Estudiante / Administración"
  const email = pd.email || "lucia@email.com"
  const phone = pd.phone || "(55) 1234-5678"
  const addr = pd.city || pd.address || "Ciudad de México"
  const website = pd.website || "lucia.dev"
  const sum = summary || "Estudiante de administración con pasión por la gestión empresarial y las finanzas. Organizada, proactiva y con excelentes habilidades comunicativas."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Asistente de Gerencia", employer: "Empresa Increíble", startDate: "Ago 2019", endDate: "", currentlyWorking: true, city: "", description: "Coordinación de agenda ejecutiva y elaboración de reportes mensuales de gestión." },
    { id: "2", jobTitle: "Practicante", employer: "Consultora ABC", startDate: "Ene 2018", endDate: "Jul 2019", currentlyWorking: false, city: "", description: "Apoyo en análisis financiero y preparación de presentaciones para clientes." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "Lic. en Administración", institution: "Universidad Increíble", startDate: "2016", endDate: "2020", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
    { id: "2", degree: "Bachiller", institution: "Colegio Fauget", startDate: "2010", endDate: "2014", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Comunicación", level: "advanced" as const },
    { id: "2", name: "Organización", level: "expert" as const },
    { id: "3", name: "Excel avanzado", level: "advanced" as const },
    { id: "4", name: "Trabajo en equipo", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
    { id: "3", name: "Francés", level: "limited" as const },
  ]

  const sidebar = "#1e3a5f"
  const accent = "#2d6bbf"
  const present = config.language === "en" ? "Present" : "Presente"
  const LANG_W: Record<string, number> = { elementary: 20, limited: 40, professional: 60, full_professional: 80, native: 100 }

  return (
    <div style={{ minHeight: "297mm", display: "flex", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Sidebar */}
      <div style={{ width: "28%", backgroundColor: sidebar, padding: "0", flexShrink: 0, color: "#fff" }}>
        {/* Photo area */}
        <div style={{ padding: "24px 20px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 85, height: 85, borderRadius: "50%", overflow: "hidden", border: "3px solid " + accent, backgroundColor: sidebar, position: "relative" }}>
            {config.photoUrl ? (
              <img src={config.photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} alt="" />
            ) : (
              <svg width="85" height="85" viewBox="0 0 85 85"><circle cx="42" cy="32" r="14" fill="#ffffff55" /><ellipse cx="42" cy="72" rx="22" ry="18" fill="#ffffff55" /></svg>
            )}
          </div>
        </div>

        <div style={{ padding: "0 18px 24px" }}>
          <SideSection title="Contacto">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={9} />{phone}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={9} />{email}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={9} />{addr}</span>
              {website && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={9} />{website}</span>}
            </div>
          </SideSection>

          {visible("languages") && (
            <SideSection title="Idiomas">
              {langs.map((l) => (
                <div key={l.id} style={{ marginBottom: 7 }}>
                  <span style={{ fontSize: 9.5 }}>{l.name}</span>
                  <div style={{ height: 4, borderRadius: 99, backgroundColor: "#ffffff22", marginTop: 3 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${LANG_W[l.level] ?? 50}%`, backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </SideSection>
          )}

          {visible("hobbies") && (
            <SideSection title="Info adicional">
              <p style={{ fontSize: 9.5, lineHeight: 1.7, opacity: 0.85 }}>{hobbies || "Lectura, Voluntariado, Natación"}</p>
            </SideSection>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "28px 26px 32px 24px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 300, color: sidebar, lineHeight: 1.1 }}>{firstName}</h1>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: sidebar, lineHeight: 1.1, marginBottom: 4 }}>{lastName}</h1>
        <p style={{ fontSize: 11, color: accent, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>{title}</p>

        {visible("summary") && (
          <MainSection title="Resumen profesional" color={accent}>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
          </MainSection>
        )}

        {visible("education") && (
          <MainSection title="Formación" color={accent}>
            {edus.map((edu) => (
              <div key={edu.id} className="resume-entry" style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{edu.institution}</p>
                <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
              </div>
            ))}
          </MainSection>
        )}

        {visible("workExperience") && (
          <MainSection title="Historial laboral" color={accent}>
            {jobs.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{job.employer}</p>
                {job.description && <div style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </MainSection>
        )}

        {visible("skills") && (
          <MainSection title="Aptitudes" color={accent}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sks.map((sk) => (
                <span key={sk.id} style={{ fontSize: 9.5, padding: "3px 10px", borderRadius: 99, backgroundColor: accent + "15", color: sidebar, fontWeight: 500 }}>{sk.name}</span>
              ))}
            </div>
          </MainSection>
        )}
      </div>
    </div>
  )
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>{title}</p>
      {children}
    </div>
  )
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
