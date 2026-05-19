"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function WaveTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstName = pd.firstName || "Carlos Alberto"
  const lastName = pd.lastName || "Ruiz"
  const title = pd.jobTitle || "Ingeniero de Software"
  const email = pd.email || "carlos.ruiz@email.com"
  const phone = pd.phone || "+52 55 4321 9876"
  const addr    = pd.city || pd.address || "Guadalajara, MX"
  const website  = pd.website
  const linkedin = pd.linkedin
  const github   = pd.github
  const sum = summary || "Ingeniero de software con 6 años de experiencia en desarrollo full-stack, especializado en React, Node.js y arquitecturas cloud."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Senior Software Engineer", employer: "TechGlobal", startDate: "2021", endDate: "", currentlyWorking: true, city: "", description: "Desarrollo de microservicios y liderazgo técnico de equipo de 5 desarrolladores." },
    { id: "2", jobTitle: "Software Developer", employer: "StartupMX", startDate: "2018", endDate: "2021", currentlyWorking: false, city: "", description: "Desarrollo frontend con React y backend con Node.js/Express." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "Ing. en Sistemas", institution: "ITESO", startDate: "2014", endDate: "2018", fieldOfStudy: "Computación", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "React/Next.js", level: "expert" as const },
    { id: "2", name: "Node.js", level: "expert" as const },
    { id: "3", name: "TypeScript", level: "advanced" as const },
    { id: "4", name: "AWS", level: "advanced" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Español", level: "native" as const },
    { id: "2", name: "Inglés", level: "full_professional" as const },
  ]

  const headerDark = "#0d4f6b"
  const headerLight = "#1a7a8a"
  const cyan = "#00bcd4"
  const L = getResumeLabels(config.language)
  const present = L.present
  const SKILL_STARS: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
  const LANG_STARS: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 3, c1: 4, c2: 5, native: 5 }

  const Stars = ({ filled, total }: { filled: number; total: number }) => (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0.5 6.2,3.5 9.5,3.8 7,6 7.8,9.3 5,7.6 2.2,9.3 3,6 0.5,3.8 3.8,3.5" fill={i < filled ? cyan : "#ddd"} /></svg>
      ))}
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Header with wave */}
      <div style={{ position: "relative", background: `linear-gradient(135deg, ${headerDark}, ${headerLight})`, paddingBottom: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "28px 30px 0" }}>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{ width: 70, height: 70, borderRadius: "50%", border: "3px solid " + cyan, flexShrink: 0, backgroundColor: headerDark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: cyan, fontWeight: 900, fontSize: 22 }}>{initials || "N"}</span>
              </div>
            )
          })()}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{firstName} {lastName}</h1>
            <p style={{ fontSize: 12, color: cyan, fontWeight: 600, marginTop: 4 }}>{title}</p>
          </div>
        </div>

        {/* Wave SVG */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", display: "block" }} viewBox="0 0 800 50" preserveAspectRatio="none">
          <path d="M0,25 C100,50 200,0 350,30 C500,55 600,10 800,35 L800,50 L0,50 Z" fill="#ffffff88" />
          <path d="M0,35 C150,55 250,10 400,38 C550,58 650,15 800,40 L800,50 L0,50 Z" fill="#fff" />
        </svg>
      </div>

      {/* Contact badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "12px 20px 8px", flexWrap: "wrap" }}>
        {[
          { icon: <Phone size={10} />, text: phone },
          { icon: <Mail size={10} />, text: email },
          { icon: <MapPin size={10} />, text: addr },
          ...(website  ? [{ icon: <Globe  size={10} />, text: website  }] : []),
          ...(linkedin ? [{ icon: <Link2  size={10} />, text: linkedin }] : []),
          ...(github   ? [{ icon: <GitFork size={10} />, text: github   }] : []),
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9.5, color: headerDark, padding: "4px 12px", borderRadius: 99, backgroundColor: cyan + "18" }}>
            {item.icon}{item.text}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 30px 32px" }}>
        {visible("summary") && (
          <Section title={L.profile} color={headerDark}>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
          </Section>
        )}

        {visible("education") && (
          <Section title={L.education} color={headerDark}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {edus.map((edu, i) => (
                <div key={edu.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: cyan, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</p>
                    <p style={{ fontSize: 9.5, color: headerDark, fontWeight: 600 }}>{edu.institution}</p>
                    <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                  </div>
                  {i < edus.length - 1 && <div style={{ width: 30, height: 1, backgroundColor: cyan + "44", alignSelf: "center" }} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {visible("workExperience") && (
          <Section title={L.experience} color={headerDark}>
            {jobs.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 10, paddingLeft: 14, borderLeft: `2px solid ${cyan}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: headerDark }}>{job.employer}</p>
                {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </Section>
        )}

        {/* Bottom two columns */}
        <div style={{ display: "flex", gap: 28 }}>
          {visible("languages") && (
            <div style={{ flex: 1 }}>
              <Section title={L.languages} color={headerDark}>
                {langs.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 9.5, color: "#444" }}>{l.name}</span>
                    <Stars filled={LANG_STARS[l.level] ?? 3} total={5} />
                  </div>
                ))}
              </Section>
            </div>
          )}
          {visible("skills") && (
            <div style={{ flex: 1 }}>
              <Section title={L.skills} color={headerDark}>
                {sks.map((sk) => (
                  <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 9.5, color: "#444" }}>{sk.name}</span>
                    <Stars filled={SKILL_STARS[sk.level] ?? 2} total={4} />
                  </div>
                ))}
              </Section>
            </div>
          )}
        </div>

        {visible("hobbies") && (
          <Section title={L.hobbies} color={headerDark}>
            <p style={{ fontSize: 10, color: "#555" }}>{hobbies || "Programación, Ciclismo, Videojuegos"}</p>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, backgroundColor: color + "22" }} />
      </div>
      {children}
    </div>
  )
}
