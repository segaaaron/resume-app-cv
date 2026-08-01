"use client"

/**
 * ATS Nordic — faithful 1:1 port (cv-ats-c.jsx · 11 NORDIC). Ice blue, centered
 * header with side rules, framed summary, timeline-spine experience, caps
 * headings. Cabin — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, ABars, aFade } from "./ats/atoms"

const CABIN = 'var(--font-cabin), "Trebuchet MS", Arial, sans-serif'

export default function AtsNordic() {
  const d = useAtsData()
  const c = d.accent("#2d6ca2")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fdfeff", color: "#16181d", fontFamily: CABIN, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "40px 50px 20px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>{d.fullName}</h1>
        {d.jobTitle && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 9 }}>
            <span style={{ width: 40, height: 1, background: aFade(c, 0.5), ...pca }} />
            <span style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: c, fontWeight: 700 }}>{d.jobTitle}</span>
            <span style={{ width: 40, height: 1, background: aFade(c, 0.5), ...pca }} />
          </div>
        )}
        {d.contacts.length > 0 && <div style={{ display: "flex", justifyContent: "center", marginTop: 15 }}><AContact items={d.contacts} color={c} variant="soft" shape="circle" size={20} font={CABIN} fs={10.3} gap="7px 16px" /></div>}
      </div>
      <div style={{ padding: "10px 50px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && <p style={{ fontSize: 11.2, lineHeight: 1.65, color: "#43474f", margin: "0 0 20px", textAlign: "center", padding: "14px 0", borderTop: `1px solid ${aFade(c, 0.25)}`, borderBottom: `1px solid ${aFade(c, 0.25)}`, ...pca }}>{d.summary}</p>}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="chart" color={c} font={CABIN} variant="caps">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 20 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "14px 1fr", gap: 14, paddingBottom: i < d.experience.length - 1 ? 14 : 0, breakInside: "avoid" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", border: `3px solid ${c}`, background: "#fff", marginTop: 4, ...pca }} />
                    {i < d.experience.length - 1 && <span style={{ flex: 1, width: 1, background: aFade(c, 0.3), ...pca }} />}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontSize: 13.4, fontWeight: 700 }}>{e.role}</div>
                      {e.period && <div style={{ fontSize: 9.8, color: c, fontWeight: 700, whiteSpace: "nowrap" }}>{e.period}</div>}
                    </div>
                    {(e.company || e.loc) && <div style={{ fontSize: 10.6, color: "#6b7078", margin: "2px 0 6px" }}>{[e.company, e.loc].filter(Boolean).join(" · ")}</div>}
                    {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={CABIN} marker="dot" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          <div>
            {d.visible("skills") && d.skills.length > 0 && (
              <>
                <AHead icon="gear" color={c} font={CABIN} variant="caps" size={11.5}>{d.label("skills")}</AHead>
                <div style={{ marginBottom: 16 }}><AChips items={d.skills.slice(0, 12)} color={c} font={CABIN} variant="soft" /></div>
              </>
            )}
            {d.visible("languages") && d.languages.length > 0 && (
              <>
                <AHead icon="lang" color={c} font={CABIN} variant="caps" size={11.5}>{d.label("languages")}</AHead>
                <ABars items={d.languages} color={c} font={CABIN} />
              </>
            )}
          </div>
          <div>
            {d.visible("education") && d.education.length > 0 && (
              <>
                <AHead icon="cap" color={c} font={CABIN} variant="caps" size={11.5}>{d.label("education")}</AHead>
                {d.education.map((ed, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                    {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                  </div>
                ))}
              </>
            )}
            {d.visible("certifications") && d.certs.length > 0 && (
              <>
                <AHead icon="medal" color={c} font={CABIN} variant="caps" size={11.5}>{d.label("certifications")}</AHead>
                <ABullets items={d.certs} color={c} font={CABIN} marker="check" fs={10.3} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
