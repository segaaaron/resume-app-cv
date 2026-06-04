"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function TimelineVerticalTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd
  const accent = config.colorScheme
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const ink = "#1c2329"
  const sage = "#7a8b7c"
  const bg = "#f7f6f1"

  // Combine work experience and education into one timeline, sorted by date
  const timelineItems = [
    ...workExperience.map((job) => ({
      id: job.id,
      year: job.startDate?.match(/\d{4}/)?.[0] || "",
      head: job.jobTitle,
      sub: job.employer + (job.city ? `, ${job.city}` : ""),
      body: fmtDesc(job.description || ""),
      isHtml: true,
    })),
    ...education.map((edu) => ({
      id: edu.id,
      year: edu.startDate?.match(/\d{4}/)?.[0] || "",
      head: edu.degree + (edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""),
      sub: edu.institution,
      body: edu.city || "",
      isHtml: false,
    })),
  ].sort((a, b) => parseInt(b.year) - parseInt(a.year))

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: ink,
      fontFamily: "inherit", fontSize: 10.5, lineHeight: 1.55,
      padding: "48px 56px", display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 24, alignItems: "center", paddingBottom: 24, borderBottom: `1px solid ${ink}` }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", flexShrink: 0, backgroundColor: accent + "22", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 800, fontSize: 36 }}>
          {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
        </div>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em", color: accent, textTransform: "uppercase" }}>Curriculum · {new Date().getFullYear()}</div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 52, lineHeight: 1, margin: "4px 0 6px", letterSpacing: "-0.02em" }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && <div style={{ fontSize: 13, color: sage }}>{pd.jobTitle}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: 10, lineHeight: 1.7, color: ink }}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
          {pd.website && <div style={{ color: accent, marginTop: 4 }}>{pd.website}</div>}
          {pd.linkedin && <div style={{ color: accent }}>{pd.linkedin}</div>}
        </div>
      </header>

      {/* Pull quote / summary */}
      {visible("summary") && summary && (
        <div style={{ padding: "20px 0", borderBottom: `1px solid ${ink}`, marginBottom: 28 }}>
          <p style={{ margin: 0, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, lineHeight: 1.4, fontStyle: "italic", color: ink }}>
            &ldquo;{summary}&rdquo;
          </p>
        </div>
      )}

      {/* Timeline */}
      {timelineItems.length > 0 && (
        <div style={{ position: "relative", flex: 1, display: "grid", gridTemplateColumns: "1fr 100px 1fr", gap: 0 }}>
          {/* Spine */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: ink, transform: "translateX(-0.5px)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

          {timelineItems.map((item, i) => {
            const isLeft = i % 2 === 0
            return (
              <TimelineRow
                key={item.id}
                year={item.year}
                side={isLeft ? "L" : "R"}
                head={item.head}
                sub={item.sub}
                body={item.body}
                isHtml={item.isHtml}
                ink={ink}
                accent={accent}
                bg={bg}
              />
            )
          })}
        </div>
      )}

      {/* Footer buckets */}
      <footer style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${ink}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {visible("skills") && skills.length > 0 && (
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: sage, textTransform: "uppercase", marginBottom: 8 }}>{label("skills")}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10.5, lineHeight: 1.7 }}>
              {skills.map((sk) => <li key={sk.id}>{sk.name}</li>)}
            </ul>
          </div>
        )}
        {visible("languages") && languages.length > 0 && (
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: sage, textTransform: "uppercase", marginBottom: 8 }}>{label("languages")}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10.5, lineHeight: 1.7 }}>
              {languages.map((lang) => <li key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</li>)}
            </ul>
          </div>
        )}
        {visible("certifications") && certifications.length > 0 && (
          <div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: sage, textTransform: "uppercase", marginBottom: 8 }}>{label("certifications")}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10.5, lineHeight: 1.7 }}>
              {certifications.map((cert) => <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>)}
            </ul>
          </div>
        )}
      </footer>
    </div>
  )
}

function TimelineRow({
  year, side, head, sub, body, isHtml, ink, accent, bg,
}: {
  year: string; side: "L" | "R"; head: string; sub: string; body: string; isHtml: boolean; ink: string; accent: string; bg: string
}) {
  const isLeft = side === "L"
  return (
    <>
      {/* Left cell */}
      <div style={{ gridColumn: 1, padding: "0 24px 24px 0", textAlign: "right", visibility: isLeft ? "visible" : "hidden" }}>
        {isLeft && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 15, lineHeight: 1.2 }}>{head}</div>
            <div style={{ fontSize: 10.5, color: accent, fontWeight: 600, marginTop: 2 }}>{sub}</div>
            {body && (
              isHtml
                ? <div className="resume-desc" style={{ fontSize: 10.5, color: "#3d4248", marginTop: 4 }} dangerouslySetInnerHTML={{ __html: body }} />
                : <div style={{ fontSize: 10.5, color: "#3d4248", marginTop: 4 }}>{body}</div>
            )}
          </div>
        )}
      </div>

      {/* Center (dot + year) */}
      <div style={{ gridColumn: 2, position: "relative", padding: "4px 0 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, border: `2px solid ${bg}`, boxShadow: `0 0 0 1px ${ink}`, flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        {year && <div style={{ textAlign: "center", marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 10, color: ink, fontWeight: 600 }}>{year}</div>}
      </div>

      {/* Right cell */}
      <div style={{ gridColumn: 3, padding: "0 0 24px 24px", visibility: isLeft ? "hidden" : "visible" }}>
        {!isLeft && (
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 15, lineHeight: 1.2 }}>{head}</div>
            <div style={{ fontSize: 10.5, color: accent, fontWeight: 600, marginTop: 2 }}>{sub}</div>
            {body && (
              isHtml
                ? <div className="resume-desc" style={{ fontSize: 10.5, color: "#3d4248", marginTop: 4 }} dangerouslySetInnerHTML={{ __html: body }} />
                : <div style={{ fontSize: 10.5, color: "#3d4248", marginTop: 4 }}>{body}</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
