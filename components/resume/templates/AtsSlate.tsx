"use client"

/**
 * ATS Slate — faithful 1:1 port (cv-ats-a.jsx · 05 SLATE). Graphite + amber,
 * minimal split header, summary callout, dashed-rule experience, dense 2-col
 * skills grid with language bars. Work Sans — single column, ATS-safe.
 * Graphite is structural; the amber accent is the user-overridable signature.
 */

import { useAtsData } from "./ats/useAtsData"
import { AHead, AContact, ABullets, AGroups, ABars, AIco, aFade } from "./ats/atoms"

const WORKS = 'var(--font-work-sans), "Helvetica Neue", Arial, sans-serif'
const C = "#37474f"

export default function AtsSlate() {
  const d = useAtsData()
  const a = d.accent("#b06f16")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fcfcfb", color: "#16181d", fontFamily: WORKS, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "38px 48px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, borderBottom: "1px solid #e3e4e7" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>{d.fullName}</h1>
          {d.jobTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
              <span style={{ width: 26, height: 3, background: a, ...pca }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C }}>{d.jobTitle}</span>
            </div>
          )}
        </div>
        {d.contacts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <AContact items={d.contacts} color={a} variant="plain" size={13} font={WORKS} fs={10.2} dir="column" gap="6px" />
          </div>
        )}
      </div>

      <div style={{ padding: "20px 48px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18, background: aFade(C, 0.05), padding: "14px 16px", borderRadius: 4, ...pca }}>
            <AIco k="spark" c={a} size={26} variant="solid" shape="circle" />
            <p style={{ fontSize: 11.2, lineHeight: 1.6, color: "#43474f", margin: 0 }}>{d.summary}</p>
          </div>
        )}

        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="chart" color={C} font={WORKS} variant="split">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < d.experience.length - 1 ? "1px dashed #dcdde1" : "none", breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{e.role}</div>
                    {e.period && <div style={{ fontSize: 9.6, fontWeight: 700, letterSpacing: "0.08em", color: a, textTransform: "uppercase", whiteSpace: "nowrap" }}>{e.period}</div>}
                  </div>
                  {(e.company || e.loc) && <div style={{ fontSize: 10.8, color: "#6b7078", margin: "2px 0 6px" }}>{e.company}{e.loc ? ` · ${e.loc}` : ""}</div>}
                  {e.bullets.length > 0 && <ABullets items={e.bullets} color={a} font={WORKS} marker="bolt" />}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28 }}>
          <div>
            {d.skillGroups.length > 0 && (
              <>
                <AHead icon="gear" color={C} font={WORKS} variant="split" size={11.5}>{d.label("skills")}</AHead>
                <div style={{ marginBottom: 16 }}><AGroups groups={d.skillGroups} color={a} font={WORKS} cols={1} /></div>
              </>
            )}
            {d.visible("education") && d.education.length > 0 && (
              <>
                <AHead icon="cap" color={C} font={WORKS} variant="split" size={11.5}>{d.label("education")}</AHead>
                {d.education.map((ed, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                    {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? ` · ${ed.period}` : ""}</div>}
                  </div>
                ))}
              </>
            )}
          </div>
          <div>
            {d.visible("certifications") && d.certs.length > 0 && (
              <>
                <AHead icon="medal" color={C} font={WORKS} variant="split" size={11.5}>{d.label("certifications")}</AHead>
                <div style={{ marginBottom: 14 }}><ABullets items={d.certs} color={a} font={WORKS} marker="star" fs={10.3} /></div>
              </>
            )}
            {d.visible("languages") && d.languages.length > 0 && (
              <>
                <AHead icon="lang" color={C} font={WORKS} variant="split" size={11.5}>{d.label("languages")}</AHead>
                <ABars items={d.languages} color={a} font={WORKS} rounded={false} h={4} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
