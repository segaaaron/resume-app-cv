"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

function SL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "0 24px 6px", fontSize: 11, color: "#8e8e93", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

const rowColors = ["#34c759", "#bf5af2", "#0a84ff", "#ff9f0a", "#ff3b30", "#5ac8fa"]

export default function IOSAppCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const L = getResumeLabels(config.language)
  const present = L.present

  const bg = "#f2f2f7"
  const card = "#ffffff"
  const ink = "#1c1c1e"
  const dim = "#8e8e93"
  const blue = accent

  const yearsExp = (() => {
    if (pd.yearsOfExperience && parseInt(pd.yearsOfExperience) > 0) return `${pd.yearsOfExperience}+`
    if (workExperience.length === 0) return "0+"
    const earliest = workExperience.reduce((min, job) => {
      const y = parseInt(job.startDate?.match(/\d{4}/)?.[0] || "9999")
      return y < min ? y : min
    }, 9999)
    if (earliest >= 9999) return "0+"
    return `${new Date().getFullYear() - earliest}+`
  })()

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: ink,
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif", fontSize: 11,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px 6px", fontSize: 13, fontWeight: 600 }}>
        <span>9:41</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>●●●●● 5G 🔋</span>
      </div>

      {/* Navigation header */}
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ fontSize: 13, color: blue, marginBottom: 4 }}>← Settings</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Resume</h1>
        {pd.jobTitle && <div style={{ fontSize: 17, color: dim, marginTop: 2 }}>{pd.jobTitle}</div>}
      </div>

      {/* Profile card */}
      <div style={{ margin: "0 16px 16px", background: card, borderRadius: 16, padding: 18, display: "flex", gap: 14, alignItems: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: blue, flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{initials || "N"}</span>}
            </div>
          )
        })()}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{pd.firstName || "First"} {pd.lastName || "Last"}</div>
          {pd.email && <div style={{ fontSize: 13, color: dim }}>{pd.email}</div>}
          {pd.phone && <div style={{ fontSize: 13, color: dim }}>{pd.phone}</div>}
        </div>
        <div style={{ background: blue, color: "#fff", padding: "8px 14px", borderRadius: 100, fontSize: 13, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>Hire</div>
      </div>

      {/* Stats strip */}
      <div style={{ margin: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[
          [yearsExp, config.language === "en" ? "Years" : "Años"],
          [`${workExperience.length}`, config.language === "en" ? "Companies" : "Empresas"],
          [`${skills.length}`, L.skills],
          [`${education.length + certifications.length}`, config.language === "en" ? "Degrees" : "Títulos"],
        ].map(([k, v]) => (
          <div key={v} style={{ background: card, borderRadius: 12, padding: 12, textAlign: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{k}</div>
            <div style={{ fontSize: 11, color: dim }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <>
          <SL>{label("summary")}</SL>
          <div style={{ margin: "0 16px 16px", background: card, borderRadius: 16, padding: 16, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#3a3a3c" }}>{summary}</p>
          </div>
        </>
      )}

      {/* Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <SL>{label("workExperience")}</SL>
          <div style={{ margin: "0 16px 16px", background: card, borderRadius: 16, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {workExperience.map((job, idx) => (
              <div key={job.id} style={{ borderTop: idx === 0 ? "none" : "0.5px solid #d1d1d6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: rowColors[idx % rowColors.length], flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{job.jobTitle}</div>
                    <div style={{ fontSize: 12, color: dim }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 11, color: dim }}>
                    {job.startDate}{job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                  </div>
                </div>
                {job.description && (
                  <div className="resume-desc" style={{ padding: "0 16px 12px 38px", fontSize: 11.5, color: "#3a3a3c", lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <>
          <SL>{label("skills")}</SL>
          <div style={{ margin: "0 16px 16px", background: card, borderRadius: 16, padding: 16, display: "flex", flexWrap: "wrap", gap: 6, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {skills.map((sk, idx) => {
              const c = rowColors[idx % rowColors.length]
              return (
                <span key={sk.id} style={{ background: `${c}22`, color: c, padding: "6px 11px", borderRadius: 100, fontSize: 11.5, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {sk.name}
                </span>
              )
            })}
          </div>
        </>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <>
          <SL>{label("education")}</SL>
          {education.map((edu) => (
            <div key={edu.id} style={{ margin: "0 16px 10px", background: card, borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                {edu.institution && <div style={{ fontSize: 12, color: dim }}>{edu.institution}</div>}
              </div>
              {(edu.startDate || edu.endDate) && (
                <div style={{ fontSize: 12, color: dim }}>
                  {edu.startDate}{edu.currentlyStudying ? ` — ${present}` : edu.endDate ? ` — ${edu.endDate}` : ""}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Tab bar */}
      <div style={{ marginTop: "auto", background: "rgba(255,255,255,0.85)", borderTop: "0.5px solid #d1d1d6", padding: "10px 0 24px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", textAlign: "center", fontSize: 10, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {[["👤", L.profile, true], ["💼", L.work], ["🛠", L.skills], ["🎓", L.education], ["📞", L.contact]].map(([i, l, a]) => (
          <div key={String(l)} style={{ color: a ? blue : dim }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{i}</div>
            <div style={{ marginTop: 2, fontWeight: a ? 600 : 400 }}>{String(l)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
