"use client"

/**
 * Elite Cadence — Filmmaker / Director cinematic duotone with amber accent.
 * Source: planillas-lujosas-Jun-29026/cv-elite-d.jsx (EliteCadence, 2026-06-04).
 *
 * Design fidelity:
 *  - Palette: ink #0c0b0d, amber #e3a44a, fog #cfc9bd.
 *  - Top + bottom black "letterbox" bars (26px) for cinematic frame.
 *  - Body: left editorial (name + filmography), right portrait with sepia/grayscale filter,
 *    "SCENE 01 / TAKE 03" mono caption overlay.
 *  - NumSec uses amber numerals; MiniLabel tracked amber.
 *
 * Font mapping: Space Grotesk / Geist Mono → Jakarta SANS + monospace fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-space-grotesk), "Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO = '"Courier New", ui-monospace, SFMono-Regular, monospace'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function EliteCadenceTemplate() {
  // The page was ink-black; on paper that is where the design stopped working. White
  // canvas, and every value that carried text re-grounded so it can be read.
  const ink = "#ffffff"
  const fog = "#575249"   // was #cfc9bd — 1.65:1 on white

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const am = designAccent(config.colorScheme, "#e3a44a")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  const NumSec = ({ n, label }: { n: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 15px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: am }}>{n}</span>
      <span style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#15171c" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "#f4f2ee", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
  const MiniLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: am, marginBottom: 12, fontWeight: 600 }}>
      {children}
    </div>
  )

  const contactLines: string[] = []
  if (pd.email) contactLines.push(pd.email)
  if (pd.phone) contactLines.push(pd.phone)
  if (pd.website) contactLines.push(pd.website)
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contactLines.push(place)

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: ink,
        color: fog,
        fontFamily: SANS,
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* top letterbox */}
      <div style={{ height: 26, background: "#f4f2ee", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", padding: "34px 46px 60px", gap: 30 }}>
        {/* LEFT */}
        <div style={{ paddingRight: 0 }}>
          {pd.jobTitle && (
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.3em", color: am, marginBottom: 16, textTransform: "uppercase" }}>
              ● {pd.jobTitle}
            </div>
          )}
          <h1 style={{ fontSize: 56, fontWeight: 700, margin: 0, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#15171c" }}>
            {firstLine}
            <br />
            {lastLine}
          </h1>
          {visible("summary") && summary && (
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "#757068", margin: "20px 0 28px", maxWidth: 380 }}>
              {summary}
            </p>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <NumSec n="01" label={labelFor("workExperience")} />
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#15171c" }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: am, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: am, fontWeight: 600, marginBottom: 3 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: "#706c65", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <NumSec n="02" label={labelFor("education")} />
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#15171c" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "#706c65" }}>
                    {ed.institution}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          <div style={{ position: "relative", marginBottom: 22 }}>
            {config.photoUrl ? (
              <img
                src={config.photoUrl}
                alt=""
                style={{
                  width: "100%", height: 256, objectFit: "cover", display: "block",
                  objectPosition: `center ${config.photoPosition ?? 15}%`,
                  filter: "grayscale(1) contrast(1.1) sepia(0.35) hue-rotate(-12deg) brightness(0.95)",
                }}
              />
            ) : (
              <div style={{ width: "100%", height: 256, background: "#f4f2ee", display: "grid", placeItems: "center", color: am, fontSize: 60, fontWeight: 700 }}>
                {initials}
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1px ${am}55`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
            <div style={{ position: "absolute", top: 8, left: 8, fontFamily: MONO, fontSize: 9, color: am, background: "rgba(0,0,0,0.5)", padding: "2px 6px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              SCENE 01 / TAKE 03
            </div>
          </div>

          {visible("skills") && skills.length > 0 && (
            <>
              <MiniLabel>{labelFor("skills")}</MiniLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 10.5, border: `1px solid ${am}55`, color: am, padding: "4px 10px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <MiniLabel>{labelFor("certifications")}</MiniLabel>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#757068", lineHeight: 1.9, marginBottom: 18 }}>
                {certifications.map((c) => (
                  <div key={c.id}>{c.name}</div>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <MiniLabel>{labelFor("languages")}</MiniLabel>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#757068", lineHeight: 1.9, marginBottom: 18 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{l.name}</span>
                    <span style={{ color: am }}>{langLbl(l.level)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {contactLines.length > 0 && (
            <>
              <MiniLabel>{config.language === "en" ? "Contact" : "Contacto"}</MiniLabel>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#757068", lineHeight: 1.9 }}>
                {contactLines.map((c, i) => <div key={i}>{c}</div>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* bottom letterbox */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 26, background: "#f4f2ee", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
}
