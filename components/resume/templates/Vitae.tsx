"use client"

/**
 * Vitae — Réplica del template "David Martin" de Freepik.
 *
 * Sidebar navy (#1e2d3d) con foto circular, iconos de contacto circulares,
 * barras de skills/idiomas e íconos de hobbies.
 * Main: nombre partido (firstName en accent, lastName en navy),
 * section headers con banda navy + tab ovalado accent a la derecha.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import {
  Mail, Phone, MapPin, Globe, Link2, GitFork,
  Music, Camera, Palette, Gamepad2, BookOpen, Dumbbell, Plane, Coffee,
} from "lucide-react"

const NAVY = "#1e2d3d"
const HOBBY_ICONS = [Music, Camera, Palette, Gamepad2, BookOpen, Dumbbell, Plane, Coffee]

const SKILL_W: Record<string, string> = {
  beginner: "25%", intermediate: "52%", advanced: "76%", expert: "100%",
}
const LANG_W: Record<string, string> = {
  a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%",
}

export default function VitaeTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, hobbies, volunteer,
  } = sectionData

  const accent  = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials     = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const fullName     = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const nameFontSize = fullName.length > 22 ? "20px" : fullName.length > 16 ? "24px" : "30px"

  const hobbyList = hobbies
    ? hobbies.split(/[,\n]+/).map((h) => h.trim()).filter(Boolean)
    : []

  return (
    <div style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <div style={{
        width: "230px", flexShrink: 0,
        backgroundColor: NAVY,
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingBottom: "28px",
      }}>

        {/* Photo */}
        <div style={{ marginTop: "28px", marginBottom: "16px" }}>
          <div style={{
            width: 112, height: 112,
            borderRadius: "50%",
            border: `4px solid ${accent}`,
            overflow: "hidden",
            backgroundColor: `${accent}22`,
          }}>
            {config.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.photoUrl} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: accent, fontWeight: 800, fontSize: "28px",
              }}>
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Thin accent divider */}
        <div style={{ width: "75%", height: "1px", backgroundColor: `${accent}60`, marginBottom: "20px" }} />

        {/* CONTACT */}
        <SideBlock title={config.language === "en" ? "CONTACT" : "CONTACTO"} accent={accent}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pd.email    && <ContactRow icon={<Mail    size={10} />} text={pd.email}   accent={accent} />}
            {pd.phone    && <ContactRow icon={<Phone   size={10} />} text={pd.phone}   accent={accent} />}
            {(pd.address || pd.city || pd.country) && (
              <ContactRow
                icon={<MapPin size={10} />}
                text={[pd.address, pd.city, pd.country].filter(Boolean).join(", ")}
                accent={accent}
              />
            )}
            {pd.website  && <ContactRow icon={<Globe   size={10} />} text={pd.website}  accent={accent} />}
            {pd.linkedin && <ContactRow icon={<Link2   size={10} />} text={pd.linkedin} accent={accent} />}
            {pd.github   && <ContactRow icon={<GitFork size={10} />} text={pd.github}   accent={accent} />}
          </div>
        </SideBlock>

        {/* SKILLS */}
        {visible("skills") && skills.length > 0 && (
          <SideBlock title={label("skills").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%" }}>
              {skills.map((sk) => (
                <div key={sk.id}>
                  <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "10.5px", marginBottom: "4px" }}>{sk.name}</p>
                  <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.13)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "3px", width: SKILL_W[sk.level] ?? "55%", backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>
        )}

        {/* LANGUAGES */}
        {visible("languages") && languages.length > 0 && (
          <SideBlock title={label("languages").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%" }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "10.5px", marginBottom: "4px" }}>{lang.name}</p>
                  <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.13)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "3px", width: LANG_W[lang.level] ?? "55%", backgroundColor: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>
        )}

        {/* HOBBIES */}
        {visible("hobbies") && hobbyList.length > 0 && (
          <SideBlock title={label("hobbies").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {hobbyList.slice(0, 6).map((_, i) => {
                const Icon = HOBBY_ICONS[i % HOBBY_ICONS.length]
                return (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: `2px solid ${accent}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: accent,
                  }}>
                    <Icon size={13} />
                  </div>
                )
              })}
            </div>
          </SideBlock>
        )}

        {/* CERTIFICATIONS */}
        {visible("certifications") && certifications.length > 0 && (
          <SideBlock title={label("certifications").toUpperCase()} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10.5px", fontWeight: 600, lineHeight: 1.3 }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && (
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "9.5px" }}>
                      {cert.issuer}{cert.date ? ` · ${cert.date}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SideBlock>
        )}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>

        {/* Name + title */}
        <div style={{ padding: "28px 24px 16px 24px", borderBottom: `3px solid ${accent}` }}>
          <div style={{ lineHeight: 1.05, marginBottom: "7px", whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ fontWeight: 900, fontSize: nameFontSize, color: accent, letterSpacing: "0.03em" }}>
              {(pd.firstName ?? "").toUpperCase()}
            </span>
            {pd.firstName && pd.lastName ? " " : ""}
            <span style={{ fontWeight: 900, fontSize: nameFontSize, color: NAVY, letterSpacing: "0.03em" }}>
              {(pd.lastName ?? "").toUpperCase()}
            </span>
          </div>
          {pd.jobTitle && (
            <p style={{ color: "#8a9ab0", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Sections */}
        <div style={{ flex: 1, padding: "14px 24px 24px 24px", display: "flex", flexDirection: "column" }}>

          {visible("summary") && summary && (
            <ContentSection title={config.language === "en" ? "ABOUT ME" : "SOBRE MÍ"} accent={accent}>
              <p style={{ fontSize: "11px", color: "#5a6a7a", lineHeight: 1.75 }}>{summary}</p>
            </ContentSection>
          )}

          {visible("education") && education.length > 0 && (
            <ContentSection title={label("education").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </p>
                      <span style={{ fontSize: "10px", color: "#9aabb8", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color: accent, marginBottom: "2px" }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a6a7a", lineHeight: 1.65 }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </ContentSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <ContentSection title={label("workExperience").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>{job.jobTitle}</p>
                      <span style={{ fontSize: "10px", color: "#9aabb8", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color: accent, marginBottom: "2px" }}>
                      {job.employer}{job.city ? `, ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div
                        style={{ fontSize: "10.5px", color: "#5a6a7a", lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </ContentSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <ContentSection title={label("projects").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>{proj.name}</p>
                    {proj.role && <p style={{ fontSize: "10.5px", fontWeight: 600, color: accent }}>{proj.role}</p>}
                    {proj.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a6a7a", lineHeight: 1.65 }}>{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </ContentSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <ContentSection title={label("volunteer").toUpperCase()} accent={accent}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: NAVY }}>{vol.role}</p>
                      <span style={{ fontSize: "10px", color: "#9aabb8", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color: accent }}>{vol.organization}</p>
                    {vol.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a6a7a", lineHeight: 1.65 }}>{vol.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </ContentSection>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function SideBlock({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", padding: "0 22px 18px 22px" }}>
      <p className="resume-section-title" style={{
        color: accent, fontSize: "11px", fontWeight: 800,
        letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px",
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function ContactRow({ icon, text, accent }: { icon: React.ReactNode; text: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        backgroundColor: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "#fff", marginTop: "1px",
      }}>
        {icon}
      </div>
      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.72)", lineHeight: 1.5, wordBreak: "break-all" }}>
        {text}
      </span>
    </div>
  )
}

function ContentSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div className="resume-section-title" style={{
        position: "relative",
        backgroundColor: NAVY,
        height: "32px",
        display: "flex", alignItems: "center",
        paddingLeft: "14px",
        marginBottom: "10px",
        overflow: "hidden",
        borderRadius: "2px",
      }}>
        <span style={{
          color: "#fff", fontSize: "11px", fontWeight: 800,
          letterSpacing: "0.2em", position: "relative", zIndex: 2, whiteSpace: "nowrap",
        }}>
          {title}
        </span>
        <div style={{
          position: "absolute", right: 0, top: 0,
          height: "32px", width: "70px",
          backgroundColor: accent,
          borderRadius: "50% 0 0 50%",
          zIndex: 1,
        }} />
      </div>
      {children}
    </div>
  )
}
