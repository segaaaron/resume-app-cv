"use client"

/**
 * Nordic — Minimalismo escandinavo.
 * Tendencia 2024-2026: mucho espacio en blanco, tipografía ligera,
 * una sola línea de acento de color, estructura aérea.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function NordicTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="bg-white" style={{ minHeight: "297mm" }}>
      {/* Thin color accent line */}
      <div className="h-[3px] w-full" style={{ backgroundColor: color }} />

      <div className="px-12 pt-10 pb-10">
        {/* Header — very airy */}
        <div className="mb-9">
          {fullName && (
            <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-1.5">{fullName}</h1>
          )}
          {pd.jobTitle && (
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>{pd.jobTitle}</p>
          )}

          {/* Contact line */}
          <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-4 text-xs text-gray-400 font-light">
            {pd.email && <span>{pd.email}</span>}
            {pd.phone && <span>{pd.phone}</span>}
            {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website && <span>{pd.website}</span>}
            {pd.linkedin && <span>{pd.linkedin}</span>}
            {pd.github && <span>{pd.github}</span>}
          </div>
        </div>

        {visible("summary") && summary && (
          <div className="mb-8">
            <p className="text-xs text-gray-600 leading-loose font-light max-w-2xl">{summary}</p>
          </div>
        )}

        {/* Two column lower body */}
        <div className="flex gap-12">
          {/* Main */}
          <div className="flex-1">
            {visible("workExperience") && workExperience.length > 0 && (
              <NordicSection title="Experiencia" color={color}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry mb-6">
                    <div className="flex justify-between items-baseline gap-2 mb-0.5">
                      <h4 className="font-medium text-sm text-gray-900">{job.jobTitle}</h4>
                      <span className="text-xs text-gray-300 font-light whitespace-nowrap shrink-0">
                        {job.startDate}{job.currentlyWorking ? ` — ${present}` : job.endDate ? ` — ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? `, ${job.city}` : ""}</p>
                    {job.description && (
                      <div className="resume-desc text-xs text-gray-500 font-light leading-loose" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </NordicSection>
            )}

            {visible("education") && education.length > 0 && (
              <NordicSection title={label("education")} color={color}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry mb-4">
                    <div className="flex justify-between items-baseline gap-2 mb-0.5">
                      <h4 className="font-medium text-sm text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                      <span className="text-xs text-gray-300 font-light whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` — ${present}` : edu.endDate ? ` — ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
                  </div>
                ))}
              </NordicSection>
            )}

            {visible("projects") && projects.length > 0 && (
              <NordicSection title={label("projects")} color={color}>
                {projects.map((proj) => (
                  <div key={proj.id} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-xs font-medium" style={{ color }}>{proj.role}</p>}
                    {proj.description && <p className="text-xs text-gray-500 font-light mt-0.5 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </NordicSection>
            )}

            {visible("volunteer") && volunteer.length > 0 && (
              <NordicSection title={label("volunteer")} color={color}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="mb-3">
                    <h4 className="font-medium text-sm text-gray-900">{vol.role}</h4>
                    <p className="text-xs font-medium" style={{ color }}>{vol.organization}</p>
                    {vol.description && <p className="text-xs text-gray-500 font-light mt-0.5 leading-relaxed">{vol.description}</p>}
                  </div>
                ))}
              </NordicSection>
            )}
          </div>

          {/* Side — narrow */}
          <div className="w-40 shrink-0">
            {visible("skills") && skills.length > 0 && (
              <NordicSection title={label("skills")} color={color}>
                <div className="space-y-1.5">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-light text-gray-700">{skill.name}</span>
                    </div>
                  ))}
                </div>
              </NordicSection>
            )}

            {visible("languages") && languages.length > 0 && (
              <NordicSection title={label("languages")} color={color}>
                {languages.map((lang) => (
                  <div key={lang.id} className="mb-2">
                    <p className="text-xs font-medium text-gray-800">{lang.name}</p>
                    <p className="text-[10px] font-light text-gray-400">{lang.level.toUpperCase()}</p>
                  </div>
                ))}
              </NordicSection>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <NordicSection title={label("certifications")} color={color}>
                {certifications.map((cert) => (
                  <div key={cert.id} className="mb-2.5">
                    <p className="text-xs font-medium text-gray-800">{cert.name}</p>
                    <p className="text-[10px] font-light text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                  </div>
                ))}
              </NordicSection>
            )}

            {visible("hobbies") && hobbies && (
              <NordicSection title="Intereses" color={color}>
                <p className="text-xs font-light text-gray-500 leading-relaxed">{hobbies}</p>
              </NordicSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NordicSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-3.5 resume-section-title">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">{title}</span>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "40" }} />
      </div>
      {children}
    </div>
  )
}
