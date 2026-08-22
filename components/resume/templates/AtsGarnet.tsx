"use client"

/**
 * ATS Garnet — faithful 1:1 port (cv-ats-b.jsx · 06 GARNET). Plum, EB Garamond
 * display name, hairline rules, caps headings, grouped skills. Lato body —
 * single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AGroups, AIco, type IconKey } from "./ats/atoms"

const GARA = 'var(--font-eb-garamond), Garamond, Georgia, serif'
const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'

export default function AtsGarnet() {
  const d = useAtsData()
  const c = d.accent("#5b2a55")

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fffdff", color: "#16181d", fontFamily: LATO, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "42px 50px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, borderBottom: `2px solid ${c}`, paddingBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: GARA, fontSize: 44, fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1 }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 11.5, letterSpacing: "0.18em", textTransform: "uppercase", color: c, marginTop: 8, fontWeight: 700 }}>{d.jobTitle}</div>}
          </div>
          <div style={{ display: "flex", gap: 7 }}>{(["code", "layers", "target"] as IconKey[]).map((k) => <AIco key={k} k={k} c={c} size={28} variant="soft" shape="circle" />)}</div>
        </div>
        {d.contacts.length > 0 && <div style={{ marginTop: 13 }}><AContact items={d.contacts} color={c} variant="plain" size={13} font={LATO} fs={10.3} gap="5px 20px" /></div>}
      </div>
      <div style={{ padding: "4px 50px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && <p style={{ fontFamily: GARA, fontSize: 13.2, lineHeight: 1.6, color: "#3f434b", margin: "0 0 18px" }}>{d.summary}</p>}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={LATO} variant="caps">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 16 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontFamily: GARA, fontSize: 16, fontWeight: 600 }}>{e.role}{e.company && <>, <span style={{ fontStyle: "italic", color: c }}>{e.company}</span></>}</div>
                    {e.period && <div style={{ fontSize: 9.8, color: "#8b8f98", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {e.bullets.length > 0 && <div style={{ marginTop: 5 }}><ABullets items={e.bullets} color={c} font={LATO} marker="dot" fs={10.6} /></div>}
                </div>
              ))}
            </div>
          </>
        )}
        {d.skillGroups.length > 0 && (
          <>
            <AHead icon="bolt" color={c} font={LATO} variant="caps">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 16 }}><AGroups groups={d.skillGroups} color={c} font={LATO} cols={3} /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={LATO} variant="caps" size={11.5}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontFamily: GARA, fontSize: 14, fontWeight: 600 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={LATO} variant="caps" size={11.5}>{d.label("languages")}</AHead>
              <div style={{ fontSize: 10.6, color: "#43474f", lineHeight: 1.75 }}>{d.languages.map((l) => <div key={l.name}>{l.name} — <span style={{ color: c, fontWeight: 700 }}>{l.level}</span></div>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
