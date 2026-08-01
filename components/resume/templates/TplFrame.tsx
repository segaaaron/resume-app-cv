"use client"

/**
 * Frame — accent bordered, QR-decorated.
 * Source: planillas-lujosas-Jun-29026/cv-premium.jsx (TplFrame).
 *
 * Palette: accent #1aa899 outer frame, white inner sheet.
 * Header band CURRICULUM VITAE + footer website tag.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"


const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

// Pre-baked decorative QR-like grid cells (mirror source array)
const QR_CELLS = new Set([0, 1, 5, 6, 7, 13, 14, 20, 21, 42, 43, 47, 48, 8, 40, 16, 24, 32, 18, 30, 12])

export default function TplFrameTemplate() {
  const accentSoft = "#e6f5f3"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#1aa899")
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

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (place) contacts.push([<Pin key="i" />, place])

  const FrH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: accent, margin: "0 0 10px", paddingBottom: 5, borderBottom: `2px solid ${accentSoft}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: accent,
        fontFamily: "inherit",
        position: "relative",
        padding: 16,
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: "0.5em", textTransform: "uppercase", zIndex: 2 }}>
        {config.language === "en" ? "Curriculum Vitae" : "Currículum Vitae"}
      </div>
      {pd.website && (
        <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: "0.3em", zIndex: 2 }}>
          {pd.website}
        </div>
      )}

      <div style={{ background: "#fff", minHeight: "calc(297mm - 32px)", borderRadius: 4, padding: "40px 44px", color: "#27343a", overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 22 }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 120, height: 130, borderRadius: 10, objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{ width: 120, height: 130, borderRadius: 10, background: accentSoft, display: "grid", placeItems: "center", color: accent, fontSize: 40, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 38, fontWeight: 700, margin: 0, color: accent, lineHeight: 1, letterSpacing: "-0.01em" }}>
              {pd.firstName || "Your"}<br />{pd.lastName || "Name"}
            </h1>
            {pd.jobTitle && (
              <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a8a8e", marginTop: 8 }}>
                {pd.jobTitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 28 }}>
          <div>
            {visible("summary") && summary && (
              <>
                <FrH id="summary">{labelFor("summary")}</FrH>
                <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#4a585e", margin: "0 0 16px" }}>{summary}</p>
              </>
            )}

            {contacts.length > 0 && (
              <>
                <FrH id="personalDetails">{config.language === "en" ? "Contact" : "Contacto"}</FrH>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, color: "#4a585e", marginBottom: 16 }}>
                  {contacts.map(([I, t], i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: accentSoft, color: accent, display: "grid", placeItems: "center", fontSize: 11, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                        {I}
                      </span>
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {visible("skills") && skills.length > 0 && (
              <>
                <FrH id="skills">{labelFor("skills")}</FrH>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                  {skills.map((s) => (
                    <span key={s.id} style={{ fontSize: 10.5, background: accentSoft, color: accent, padding: "3px 9px", borderRadius: 6, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </>
            )}

            {visible("languages") && languages.length > 0 && (
              <>
                <FrH id="languages">{labelFor("languages")}</FrH>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#4a585e", marginBottom: 4 }}>
                    <span>{l.name}</span>
                    <span style={{ color: accent, fontWeight: 600 }}>{langLbl(l.level)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Decorative QR */}
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, width: 56 }}>
              {Array.from({ length: 49 }).map((_, i) => (
                <span key={i} style={{ aspectRatio: "1", background: QR_CELLS.has(i) ? accent : "transparent", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
              ))}
            </div>
          </div>

          <div>
            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <FrH id="workExperience">{labelFor("workExperience")}</FrH>
                {workExperience.map((e) => (
                  <div key={e.id} className="resume-entry" style={{ marginBottom: 13, paddingLeft: 16, borderLeft: "2px solid #d6ebe8", position: "relative", breakInside: "avoid" }}>
                    <span style={{ position: "absolute", left: -5, top: 4, width: 8, height: 8, borderRadius: "50%", background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#27343a" }}>{e.jobTitle}</div>
                      <div style={{ fontSize: 10.5, color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#8a9a9e", marginBottom: 3 }}>
                      {e.employer}{e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 11, color: "#4a585e", lineHeight: 1.45 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                ))}
              </>
            )}

            {visible("education") && education.length > 0 && (
              <>
                <FrH id="education">{labelFor("education")}</FrH>
                {education.map((ed) => (
                  <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                      {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "#8a9a9e" }}>
                      {ed.institution} · {ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <>
                <FrH id="certifications">{labelFor("certifications")}</FrH>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {certifications.map((c) => (
                    <span key={c.id} style={{ fontSize: 10.5, border: `1px solid ${accent}`, color: accent, padding: "3px 9px", borderRadius: 6, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      {c.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
