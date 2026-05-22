"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

export default function SimpleTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div data-print-layout="single-column" className="p-10" style={{ minHeight: "297mm", lineHeight: config.spacing * 1.5 }}>
      {/* Minimal header */}
      <div className="mb-7">
        {fullName && <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{fullName}</h1>}
        {pd.jobTitle && <p className="text-sm text-gray-500">{pd.jobTitle}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-400">
          {pd.email && <span>{pd.email}</span>}
          {pd.phone && <span>· {pd.phone}</span>}
          {(pd.city || pd.country) && <span>· {[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website && <span>· {pd.website}</span>}
          {pd.linkedin && <span>· {pd.linkedin}</span>}
          {pd.github && <span>· {pd.github}</span>}
        </div>
      </div>

      {visible("summary") && summary && (
        <Block title="Resumen" color={color}>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </Block>
      )}

      {visible("workExperience") && workExperience.length > 0 && (
        <Block title="Experiencia" color={color}>
          <div className="space-y-4">
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm text-gray-900">{job.jobTitle}</span>
                  <span className="text-xs text-gray-400">
                    {job.startDate}{job.currentlyWorking ? `–${present}` : job.endDate ? `–${job.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                {job.description && (
                  <div className="resume-desc text-xs text-gray-600 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {visible("education") && education.length > 0 && (
        <Block title={label("education")} color={color}>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</span>
                  <span className="text-xs text-gray-400">
                    {edu.startDate}{edu.currentlyStudying ? `–${present}` : edu.endDate ? `–${edu.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {visible("projects") && projects.length > 0 && (
        <Block title={label("projects")} color={color}>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm text-gray-900">{proj.name}</span>
                  {(proj.startDate || proj.endDate) && <span className="text-xs text-gray-400">{proj.startDate}{proj.endDate ? `–${proj.endDate}` : ""}</span>}
                </div>
                {proj.role && <p className="text-xs text-gray-500">{proj.role}</p>}
                {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
              </div>
            ))}
          </div>
        </Block>
      )}

      <div className="grid grid-cols-2 gap-6">
        {visible("skills") && skills.length > 0 && (
          <Block title={label("skills")} color={color}>
            <p className="text-xs text-gray-700 leading-relaxed">
              {skills.map((s) => s.name).join(" · ")}
            </p>
          </Block>
        )}
        {visible("languages") && languages.length > 0 && (
          <Block title={label("languages")} color={color}>
            <p className="text-xs text-gray-700 leading-relaxed">
              {languages.map((l) => `${l.name} (${l.level.toUpperCase()})`).join(" · ")}
            </p>
          </Block>
        )}
      </div>

      {visible("certifications") && certifications.length > 0 && (
        <Block title={label("certifications")} color={color}>
          <div className="space-y-1">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">{cert.name}</span>
                <span className="text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {visible("hobbies") && hobbies && (
        <Block title="Intereses" color={color}>
          <p className="text-xs text-gray-600">{hobbies}</p>
        </Block>
      )}
    </div>
  )
}

function Block({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}
