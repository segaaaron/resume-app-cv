"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function ObsidianTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const name = [pd.firstName || "Michael", pd.lastName || "Larsson"].join(" ")
  const title = pd.jobTitle || "Community Manager"
  const email = pd.email || "michael@email.com"
  const phone = pd.phone || "+46 70 123 4567"
  const addr    = pd.city || pd.address || "Stockholm, Sweden"
  const website = pd.website
  const linkedin = pd.linkedin
  const github  = pd.github
  const sum = summary || "Experienced community manager with a passion for building engaged online communities. Expert in social media strategy, content creation, and analytics."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Community Manager", employer: "SocialBrand", startDate: "2020", endDate: "", currentlyWorking: true, city: "", description: "Managing communities of 500K+ members across multiple platforms. Grew engagement by 120%." },
    { id: "2", jobTitle: "Social Media Specialist", employer: "DigitalFirst", startDate: "2017", endDate: "2020", currentlyWorking: false, city: "", description: "Content strategy and community engagement for B2C brands." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "BA in Communications", institution: "Stockholm University", startDate: "2013", endDate: "2017", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Social Media", level: "expert" as const },
    { id: "2", name: "Content Strategy", level: "advanced" as const },
    { id: "3", name: "Analytics", level: "advanced" as const },
    { id: "4", name: "Copywriting", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "Swedish", level: "native" as const },
    { id: "2", name: "English", level: "full_professional" as const },
  ]

  const darkBg = "#0f1e2d"
  const blue = "#3b82f6"
  const present = config.language === "en" ? "Present" : "Presente"
  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
  const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: darkBg, position: "relative", overflow: "hidden" }}>
      {/* White curved panel on right */}
      <svg style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", pointerEvents: "none" }} viewBox="0 0 400 1120" preserveAspectRatio="none">
        <path d="M80,0 Q0,560 80,1120 L400,1120 L400,0 Z" fill="#ffffff" />
      </svg>

      <div style={{ position: "relative", display: "flex", minHeight: "297mm" }}>
        {/* Left (dark) */}
        <div style={{ width: "42%", padding: "28px 20px", flexShrink: 0, color: "#fff" }}>
          {/* Photo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 85, height: 85, borderRadius: "50%", overflow: "hidden", border: `3px solid ${blue}`, position: "relative" }}>
              {config.photoUrl ? (
                <img src={config.photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} alt="" />
              ) : (
                <svg width="85" height="85" viewBox="0 0 85 85"><rect width="85" height="85" fill="#1a2e40" rx="42" /><circle cx="42" cy="32" r="14" fill="#ffffff44" /><ellipse cx="42" cy="72" rx="22" ry="18" fill="#ffffff44" /></svg>
              )}
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 2 }}>{name}</h1>
          <p style={{ fontSize: 10, textAlign: "center", color: blue, fontWeight: 600, marginBottom: 18 }}>{title}</p>

          <DarkSection title="Contact">
            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 9.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={10} color={blue} />{phone}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={10} color={blue} />{email}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={10} color={blue} />{addr}</span>
              {website  && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe  size={10} color={blue} />{website}</span>}
              {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Link2  size={10} color={blue} />{linkedin}</span>}
              {github   && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><GitFork size={10} color={blue} />{github}</span>}
            </div>
          </DarkSection>

          {visible("skills") && (
            <DarkSection title="Skills">
              {sks.map((sk) => (
                <div key={sk.id} style={{ marginBottom: 7 }}>
                  <span style={{ fontSize: 9.5, opacity: 0.85 }}>{sk.name}</span>
                  <div style={{ height: 4, borderRadius: 99, backgroundColor: "#ffffff18", marginTop: 3 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: blue }} />
                  </div>
                </div>
              ))}
            </DarkSection>
          )}

          {visible("languages") && (
            <DarkSection title="Languages">
              {langs.map((l) => (
                <div key={l.id} style={{ marginBottom: 7 }}>
                  <span style={{ fontSize: 9.5, opacity: 0.85 }}>{l.name}</span>
                  <div style={{ height: 4, borderRadius: 99, backgroundColor: "#ffffff18", marginTop: 3 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${LANG_W[l.level] ?? 50}%`, backgroundColor: blue }} />
                  </div>
                </div>
              ))}
            </DarkSection>
          )}

          {visible("hobbies") && (
            <DarkSection title="Hobbies">
              <p style={{ fontSize: 9.5, opacity: 0.8, lineHeight: 1.7 }}>{hobbies || "Reading, Gaming, Hiking"}</p>
            </DarkSection>
          )}
        </div>

        {/* Right (white) */}
        <div style={{ flex: 1, padding: "28px 26px 32px 30px" }}>
          {visible("summary") && (
            <LightSection title="Profile" color={blue}>
              <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
            </LightSection>
          )}

          {visible("workExperience") && (
            <LightSection title="Work Experience" color={blue}>
              {jobs.map((job) => (
                <div key={job.id} className="resume-entry" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{job.jobTitle}</p>
                    <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: blue }}>{job.employer}</p>
                  {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                </div>
              ))}
            </LightSection>
          )}

          {visible("education") && (
            <LightSection title="Education" color={blue}>
              {edus.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: blue }}>{edu.institution}</p>
                  <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                </div>
              ))}
            </LightSection>
          )}
        </div>
      </div>
    </div>
  )
}

function DarkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  )
}

function LightSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
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
