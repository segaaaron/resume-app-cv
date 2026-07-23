"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

export default function ElegantTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div data-print-layout="single-column" className="px-12 py-10" style={{ minHeight: "297mm" }}>
      {/* Header — centered, elegant */}
      <div className="text-center mb-8">
        {fullName && (
          <h1 className="text-4xl font-bold tracking-[0.12em] mb-1.5 uppercase text-gray-900">
            {fullName}
          </h1>
        )}
        {pd.jobTitle && (
          <p className="text-xs tracking-[0.35em] uppercase font-semibold mb-4" style={{ color }}>{pd.jobTitle}</p>
        )}

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-16" style={{ backgroundColor: color }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: color }} />
          <div className="h-px w-16" style={{ backgroundColor: color }} />
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-0.5 text-xs text-gray-500">
          {pd.email && <span>{pd.email}</span>}
          {pd.phone && <span>{pd.phone}</span>}
          {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website && <span>{pd.website}</span>}
          {pd.linkedin && <span>{pd.linkedin}</span>}
        </div>
      </div>

      {visible("summary") && summary && (
        <Section id="summary" title="Perfil" color={color}>
          <p className="text-xs text-gray-600 leading-relaxed text-center italic max-w-xl mx-auto">{summary}</p>
        </Section>
      )}

      {visible("workExperience") && workExperience.length > 0 && (
        <Section id="workExperience" title="Experiencia" color={color}>
          <div className="space-y-5">
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry flex gap-6">
                <div className="w-24 shrink-0 text-right pt-0.5">
                  <span className="text-[10px] text-gray-400 leading-relaxed">
                    {job.startDate}{job.currentlyWorking ? ` –
${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <div className="flex-1 border-l pl-5" style={{ borderColor: color + "35" }}>
                  <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                  <p className="text-xs font-medium mb-1.5" style={{ color }}>{job.employer}{job.city ? `, ${job.city}` : ""}</p>
                  {job.description && (
                    <div className="resume-desc text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {visible("education") && education.length > 0 && (
        <Section id="education" title={label("education")} color={color}>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry flex gap-6">
                <div className="w-24 shrink-0 text-right pt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <div className="flex-1 border-l pl-5" style={{ borderColor: color + "35" }}>
                  <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                  <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-8 mt-2">
        {visible("skills") && skills.length > 0 && (
          <Section id="skills" title={label("skills")} color={color}>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill.id} className="text-[10px] font-medium px-2.5 py-1 border" style={{ borderColor: color + "50", color }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </Section>
        )}
        {visible("languages") && languages.length > 0 && (
          <Section id="languages" title={label("languages")} color={color}>
            <div className="space-y-1.5">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-800">{lang.name}</span>
                  <span className="text-gray-400">{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {visible("certifications") && certifications.length > 0 && (
        <Section id="certifications" title={label("certifications")} color={color}>
          <div className="space-y-1.5">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline text-xs">
                <span className="font-semibold text-gray-800">{cert.name}</span>
                <span className="text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {visible("hobbies") && hobbies && (
        <Section id="hobbies" title="Intereses" color={color}>
          <p className="text-xs text-gray-600 italic leading-relaxed">{hobbies}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ id, title, color, children }: { id: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5 mb-4 resume-section-title">
        <SectionIcon sectionId={id} color={color} size={12} strokeWidth={2} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">{title}</h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      {children}
    </div>
  )
}
