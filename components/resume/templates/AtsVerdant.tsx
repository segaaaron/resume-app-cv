"use client"

/**
 * ATS Verdant — faithful 1:1 port (cv-ats-a.jsx · 02 VERDANT). Forest green,
 * initials medallion header with 3px rule, left icon-rail "rule" headings,
 * period/role two-column experience, grouped technical skills, language bars.
 * Source Sans 3 — single column, ATS-safe.
 */

import { useAtsData } from "./ats/useAtsData"
import { useResumeStore } from "@/stores/resumeStore"
import { AHead, AContact, ABullets, AGroups, ABars } from "./ats/atoms"

const SSANS = 'var(--font-source-sans), "Segoe UI", Calibri, Arial, sans-serif'

export default function AtsVerdant() {
  const d = useAtsData()
  const c = d.accent("#1e5c3d")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  const pd = useResumeStore((s) => s.sectionData.personalDetails)
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  return (
    <div data-print-layout="single-column" style={{ width: "100%", minHeight: "297mm", background: "#fff", color: "#16181d", fontFamily: SSANS, display: "flex", flexDirection: "column", ...pca }}>
      <div style={{ padding: "38px 48px 20px", borderBottom: `3px solid ${c}`, ...pca }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 8, background: c, color: "#fff", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700, letterSpacing: "0.02em", ...pca }}>{initials}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 35, fontWeight: 700, letterSpacing: "-0.015em" }}>{d.fullName}</h1>
            {d.jobTitle && <div style={{ fontSize: 13, color: c, fontWeight: 600, letterSpacing: "0.05em" }}>{d.jobTitle}</div>}
          </div>
        </div>
        {d.contacts.length > 0 && <div style={{ marginTop: 16 }}><AContact items={d.contacts} color={c} variant="soft" shape="circle" size={20} font={SSANS} fs={10.4} /></div>}
      </div>

      <div style={{ padding: "22px 48px 32px", flex: 1 }}>
        {d.visible("summary") && d.summary && (
          <>
            <AHead icon="target" color={c} font={SSANS} variant="rule">{d.label("summary")}</AHead>
            <p style={{ fontSize: 11.4, lineHeight: 1.6, color: "#43474f", margin: "0 0 18px" }}>{d.summary}</p>
          </>
        )}

        {d.visible("workExperience") && d.experience.length > 0 && (
          <>
            <AHead icon="chart" color={c} font={SSANS} variant="rule">{d.label("workExperience")}</AHead>
            <div style={{ marginBottom: 18 }}>
              {d.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 16, paddingBottom: 13, marginBottom: 13, borderBottom: i < d.experience.length - 1 ? "1px solid #e6e7ea" : "none", breakInside: "avoid" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c, lineHeight: 1.4, paddingTop: 2 }}>{e.period}{e.loc && <div style={{ color: "#8b8f98", fontWeight: 600 }}>{e.loc}</div>}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{e.role}</div>
                    {e.company && <div style={{ fontSize: 11, color: "#6b7078", marginBottom: 6 }}>{e.company}</div>}
                    {e.bullets.length > 0 && <ABullets items={e.bullets} color={c} font={SSANS} marker="sq" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {d.skillGroups.length > 0 && (
          <>
            <AHead icon="gear" color={c} font={SSANS} variant="rule">{d.label("skills")}</AHead>
            <div style={{ marginBottom: 18 }}><AGroups groups={d.skillGroups} color={c} font={SSANS} cols={3} icon="check" /></div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 28 }}>
          {d.visible("education") && d.education.length > 0 && (
            <div>
              <AHead icon="cap" color={c} font={SSANS} variant="rule" size={11.5}>{d.label("education")}</AHead>
              {d.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{ed.degree}</div>
                  {ed.school && <div style={{ fontSize: 10.4, color: "#6b7078" }}>{ed.school}{ed.period ? `, ${ed.period}` : ""}</div>}
                </div>
              ))}
              {d.visible("certifications") && d.certs.length > 0 && <div style={{ fontSize: 10.4, color: "#43474f", marginTop: 8 }}>{d.certs.join(" · ")}</div>}
            </div>
          )}
          {d.visible("languages") && d.languages.length > 0 && (
            <div>
              <AHead icon="lang" color={c} font={SSANS} variant="rule" size={11.5}>{d.label("languages")}</AHead>
              <ABars items={d.languages} color={c} font={SSANS} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
