"use client"

/**
 * Executive — Diseño premium para perfiles senior/directivos.
 * Tendencia 2024-2026: nombre grande centrado, línea dorada, secciones amplias.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function ExecutiveTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="bg-white px-14 pt-12 pb-10" style={{ minHeight: "297mm" }}>
      {/* Header */}
      <div className="text-center mb-3">
        {fullName && (
          <h1 className="text-[34px] font-light tracking-[0.18em] text-gray-900 uppercase leading-tight">{fullName}</h1>
        )}
        {pd.jobTitle && (
          <p className="text-[11px] tracking-[0.4em] uppercase mt-1.5 font-semibold" style={{ color }}>{pd.jobTitle}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px flex-1" style={{ backgroundColor: color }} />
          <div className="w-2 h-2 rotate-45 shrink-0" style={{ backgroundColor: color }} />
          <div className="h-px flex-1" style={{ backgroundColor: color }} />
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-0.5 text-[10px] text-gray-500 tracking-wide mb-7 mt-3">
        {pd.email && <span>{pd.email}</span>}
        {pd.phone && <span>{pd.phone}</span>}
        {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
        {pd.linkedin && <span>{pd.linkedin}</span>}
        {pd.website && <span>{pd.website}</span>}
        {pd.github && <span>{pd.github}</span>}
      </div>

      {visible("summary") && summary && (
        <div className="mb-7">
          <p className="text-xs text-gray-600 text-center leading-relaxed max-w-xl mx-auto font-light">{summary}</p>
        </div>
      )}

      {/* Body — two columns */}
      <div className="flex gap-10">
        {/* Main */}
        <div className="flex-1">
          {visible("workExperience") && workExperience.length > 0 && (
            <ExecSection title="Trayectoria Profesional" color={color}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry mb-5">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-1.5" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                  {job.description && (
                    <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </ExecSection>
          )}

          {visible("education") && education.length > 0 && (
            <ExecSection title="Formación Académica" color={color}>
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
            </ExecSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <ExecSection title={label("projects")} color={color}>
              {projects.map((proj) => (
                <div key={proj.id} className="mb-3">
                  <h4 className="font-semibold text-[13px] text-gray-900">{proj.name}{proj.role ? ` — ${proj.role}` : ""}</h4>
                  {proj.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{proj.description}</p>}
                </div>
              ))}
            </ExecSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <ExecSection title="Actividad Social" color={color}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="mb-2">
                  <h4 className="font-semibold text-[13px] text-gray-900">{vol.role}</h4>
                  <p className="text-xs font-medium" style={{ color }}>{vol.organization}</p>
                  {vol.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{vol.description}</p>}
                </div>
              ))}
            </ExecSection>
          )}
        </div>

        {/* Side */}
        <div className="w-44 shrink-0">
          {visible("skills") && skills.length > 0 && (
            <ExecSection title="Competencias" color={color}>
              <div className="space-y-1.5">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-700">{skill.name}</span>
                  </div>
                ))}
              </div>
            </ExecSection>
          )}

          {visible("languages") && languages.length > 0 && (
            <ExecSection title={label("languages")} color={color}>
              {languages.map((lang) => (
                <div key={lang.id} className="mb-2">
                  <p className="text-xs font-semibold text-gray-800">{lang.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{lang.level.replace("_", " ")}</p>
                </div>
              ))}
            </ExecSection>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <ExecSection title={label("certifications")} color={color}>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2.5">
                  <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </ExecSection>
          )}
        </div>
      </div>
    </div>
  )
}

function ExecSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 resume-section-title">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">{title}</h3>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="w-5 h-0.5" style={{ backgroundColor: color }} />
      </div>
      {children}
    </div>
  )
}
