"use client"

/**
 * ATS Sable — faithful 1:1 port (cv-ats-c.jsx · 13 SABLE). Deep green band header
 * with an initials medallion, Spectral serif body, rule headings, quiet-luxury
 * spacing. Source Sans 3 labels — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { useResumeStore } from "@/stores/resumeStore"
import { AHead, AContact, ABullets, AChips } from "./ats/atoms"

const SSANS = 'var(--font-source-sans), Calibri, Arial, sans-serif'
const SPEC = 'var(--font-spectral), Georgia, serif'

export default function AtsSable() {
  const d = useAtsData()
  const c = d.accent("#14453d")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  const pd = useResumeStore((s) => s.sectionData.personalDetails)
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fcfdfc", color: "#16181d", fontFamily: SSANS, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ background: c, color: "#fff", padding: "30px 46px 22px", display: "flex", alignItems: "center", gap: 18, ...pca }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "grid", placeItems: "center", fontFamily: SPEC, fontSize: 21, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: SPEC, fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em" }}>{d.fullName}</h1>
          {d.jobTitle && <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9dc4b8", marginTop: 5 }}>{d.jobTitle}</div>}
        </div>
        {d.contacts.length > 0 && <AContact items={d.contacts.slice(0, 3)} color="#ffffff" variant="plain" size={12} font={SSANS} fs={9.7} ink="#d5e5df" dir="column" gap="6px" />}
      </div>
      <div style={{ padding: "22px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="book" color={c} font={SSANS} variant="rule">{d.label("summary")}</AHead>
            <p style={{ fontFamily: SPEC, fontSize: 11.6, lineHeight: 1.7, color: "#3f434b", margin: "0 0 16px" }}>{d.summary}</p>
          </>
        )}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={SSANS} variant="rule">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontFamily: SPEC, fontSize: 14.5, fontWeight: 600 }}>{e.role}</div>
                    {e.period && <div style={{ fontSize: 9.7, color: c, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {(e.company || e.loc) && <div style={{ fontSize: 10.5, color: "#6b7078", margin: "2px 0 6px" }}>{[e.company, e.loc].filter(Boolean).join(" · ")}</div>}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={SSANS} marker="check" />}
                </div>
              ))}
            </div>
          </>
        )}
        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <AHead icon="gear" color={c} font={SSANS} variant="rule">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AChips items={d.skills} color={c} font={SSANS} variant="soft" /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={SSANS} variant="rule" size={11}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontFamily: SPEC, fontSize: 13, fontWeight: 600 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.3, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={SSANS} variant="rule" size={11}>{d.label("languages")}</AHead>
              <div style={{ fontSize: 10.5, color: "#43474f", lineHeight: 1.7 }}>{d.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
