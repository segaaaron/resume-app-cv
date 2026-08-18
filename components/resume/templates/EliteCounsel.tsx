"use client"

/**
 * Elite Counsel — dark luxe law editorial (navy + gold).
 * Source: planillas-lujosas-Jun-29026/cv-elite-a.jsx (EliteCounsel, 2026-06-04).
 *
 * Design fidelity:
 *  - Palette: navy #10182b, gold #b8924f, ivory #ece6d8.
 *  - Hairline gold frame inset 22px; serif headline (italic last name);
 *    left editorial column + right portrait rail with bordered photo.
 *  - SecRule (gold uppercase + hairline) used as section divider.
 *
 * Font mapping (no Cormorant/Playfair in app stack):
 *  - Cormorant Garamond / Playfair Display (source) → Georgia / Times New Roman serif stack.
 *  - Geist (source meta) → Jakarta sans stack (var(--font-jakarta)).
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function EliteCounselTemplate() {
  // White canvas: the design's dark ground is what made this unreadable on paper.
  // Structure and accent survive; only the values that carry text were re-grounded.
  const navy = "#ffffff"
  const ivory = "#15171c"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const gold = designAccent(config.colorScheme, "#b8924f")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  const SecRule = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 16px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.28em", color: gold, textTransform: "uppercase" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: `${gold}66`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )

  const contactRows: Array<[string, string]> = []
  if (pd.phone) contactRows.push(["T", pd.phone])
  if (pd.email) contactRows.push(["E", pd.email])
  if (pd.website) contactRows.push(["W", pd.website])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contactRows.push(["A", place])

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  return (
    <div
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "1fr 286px",
        background: navy,
        color: ivory,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* hairline gold frame */}
      <div style={{ position: "absolute", inset: 22, border: `1px solid ${gold}40`, pointerEvents: "none", zIndex: 3, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* LEFT editorial column */}
      <div style={{ padding: "54px 44px 40px 50px", position: "relative" }}>
        {pd.jobTitle && (
          <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.46em", color: gold, marginBottom: 26, textTransform: "uppercase" }}>
            {pd.jobTitle}
          </div>
        )}
        <h1 style={{ fontFamily: SERIF, fontSize: 62, fontWeight: 500, margin: 0, lineHeight: 0.92, color: "#15171c", letterSpacing: "-0.01em" }}>
          {firstLine}
          <br />
          <span style={{ fontStyle: "italic", fontWeight: 500 }}>{lastLine}</span>
        </h1>

        {visible("summary") && summary && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0 24px" }}>
              <span style={{ width: 44, height: 1, background: gold, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
              <span style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.2em", color: "#6f737e", textTransform: "uppercase" }}>
                {config.language === "en" ? "Summary" : "Resumen"}
              </span>
            </div>
            <p style={{ fontSize: 17.5, lineHeight: 1.55, fontStyle: "italic", color: "#6e7075", margin: "0 0 30px", maxWidth: 420 }}>
              {summary}
            </p>
          </>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <SecRule label={labelFor("workExperience")} />
            {workExperience.map((e) => {
              const yr = (e.startDate || "").slice(-2)
              return (
                <div key={e.id} className="resume-entry" style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 16, marginBottom: 17, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 22, fontStyle: "italic", color: gold, lineHeight: 1 }}>’{yr}</div>
                  <div>
                    <div style={{ fontSize: 19, color: "#15171c", lineHeight: 1.1 }}>
                      {e.jobTitle}
                      <span style={{ color: gold }}> · </span>
                      <span style={{ fontStyle: "italic", color: "#6b6d73" }}>{e.employer}</span>
                    </div>
                    <div style={{ fontFamily: "inherit", fontSize: 11, color: gold, marginTop: 3, letterSpacing: "0.04em" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      {e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontFamily: "inherit", fontSize: 11.5, color: "#707584", lineHeight: 1.5, marginTop: 4 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <SecRule label={labelFor("education")} />
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 18, color: "#15171c" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? " — " : ""}
                    {ed.fieldOfStudy && <span style={{ fontStyle: "italic" }}>{ed.fieldOfStudy}</span>}
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 11, color: gold, whiteSpace: "nowrap" }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 11.5, color: "#707584", marginTop: 4 }}>
                  {ed.institution}
                  {ed.city ? ` · ${ed.city}` : ""}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* RIGHT portrait rail */}
      <div style={{ position: "relative", padding: "40px 30px", borderLeft: `1px solid ${gold}30`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ padding: 5, border: `1px solid ${gold}`, marginBottom: 22, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: "100%",
                height: 270,
                display: "block",
                objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                filter: "grayscale(0.3)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: 270, background: "#f4f2ee", display: "grid", placeItems: "center", color: `${gold}99`, fontSize: 56, fontWeight: 300, letterSpacing: "0.04em", fontFamily: "inherit" }}>
              {initials}
            </div>
          )}
        </div>

        {contactRows.length > 0 && (
          <>
            <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.24em", color: gold, marginBottom: 14, textTransform: "uppercase" }}>
              {config.language === "en" ? "Chambers" : "Contacto"}
            </div>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 11, fontSize: 11.5, color: "#6e7075", marginBottom: 26 }}>
              {contactRows.map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: gold, width: 10 }}>{k}</span>
                  {v}
                </div>
              ))}
            </div>
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.24em", color: gold, marginBottom: 14, textTransform: "uppercase" }}>
              {labelFor("skills")}
            </div>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#6e7075", marginBottom: 22 }}>
              {skills.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${gold}22`, paddingBottom: 8 }}>
                  <span style={{ width: 4, height: 4, background: gold, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  {s.name}
                </div>
              ))}
            </div>
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.24em", color: gold, marginBottom: 12, textTransform: "uppercase" }}>
              {labelFor("certifications")}
            </div>
            <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "#6e7075", marginBottom: 18 }}>
              {certifications.map((c) => (
                <div key={c.id}>{c.name}</div>
              ))}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <div style={{ fontFamily: "inherit", fontSize: 13, fontStyle: "italic", color: gold, textAlign: "center", borderTop: `1px solid ${gold}30`, paddingTop: 14, marginTop: 8 }}>
            {languages.map((l) => `${l.name} (${langLbl(l.level)})`).join(" · ")}
          </div>
        )}
      </div>
    </div>
  )
}
