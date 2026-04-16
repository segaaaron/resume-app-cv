"use client"

/**
 * Outline — Solo bordes, cero rellenos. Ultra-minimalista moderno.
 * Tendencia 2024-2026: diseño "wireframe", elegancia extrema.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"

export default function OutlineTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="bg-white px-12 pt-10 pb-10" style={{ minHeight: "297mm" }}>
      {/* Header — bordered box */}
      <div className="border-2 border-gray-800 p-6 mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            {fullName && (
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{fullName}</h1>
            )}
            {pd.jobTitle && (
              <p className="text-sm mt-1 font-semibold" style={{ color }}>{pd.jobTitle}</p>
            )}
          </div>
          <div className="text-right text-[10px] text-gray-600 space-y-0.5 shrink-0">
            {pd.email && <p>{pd.email}</p>}
            {pd.phone && <p>{pd.phone}</p>}
            {(pd.city || pd.country) && <p>{[pd.city, pd.country].filter(Boolean).join(", ")}</p>}
            {pd.website && <p>{pd.website}</p>}
            {pd.linkedin && <p>{pd.linkedin}</p>}
            {pd.github && <p>{pd.github}</p>}
          </div>
        </div>
      </div>

      {visible("summary") && summary && (
        <div className="border-l-2 pl-4 mb-6" style={{ borderColor: color }}>
          <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Two column */}
      <div className="flex gap-8">
        {/* Main */}
        <div className="flex-1">
          {visible("workExperience") && workExperience.length > 0 && (
            <OutlineSection title="Experiencia" color={color}>
              {workExperience.map((job, i) => (
                <div key={job.id} className={`resume-entry pl-4 border-l border-gray-200 ${i < workExperience.length - 1 ? "mb-4" : ""}`}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-[13px] text-gray-900">{job.jobTitle}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                  {job.description && (
                    <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </OutlineSection>
          )}

          {visible("education") && education.length > 0 && (
            <OutlineSection title={label("education")} color={color}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry pl-4 border-l border-gray-200 mb-3">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
                </div>
              ))}
            </OutlineSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <OutlineSection title={label("projects")} color={color}>
              {projects.map((proj) => (
                <div key={proj.id} className="pl-4 border-l border-gray-200 mb-3">
                  <h4 className="font-bold text-[13px] text-gray-900">{proj.name}</h4>
                  {proj.role && <p className="text-xs font-medium" style={{ color }}>{proj.role}</p>}
                  {proj.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{proj.description}</p>}
                </div>
              ))}
            </OutlineSection>
          )}
        </div>

        {/* Side — outlined boxes */}
        <div className="w-44 shrink-0">
          {visible("skills") && skills.length > 0 && (
            <OutlineSection title={label("skills")} color={color}>
              <div className="border border-gray-200 p-2.5 space-y-1.5">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-800 font-medium">{skill.name}</span>
                    <span className="text-[10px] uppercase tracking-wide" style={{ color }}>
                      {skill.level === "expert" ? "●●●●" : skill.level === "advanced" ? "●●●○" : skill.level === "intermediate" ? "●●○○" : "●○○○"}
                    </span>
                  </div>
                ))}
              </div>
            </OutlineSection>
          )}

          {visible("languages") && languages.length > 0 && (
            <OutlineSection title={label("languages")} color={color}>
              <div className="border border-gray-200 p-2.5 space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p className="text-xs font-bold text-gray-800">{lang.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{lang.level.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            </OutlineSection>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <OutlineSection title={label("certifications")} color={color}>
              <div className="border border-gray-200 p-2.5 space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="text-xs font-bold text-gray-800">{cert.name}</p>
                    <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </OutlineSection>
          )}

          {visible("hobbies") && hobbies && (
            <OutlineSection title="Intereses" color={color}>
              <div className="border border-gray-200 p-2.5">
                <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
              </div>
            </OutlineSection>
          )}
        </div>
      </div>
    </div>
  )
}

function OutlineSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 resume-section-title">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px bg-gray-300" />
      </div>
      {children}
    </div>
  )
}
