"use client"

/**
 * ATS Cobalt — faithful 1:1 port (cv-ats-a.jsx · 04 COBALT). Split header (name
 * left, contact band right), tab headings, layered experience icons, square
 * chips, 2-col Education / Languages, certification grid. IBM Plex Sans —
 * single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, AIco } from "./ats/atoms"

const PLEX = 'var(--font-plex), Tahoma, Arial, sans-serif'

export default function AtsCobalt() {
  const d = useAtsData()
  const c = d.accent("#14509e")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: PLEX, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 210px" }}>
        <div style={{ padding: "36px 30px 26px 46px" }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{d.firstName}<br /><span style={{ color: c }}>{d.lastName}</span></h1>
          {d.jobTitle && <div style={{ fontSize: 12, color: "#43474f", marginTop: 8, fontWeight: 500, letterSpacing: "0.04em" }}>{d.jobTitle}</div>}
          {d.summary && <p style={{ fontSize: 10.8, lineHeight: 1.6, color: "#5b6068", margin: "12px 0 0", maxWidth: 400 }}>{d.summary}</p>}
        </div>
        {d.contacts.length > 0 && (
          <div style={{ background: c, color: "#fff", padding: "30px 22px", ...pca }}>
            <AContact items={d.contacts} color="#ffffff" variant="plain" size={13} font={PLEX} fs={9.6} ink="#e2ecf9" dir="column" gap="9px" />
          </div>
        )}
      </div>

      <div style={{ padding: "18px 46px 32px", flex: 1 }}>
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={PLEX} variant="tab">{d.label("workExperience")}</AHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 15, marginBottom: 20 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AIco k="layers" c={c} size={22} variant="soft" shape="square" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.role}{e.company && <span style={{ color: c }}> @ {e.company}</span>}</div>
                      {(e.period || e.loc) && <div style={{ fontSize: 9.8, color: "#8b8f98" }}>{e.period}{e.loc ? ` · ${e.loc}` : ""}</div>}
                    </div>
                  </div>
                  {e.bullets.length > 0 && <div style={{ marginTop: 6, paddingLeft: 32 }}><ABullets items={e.bullets} color={c} font={PLEX} marker="dot" /></div>}
                </div>
              ))}
            </div>
          </>
        )}

        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <AHead icon="code" color={c} font={PLEX} variant="tab">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 20 }}><AChips items={d.skills} color={c} font={PLEX} variant="square" /></div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={PLEX} variant="tab" size={11.5}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={PLEX} variant="tab" size={11.5}>{d.label("languages")}</AHead>
              <div style={{ fontSize: 10.6, color: "#43474f", lineHeight: 1.7 }}>{d.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</div>
            </div>
          )}
        </div>

        {d.visible("certifications") && d.certs.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <AHead icon="medal" color={c} font={PLEX} variant="tab">{d.label("certifications")}</AHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 26px" }}>
              {d.certs.map((t) => (
                <div key={t} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 10.4, color: "#43474f" }}><AIco k="medal" c={c} size={19} variant="soft" shape="square" />{t}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
