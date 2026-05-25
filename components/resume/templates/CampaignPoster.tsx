"use client"

import { Mail, Phone, Link2 } from "lucide-react"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function CampaignPosterTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = config.colorScheme || "#ff3a5c"
  const cream = "#fff4e8"
  const ink = "#0e0e0e"
  const yellow = "#ffd23f"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h3 style={{
        fontFamily: "'Archivo Black', sans-serif", fontSize: 22,
        margin: "20px 0 10px", color: cream, textTransform: "uppercase" as const, lineHeight: 1,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {children}
      </h3>
    )
  }

  function Hit({ n, t, s, desc }: { n: string; t: string; s?: string; desc?: string }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "60px 1fr", gap: 10,
        padding: "8px 0", borderBottom: "2px solid rgba(255,255,255,0.3)",
      }}>
        <span style={{
          fontFamily: "'Archivo Black', sans-serif", fontSize: 18,
          color: yellow, lineHeight: 1,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>{n}</span>
        <div style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>{t}</div>
          {s && <div style={{ fontSize: 11, opacity: 0.85 }}>{s}</div>}
          {desc && <div className="resume-desc" style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }} dangerouslySetInnerHTML={{ __html: desc }} />}
        </div>
      </div>
    )
  }

  const firstName = pd.firstName || "First"
  const lastName = pd.lastName || "Last"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: cream,
      fontFamily: "'Archivo Black', sans-serif", padding: 48,
      position: "relative", display: "flex", flexDirection: "column", overflow: "hidden",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Decorative circles */}
      <div style={{
        position: "absolute", right: -100, top: -80, width: 400, height: 400,
        borderRadius: "50%", background: yellow, opacity: 0.95,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }} />
      <div style={{
        position: "absolute", left: 40, bottom: 80, width: 180, height: 180,
        borderRadius: "50%", background: cream, opacity: 0.18,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Inter Tight', sans-serif", fontSize: 12,
          letterSpacing: "0.3em", fontWeight: 800,
        }}>
          ★ {config.language === "en" ? "THE CANDIDATE" : "EL CANDIDATO"} ★ {new Date().getFullYear()}
        </div>
        <h1 style={{
          fontSize: 110, lineHeight: 0.85, margin: "20px 0 10px",
          letterSpacing: "-0.05em", color: cream, textTransform: "uppercase" as const,
        }}>
          {config.language === "en" ? "HIRE" : "CONTRATA"}<br />{firstName.toUpperCase()}!
        </h1>
        {pd.jobTitle && (
          <div style={{
            fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 800,
            color: ink, background: yellow, display: "inline-block",
            padding: "6px 14px", transform: "rotate(-2deg)",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            {pd.jobTitle}
          </div>
        )}
      </div>

      {/* Main grid */}
      <main style={{
        marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 28, position: "relative", zIndex: 1,
        fontFamily: "'Inter Tight', sans-serif", fontWeight: 500,
      }}>
        {/* Left */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? `Why ${firstName}?` : `¿Por qué ${firstName}?`}</H>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{config.language === "en" ? "Greatest hits" : "Trayectoria"}</H>
              {workExperience.map((job, i) => {
                const startY = job.startDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                const endY = job.currentlyWorking
                  ? (config.language === "en" ? "Now" : "Hoy")
                  : job.endDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                const n = startY && endY ? `${startY}—${endY}` : String(i + 1).padStart(2, "0")
                return (
                  <Hit
                    key={job.id}
                    n={n}
                    t={`${job.jobTitle}${job.employer ? ` · ${job.employer}` : ""}`}
                    s={job.city || ""}
                    desc={job.description ? fmtDesc(job.description) : undefined}
                  />
                )
              })}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{config.language === "en" ? "Studied at" : "Educación"}</H>
              <p style={{ margin: 0, fontSize: 12 }}>
                {education.map((edu) => (
                  [edu.degree, edu.institution, edu.endDate?.match(/\d{4}/)?.[0]].filter(Boolean).join(" · ")
                )).join("\n")}
              </p>
            </>
          )}
        </section>

        {/* Right */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: ink, color: cream, padding: "5px 10px",
                    fontSize: 11, fontWeight: 800,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              {certifications.map((cert, i) => (
                <Hit
                  key={cert.id}
                  n={String(i + 1).padStart(2, "0")}
                  t={cert.name}
                  s={cert.issuer || ""}
                />
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0, fontSize: 12 }}>
                {languages.map((l) => `${l.name} · ${l.level}`).join("  ·  ")}
              </p>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", paddingTop: 24,
        position: "relative", zIndex: 1,
        fontFamily: "'Inter Tight', sans-serif",
        fontSize: 12, fontWeight: 700,
        display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center",
      }}>
        <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 13 }}>{firstName} {lastName}</span>
        {pd.email && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} />{pd.email}</span>}
        {pd.phone && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={12} />{pd.phone}</span>}
        {pd.linkedin && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2 size={12} />{pd.linkedin}</span>}
        {pd.github && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2 size={12} />{pd.github}</span>}
      </footer>
    </div>
  )
}
