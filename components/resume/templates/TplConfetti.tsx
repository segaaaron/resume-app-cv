"use client"

/**
 * Confetti — pink/orange gradient flagship.
 * Source: planillas-lujosas-Jun-29026/cv-premium.jsx (TplConfetti).
 *
 * Palette: gradient #ffd27a → #f7849b → #b06ae0 with #2a1d34 ink.
 * Decorative star sparkles, circular photo, glass cards.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Space Grotesk", "Inter", system-ui, -apple-system, sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function TplConfettiTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#a0588a"
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const Star = ({ s }: { s: number }) => (
    <svg viewBox="0 0 24 24" width={s} height={s}>
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  )
  const Mail = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  )
  const Phone = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
  const Pin = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
  const Globe = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const Tab = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ display: "inline-block", background: "#2a1d34", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 9, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5, color: "#fff" }} />{children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "linear-gradient(150deg,#ffd27a 0%,#f7849b 42%,#b06ae0 100%)",
        color: "#2a1d34",
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        padding: "40px 42px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <span style={{ position: "absolute", top: 30, right: 60, color: "#fff", opacity: 0.8 }}><Star s={20} /></span>
      <span style={{ position: "absolute", top: 120, right: 30, color: "#fff", opacity: 0.6 }}><Star s={13} /></span>
      <span style={{ position: "absolute", bottom: 80, left: 30, color: "#fff", opacity: 0.5 }}><Star s={16} /></span>

      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 22 }}>
        {config.photoUrl ? (
          <img
            src={config.photoUrl}
            alt=""
            style={{
              width: 130, height: 130, borderRadius: "50%", objectFit: "cover",
              objectPosition: `center ${config.photoPosition ?? 15}%`,
              boxShadow: "0 0 0 5px rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.55)", display: "grid", placeItems: "center", color: "#2a1d34", fontSize: 44, fontWeight: 700, boxShadow: "0 0 0 5px rgba(255,255,255,0.6)", flexShrink: 0 }}>
            {initials}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 46, fontWeight: 700, margin: 0, lineHeight: 0.94, letterSpacing: "-0.02em", color: "#fff", textShadow: "0 2px 12px rgba(140,60,140,0.25)" }}>
            {pd.firstName || "Your"}<br />{pd.lastName || "Name"}
          </h1>
          {pd.jobTitle && (
            <div style={{ display: "inline-block", marginTop: 10, background: "#2a1d34", color: "#fff", padding: "5px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {pd.jobTitle}
            </div>
          )}
        </div>
      </div>

      {visible("summary") && summary && (
        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#3a2842", background: "rgba(255,255,255,0.55)", borderRadius: 16, padding: "14px 18px", margin: "0 0 16px" }}>
          {summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <Tab id="workExperience">{labelFor("workExperience")}</Tab>
            {workExperience.map((e) => (
              <div key={e.id} className="resume-entry" style={{ marginBottom: 11, breakInside: "avoid" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2a1d34" }}>{e.jobTitle}</div>
                <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
                  {e.employer} · {e.startDate}
                  {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontSize: 11, color: "#4a3a52", lineHeight: 1.45, marginTop: 2 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visible("education") && education.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <Tab id="education">{labelFor("education")}</Tab>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "#2a1d34" }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#6a5a72" }}>{ed.institution}</div>
                  <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {visible("skills") && skills.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <Tab id="skills">{labelFor("skills")}</Tab>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 10.5, background: "linear-gradient(90deg,#f7849b,#b06ae0)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <Tab id="languages">{labelFor("languages")}</Tab>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#4a3a52", padding: "3px 0" }}>
                  <span>{l.name}</span>
                  <span style={{ color: accent, fontWeight: 600 }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <Tab id="certifications">{labelFor("certifications")}</Tab>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {certifications.map((c) => (
                  <span key={c.id} style={{ fontSize: 10.5, background: "#2a1d34", color: "#fff", padding: "3px 10px", borderRadius: 20, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {contacts.map(([I, t], i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#fff", fontWeight: 500 }}>
            <span style={{ fontSize: 13 }}>{I}</span>{t}
          </span>
        ))}
      </div>
    </div>
  )
}
