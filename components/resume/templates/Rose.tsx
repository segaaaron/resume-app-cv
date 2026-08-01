"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function RoseTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies, certifications } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const name = [pd.firstName || "María Julia", pd.lastName || "Estévez López"].join(" ")
  const title = pd.jobTitle || "Lic. en Administración"
  const email = pd.email || "hola@sitioincreible.com"
  const phone = pd.phone || "(55) 1234-5678"
  const addr    = pd.address || pd.city || "Calle Cualquiera 123"
  const website  = pd.website
  const linkedin = pd.linkedin
  const github   = pd.github
  const sum = summary || "Soy una persona proactiva, organizada y responsable, con buenas relaciones interpersonales y capacidad para trabajar en equipo."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Asistente de Gerencia", employer: "Empresa Increíble", startDate: "Ago 2019", endDate: "", currentlyWorking: true, city: "", description: "Coordinación de agenda, atención a clientes y elaboración de reportes mensuales." },
    { id: "2", jobTitle: "Asistente Administrativo", employer: "Empresa Barcelle", startDate: "Ene 2016", endDate: "Jul 2017", currentlyWorking: false, city: "", description: "Gestión documental, control de inventarios y apoyo en procesos contables." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "Lic. en Administración", institution: "Universidad Increíble", startDate: "2014", endDate: "2018", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
    { id: "2", degree: "Bachiller", institution: "Colegio Secundario Fauget", startDate: "2008", endDate: "2012", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Comunicación", level: "advanced" as const },
    { id: "2", name: "Organización", level: "expert" as const },
    { id: "3", name: "Trabajo en equipo", level: "advanced" as const },
    { id: "4", name: "Microsoft Office", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
  ]
  const hob = hobbies || "Lectura, Yoga, Viajes"

  const accent = designAccent(config.colorScheme, "#c9947a")
  const sidebarBg = "#f5e6e0"
  const dark = "#2d2d2d"
  const L = getResumeLabels(config.language)
  const present = L.present

  const SectionHead = ({ id, text }: { id: string; text: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 14 }}>
      <SectionIcon sectionId={id} color={accent} size={12} strokeWidth={2.25} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: accent }}>{text}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: accent + "55" }} />
    </div>
  )

  const PhotoPlaceholder = () => (
    <div style={{ width: 90, height: 90, borderRadius: "50%", backgroundColor: accent + "33", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 800, fontSize: 28 }}>
      {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
    </div>
  )

  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
  const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

  return (
    <div data-print-layout="sidebar-left" style={{ minHeight: "297mm", display: "flex", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": "#f5e6e0", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "35%" } as React.CSSProperties}>
      {/* Sidebar */}
      <div style={{ width: "35%", backgroundColor: sidebarBg, padding: "28px 20px", flexShrink: 0 }}>
        <PhotoPlaceholder />
        {visible("summary") && <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7, marginBottom: 10 }}>{sum}</p>}

        <SectionHead id="personalDetails" text={L.contact} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10, color: dark }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={10} color={accent} />{phone}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={10} color={accent} />{email}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={10} color={accent} />{addr}</span>
          {website  && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe  size={10} color={accent} />{website}</span>}
          {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Link2  size={10} color={accent} />{linkedin}</span>}
          {github   && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><GitFork size={10} color={accent} />{github}</span>}
        </div>

        {visible("education") && (
          <>
            <SectionHead id="education" text={L.education} />
            {edus.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: dark }}>{edu.degree}</p>
                <p style={{ fontSize: 9.5, color: accent, fontWeight: 600 }}>{edu.institution}</p>
                <p style={{ fontSize: 9, color: "#888" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
              </div>
            ))}
          </>
        )}

        {visible("skills") && (
          <>
            <SectionHead id="skills" text={L.skills} />
            {sks.map((sk) => (
              <div key={sk.id} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 9.5, color: dark }}>{sk.name}</span>
                <div style={{ height: 4, borderRadius: 99, backgroundColor: accent + "33", marginTop: 2 }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: accent }} />
                </div>
              </div>
            ))}
          </>
        )}

        {visible("languages") && (
          <>
            <SectionHead id="languages" text={L.languages} />
            {langs.map((l) => (
              <div key={l.id} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 9.5, color: dark }}>{l.name}</span>
                <div style={{ height: 4, borderRadius: 99, backgroundColor: accent + "33", marginTop: 2 }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${LANG_W[l.level] ?? 50}%`, backgroundColor: accent }} />
                </div>
              </div>
            ))}
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SectionHead id="certifications" text={L.certifications} />
            {certifications.map((c) => (
              <div key={c.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: dark, lineHeight: 1.25 }}>{c.name}</p>
                {c.issuer && <p style={{ fontSize: 9.5, color: accent, fontWeight: 600 }}>{c.issuer}</p>}
                {c.date && <p style={{ fontSize: 9, color: "#888" }}>{c.date}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "28px 28px 32px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: dark, lineHeight: 1.1, marginBottom: 4 }}>{name}</h1>
        <p style={{ fontSize: 12, color: accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{title}</p>
        <div style={{ height: 2, backgroundColor: accent, width: 60, marginBottom: 18 }} />

        {visible("workExperience") && (
          <>
            <SectionHead id="workExperience" text={L.experience} />
            {jobs.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `2px solid ${accent}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dark }}>{job.jobTitle}</p>
                  <span style={{ fontSize: 9, color: "#aaa", flexShrink: 0 }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{job.employer}</p>
                {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </>
        )}

        {visible("hobbies") && (
          <>
            <SectionHead id="hobbies" text={L.hobbies} />
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7 }}>{hob}</p>
          </>
        )}
      </div>
    </div>
  )
}
