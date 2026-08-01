"use client"

/**
 * ATS Copper — faithful 1:1 port (cv-ats-b.jsx · 07 COPPER). Bronze, PT Serif
 * headings, framed contact strip, timeline experience with brief medallions,
 * outline chips. Karla body — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AChips, AIco, aFade } from "./ats/atoms"

const PTS = 'var(--font-pt-serif), Georgia, serif'
const KARLA = 'var(--font-karla), Helvetica, Arial, sans-serif'

export default function AtsCopper() {
  const d = useAtsData()
  const c = d.accent("#8a5426")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fffdfa", color: "#16181d", fontFamily: KARLA, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "40px 48px 0" }}>
        <h1 style={{ margin: 0, fontFamily: PTS, fontSize: 36, fontWeight: 700, letterSpacing: "-0.01em" }}>{d.fullName}</h1>
        {d.jobTitle && <div style={{ fontSize: 12.5, color: c, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 6 }}>{d.jobTitle}</div>}
      </div>
      {d.contacts.length > 0 && (
        <div style={{ margin: "18px 48px 0", border: `1px solid ${aFade(c, 0.35)}`, background: aFade(c, 0.05), borderRadius: 4, padding: "11px 16px", ...pca }}>
          <AContact items={d.contacts} color={c} variant="plain" size={13} font={KARLA} fs={10.3} gap="5px 16px" />
        </div>
      )}
      <div style={{ padding: "20px 48px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="target" color={c} font={PTS} variant="tab" track="0.06em">{d.label("summary")}</AHead>
            <p style={{ fontSize: 11.2, lineHeight: 1.62, color: "#43474f", margin: "0 0 16px" }}>{d.summary}</p>
          </>
        )}
        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="brief" color={c} font={PTS} variant="tab" track="0.06em">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12, marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <AIco k="brief" c={c} size={24} variant="solid" shape="circle" />
                    {i < d.experience.length - 1 && <span style={{ flex: 1, width: 1.5, background: aFade(c, 0.28), ...pca }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: PTS, fontSize: 14, fontWeight: 700 }}>{e.role}</div>
                    <div style={{ fontSize: 10.6, color: c, fontWeight: 700, margin: "2px 0 6px" }}>{[e.company, e.period, e.loc].filter(Boolean).join(" · ")}</div>
                    {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={KARLA} marker="check" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {d.visible("skills") && d.skills.length > 0 && (
          <>
            <AHead icon="gear" color={c} font={PTS} variant="tab" track="0.06em">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AChips items={d.skills} color={c} font={KARLA} variant="outline" /></div>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={PTS} variant="tab" size={11.5} track="0.06em">{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? `, ${ed.period}` : ""}</div>}
                </div>
              ))}
            </div>
          )}
          {d.visible("certifications") && d.certs.length > 0 && (
            <div>
              <AHead icon="medal" color={c} font={PTS} variant="tab" size={11.5} track="0.06em">{d.label("certifications")}</AHead>
              <ABullets items={d.certs} color={c} font={KARLA} marker="dash" fs={10.3} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
