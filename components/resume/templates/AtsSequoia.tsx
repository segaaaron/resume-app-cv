"use client"

/**
 * ATS Sequoia — faithful 1:1 port (cv-ats-b.jsx · 10 SEQUOIA). Rust, Roboto Slab,
 * numbered circular section markers, indented content columns. Lato body —
 * single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AContact, ABullets, AChips, AIco, aFade, type IconKey } from "./ats/atoms"

const RSLAB = 'var(--font-roboto-slab), Georgia, serif'
const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'

export default function AtsSequoia() {
  const d = useAtsData()
  const c = d.accent("#a1441f")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  const Sec = ({ n, icon, children }: { n: string; icon: IconKey; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
      <span style={{ fontFamily: RSLAB, fontSize: 11, fontWeight: 700, color: "#fff", background: c, width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", ...pca }}>{n}</span>
      <AIco k={icon} c={c} variant="plain" size={15} />
      <span style={{ fontFamily: RSLAB, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{children}</span>
      <span style={{ flex: 1, height: 2, background: aFade(c, 0.2), ...pca }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fffcfa", color: "#16181d", fontFamily: LATO, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "38px 48px 22px", borderBottom: "1px solid #e8e5e1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: RSLAB, fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 12.5, color: c, fontWeight: 700, marginTop: 5 }}>{d.jobTitle}</div>}
            {d.summary && <p style={{ fontSize: 10.8, lineHeight: 1.6, color: "#5b6068", margin: "10px 0 0", maxWidth: 430 }}>{d.summary}</p>}
          </div>
          {d.contacts.length > 0 && <AContact items={d.contacts} color={c} variant="soft" shape="circle" size={19} font={LATO} fs={9.9} dir="column" gap="8px" />}
        </div>
      </div>
      <div style={{ padding: "22px 48px 32px", flex: 1 }}>
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <Sec n="1" icon="brief">{d.label("workExperience")}</Sec>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 13, paddingLeft: 33, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontFamily: RSLAB, fontSize: 13, fontWeight: 700 }}>{e.role}{e.company ? ` — ${e.company}` : ""}</div>
                    {e.period && <div style={{ fontSize: 9.8, color: c, fontWeight: 700, whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {e.loc && <div style={{ fontSize: 10, color: "#8b8f98", marginBottom: 5 }}>{e.loc}</div>}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={LATO} marker="dot" />}
                </div>
              ))}
            </div>
          </>
        )}
        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <Sec n="2" icon="gear">{d.label("skills")}</Sec>
            <div style={{ paddingLeft: 33, marginBottom: 18 }}><AChips items={d.skills} color={c} font={LATO} variant="soft" /></div>
          </>
        )}
        {d.visible("education") && d.education.length > 0 && (
          <>
            <Sec n="3" icon="cap">{d.label("education")}</Sec>
            <div style={{ paddingLeft: 33, marginBottom: 18 }}>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: RSLAB, fontSize: 12.5, fontWeight: 700 }}>{ed.degree}</div>
                    {ed.period && <div style={{ fontSize: 9.8, color: c, fontWeight: 700 }}>{ed.period}</div>}
                  </div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}</div>}
                </div>
              ))}
              {d.visible("certifications") && d.certs.length > 0 && <div style={{ marginTop: 7 }}><ABullets items={d.certs} color={c} font={LATO} marker="check" fs={10.3} /></div>}
            </div>
          </>
        )}
        {d.visible("languages") && d.languages.length > 0 && (
          <>
            <Sec n="4" icon="lang">{d.label("languages")}</Sec>
            <div style={{ paddingLeft: 33, fontSize: 10.7, color: "#43474f" }}>{d.languages.map((l) => `${l.name} — ${l.level}`).join("   ·   ")}</div>
          </>
        )}
      </div>
    </div>
  )
}
