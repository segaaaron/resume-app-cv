"use client"

/**
 * Prism ⭐ — Réplica fiel del estilo "David Martin" (Freepik):
 * Versión corregida con todos los ajustes de UI/UX aplicados.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import {
  Mail, Phone, MapPin, Globe, Link2, GitFork,
  Music, Camera, Palette, Gamepad2, BookOpen, Dumbbell, Plane, Coffee,
} from "lucide-react"

const DARK = "#1b2a3b"

const SKILL_W: Record<string, string> = {
  beginner: "22%", intermediate: "50%", advanced: "75%", expert: "100%",
}
const LANG_W: Record<string, string> = {
  a1: "17%", a2: "33%", b1: "50%",
  b2: "67%", c1: "83%", c2: "100%", native: "100%",
}
const HOBBY_ICONS = [Music, Camera, Palette, Gamepad2, BookOpen, Dumbbell, Plane, Coffee]

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function PrismTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, hobbies, volunteer, references,
  } = sectionData

  const accent  = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials  = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const hobbyList = hobbies ? hobbies.split(/[,\n]+/).map((h) => h.trim()).filter(Boolean) : []

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": "#1b2a3b", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "238px" } as React.CSSProperties}>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR — 238px, solo foto / contacto / skills / idiomas / hobbies
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: "238px", flexShrink: 0,
        backgroundColor: DARK,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Foto circular — 96×96, sin SVG punteado exterior ── */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 32, paddingBottom: 22 }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            border: `4px solid ${accent}`,
            backgroundColor: `${accent}20`,
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: accent, fontWeight: 900, fontSize: 28 }}>{initials || "N"}</span>
          </div>
        </div>

        {/* ── CONTACTO ── */}
        <SideBlock title={config.language === "en" ? "CONTACT" : "CONTACT"} accent={accent}>
          {pd.email    && <ContactRow icon={<Mail size={12} />} text={pd.email}   accent={accent} />}
          {pd.phone    && <ContactRow icon={<Phone size={12} />} text={pd.phone}   accent={accent} />}
          {(pd.address || pd.city || pd.country) && (
            <ContactRow
              icon={<MapPin size={12} />}
              text={[pd.address, pd.city, pd.country].filter(Boolean).join(", ")}
              accent={accent}
            />
          )}
          {pd.website  && <ContactRow icon={<Globe size={12} />}   text={pd.website}  accent={accent} />}
          {pd.linkedin && <ContactRow icon={<Link2 size={12} />}   text={pd.linkedin} accent={accent} />}
          {pd.github   && <ContactRow icon={<GitFork size={12} />} text={pd.github}   accent={accent} />}
        </SideBlock>

        {/* ── SKILLS ── */}
        {visible("skills") && skills.length > 0 && (
          <SideBlock title={label("skills").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%" }}>
              {skills.map((sk) => (
                <div key={sk.id}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10.5px", marginBottom: 4 }}>{sk.name}</p>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: SKILL_W[sk.level] ?? "55%", backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>
        )}

        {/* ── LANGUAGES ── */}
        {visible("languages") && languages.length > 0 && (
          <SideBlock title={label("languages").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%" }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10.5px", marginBottom: 4 }}>{lang.name}</p>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: LANG_W[lang.level] ?? "55%", backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>
        )}

        {/* ── CERTIFICATIONS ── */}
        {visible("certifications") && certifications.length > 0 && (
          <SideBlock title={label("certifications").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10.5px", fontWeight: 600, lineHeight: 1.3 }}>
                    {cert.name}
                  </p>
                  {(cert.issuer || cert.date) && (
                    <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "9.5px" }}>
                      {cert.issuer}{cert.date ? ` · ${cert.date}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SideBlock>
        )}

        {/* ── HOBBIES — iconos circulares 38×38 al final ── */}
        {visible("hobbies") && hobbyList.length > 0 && (
          <SideBlock title={label("hobbies").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {hobbyList.slice(0, 6).map((_, i) => {
                const Icon = HOBBY_ICONS[i % HOBBY_ICONS.length]
                return (
                  <div key={i} style={{
                    width: 38, height: 38, borderRadius: "50%",
                    backgroundColor: accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}>
                    <Icon size={16} />
                  </div>
                )
              })}
            </div>
          </SideBlock>
        )}

        {/* ── SVG curva decorativa base del sidebar — olas más pronunciadas ── */}
        <div style={{ marginTop: "auto" }}>
          <svg
            width="238" height="64"
            viewBox="0 0 230 64"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <path
              d="M 0,36 Q 57,8 115,28 Q 173,48 230,18 L 230,64 L 0,64 Z"
              fill={accent} opacity="0.28"
            />
            <path
              d="M 0,48 Q 57,22 115,40 Q 173,58 230,32 L 230,64 L 0,64 Z"
              fill={accent} opacity="0.55"
            />
          </svg>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>

        {/* ── HEADER: nombre en dos líneas + título + arcos SVG ── */}
        <div style={{ position: "relative", padding: "36px 28px 0 28px", overflow: "hidden" }}>

          {/* Nombre en dos líneas separadas */}
          <div style={{ lineHeight: 1.0, marginBottom: 4, position: "relative" }}>
            <div style={{ fontWeight: 900, fontSize: 38, color: accent, letterSpacing: "0.02em" }}>
              {(pd.firstName ?? "").toUpperCase()}
            </div>
            <div style={{ fontWeight: 900, fontSize: 38, color: DARK, letterSpacing: "0.02em" }}>
              {(pd.lastName ?? "").toUpperCase()}
            </div>
          </div>

          {/* Cargo / job title */}
          {pd.jobTitle && (
            <p style={{
              color: "#9aabb8",
              fontSize: "9.5px",
              fontWeight: 600,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}>
              {pd.jobTitle}
            </p>
          )}

          {/* ── SVG dos arcos decorativos — height 28, viewBox 560×28 ── */}
          <svg
            width="100%" height="28"
            viewBox="0 0 560 28"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", marginBottom: 20 }}
          >
            {/* Arco superior — más claro */}
            <path
              d="M 0,8 Q 280,0 560,6"
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.35"
            />
            {/* Arco inferior — sólido */}
            <path
              d="M 0,18 Q 280,10 560,16"
              fill="none"
              stroke={accent}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── SECCIONES ── sin padding horizontal para que las bandas lleguen a los bordes ── */}
        <div style={{ flex: 1, paddingBottom: 28 }}>

          {visible("summary") && summary && (
            <PrismSection
              title={config.language === "en" ? "ABOUT ME" : "SOBRE MÍ"}
              accent={accent}
            >
              <p style={{ fontSize: "10.5px", color: "#4a5568", lineHeight: 1.78 }}>{summary}</p>
            </PrismSection>
          )}

          {visible("education") && education.length > 0 && (
            <PrismSection title={label("education").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry" style={{ display: "flex", gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 72, paddingTop: 1 }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <div style={{ width: 1, backgroundColor: `${accent}40`, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "11px", fontWeight: 800, color: DARK, marginBottom: 1, letterSpacing: "0.02em" }}>
                        {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                      </p>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: accent, marginBottom: 3 }}>
                        {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                      </p>
                      {edu.description && (
                        <p style={{ fontSize: "10px", color: "#6a7588", lineHeight: 1.65 }}>{edu.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrismSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <PrismSection title={label("workExperience").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry" style={{ display: "flex", gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 72, paddingTop: 1 }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <div style={{ width: 1, backgroundColor: `${accent}40`, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "11px", fontWeight: 800, color: DARK, marginBottom: 1, letterSpacing: "0.02em" }}>
                        {job.jobTitle}
                      </p>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: accent, marginBottom: 3 }}>
                        {job.employer}{job.city ? `, ${job.city}` : ""}
                      </p>
                      {job.description && (
                        <div className="resume-desc"
                          style={{ fontSize: "10px", color: "#6a7588", lineHeight: 1.65 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrismSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <PrismSection title={label("projects").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry" style={{ display: "flex", gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 72, paddingTop: 1 }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
                        {[proj.startDate, proj.endDate].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    <div style={{ width: 1, backgroundColor: `${accent}40`, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "11px", fontWeight: 800, color: DARK, marginBottom: 1, letterSpacing: "0.02em" }}>
                        {proj.name}
                      </p>
                      {proj.role && (
                        <p style={{ fontSize: "10px", fontWeight: 600, color: accent, marginBottom: 3 }}>{proj.role}</p>
                      )}
                      {proj.description && (
                        <p style={{ fontSize: "10px", color: "#6a7588", lineHeight: 1.65 }}>{proj.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrismSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <PrismSection title={label("volunteer").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry" style={{ display: "flex", gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 72, paddingTop: 1 }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <div style={{ width: 1, backgroundColor: `${accent}40`, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "11px", fontWeight: 800, color: DARK, marginBottom: 1, letterSpacing: "0.02em" }}>
                        {vol.role}
                      </p>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: accent, marginBottom: 3 }}>{vol.organization}</p>
                      {vol.description && (
                        <p style={{ fontSize: "10px", color: "#6a7588", lineHeight: 1.65 }}>{vol.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrismSection>
          )}

          {visible("references") && references && references.length > 0 && (
            <PrismSection title={label("references").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {references.map((ref) => (
                  <div key={ref.id} style={{ minWidth: 130 }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: DARK }}>{ref.name}</p>
                    {ref.company && <p style={{ fontSize: "10px", fontWeight: 600, color: accent }}>{ref.company}</p>}
                    {ref.phone   && <p style={{ fontSize: "9.5px", color: "#6a7588" }}>{ref.phone}</p>}
                    {ref.email   && <p style={{ fontSize: "9.5px", color: "#6a7588" }}>{ref.email}</p>}
                  </div>
                ))}
              </div>
            </PrismSection>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════════════ */

/**
 * PrismSection — Banda 36px + tab teal 140px con bezier curvo.
 * SVG viewBox "0 0 140 36", path M 44,0 C 10,0 10,36 44,36 L 140,36 L 140,0 Z
 */
function PrismSection({ title, accent, children }: {
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Banda de sección — borde a borde (sin padding lateral) */}
      <div
        className="resume-section-title"
        style={{ position: "relative", height: 36, marginBottom: 12, overflow: "hidden" }}
      >
        {/* Fondo oscuro completo */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: DARK }} />

        {/* Texto del título — padding izquierdo de 26px para alinearse con el contenido */}
        <span style={{
          position: "absolute",
          left: 26, top: "50%", transform: "translateY(-50%)",
          color: "#fff",
          fontSize: "11.5px",
          fontWeight: 800,
          letterSpacing: "0.15em",
          zIndex: 2,
          whiteSpace: "nowrap",
        }}>
          {title}
        </span>

        {/* Tab curvo teal — ancho 140px, viewBox 140×36 */}
        <svg
          style={{ position: "absolute", right: 0, top: 0, height: "36px", width: "140px" }}
          viewBox="0 0 140 36"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 44,0 C 10,0 10,36 44,36 L 140,36 L 140,0 Z" fill={accent} />
        </svg>
      </div>

      <div style={{ padding: "0 26px" }}>
        {children}
      </div>
    </div>
  )
}

function SideBlock({ title, accent, children }: {
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <div style={{ width: "100%", padding: "0 20px 18px 20px" }}>
      <p
        className="resume-section-title"
        style={{
          color: accent,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 4,
          textAlign: "center",
        }}
      >
        {title}
      </p>
      {/* Línea decorativa bajo el título de sección del sidebar */}
      <div style={{ width: 30, height: 2, backgroundColor: accent, margin: "4px auto 10px" }} />
      {children}
    </div>
  )
}

function ContactRow({ icon, text, accent }: {
  icon: React.ReactNode
  text: string
  accent: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 9 }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        backgroundColor: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "#fff",
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: "10px",
        color: "rgba(255,255,255,0.90)",
        lineHeight: 1.5,
        wordBreak: "break-all",
        paddingTop: "4px",
      }}>
        {text}
      </span>
    </div>
  )
}
