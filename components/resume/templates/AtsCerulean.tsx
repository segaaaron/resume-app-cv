"use client"

/**
 * ATS Cerulean — faithful 1:1 port (cv-ats-c.jsx · 14 CERULEAN). Bright blue,
 * accent-bar header, coloured contact panel, badge headings, competency bars
 * (from the candidate's real skill levels) + language bars. Asap — single
 * column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, ABars, aFade } from "./ats/atoms"

const ASAP = 'var(--font-asap), Verdana, Arial, sans-serif'

export default function AtsCerulean() {
  const d = useAtsData()
  const c = d.accent("#1565a0")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: ASAP, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "34px 46px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 5, height: 54, background: c, borderRadius: 3, ...pca }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 35, fontWeight: 700, letterSpacing: "-0.02em" }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 12.5, color: c, fontWeight: 600, letterSpacing: "0.06em" }}>{d.jobTitle}</div>}
          </div>
        </div>
      </div>
      {d.contacts.length > 0 && (
        <div style={{ margin: "18px 46px 0", background: c, borderRadius: 5, padding: "12px 18px", ...pca }}>
          <AContact items={d.contacts} color="#ffffff" variant="plain" size={13} font={ASAP} fs={10.2} ink="#eaf3fa" gap="5px 16px" />
        </div>
      )}
      <div style={{ padding: "20px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="target" color={c} font={ASAP} variant="badge">{d.label("summary")}</AHead>
            <p style={{ fontSize: 11.2, lineHeight: 1.6, color: "#43474f", margin: "0 0 18px" }}>{d.summary}</p>
          </>
        )}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="chart" color={c} font={ASAP} variant="badge">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 13, background: i === 0 ? aFade(c, 0.05) : "transparent", padding: i === 0 ? "11px 13px" : "0", borderRadius: 4, borderLeft: i === 0 ? `3px solid ${c}` : "none", breakInside: "avoid", ...pca }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontSize: 13.2, fontWeight: 700 }}>{e.role}{e.company && <span style={{ color: c, fontWeight: 600 }}> · {e.company}</span>}</div>
                    {(e.period || e.loc) && <div style={{ fontSize: 9.8, color: "#6b7078", whiteSpace: "nowrap" }}>{[e.period, e.loc].filter(Boolean).join(" · ")}</div>}
                  </div>
                  {e.bullets.length > 0 && <div style={{ marginTop: 5 }}><ABullets items={e.bullets} color={c} font={ASAP} marker="check" /></div>}
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 18 }}>
          {d.skillBars.length > 0 && (
            <div>
              <AHead icon="bolt" color={c} font={ASAP} variant="badge" size={11}>{d.label("skills")}</AHead>
              {/* Bars for the first four, then the rest as plain text. The slice used to
                  be the whole section: a candidate with twelve skills printed four, and
                  this template is the one sold as ATS-safe — the eight it dropped are
                  exactly the keywords the panel told them to add. A bar is also not
                  machine-readable, so the text run is what a parser actually sees. */}
              <ABars items={d.skillBars.slice(0, 4)} color={c} font={ASAP} />
              {d.skillBars.length > 4 && (
                <p style={{ fontSize: 9.5, lineHeight: 1.55, color: "#4a4f57", margin: "6px 0 0" }}>
                  {d.skillBars.slice(4).map((s) => s.name).join(" · ")}
                </p>
              )}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={ASAP} variant="badge" size={11}>{d.label("languages")}</AHead>
              <ABars items={d.languages} color={c} font={ASAP} />
            </div>
          )}
        </div>
        {((d.visible("education") && d.education.length > 0) || (d.visible("certifications") && d.certs.length > 0)) && (
          <>
            <AHead icon="cap" color={c} font={ASAP} variant="badge">{d.label("education")}</AHead>
            {d.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}{ed.school && <span style={{ fontWeight: 400, color: "#6b7078" }}> — {ed.school}</span>}</div>
                {ed.period && <div style={{ fontSize: 9.8, color: c, fontWeight: 700 }}>{ed.period}</div>}
              </div>
            ))}
            {d.visible("certifications") && d.certs.length > 0 && <div style={{ marginTop: 6 }}><AChips items={d.certs} color={c} font={ASAP} variant="outline" fs={9.8} /></div>}
          </>
        )}
      </div>
    </div>
  )
}
