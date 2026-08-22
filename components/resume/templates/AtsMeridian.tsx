"use client"

/**
 * ATS Meridian — faithful 1:1 port (cv-ats-a.jsx · 01 MERIDIAN). Navy band header
 * with an outline code medallion, badge headings, check bullets, soft skill chips,
 * 2-col Education / Certifications, language bars. Lato — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, ABars, AIco } from "./ats/atoms"

const LATO = 'var(--font-lato), "Helvetica Neue", Arial, sans-serif'

export default function AtsMeridian() {
  const d = useAtsData()
  const c = d.accent("#1f3a5f")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: LATO, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ background: c, color: "#fff", padding: "30px 46px 26px", ...pca }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 12.5, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 9, color: "#a9c2e0" }}>{d.jobTitle}</div>}
          </div>
          <AIco k="code" c="#fff" variant="outline" size={46} shape="rounded" style={{ borderColor: "rgba(255,255,255,0.4)" }} />
        </div>
        {d.contacts.length > 0 && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "18px 0 14px", ...pca }} />
            <AContact items={d.contacts} color="#ffffff" variant="plain" size={13} font={LATO} fs={10.3} ink="#dbe6f3" gap="6px 20px" />
          </>
        )}
      </div>

      <div style={{ padding: "24px 46px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="user" color={c} font={LATO} variant="badge">{d.label("summary")}</AHead>
            <p style={{ fontSize: 11.2, lineHeight: 1.62, color: "#43474f", margin: "0 0 16px" }}>{d.summary}</p>
          </>
        )}

        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={LATO} variant="badge">{d.label("workExperience")}</AHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 15, marginBottom: 20 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800 }}>{e.role}</div>
                    {e.period && <div style={{ fontSize: 10, fontWeight: 700, color: c, whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {(e.company || e.loc) && <div style={{ fontSize: 11, color: "#6b7078", margin: "2px 0 6px" }}>{e.company}{e.loc ? ` — ${e.loc}` : ""}</div>}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={LATO} marker="check" />}
                </div>
              ))}
            </div>
          </>
        )}

        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <AHead icon="bolt" color={c} font={LATO} variant="badge">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 20 }}><AChips items={d.skills} color={c} font={LATO} variant="soft" /></div>
          </>
        )}

        {((d.visible("education") && d.education.length > 0) || (d.visible("certifications") && d.certs.length > 0)) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
            {d.visible("education") && d.education.length > 0 && (
              <div>
                <AHead icon="cap" color={c} font={LATO} variant="badge" size={11.5}>{d.label("education")}</AHead>
                {d.education.map((ed, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                    {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                  </div>
                ))}
              </div>
            )}
            {d.visible("certifications") && d.certs.length > 0 && (
              <div>
                <AHead icon="medal" color={c} font={LATO} variant="badge" size={11.5}>{d.label("certifications")}</AHead>
                <ABullets items={d.certs} color={c} font={LATO} marker="dot" fs={10.4} />
              </div>
            )}
          </div>
        )}

        {d.visible("languages") && d.languages.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <AHead icon="lang" color={c} font={LATO} variant="badge">{d.label("languages")}</AHead>
            <ABars items={d.languages} color={c} font={LATO} />
          </div>
        )}
      </div>
    </div>
  )
}
