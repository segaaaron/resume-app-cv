"use client"

/**
 * ATS Ivory — faithful 1:1 port (cv-ats-c.jsx · 15 IVORY). Warm taupe on cream,
 * wide margins, light/bold name, spark medallion, check-marked experience with
 * hairline rules, grouped skills. Lato — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AGroups, AIco, aFade } from "./ats/atoms"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'

export default function AtsIvory() {
  const d = useAtsData()
  const c = d.accent("#6b5844")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fdfbf6", color: "#16181d", fontFamily: LATO, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "46px 54px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 33, fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" }}>{d.firstName} <strong style={{ fontWeight: 900 }}>{d.lastName}</strong></h1>
            {d.jobTitle && <div style={{ fontSize: 11.5, color: c, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 7, fontWeight: 700 }}>{d.jobTitle}</div>}
          </div>
          <AIco k="spark" c={c} size={40} variant="outline" shape="circle" />
        </div>
        <div style={{ height: 1, background: aFade(c, 0.3), margin: "18px 0 14px", ...pca }} />
        {d.contacts.length > 0 && <AContact items={d.contacts} color={c} variant="plain" size={12.5} font={LATO} fs={10.2} gap="5px 18px" ink="#585c63" />}
      </div>
      <div style={{ padding: "20px 54px 34px", flex: 1 }}>
        {d.visible("summary") && d.summary && <p style={{ fontSize: 11.3, lineHeight: 1.68, color: "#4a4e55", margin: "0 0 20px" }}>{d.summary}</p>}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={LATO} variant="tab" track="0.2em">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 20 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 15, breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <AIco k="check" c={c} size={18} variant="solid" shape="circle" />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{e.role}</div>
                    <span style={{ flex: 1, height: 1, background: "#e8e2d6", ...pca }} />
                    {e.period && <div style={{ fontSize: 9.8, color: c, fontWeight: 700, whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {(e.company || e.loc) && <div style={{ fontSize: 10.5, color: "#7a7f86", margin: "3px 0 6px", paddingLeft: 27 }}>{[e.company, e.loc].filter(Boolean).join(" · ")}</div>}
                  {e.bullets.length > 0 && <div style={{ paddingLeft: 27 }}><ABullets items={e.bullets} color={c} font={LATO} marker="dash" /></div>}
                </div>
              ))}
            </div>
          </>
        )}
        {d.skillGroups.length > 0 && (
          <>
            <AHead icon="gear" color={c} font={LATO} variant="tab" track="0.2em">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 20 }}><AGroups groups={d.skillGroups} color={c} font={LATO} cols={3} /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={LATO} variant="tab" size={11} track="0.2em">{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#7a7f86" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("certifications") && d.certs.length > 0 && (
            <div>
              <AHead icon="medal" color={c} font={LATO} variant="tab" size={11} track="0.2em">{d.label("certifications")}</AHead>
              <ABullets items={d.certs} color={c} font={LATO} marker="dot" fs={10.3} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
