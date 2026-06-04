"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function BannerTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const name = [pd.firstName || "Carlos", pd.lastName || "Miass"].join(" ")
  const title = pd.jobTitle || "Graphic Designer"
  const email = pd.email || "carlos.m@email.com"
  const phone = pd.phone || "+34 612 345 678"
  const addr    = pd.city || pd.address || "Barcelona, España"
  const website  = pd.website
  const linkedin = pd.linkedin
  const github   = pd.github
  const sum = summary || "Diseñador gráfico apasionado con experiencia en branding, UX/UI y diseño editorial. Creativo, detallista y orientado a resultados."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Lead Designer", employer: "BrandFactory", startDate: "2021", endDate: "", currentlyWorking: true, city: "", description: "Dirección creativa de proyectos de identidad visual para startups." },
    { id: "2", jobTitle: "Graphic Designer", employer: "MediaGroup", startDate: "2018", endDate: "2021", currentlyWorking: false, city: "", description: "Diseño de campañas publicitarias impresas y digitales." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "Grado en Diseño", institution: "Escola Massana", startDate: "2014", endDate: "2018", fieldOfStudy: "Diseño Gráfico", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Photoshop", level: "expert" as const },
    { id: "2", name: "Illustrator", level: "advanced" as const },
    { id: "3", name: "Figma", level: "expert" as const },
    { id: "4", name: "After Effects", level: "intermediate" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
  ]

  const navy = "#0d3b6e"
  const accent = config.colorScheme || "#1565c0"
  const L = getResumeLabels(config.language)
  const present = L.present
  const SKILL_DOTS: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }

  const BannerHead = ({ text }: { text: string }) => (
    <div style={{ position: "relative", marginBottom: 10, marginTop: 14 }}>
      <svg width="140" height="24" viewBox="0 0 140 24">
        <path d="M0,2 Q0,0 2,0 L128,0 L140,12 L128,24 L2,24 Q0,24 0,22 Z" fill={navy} />
      </svg>
      <span style={{ position: "absolute", top: 5, left: 12, fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff" }}>{text}</span>
    </div>
  )

  const Dots = ({ filled, total }: { filled: number; total: number }) => (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: i < filled ? accent : "#ddd" }} />
      ))}
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "28px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: navy, lineHeight: 1.1 }}>{name}</h1>
          <p style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>{title}</p>
        </div>
        <div style={{ width: 75, height: 75, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${navy}`, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: navy, fontWeight: 800, fontSize: 26 }}>
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
          </div>
        </div>
      </div>

      {/* About me - full width */}
      {visible("summary") && (
        <>
          <BannerHead text={L.aboutMe} />
          <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75, marginBottom: 10 }}>{sum}</p>
        </>
      )}

      {/* Two columns */}
      <div style={{ display: "flex", gap: 24 }}>
        {/* Left */}
        <div style={{ width: "32%", flexShrink: 0 }}>
          <BannerHead text={L.contact} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9.5, color: "#444", marginBottom: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} color={accent} />{phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} color={accent} />{email}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={9} color={accent} />{addr}</span>
            {website  && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe  size={9} color={accent} />{website}</span>}
            {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2  size={9} color={accent} />{linkedin}</span>}
            {github   && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GitFork size={9} color={accent} />{github}</span>}
          </div>

          {visible("skills") && (
            <>
              <BannerHead text={L.skills} />
              {sks.map((sk) => (
                <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, color: "#444" }}>{sk.name}</span>
                  <Dots filled={SKILL_DOTS[sk.level] ?? 2} total={4} />
                </div>
              ))}
            </>
          )}

          {visible("hobbies") && (
            <>
              <BannerHead text={L.hobbies} />
              <p style={{ fontSize: 9.5, color: "#555", lineHeight: 1.7 }}>{hobbies || "Fotografía, Senderismo, Cocina"}</p>
            </>
          )}

          {visible("languages") && (
            <>
              <BannerHead text={L.languages} />
              {langs.map((l) => (
                <p key={l.id} style={{ fontSize: 9.5, color: "#444", marginBottom: 3 }}>{l.name}</p>
              ))}
            </>
          )}
        </div>

        {/* Right */}
        <div style={{ flex: 1 }}>
          {visible("education") && (
            <>
              <BannerHead text={L.education} />
              {edus.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: accent, fontWeight: 700, flexShrink: 0, width: 60 }}>{edu.startDate}{edu.endDate ? `–${edu.endDate}` : ""}</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</p>
                    <p style={{ fontSize: 10, color: accent }}>{edu.institution}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("workExperience") && (
            <>
              <BannerHead text={L.experience} />
              {jobs.map((job) => (
                <div key={job.id} className="resume-entry" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 9, color: accent, fontWeight: 700, flexShrink: 0, width: 60 }}>{job.startDate}{job.currentlyWorking ? `–${present}` : job.endDate ? `–${job.endDate}` : ""}</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: accent }}>{job.employer}</p>
                    {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
