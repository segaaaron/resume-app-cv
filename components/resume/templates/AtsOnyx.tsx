"use client"

/**
 * ATS Onyx — faithful 1:1 port (cv-ats-c.jsx · 12 ONYX). Black + gold, double
 * rule header with a chip of icons, split editorial headings, company/role
 * two-column experience. Figtree — single column, ATS-safe. Black is structural;
 * the gold accent is the user-overridable signature.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AGroups, AIco, type IconKey } from "./ats/atoms"

const FIGT = 'var(--font-figtree), Helvetica, Arial, sans-serif'
const INK = "#101114"

export default function AtsOnyx() {
  const d = useAtsData()
  const c = d.accent("#8a6a1f")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fdfdfc", color: "#16181d", fontFamily: FIGT, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "38px 46px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, paddingBottom: 12, borderBottom: `3px double ${INK}` }}>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95 }}>{d.firstName}<br />{d.lastName}</h1>
          <div style={{ textAlign: "right" }}>
            {d.jobTitle && <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: c }}>{d.jobTitle}</div>}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>{(["code", "target", "bolt", "shield"] as IconKey[]).map((k) => <AIco key={k} k={k} c={INK} size={24} variant="solid" shape="square" />)}</div>
          </div>
        </div>
        {d.contacts.length > 0 && <div style={{ marginTop: 12 }}><AContact items={d.contacts} color={c} variant="plain" size={13} font={FIGT} fs={10.2} gap="5px 18px" /></div>}
      </div>
      <div style={{ padding: "6px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && <p style={{ fontSize: 11.4, lineHeight: 1.6, color: "#3c4048", margin: "0 0 18px", fontWeight: 500 }}>{d.summary}</p>}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={FIGT} variant="split">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 18, paddingBottom: 12, marginBottom: 12, borderBottom: i < d.experience.length - 1 ? "1px solid #e6e5e0" : "none", breakInside: "avoid" }}>
                  <div>
                    {e.company && <div style={{ fontSize: 11.5, fontWeight: 800 }}>{e.company}</div>}
                    {e.period && <div style={{ fontSize: 9.6, color: c, fontWeight: 700, letterSpacing: "0.05em" }}>{e.period}</div>}
                    {e.loc && <div style={{ fontSize: 9.6, color: "#8b8f98" }}>{e.loc}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{e.role}</div>
                    {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={FIGT} marker="sq" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {d.skillGroups.length > 0 && (
          <>
            <AHead icon="layers" color={c} font={FIGT} variant="split">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AGroups groups={d.skillGroups} color={c} font={FIGT} cols={3} /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={FIGT} variant="split" size={11}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11.8, fontWeight: 700 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.3, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("certifications") && d.certs.length > 0 && (
            <div>
              <AHead icon="star" color={c} font={FIGT} variant="split" size={11}>{d.label("certifications")}</AHead>
              <ABullets items={d.certs} color={c} font={FIGT} marker="medal" fs={10.3} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
