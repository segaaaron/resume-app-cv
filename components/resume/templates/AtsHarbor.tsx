"use client"

/**
 * ATS Harbor — faithful 1:1 port (cv-ats-b.jsx · 08 HARBOR). Teal ribbon header
 * with a layers medallion + 3-col contact grid, solid bar headings, banded
 * experience rows, solid chips, language bars. Libre Franklin — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, ABars, AIco, aFade, aMix } from "./ats/atoms"

const FRANK = 'var(--font-libre-franklin), Helvetica, Arial, sans-serif'

export default function AtsHarbor() {
  const d = useAtsData()
  const c = d.accent("#0f6b73")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  const third = Math.ceil(d.contacts.length / 3)

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: FRANK, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ background: aFade(c, 0.07), padding: "34px 46px 24px", borderBottom: `4px solid ${c}`, ...pca }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <AIco k="layers" c={c} size={52} variant="solid" shape="rounded" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 33, fontWeight: 700, letterSpacing: "-0.02em" }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 12.5, color: aMix(c, 0.1), fontWeight: 600, marginTop: 4 }}>{d.jobTitle}</div>}
          </div>
        </div>
        {d.contacts.length > 0 && (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 14px" }}>
            {[0, 1, 2].map((col) => (
              <AContact key={col} items={d.contacts.slice(col * third, col * third + third)} color={c} variant="soft" size={19} font={FRANK} fs={10.1} dir="column" gap="8px" />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "22px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="user" color={c} font={FRANK} variant="bar">{d.label("summary")}</AHead>
            <p style={{ fontSize: 11.1, lineHeight: 1.62, color: "#43474f", margin: "0 0 18px" }}>{d.summary}</p>
          </>
        )}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="chart" color={c} font={FRANK} variant="bar">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, background: "#f6f8f8", padding: "6px 10px", borderRadius: 3, ...pca }}>
                    <div style={{ fontSize: 12.8, fontWeight: 700 }}>{e.role}{e.company && <span style={{ color: c, fontWeight: 600 }}> | {e.company}</span>}</div>
                    {(e.period || e.loc) && <div style={{ fontSize: 9.8, color: "#6b7078", whiteSpace: "nowrap" }}>{[e.period, e.loc].filter(Boolean).join(" · ")}</div>}
                  </div>
                  {e.bullets.length > 0 && <div style={{ marginTop: 6, paddingLeft: 10 }}><ABullets items={e.bullets} color={c} font={FRANK} marker="sq" /></div>}
                </div>
              ))}
            </div>
          </>
        )}
        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <AHead icon="bolt" color={c} font={FRANK} variant="bar">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AChips items={d.skills} color={c} font={FRANK} variant="solid" /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={FRANK} variant="bar" size={11}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11.8, fontWeight: 700 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.3, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={FRANK} variant="bar" size={11}>{d.label("languages")}</AHead>
              <ABars items={d.languages} color={c} font={FRANK} h={4} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
