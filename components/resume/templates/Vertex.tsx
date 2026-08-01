"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function VertexTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies, certifications } = sectionData
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const name = [pd.firstName || "Kathlyn", pd.lastName || "Vivo"].join(" ")
  const title = pd.jobTitle || "Graphic Designer"
  const email = pd.email || "kathlyn@email.com"
  const phone = pd.phone || "+1 555 987 6543"
  const addr    = pd.city || pd.address || "Los Angeles, USA"
  const website  = pd.website
  const linkedin = pd.linkedin
  const github   = pd.github
  const sum = summary || "Creative and detail-oriented graphic designer with a strong portfolio in branding, editorial design, and digital illustration. Passionate about clean, impactful visuals."
  const jobs = workExperience.length ? workExperience : [
    { id: "1", jobTitle: "Senior Graphic Designer", employer: "VisualArts Studio", startDate: "2020", endDate: "", currentlyWorking: true, city: "", description: "Leading brand identity projects for clients in fashion, tech, and hospitality." },
    { id: "2", jobTitle: "Graphic Designer", employer: "PrintHouse", startDate: "2017", endDate: "2020", currentlyWorking: false, city: "", description: "Designed print and digital marketing materials for diverse client portfolio." },
  ]
  const edus = education.length ? education : [
    { id: "1", degree: "BFA in Graphic Design", institution: "CalArts", startDate: "2013", endDate: "2017", fieldOfStudy: "", city: "", currentlyStudying: false, description: "" },
  ]
  const sks = skills.length ? skills : [
    { id: "1", name: "Adobe Suite", level: "expert" as const },
    { id: "2", name: "Typography", level: "advanced" as const },
    { id: "3", name: "Branding", level: "expert" as const },
    { id: "4", name: "Illustration", level: "advanced" as const },
  ]
  const langs = languages.length ? languages : [
    { id: "1", name: "English", level: "native" as const },
    { id: "2", name: "French", level: "professional" as const },
    { id: "3", name: "Spanish", level: "limited" as const },
  ]

  const navy = "#1e3a5f"
  const gold = designAccent(config.colorScheme, "#c9a84c")
  const present = config.language === "en" ? "Present" : "Presente"
  const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
  const LANG_PCT: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

  const CircleGauge = ({ pct, label }: { pct: number; label: string }) => {
    const r = 16, c = 2 * Math.PI * r, offset = c - (pct / 100) * c
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={r} fill="none" stroke="#eee" strokeWidth="3" />
          <circle cx="20" cy="20" r={r} fill="none" stroke={gold} strokeWidth="3" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 20 20)" />
          <text x="20" y="22" textAnchor="middle" fontSize="8" fill={navy} fontWeight="700">{pct}%</text>
        </svg>
        <span style={{ fontSize: 8, color: "#555" }}>{label}</span>
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Corner accents */}
      <svg style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} width="180" height="180" viewBox="0 0 180 180">
        <polygon points="0,0 180,0 0,180" fill={navy} opacity="0.9" />
      </svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, pointerEvents: "none" }} width="140" height="140" viewBox="0 0 140 140">
        <polygon points="140,140 0,140 140,0" fill={navy} opacity="0.9" />
      </svg>

      <div style={{ position: "relative", padding: "28px 28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ paddingTop: 24 }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: gold, lineHeight: 1.1 }}>{name}</h1>
            <p style={{ fontSize: 12, color: gold, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>{title}</p>
          </div>
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `3px solid ${gold}`, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: gold, fontWeight: 800, fontSize: 26 }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
            </div>
          </div>
        </div>

        <div style={{ height: 2, backgroundColor: navy, marginBottom: 18, opacity: 0.15 }} />

        {/* About me full width */}
        {visible("summary") && (
          <div style={{ marginTop: 18, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>About Me</p>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.75 }}>{sum}</p>
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: "flex", gap: 24 }}>
          {/* Left */}
          <div style={{ width: "42%", flexShrink: 0 }}>
            {visible("education") && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>Education</p>
                {edus.map((edu) => (
                  <div key={edu.id} className="resume-entry" style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${gold}` }}>
                    <p style={{ fontSize: 9, color: "#aaa" }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</p>
                    <p style={{ fontSize: 9.5, color: navy }}>{edu.institution}</p>
                  </div>
                ))}
              </div>
            )}

            {visible("skills") && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>Skills</p>
                {sks.map((sk) => (
                  <div key={sk.id} style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 9.5, color: "#444" }}>{sk.name}</span>
                    <div style={{ height: 5, borderRadius: 99, backgroundColor: "#eee", marginTop: 2 }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${SKILL_W[sk.level] ?? 50}%`, backgroundColor: gold }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9.5, color: "#444" }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 4 }}>Contact</p>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} color={gold} />{phone}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} color={gold} />{email}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={9} color={gold} />{addr}</span>
              {website  && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe  size={9} color={gold} />{website}</span>}
              {linkedin && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2  size={9} color={gold} />{linkedin}</span>}
              {github   && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GitFork size={9} color={gold} />{github}</span>}
            </div>
          </div>

          {/* Right */}
          <div style={{ flex: 1 }}>
            {visible("workExperience") && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>Experience</p>
                {jobs.map((job) => (
                  <div key={job.id} className="resume-entry" style={{ marginBottom: 12 }}>
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

            {visible("languages") && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>Language</p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {langs.map((l) => <CircleGauge key={l.id} pct={LANG_PCT[l.level] ?? 50} label={l.name} />)}
                </div>
              </div>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <div style={{ marginTop: 18, marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>{config.language === "en" ? "Certifications" : "Certificaciones"}</p>
                {certifications.map((c) => (
                  <div key={c.id} className="resume-entry" style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${gold}`, breakInside: "avoid" }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.25 }}>{c.name}</p>
                    {c.issuer && <p style={{ fontSize: 9.5, color: navy }}>{c.issuer}</p>}
                    {c.date && <p style={{ fontSize: 9, color: "#aaa" }}>{c.date}</p>}
                  </div>
                ))}
              </div>
            )}

            {visible("hobbies") && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>Hobbies</p>
                <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7 }}>{hobbies || "Drawing, Yoga, Cooking"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
