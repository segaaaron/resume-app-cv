"use client"

/**
 * Sidebar — Sidebar izquierdo de color sólido con foto circular.
 * Tendencia 2024-2026: contraste fuerte, identidad visual clara.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function SidebarTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div data-print-layout="sidebar-left" className="flex" style={{ minHeight: "297mm", "--pdf-sidebar-bg": color, "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "224px" } as React.CSSProperties}>
      {/* Left sidebar */}
      <div className="w-56 shrink-0 px-6 pt-9 pb-8 flex flex-col gap-5" style={{ backgroundColor: color }}>
        {/* Photo */}
        <div className="flex justify-center">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" style={{ objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/25 flex items-center justify-center text-white font-extrabold text-2xl">
              {initials || "?"}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          {fullName && <h1 className="text-base font-bold text-white leading-tight">{fullName}</h1>}
          {pd.jobTitle && <p className="text-[10px] text-white/65 mt-1 uppercase tracking-widest leading-snug">{pd.jobTitle}</p>}
        </div>

        {/* Contact */}
        <div>
          <SideLabel label={L.contact} />
          <div className="mt-2 space-y-1.5">
            {pd.email && <SideContact icon={<Mail className="h-3 w-3 shrink-0" />} text={pd.email} />}
            {pd.phone && <SideContact icon={<Phone className="h-3 w-3 shrink-0" />} text={pd.phone} />}
            {(pd.city || pd.country) && <SideContact icon={<MapPin className="h-3 w-3 shrink-0" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} />}
            {pd.linkedin && <SideContact icon={<Link2 className="h-3 w-3 shrink-0" />} text={pd.linkedin} />}
            {pd.website && <SideContact icon={<Globe className="h-3 w-3 shrink-0" />} text={pd.website} />}
            {pd.github && <SideContact icon={<GitFork className="h-3 w-3 shrink-0" />} text={pd.github} />}
          </div>
        </div>

        {visible("skills") && skills.length > 0 && (
          <div>
            <SideLabel label={label("skills")} />
            <div className="mt-2 space-y-2.5">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <p className="text-[11px] text-white/90 mb-1">{skill.name}</p>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full" style={{
                      width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("languages") && languages.length > 0 && (
          <div>
            <SideLabel label={label("languages")} />
            <div className="mt-2 space-y-2">
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p className="text-[11px] text-white/90 font-medium">{lang.name}</p>
                  <p className="text-[10px] text-white/55">{lang.level.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div>
            <SideLabel label={label("certifications")} />
            <div className="mt-2 space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-[11px] text-white/90 font-medium">{cert.name}</p>
                  <p className="text-[10px] text-white/55">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("hobbies") && hobbies && (
          <div>
            <SideLabel label={label("hobbies")} />
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">{hobbies}</p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-8 pt-9 pb-8">
        {visible("summary") && summary && (
          <SidebarSection title={label("summary")} color={color}>
            <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
          </SidebarSection>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <SidebarSection title={L.experience} color={color}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry mb-4">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                {job.description && (
                  <div className="resume-desc text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </SidebarSection>
        )}

        {visible("education") && education.length > 0 && (
          <SidebarSection title={label("education")} color={color}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry mb-3">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
              </div>
            ))}
          </SidebarSection>
        )}

        {visible("projects") && projects.length > 0 && (
          <SidebarSection title={label("projects")} color={color}>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <h4 className="font-semibold text-[13px] text-gray-900">{proj.name}</h4>
                {proj.role && <p className="text-xs font-medium" style={{ color }}>{proj.role}</p>}
                {proj.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{proj.description}</p>}
              </div>
            ))}
          </SidebarSection>
        )}
      </div>
    </div>
  )
}

function SideLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 border-b border-white/20 pb-1 resume-section-title">{label}</p>
  )
}

function SideContact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px] text-white/80 break-all">
      <span className="mt-0.5">{icon}</span> {text}
    </div>
  )
}

function SidebarSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 resume-section-title">
        <div className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">{title}</h3>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  )
}
