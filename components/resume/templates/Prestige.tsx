"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function PrestigeTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstName = pd.firstName || "Kevin C."
  const lastName = pd.lastName || "Silva"
  const title = pd.jobTitle || "Graphic & Web Designer"
  const email = pd.email || "kevin@email.com"
  const phone = pd.phone || "+1 555 234 5678"
  const addr    = pd.city || pd.address || "Miami, USA"
  const website  = pd.website
  const linkedin = pd.linkedin
  const github   = pd.github
  const sum = summary || "Versatile designer with expertise in both print and digital media. Skilled in creating cohesive brand experiences across all touchpoints."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Lead Designer", employer: "DigitalCraft", startDate: "2020", endDate: "", currentlyWorking: true, city: "", description: "Directing design for web and mobile products. Managing a team of 4 designers." },
    { id: "2", jobTitle: "Web Designer", employer: "WebAgency", startDate: "2017", endDate: "2020", currentlyWorking: false, city: "", description: "Designed responsive websites and landing pages for e-commerce clients." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "BS in Graphic Design", institution: "University of Miami", startDate: "2013", endDate: "2017", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Web Design", level: "expert" as const },
    { id: "2", name: "Photoshop", level: "expert" as const },
    { id: "3", name: "HTML/CSS", level: "advanced" as const },
    { id: "4", name: "Figma", level: "advanced" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "English", level: "native" as const },
    { id: "2", name: "Spanish", level: "full_professional" as const },
    { id: "3", name: "Portuguese", level: "limited" as const },
  ]

  const bg = "#f8f5f0"
  const navy = "#1a2744"
  const copper = "#b87333"
  const present = config.language === "en" ? "Present" : "Presente"
  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
  const LANG_PCT: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

  const CircleGauge = ({ pct, label }: { pct: number; label: string }) => {
    const r = 14, c = 2 * Math.PI * r, offset = c - (pct / 100) * c
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#e0d5c8" strokeWidth="3" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={copper} strokeWidth="3" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 18 18)" />
          <text x="18" y="20" textAnchor="middle" fontSize="7" fill={navy} fontWeight="700">{pct}%</text>
        </svg>
        <span style={{ fontSize: 7.5, color: "#555" }}>{label}</span>
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: bg }}>
      {/* Header */}
      <div style={{ padding: "28px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: navy, lineHeight: 1.05 }}>{firstName}</h1>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: navy, lineHeight: 1.05, marginBottom: 4 }}>{lastName}</h1>
          <p style={{ fontSize: 11, color: copper, fontWeight: 600, letterSpacing: "0.1em" }}>{title}</p>
          {/* Contact row */}
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 9, color: "#777" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={9} color={copper} />{phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={9} color={copper} />{email}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={9} color={copper} />{addr}</span>
            {website  && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Globe  size={9} color={copper} />{website}</span>}
            {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Link2  size={9} color={copper} />{linkedin}</span>}
            {github   && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><GitFork size={9} color={copper} />{github}</span>}
          </div>
        </div>
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ width: 90, height: 90, borderRadius: "50%", flexShrink: 0, border: `3px solid ${copper}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ece6dd" }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ fontWeight: 900, fontSize: 28, color: navy }}>{initials || "N"}</span>}
            </div>
          )
        })()}
      </div>

      {/* Quote/summary block */}
      {visible("summary") && (
        <div style={{ margin: "16px 28px", backgroundColor: navy, borderRadius: 6, padding: "14px 20px" }}>
          <p style={{ fontSize: 10, color: "#fff", lineHeight: 1.75, fontStyle: "italic", opacity: 0.9 }}>{sum}</p>
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: "flex", gap: 22, padding: "8px 28px" }}>
        {/* Left */}
        <div style={{ width: "45%", flexShrink: 0 }}>
          {visible("education") && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: copper, marginBottom: 8 }}>Education</p>
              {edus.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${copper}` }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: navy }}>{edu.degree}</p>
                  <p style={{ fontSize: 9.5, color: copper }}>{edu.institution}</p>
                  <p style={{ fontSize: 9, color: "#999" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ flex: 1 }}>
          {visible("workExperience") && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: copper, marginBottom: 8 }}>Job Experience</p>
              {jobs.map((job) => (
                <div key={job.id} className="resume-entry" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: navy }}>{job.jobTitle}</p>
                    <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: copper }}>{job.employer}</p>
                  {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom band */}
      <div style={{ padding: "10px 28px 28px", display: "flex", gap: 24 }}>
        {visible("skills") && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: copper, marginBottom: 8 }}>Skills</p>
            {sks.map((sk) => (
              <div key={sk.id} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: "#444" }}>{sk.name}</span>
                <div style={{ height: 5, borderRadius: 99, backgroundColor: "#e0d5c8", marginTop: 2 }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: copper }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {visible("languages") && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: copper, marginBottom: 8 }}>Languages</p>
            <div style={{ display: "flex", gap: 10 }}>
              {langs.map((l) => <CircleGauge key={l.id} pct={LANG_PCT[l.level] ?? 50} label={l.name} />)}
            </div>
          </div>
        )}

        {visible("hobbies") && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: copper, marginBottom: 8 }}>Hobbies</p>
            <div style={{ display: "flex", gap: 10 }}>
              {(hobbies || "Design, Travel, Music").split(",").map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={copper + "22"} stroke={copper} strokeWidth="1" /><circle cx="12" cy="12" r="3" fill={copper} /></svg>
                  <span style={{ fontSize: 7.5, color: "#555" }}>{h.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
