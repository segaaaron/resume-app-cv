"use client"

/**
 * ATS Cardinal — faithful 1:1 port of the reference design (cv-ats-a.jsx · 03 CARDINAL).
 * Centered serif header with a shield medallion, boxed section headings, left-rule
 * experience, 2-col Skills / Awards, globe languages, Areas of Expertise. Burgundy
 * signature (user-overridable), Merriweather + Lato — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, AGroups, AIco, aFade } from "./ats/atoms"

const MERRI = 'var(--font-merriweather), Georgia, "Times New Roman", serif'
const LATO = 'var(--font-lato), "Helvetica Neue", Arial, sans-serif'

export default function AtsCardinal() {
  const d = useAtsData()
  const c = d.accent("#7a2230")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fffdfc", color: "#16181d", fontFamily: LATO, display: "flex", flexDirection: "column", ...pca }}>
      {/* HEADER — centered medallion */}
      <div style={{ padding: "40px 52px 22px", textAlign: "center", borderBottom: `1px solid ${aFade(c, 0.3)}` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <AIco k="shield" c={c} size={38} variant="soft" shape="circle" />
        </div>
        <h1 style={{ margin: 0, fontFamily: MERRI, fontSize: 33, fontWeight: 700, letterSpacing: "-0.01em" }}>{d.fullName}</h1>
        {d.jobTitle && <div style={{ fontSize: 11.5, letterSpacing: "0.3em", textTransform: "uppercase", color: c, marginTop: 8, fontWeight: 700 }}>{d.jobTitle}</div>}
        {d.contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <AContact items={d.contacts} color={c} variant="plain" size={13} font={LATO} fs={10.4} gap="5px 18px" />
          </div>
        )}
      </div>

      <div style={{ padding: "22px 52px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="book" color={c} font={LATO} variant="box">{d.label("summary")}</AHead>
            <p style={{ fontFamily: MERRI, fontSize: 10.8, lineHeight: 1.72, color: "#43474f", margin: "0 0 18px" }}>{d.summary}</p>
          </>
        )}

        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={LATO} variant="box">{d.label("workExperience")}</AHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ paddingLeft: 14, borderLeft: `2px solid ${aFade(c, 0.35)}`, breakInside: "avoid", ...pca }}>
                  <div style={{ fontFamily: MERRI, fontSize: 13.5, fontWeight: 700 }}>{e.role}{e.company && <span style={{ fontWeight: 400, color: c }}> · {e.company}</span>}</div>
                  {(e.period || e.loc) && <div style={{ fontSize: 10, color: "#8b8f98", letterSpacing: "0.08em", textTransform: "uppercase", margin: "3px 0 6px" }}>{e.period}{e.loc ? ` — ${e.loc}` : ""}</div>}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={LATO} marker="dash" />}
                </div>
              ))}
            </div>
          </>
        )}

        {((d.visible("skills") && d.skills.length > 0) || (d.visible("certifications") && d.certs.length > 0)) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, marginBottom: 18 }}>
            {d.visible("skills") && d.skills.length > 0 && (
              <div><AHead icon="bolt" color={c} font={LATO} variant="box" size={11.5}>{d.label("skills")}</AHead><AChips items={d.skills.slice(0, 12)} color={c} font={LATO} variant="outline" /></div>
            )}
            {d.visible("certifications") && d.certs.length > 0 && (
              <div><AHead icon="medal" color={c} font={LATO} variant="box" size={11.5}>{d.label("certifications")}</AHead><ABullets items={d.certs} color={c} font={LATO} marker="star" fs={10.4} /></div>
            )}
          </div>
        )}

        {d.visible("education") && d.education.length > 0 && (
          <>
            <AHead icon="cap" color={c} font={LATO} variant="box">{d.label("education")}</AHead>
            {d.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div><span style={{ fontFamily: MERRI, fontSize: 12.5, fontWeight: 700 }}>{ed.degree}</span>{ed.school && <span style={{ fontSize: 10.6, color: "#6b7078" }}> — {ed.school}</span>}</div>
                {ed.period && <div style={{ fontSize: 10, color: c, fontWeight: 700, whiteSpace: "nowrap" }}>{ed.period}</div>}
              </div>
            ))}
          </>
        )}

        {d.visible("languages") && d.languages.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <AHead icon="lang" color={c} font={LATO} variant="box">{d.label("languages")}</AHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              {d.languages.map((l) => (
                <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <AIco k="globe" c={c} size={20} variant="soft" shape="circle" />
                  <div><div style={{ fontFamily: MERRI, fontSize: 11.5, fontWeight: 700 }}>{l.name}</div><div style={{ fontSize: 9.8, color: "#6b7078" }}>{l.level}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.skillGroups.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <AHead icon="target" color={c} font={LATO} variant="box">{d.label("skills") === "Skills" ? "Areas of Expertise" : d.label("skills")}</AHead>
            <AGroups groups={d.skillGroups} color={c} font={LATO} cols={3} icon="check" />
          </div>
        )}
      </div>
    </div>
  )
}
