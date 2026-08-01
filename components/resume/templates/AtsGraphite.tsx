"use client"

/**
 * ATS Graphite — faithful 1:1 port (cv-ats-b.jsx · 09 GRAPHITE). Charcoal header
 * with a red accent bar + title chip, split headings, tight modern experience,
 * grouped skills. Nunito Sans — single column, ATS-safe. Charcoal is structural;
 * the red accent is the user-overridable signature.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AGroups } from "./ats/atoms"

const NUNI = 'var(--font-nunito-sans), "Segoe UI", Arial, sans-serif'
const C = "#22262c"

export default function AtsGraphite() {
  const d = useAtsData()
  const a = d.accent("#b3261e")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: NUNI, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ background: C, color: "#fff", padding: "32px 46px 24px", position: "relative", ...pca }}>
        <span style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: a, ...pca }} />
        <h1 style={{ margin: 0, fontSize: 37, fontWeight: 900, letterSpacing: "-0.03em" }}>{d.fullName}</h1>
        {d.jobTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span style={{ background: a, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 2, ...pca }}>{d.jobTitle}</span>
          </div>
        )}
        {d.contacts.length > 0 && <div style={{ marginTop: 16 }}><AContact items={d.contacts} color={a} variant="solid" shape="square" size={18} font={NUNI} fs={10.1} ink="#fff" gap="7px 16px" /></div>}
      </div>
      <div style={{ padding: "22px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && <p style={{ fontSize: 11, lineHeight: 1.6, color: "#43474f", margin: "0 0 18px" }}>{d.summary}</p>}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={a} font={NUNI} variant="split">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 13, breakInside: "avoid" }}>
                  <div style={{ fontSize: 13.4, fontWeight: 800 }}>{e.role}</div>
                  {(e.company || e.period || e.loc) && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10.4, color: "#6b7078", margin: "2px 0 6px", flexWrap: "wrap" }}>
                      {e.company && <span style={{ fontWeight: 700, color: a }}>{e.company}</span>}
                      {e.period && <><span>·</span><span>{e.period}</span></>}
                      {e.loc && <><span>·</span><span>{e.loc}</span></>}
                    </div>
                  )}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={a} font={NUNI} marker="dash" />}
                </div>
              ))}
            </div>
          </>
        )}
        {d.skillGroups.length > 0 && (
          <>
            <AHead icon="code" color={a} font={NUNI} variant="split">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AGroups groups={d.skillGroups} color={a} font={NUNI} cols={3} icon="bolt" /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={a} font={NUNI} variant="split" size={11}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11.8, fontWeight: 800 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.3, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("certifications") && d.certs.length > 0 && (
            <div>
              <AHead icon="medal" color={a} font={NUNI} variant="split" size={11}>{d.label("certifications")}</AHead>
              <ABullets items={d.certs} color={a} font={NUNI} marker="star" fs={10.3} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
