"use client"

/**
 * Sharp — Ángulos pronunciados, sidebar con corte diagonal.
 * Tendencia 2024-2026: diseños geométricos y asimétricos.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function SharpTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm" }}>
      {/* Angled header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-6 px-10 pt-8 pb-14">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="" className="w-20 h-20 object-cover border-4 border-white/30 shrink-0" style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          ) : (
            <div className="w-20 h-20 bg-white/20 border-4 border-white/30 flex items-center justify-center shrink-0 text-white font-black text-2xl" style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)", objectPosition: `center ${config.photoPosition ?? 15}%` }}>
              {initials || "?"}
            </div>
          )}
          <div>
            {fullName && <h1 className="text-3xl font-black text-white tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-white/80 font-medium mt-0.5 uppercase tracking-widest text-xs">{pd.jobTitle}</p>}
          </div>
        </div>
        {/* Diagonal cut */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ clipPath: "polygon(0 100%, 100% 0%, 100% 100%)" }} />
      </div>

      {/* Contact bar */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-10 pt-3 pb-4 text-xs text-gray-500 border-b border-gray-100">
        {pd.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" style={{ color }} />{pd.email}</span>}
        {pd.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" style={{ color }} />{pd.phone}</span>}
        {(pd.city || pd.country) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color }} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
        {pd.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" style={{ color }} />{pd.website}</span>}
        {pd.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" style={{ color }} />{pd.linkedin}</span>}
      </div>

      <div className="flex px-10 pt-5 pb-8 gap-7">
        {/* Main */}
        <div className="flex-1">
          {visible("summary") && summary && (
            <SharpSection title="Perfil" color={color}>
              <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            </SharpSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <SharpSection title="Experiencia" color={color}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{job.jobTitle}</h4>
                      <p className="text-xs font-medium" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 mt-0.5 font-mono">
                      {job.startDate}{job.currentlyWorking ? "→NOW" : job.endDate ? `→${job.endDate}` : ""}
                    </span>
                  </div>
                  {job.description && <div className="resume-desc text-xs text-gray-600 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                </div>
              ))}
            </SharpSection>
          )}

          {visible("education") && education.length > 0 && (
            <SharpSection title={label("education")} color={color}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{edu.degree}</h4>
                      <p className="text-xs" style={{ color }}>{edu.institution}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 font-mono">
                      {edu.startDate}{edu.currentlyStudying ? "→NOW" : edu.endDate ? `→${edu.endDate}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </SharpSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <SharpSection title={label("projects")} color={color}>
              {projects.map((proj) => (
                <div key={proj.id} className="mb-3">
                  <h4 className="font-bold text-sm">{proj.name}</h4>
                  {proj.role && <p className="text-xs" style={{ color }}>{proj.role}</p>}
                  {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
                </div>
              ))}
            </SharpSection>
          )}
        </div>

        {/* Side */}
        <div className="w-44 shrink-0">
          {visible("skills") && skills.length > 0 && (
            <SharpSection title="Skills" color={color}>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <p className="text-xs font-medium mb-0.5">{skill.name}</p>
                    <div className="h-1.5 bg-gray-100 overflow-hidden" style={{ clipPath: "polygon(0 0, 100% 0, 97% 100%, 3% 100%)" }}>
                      <div className="h-full" style={{
                        backgroundColor: color,
                        width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </SharpSection>
          )}

          {visible("languages") && languages.length > 0 && (
            <SharpSection title={label("languages")} color={color}>
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-gray-400 text-[10px]">{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </SharpSection>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <SharpSection title="Certs" color={color}>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <p className="text-xs font-semibold">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </SharpSection>
          )}
        </div>
      </div>
    </div>
  )
}

function SharpSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-1" style={{ backgroundColor: color }} />
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
