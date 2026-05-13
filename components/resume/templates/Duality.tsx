"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function DualityTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const name = [pd.firstName || "Johnson", pd.lastName || "Smith"].join(" ")
  const title = pd.jobTitle || "Graphic Designer"
  const email = pd.email || "johnson@email.com"
  const phone = pd.phone || "+1 555 123 4567"
  const addr = pd.city || pd.address || "New York, USA"
  const website = pd.website || "johnson.design"
  const sum = summary || "Creative graphic designer with 7+ years of experience in visual communication, branding, and digital design. Passionate about creating impactful visual stories."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Art Director", employer: "CreativeHub", startDate: "2021", endDate: "", currentlyWorking: true, city: "", description: "Leading creative direction for major brand campaigns and overseeing a team of 8 designers." },
    { id: "2", jobTitle: "Senior Designer", employer: "PixelWorks", startDate: "2018", endDate: "2021", currentlyWorking: false, city: "", description: "Developed brand identities and marketing collateral for Fortune 500 clients." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "BFA in Graphic Design", institution: "Parsons School of Design", startDate: "2014", endDate: "2018", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Adobe Creative Suite", level: "expert" as const },
    { id: "2", name: "UI/UX Design", level: "advanced" as const },
    { id: "3", name: "Motion Graphics", level: "advanced" as const },
    { id: "4", name: "Brand Strategy", level: "expert" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "English", level: "native" as const },
    { id: "2", name: "Spanish", level: "professional" as const },
  ]

  const dark = "#1a2744"
  const cyan = "#00bcd4"
  const L = getResumeLabels(config.language)
  const present = L.present
  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

  return (
    <div data-print-layout="sidebar-right" style={{ minHeight: "297mm", display: "flex", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Left main content */}
      <div style={{ flex: 1, padding: "28px 22px 32px 28px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: dark, lineHeight: 1.1, marginBottom: 2 }}>{name}</h1>
        <p style={{ fontSize: 12, color: cyan, fontWeight: 600, marginBottom: 16 }}>{title}</p>

        {visible("summary") && (
          <LeftSection title={L.aboutMe} color={cyan}>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
          </LeftSection>
        )}

        {visible("workExperience") && (
          <LeftSection title={L.experience} color={cyan}>
            {jobs.map((job) => (
              <div key={job.id} className="resume-entry" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dark }}>{job.jobTitle}</p>
                  <span style={{ fontSize: 9, color: "#aaa" }}>{job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: cyan }}>{job.employer}</p>
                {job.description && <div className="resume-desc" style={{ fontSize: 10, color: "#555", lineHeight: 1.65, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </LeftSection>
        )}

        {visible("skills") && (
          <LeftSection title={L.skills} color={cyan}>
            {sks.map((sk) => (
              <div key={sk.id} style={{ marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 9.5, color: "#444" }}>{sk.name}</span>
                  <span style={{ fontSize: 8, color: "#aaa" }}>{SKILL_W[sk.level] ?? 50}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, backgroundColor: "#eee" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: cyan }} />
                </div>
              </div>
            ))}
          </LeftSection>
        )}

        {visible("hobbies") && (
          <LeftSection title={L.hobbies} color={cyan}>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7 }}>{hobbies || "Photography, Cycling, Travel"}</p>
          </LeftSection>
        )}
      </div>

      {/* Right dark panel */}
      <div style={{ width: "35%", backgroundColor: dark, padding: "28px 18px", flexShrink: 0, color: "#fff" }}>
        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${cyan}`, position: "relative" }}>
            {config.photoUrl ? (
              <img src={config.photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} alt="" />
            ) : (
              <svg width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#253554" /><circle cx="40" cy="30" r="14" fill="#ffffff44" /><ellipse cx="40" cy="68" rx="22" ry="18" fill="#ffffff44" /></svg>
            )}
          </div>
        </div>

        <RightSection title={L.contact}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 9.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={10} color={cyan} />{phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={10} color={cyan} />{email}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={10} color={cyan} />{addr}</span>
            {website && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={10} color={cyan} />{website}</span>}
          </div>
        </RightSection>

        {visible("education") && (
          <RightSection title={L.education}>
            {edus.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700 }}>{edu.degree}</p>
                <p style={{ fontSize: 9.5, color: cyan }}>{edu.institution}</p>
                <p style={{ fontSize: 9, opacity: 0.6 }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
              </div>
            ))}
          </RightSection>
        )}

        {visible("languages") && (
          <RightSection title={L.languages}>
            {langs.map((l) => (
              <p key={l.id} style={{ fontSize: 9.5, marginBottom: 4, opacity: 0.85 }}>{l.name}</p>
            ))}
          </RightSection>
        )}
      </div>
    </div>
  )
}

function LeftSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color, marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  )
}

function RightSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00bcd4", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  )
}
