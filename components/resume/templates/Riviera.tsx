"use client"

/**
 * Riviera — Dark sidebar izquierdo con foto circular, header del contenido
 * principal con nombre partido: nombre en color de acento, apellido en blanco
 * sobre fondo oscuro. Inspirado en el estilo premium tipo Freepik/Vitae.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function RivieraTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  const SKILL_WIDTH: Record<string, string> = {
    beginner: "25%", intermediate: "55%", advanced: "78%", expert: "100%",
  }
  const LANG_WIDTH: Record<string, string> = {
    a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%",
  }

  return (
    <div data-print-layout="sidebar-left" className="flex" style={{ minHeight: "297mm", fontFamily: "inherit", "--pdf-sidebar-bg": "#1a2233", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "188px" } as React.CSSProperties}>

      {/* ── Dark Sidebar ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex flex-col"
        style={{ width: "188px", backgroundColor: "#1a2233" }}
      >
        {/* Photo area */}
        <div className="flex flex-col items-center px-5 pt-8 pb-6 text-center" style={{ borderBottom: `3px solid ${color}` }}>
          <div
            className="rounded-full flex items-center justify-center font-extrabold text-2xl mb-4"
            style={{ width: 90, height: 90, border: `3px solid ${color}`, color, backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
          </div>
        </div>

        {/* Sidebar sections */}
        <div className="flex-1 px-5 pt-5 pb-6 flex flex-col gap-5">

          {/* Contact */}
          <SideBlock title={L.contact} color={color}>
            <div className="space-y-2">
              {pd.email && <ContactRow icon={<Mail className="h-3 w-3 shrink-0" />} text={pd.email} color={color} />}
              {pd.phone && <ContactRow icon={<Phone className="h-3 w-3 shrink-0" />} text={pd.phone} color={color} />}
              {(pd.city || pd.country) && (
                <ContactRow icon={<MapPin className="h-3 w-3 shrink-0" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} color={color} />
              )}
              {pd.website && <ContactRow icon={<Globe className="h-3 w-3 shrink-0" />} text={pd.website} color={color} />}
              {pd.linkedin && <ContactRow icon={<Link2 className="h-3 w-3 shrink-0" />} text={pd.linkedin} color={color} />}
              {pd.github && <ContactRow icon={<GitFork className="h-3 w-3 shrink-0" />} text={pd.github} color={color} />}
            </div>
          </SideBlock>

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <SideBlock title={label("skills")} color={color}>
              <div className="space-y-2.5">
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <p className="text-[10.5px] text-white/80 mb-1">{sk.name}</p>
                    <div className="h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: SKILL_WIDTH[sk.level] ?? "60%", backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </SideBlock>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <SideBlock title={label("languages")} color={color}>
              <div className="space-y-2.5">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p className="text-[10.5px] text-white/80 mb-1">{lang.name}</p>
                    <div className="h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: LANG_WIDTH[lang.level] ?? "60%", backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </SideBlock>
          )}

          {/* Hobbies */}
          {visible("hobbies") && hobbies && (
            <SideBlock title={label("hobbies")} color={color}>
              <p className="text-[10.5px] text-white/65 leading-relaxed">{hobbies}</p>
            </SideBlock>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <SideBlock title={label("certifications")} color={color}>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="text-[10.5px] text-white/85 font-medium leading-snug">{cert.name}</p>
                    {(cert.issuer || cert.date) && (
                      <p className="text-[10px] text-white/45">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                    )}
                  </div>
                ))}
              </div>
            </SideBlock>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "#fff" }}>

        {/* Header: dark band with split-color name */}
        <div className="px-7 pt-7 pb-6" style={{ backgroundColor: "#1a2233" }}>
          <div className="leading-tight mb-1">
            <span className="font-extrabold text-[26px]" style={{ color }}>
              {pd.firstName}
            </span>
            {pd.firstName && pd.lastName && " "}
            <span className="font-extrabold text-[26px] text-white">
              {pd.lastName}
            </span>
          </div>
          {pd.jobTitle && (
            <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-7 pt-6 pb-6 flex flex-col gap-0">

          {visible("summary") && summary && (
            <MainSection title={label("summary")} color={color}>
              <p className="text-[11.5px] text-gray-600 leading-relaxed">{summary}</p>
            </MainSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <MainSection title={label("workExperience")} color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">{job.jobTitle}</h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold mb-1" style={{ color }}>
                      {job.employer}{job.city ? `, ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc text-[11px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {visible("education") && education.length > 0 && (
            <MainSection title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && (
                      <p className="resume-desc text-[11px] text-gray-500 mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(edu.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <MainSection title={label("projects")} color={color}>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <h4 className="font-bold text-[12px] text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-[11px] font-semibold" style={{ color }}>{proj.role}</p>}
                    {proj.description && (
                      <p className="resume-desc text-[11px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <MainSection title={label("volunteer")} color={color}>
              <div className="space-y-3">
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">{vol.role}</h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color }}>{vol.organization}</p>
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}

function SideBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] pb-1 mb-2"
        style={{ color, borderBottom: `1px solid rgba(255,255,255,0.12)` }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function ContactRow({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5" style={{ color }}>{icon}</span>
      <span className="text-[10px] text-white/65 leading-snug break-all">{text}</span>
    </div>
  )
}

function MainSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 resume-section-title">
        <div className="w-4 h-0.5 shrink-0" style={{ backgroundColor: color }} />
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-700">{title}</h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      {children}
    </div>
  )
}
