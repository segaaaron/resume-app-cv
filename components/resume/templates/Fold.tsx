"use client"

/**
 * Fold — Diseño "plegado" con secciones separadas por bandas de color claro.
 * Tendencia 2024-2026: visual "modular", cada bloque es una tarjeta independiente.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function FoldTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }
  const rgb = color.startsWith("#") ? hexToRgb(color) : "42, 114, 215"

  return (
    <div data-print-layout="single-column" className="bg-white" style={{ minHeight: "297mm" }}>
      {/* Header band */}
      <div className="px-10 pt-8 pb-6" style={{ backgroundColor: `rgba(${rgb}, 0.07)`, borderBottom: `3px solid rgba(${rgb}, 0.2)` }}>
        <div className="flex items-end justify-between">
          <div>
            {fullName && <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-sm mt-0.5 font-semibold" style={{ color }}>{pd.jobTitle}</p>}
          </div>
          <div className="text-right text-[10px] text-gray-500 space-y-0.5">
            {pd.email && <p>{pd.email}</p>}
            {pd.phone && <p>{pd.phone}</p>}
            {(pd.city || pd.country) && <p>{[pd.city, pd.country].filter(Boolean).join(", ")}</p>}
            {pd.linkedin && <p>{pd.linkedin}</p>}
          </div>
        </div>
      </div>

      {/* Summary band */}
      {visible("summary") && summary && (
        <div className="px-10 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Main + Side layout */}
      <div className="flex">
        {/* Main */}
        <div className="flex-1">
          {visible("workExperience") && workExperience.length > 0 && (
            <FoldBlock title="Experiencia" color={color} rgb={rgb}>
              {workExperience.map((job, i) => (
                <div key={job.id} className={`resume-entry ${i < workExperience.length - 1 ? "mb-4 pb-4 border-b border-gray-100" : ""}`}>
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
            </FoldBlock>
          )}

          {visible("education") && education.length > 0 && (
            <FoldBlock title={label("education")} color={color} rgb={rgb}>
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
            </FoldBlock>
          )}

          {visible("projects") && projects.length > 0 && (
            <FoldBlock title={label("projects")} color={color} rgb={rgb}>
              {projects.map((proj) => (
                <div key={proj.id} className="mb-3">
                  <h4 className="font-semibold text-[13px] text-gray-900">{proj.name}</h4>
                  {proj.role && <p className="text-xs font-medium" style={{ color }}>{proj.role}</p>}
                  {proj.description && <p className="resume-desc text-xs text-gray-600 mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                </div>
              ))}
            </FoldBlock>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <FoldBlock title={label("volunteer")} color={color} rgb={rgb}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="mb-2">
                  <h4 className="font-semibold text-[13px] text-gray-900">{vol.role}</h4>
                  <p className="text-xs font-medium" style={{ color }}>{vol.organization}</p>
                  {vol.description && <p className="resume-desc text-xs text-gray-600 mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />}
                </div>
              ))}
            </FoldBlock>
          )}
        </div>

        {/* Side */}
        <div className="w-48 shrink-0 border-l border-gray-100">
          {visible("skills") && skills.length > 0 && (
            <FoldBlock title={label("skills")} color={color} rgb={rgb}>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <p className="text-xs font-medium text-gray-800 mb-1">{skill.name}</p>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        backgroundColor: color,
                        width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </FoldBlock>
          )}

          {visible("languages") && languages.length > 0 && (
            <FoldBlock title={label("languages")} color={color} rgb={rgb}>
              {languages.map((lang) => (
                <div key={lang.id} className="mb-2">
                  <p className="text-xs font-semibold text-gray-800">{lang.name}</p>
                  <p className="text-[10px] text-gray-400">{lang.level.toUpperCase()}</p>
                </div>
              ))}
            </FoldBlock>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <FoldBlock title={label("certifications")} color={color} rgb={rgb}>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2.5">
                  <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </FoldBlock>
          )}

          {visible("hobbies") && hobbies && (
            <FoldBlock title="Intereses" color={color} rgb={rgb}>
              <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
            </FoldBlock>
          )}
        </div>
      </div>
    </div>
  )
}

function FoldBlock({ title, color, rgb, children }: { title: string; color: string; rgb: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-6 py-2 resume-section-title" style={{ backgroundColor: `rgba(${rgb}, 0.07)` }}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color }}>{title}</h3>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}
