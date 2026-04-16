"use client"

/**
 * Bauhaus — Inspirado en el diseño gráfico Bauhaus: geometría, bloques de color, tipografía bold.
 * Tendencia 2024-2026: diseño con carácter, identidad visual fuerte.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"

export default function BauhausTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="bg-white" style={{ minHeight: "297mm" }}>
      {/* Header — Bauhaus block */}
      <div className="flex">
        {/* Color rectangle */}
        <div className="w-20 shrink-0" style={{ backgroundColor: color }} />
        {/* Name block */}
        <div className="flex-1 px-8 pt-8 pb-7 bg-gray-900">
          {fullName && (
            <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none">{fullName}</h1>
          )}
          {pd.jobTitle && (
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] mt-2" style={{ color }}>{pd.jobTitle}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-3 text-[10px] text-gray-400">
            {pd.email && <span>{pd.email}</span>}
            {pd.phone && <span>{pd.phone}</span>}
            {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.linkedin && <span>{pd.linkedin}</span>}
            {pd.website && <span>{pd.website}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Left accent column */}
        <div className="w-20 shrink-0 relative">
          <div className="absolute top-0 bottom-0 left-0 w-2" style={{ backgroundColor: color }} />
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pt-6 pb-8">
          {visible("summary") && summary && (
            <div className="mb-6 pb-5 border-b-2 border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            </div>
          )}

          <div className="flex gap-8">
            {/* Main */}
            <div className="flex-1">
              {visible("workExperience") && workExperience.length > 0 && (
                <BauhausSection title="Experiencia" color={color}>
                  {workExperience.map((job) => (
                    <div key={job.id} className="resume-entry mb-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 mt-1 shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="font-black text-sm text-gray-900 uppercase tracking-wide">{job.jobTitle}</h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 font-mono">
                              {job.startDate}{job.currentlyWorking ? ` → ${present}` : job.endDate ? ` → ${job.endDate}` : ""}
                            </span>
                          </div>
                          <p className="text-xs font-bold mb-1" style={{ color }}>{job.employer}{job.city ? ` / ${job.city}` : ""}</p>
                          {job.description && (
                            <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </BauhausSection>
              )}

              {visible("education") && education.length > 0 && (
                <BauhausSection title={label("education")} color={color}>
                  {education.map((edu) => (
                    <div key={edu.id} className="resume-entry mb-3 flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 mt-1 shrink-0 border-2" style={{ borderColor: color }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="font-black text-sm uppercase tracking-wide text-gray-900">{edu.degree}</h4>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 font-mono">
                            {edu.startDate}{edu.currentlyStudying ? ` → ${present}` : edu.endDate ? ` → ${edu.endDate}` : ""}
                          </span>
                        </div>
                        <p className="text-xs font-bold" style={{ color }}>{edu.institution}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </BauhausSection>
              )}

              {visible("projects") && projects.length > 0 && (
                <BauhausSection title={label("projects")} color={color}>
                  {projects.map((proj) => (
                    <div key={proj.id} className="mb-3 flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 mt-1 shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <h4 className="font-black text-sm uppercase text-gray-900">{proj.name}</h4>
                        {proj.role && <p className="text-xs font-bold" style={{ color }}>{proj.role}</p>}
                        {proj.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{proj.description}</p>}
                      </div>
                    </div>
                  ))}
                </BauhausSection>
              )}
            </div>

            {/* Side */}
            <div className="w-40 shrink-0">
              {visible("skills") && skills.length > 0 && (
                <BauhausSection title="Skills" color={color}>
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-2">
                        <div className="w-2 h-0.5" style={{ backgroundColor: color }} />
                        <span className="text-xs text-gray-800">{skill.name}</span>
                      </div>
                    ))}
                  </div>
                </BauhausSection>
              )}

              {visible("languages") && languages.length > 0 && (
                <BauhausSection title={label("languages")} color={color}>
                  {languages.map((lang) => (
                    <div key={lang.id} className="mb-2">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-800">{lang.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{lang.level.replace("_", " ")}</p>
                    </div>
                  ))}
                </BauhausSection>
              )}

              {visible("certifications") && certifications.length > 0 && (
                <BauhausSection title="Certs" color={color}>
                  {certifications.map((cert) => (
                    <div key={cert.id} className="mb-2.5">
                      <p className="text-xs font-black uppercase text-gray-800">{cert.name}</p>
                      <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                    </div>
                  ))}
                </BauhausSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BauhausSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 mb-3 resume-section-title">
        <div className="w-5 h-0.5" style={{ backgroundColor: color }} />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}
