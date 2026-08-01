"use client"

/**
 * Bloom — soft pastel creative.
 * Source: planillas-lujosas-Jun-29026/cv-templates-b.jsx (TplBloom).
 *
 * Design:
 *  - Pink (#e86a92) + lavender (#8b7bd8) gradient background.
 *  - Floating radial blobs, white rounded cards with soft purple shadow.
 *  - Gradient text name, photo / initials avatar with ring.
 *
 * Font mapping:
 *  - "Bricolage Grotesque" / "Space Grotesk" (source) → Jakarta sans stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

export default function TplBloomTemplate() {
  const lav = "#8b7bd8"
  const ink = "#3a2e3e"
  const muted = "#5a4e62"
  const mutedSoft = "#7a6a82"
  const subtle = "#a594ad"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#e86a92")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 18,
    padding: "18px 22px",
    boxShadow: "0 6px 24px rgba(180,140,180,0.12)",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  }

  const BlH = ({ children, c1 }: { children: React.ReactNode; c1: string }) => (
    <div style={{ fontSize: 14, fontWeight: 700, color: c1, marginBottom: 10 }}>{children}</div>
  )

  const contacts: Array<[string, string]> = []
  if (pd.email) contacts.push(["✉", pd.email])
  if (pd.phone) contacts.push(["☎", pd.phone])
  if (place) contacts.push(["⌖", place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "linear-gradient(160deg,#fef6f9 0%,#f5f0fc 100%)",
        color: ink,
        fontFamily: "inherit",
        padding: "44px 46px",
        overflow: "hidden",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,#fbd5e2,transparent 70%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", bottom: 60, left: -60, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,#e0d8f7,transparent 70%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 22, position: "relative", marginBottom: 26 }}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: "50%",
            background: `linear-gradient(145deg,${accent},#8b7bd8)`,
            border: "5px solid #fff",
            boxShadow: "0 4px 18px rgba(180,140,180,0.25)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 38,
            fontWeight: 700,
            overflow: "hidden",
            flexShrink: 0,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                display: "block",
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1,
              background: `linear-gradient(90deg,${accent},#8b7bd8)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.02em",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            {fullName}
          </h1>
          {pd.jobTitle && <div style={{ fontSize: 16, color: mutedSoft, marginTop: 7, fontWeight: 500 }}>{pd.jobTitle}</div>}
          {contacts.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {contacts.map(([icon, t], i) => (
                <span
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    background: "#fff",
                    padding: "5px 11px",
                    borderRadius: 20,
                    color: "#6a5a72",
                    boxShadow: "0 2px 8px rgba(180,140,180,0.15)",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <span style={{ color: accent, fontSize: 13 }}>{icon}</span>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <div style={{ ...card, marginBottom: 18, position: "relative" }}>
          <BlH c1={accent}>✿ {labelFor("summary")}</BlH>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: muted, margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, position: "relative" }}>
        <div style={card}>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <BlH c1={lav}>✦ {labelFor("workExperience")}</BlH>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: ink }}>{e.jobTitle}</div>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 4 }}>
                    {e.employer}
                    {" · "}
                    <span style={{ color: subtle }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </span>
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <BlH c1={lav}>✦ {labelFor("education")}</BlH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: ink }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>
                    {ed.institution}
                    {" · "}
                    <span style={{ color: subtle }}>
                      {ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {visible("skills") && skills.length > 0 && (
            <div style={card}>
              <BlH c1={accent}>❀ {labelFor("skills")}</BlH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((s, i) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11,
                      padding: "4px 11px",
                      borderRadius: 20,
                      background: i % 2 ? "#f3effc" : "#fde9ef",
                      color: i % 2 ? lav : accent,
                      fontWeight: 600,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={card}>
              <BlH c1={lav}>✿ {labelFor("languages")}</BlH>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: muted }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: subtle }}>{l.level}</span>
                </div>
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={card}>
              <BlH c1={accent}>❀ {labelFor("certifications")}</BlH>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: muted, marginBottom: 4 }}>
                  {c.name}
                </div>
              ))}
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div style={card}>
              <BlH c1={lav}>✦ {labelFor("projects")}</BlH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 12, color: muted, marginBottom: 4 }}>
                  <strong style={{ color: ink }}>{p.name}</strong>
                  {p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
