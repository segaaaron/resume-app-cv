"use client"

/**
 * Carbon — Dark mode resume. Fondo oscuro, texto claro.
 * Tendencia 2024-2026: dark-theme en CVs para perfiles tech/diseño.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, GitFork, Link2 } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function CarbonTemplate() {
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
    <div data-print-layout="sidebar-left" className="flex" style={{ minHeight: "297mm", backgroundColor: "#111827", "--pdf-sidebar-bg": "#0f172a", "--pdf-main-bg": "#111827", "--pdf-sidebar-width": "208px" } as React.CSSProperties}>
      {/* Left sidebar — dark */}
      <div className="w-52 shrink-0 px-5 pt-8 pb-8 flex flex-col gap-5" style={{ backgroundColor: "#0f172a" }}>
        {/* Avatar */}
        <div className="flex justify-center">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: color, objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-xl border-2" style={{ borderColor: color, color, backgroundColor: color + "20" }}>
              {initials || "?"}
            </div>
          )}
        </div>

        {fullName && (
          <div className="text-center">
            <h1 className="text-sm font-bold text-white leading-tight">{fullName}</h1>
            {pd.jobTitle && <p className="text-[10px] uppercase tracking-widest mt-1 font-semibold" style={{ color }}>{pd.jobTitle}</p>}
          </div>
        )}

        {/* Contact */}
        <div>
          <CarbonSideLabel label={L.contact} color={color} />
          <div className="mt-2 space-y-1.5">
            {pd.email && <CarbonContact icon={<Mail className="h-3 w-3 shrink-0" />} text={pd.email} />}
            {pd.phone && <CarbonContact icon={<Phone className="h-3 w-3 shrink-0" />} text={pd.phone} />}
            {(pd.city || pd.country) && <CarbonContact icon={<MapPin className="h-3 w-3 shrink-0" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} />}
            {pd.linkedin && <CarbonContact icon={<Link2 className="h-3 w-3 shrink-0" />} text={pd.linkedin} />}
            {pd.website && <CarbonContact icon={<Globe className="h-3 w-3 shrink-0" />} text={pd.website} />}
            {pd.github && <CarbonContact icon={<GitFork className="h-3 w-3 shrink-0" />} text={pd.github} />}
          </div>
        </div>

        {visible("skills") && skills.length > 0 && (
          <div>
            <CarbonSideLabel label={label("skills")} color={color} />
            <div className="mt-2 space-y-2.5">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <p className="text-[11px] text-gray-300 mb-1">{skill.name}</p>
                  <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      backgroundColor: color,
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
            <CarbonSideLabel label={label("languages")} color={color} />
            <div className="mt-2 space-y-2">
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p className="text-[11px] text-gray-300 font-semibold">{lang.name}</p>
                  <p className="text-[10px] text-gray-500">{lang.level.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div>
            <CarbonSideLabel label={label("certifications")} color={color} />
            <div className="mt-2 space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-[11px] text-gray-300 font-semibold">{cert.name}</p>
                  <p className="text-[10px] text-gray-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("hobbies") && hobbies && (
          <div>
            <CarbonSideLabel label={label("hobbies")} color={color} />
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{hobbies}</p>
          </div>
        )}
      </div>

      {/* Main content — dark */}
      <div className="flex-1 px-7 pt-8 pb-8">
        {visible("summary") && summary && (
          <div className="mb-5 pb-5 border-b border-gray-700">
            <p className="text-sm text-gray-400 leading-relaxed">{summary}</p>
          </div>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <CarbonSection title={L.experience} color={color}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry mb-4">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="font-bold text-sm text-white">{job.jobTitle}</h4>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0 font-mono">
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                {job.description && (
                  <div className="resume-desc text-xs text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </CarbonSection>
        )}

        {visible("education") && education.length > 0 && (
          <CarbonSection title={label("education")} color={color}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry mb-3">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="font-bold text-sm text-white">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0 font-mono">
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-semibold" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
              </div>
            ))}
          </CarbonSection>
        )}

        {visible("projects") && projects.length > 0 && (
          <CarbonSection title={label("projects")} color={color}>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <h4 className="font-bold text-sm text-white">{proj.name}</h4>
                {proj.role && <p className="text-xs font-semibold" style={{ color }}>{proj.role}</p>}
                {proj.description && <p className="resume-desc text-xs text-gray-400 mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
              </div>
            ))}
          </CarbonSection>
        )}
      </div>
    </div>
  )
}

function CarbonContact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px] text-gray-400 break-all">
      <span className="mt-0.5">{icon}</span> {text}
    </div>
  )
}

function CarbonSideLabel({ label, color }: { label: string; color: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.25em] border-b pb-1 resume-section-title" style={{ color, borderColor: color + "40" }}>{label}</p>
  )
}

function CarbonSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3 resume-section-title">
        <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px bg-gray-700" />
      </div>
      {children}
    </div>
  )
}
