"use client"

/**
 * Consul — Sidebar azul con GRAN flecha/pentágono SVG que contiene nombre + foto circular.
 * Panel principal blanco con secciones subrayadas y bullet points.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, string> = {
  beginner: "22%", intermediate: "50%", advanced: "75%", expert: "100%",
}
const LANG_W: Record<string, string> = {
  a1: "17%", a2: "33%", b1: "50%",
  b2: "67%", c1: "83%", c2: "100%", native: "100%",
}

export default function ConsulTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, volunteer, references,
  } = sectionData

  const accent  = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const objTitle = config.language === "en" ? "Objective" : "Objetivo"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()

  // Sidebar width in px (as number for SVG viewBox)
  const SW = 210

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": accent, "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "210px" } as React.CSSProperties}>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: `${SW}px`, flexShrink: 0,
        backgroundColor: accent,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* ── Gran flecha/pentágono SVG que envuelve nombre + foto ── */}
        <div style={{ position: "relative", width: "100%" }}>
          {/* SVG pentágono con punta hacia abajo */}
          <svg
            width="100%" height="230"
            viewBox={`0 0 ${SW} 230`}
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            {/* Fondo más oscuro para el pentágono */}
            <path
              d={`M 0,0 L ${SW},0 L ${SW},185 L ${SW / 2},230 L 0,185 Z`}
              fill="rgba(0,0,0,0.20)"
            />
          </svg>

          {/* Contenido dentro del pentágono: nombre + foto */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 210,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12,
          }}>
            {/* Nombre apilado */}
            <div style={{ textAlign: "center", lineHeight: 1.1 }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {pd.firstName || "NOMBRE"}
              </div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {pd.lastName || "APELLIDO"}
              </div>
            </div>

            {/* Foto circular */}
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.85)",
              backgroundColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>{initials || "N"}</span>}
            </div>
          </div>
        </div>

        {/* ── Objetivo ── */}
        {visible("summary") && summary && (
          <div style={{ padding: "18px 18px 14px 18px" }}>
            <p style={{
              color: "#fff", fontWeight: 800, fontSize: "11px",
              letterSpacing: "0.14em", textTransform: "uppercase",
              marginBottom: 6, textAlign: "center",
            }}>
              {objTitle}
            </p>
            <div style={{ width: 28, height: 2, backgroundColor: "rgba(255,255,255,0.5)", margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "9.5px", lineHeight: 1.7 }}>
              {summary}
            </p>
          </div>
        )}

        {/* ── Skills ── */}
        {visible("skills") && skills.length > 0 && (
          <SideSection id="skills" title={label("skills").toUpperCase()}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {skills.map((sk) => (
                <div key={sk.id}>
                  <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "10px", marginBottom: 3 }}>{sk.name}</p>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: SKILL_W[sk.level] ?? "55%", backgroundColor: "rgba(255,255,255,0.75)" }} />
                  </div>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {/* ── Languages ── */}
        {visible("languages") && languages.length > 0 && (
          <SideSection id="languages" title={label("languages").toUpperCase()}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "10px", marginBottom: 3 }}>{lang.name}</p>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: LANG_W[lang.level] ?? "55%", backgroundColor: "rgba(255,255,255,0.75)" }} />
                  </div>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── Contacto al fondo ── */}
        <div style={{ padding: "0 16px 24px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {pd.email    && <ContactRow icon={<Mail size={11} />}    text={pd.email} />}
          {(pd.address || pd.city || pd.country) && (
            <ContactRow icon={<MapPin size={11} />} text={[pd.address, pd.city, pd.country, pd.postalCode].filter(Boolean).join(", ")} />
          )}
          {pd.phone    && <ContactRow icon={<Phone size={11} />}   text={pd.phone} />}
          {pd.website  && <ContactRow icon={<Globe size={11} />}   text={pd.website} />}
          {pd.linkedin && <ContactRow icon={<Link2 size={11} />}   text={pd.linkedin} />}
          {pd.github   && <ContactRow icon={<GitFork size={11} />} text={pd.github} />}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, padding: "28px 26px 28px 26px", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <h1 style={{
            fontWeight: 900, fontSize: 24, color: "#111827",
            letterSpacing: "0.03em", textTransform: "uppercase",
            marginBottom: 2, lineHeight: 1.1,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "TU NOMBRE"}
          </h1>
          {pd.jobTitle && (
            <p style={{ color: accent, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
              {pd.jobTitle}
            </p>
          )}
          <div style={{ height: "1.5px", backgroundColor: accent, width: "100%" }} />
        </div>

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <MainSection id="workExperience" title={label("workExperience")} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "11px", color: "#111827", marginBottom: 1 }}>{job.jobTitle}</p>
                  <p style={{ fontSize: "10px", color: accent, fontWeight: 600, marginBottom: 4 }}>
                    {job.employer}{job.city ? `, ${job.city}` : ""}
                    {job.startDate ? ` — ${job.startDate}` : ""}
                    {job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </p>
                  {job.description && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                      <div className="resume-desc" style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <MainSection id="education" title={label("education")} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "11px", color: "#111827", marginBottom: 1 }}>
                    {edu.degree}{edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ""}
                  </p>
                  <p style={{ fontSize: "10px", color: accent, fontWeight: 600, marginBottom: 4 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    {edu.startDate ? ` — ${edu.startDate}` : ""}
                    {edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </p>
                  {edu.description && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                      <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.65 }}>{edu.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <MainSection id="certifications" title={label("certifications")} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "11px", color: "#111827" }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && (
                      <p style={{ fontSize: "10px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <MainSection id="projects" title={label("projects")} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "11px", color: "#111827", marginBottom: 1 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "10px", color: accent, fontWeight: 600, marginBottom: 4 }}>{proj.role}</p>}
                  {proj.description && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                      <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <MainSection id="volunteer" title={label("volunteer")} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "11px", color: "#111827", marginBottom: 1 }}>{vol.role}</p>
                  <p style={{ fontSize: "10px", color: accent, fontWeight: 600, marginBottom: 4 }}>
                    {vol.organization}{vol.startDate ? ` — ${vol.startDate}` : ""}{vol.endDate ? ` – ${vol.endDate}` : ""}
                  </p>
                  {vol.description && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                      <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.65 }}>{vol.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* References */}
        {visible("references") && references.length > 0 && (
          <MainSection id="references" title={label("references")} accent={accent}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, fontSize: "11px", color: "#111827" }}>{ref.name}</p>
                  {ref.company && <p style={{ fontSize: "10px", color: accent, fontWeight: 600 }}>{ref.company}</p>}
                  {ref.phone   && <p style={{ fontSize: "9.5px", color: "#6b7280" }}>{ref.phone}</p>}
                  {ref.email   && <p style={{ fontSize: "9.5px", color: "#6b7280" }}>{ref.email}</p>}
                </div>
              ))}
            </div>
          </MainSection>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════════════ */

function MainSection({ id, title, accent, children }: {
  id: string; title: string; accent: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "13px", color: "#111827", marginBottom: 5 }}>
          <SectionIcon sectionId={id} color={accent} size={13} strokeWidth={2.25} />
          {title}
        </h2>
        <div style={{ height: "1.5px", backgroundColor: "#d1d5db", width: "100%" }} />
      </div>
      {children}
    </div>
  )
}

function SideSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "0 18px 16px 18px" }}>
      <p style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        color: "#fff", fontWeight: 800, fontSize: "10px",
        letterSpacing: "0.15em", marginBottom: 8, textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 4,
      }}>
        <SectionIcon sectionId={id} color="rgba(255,255,255,0.8)" size={11} strokeWidth={2.25} />
        {title}
      </p>
      {children}
    </div>
  )
}

function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
      <span style={{ color: "rgba(255,255,255,0.75)", flexShrink: 0, paddingTop: 1 }}>{icon}</span>
      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, wordBreak: "break-all" }}>{text}</span>
    </div>
  )
}
