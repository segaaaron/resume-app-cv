"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function MetroTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div style={{ minHeight: "297mm" }}>
      {/* Header tile */}
      <div className="flex" style={{ borderBottom: `4px solid ${color}` }}>
        {/* Color block */}
        <div className="w-5 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 px-8 py-7 bg-gray-900 text-white">
          {fullName && <h1 className="text-3xl font-black uppercase tracking-wide text-white">{fullName}</h1>}
          {pd.jobTitle && <p className="text-sm font-light mt-1 text-gray-300 tracking-wide">{pd.jobTitle}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4">
            {pd.email && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Mail className="h-3 w-3" />{pd.email}</span>}
            {pd.phone && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Phone className="h-3 w-3" />{pd.phone}</span>}
            {(pd.city || pd.country) && <span className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin className="h-3 w-3" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Globe className="h-3 w-3" />{pd.website}</span>}
            {pd.linkedin && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Link2 className="h-3 w-3" />{pd.linkedin}</span>}
          </div>
        </div>
      </div>

      {/* Skills tiles row */}
      {visible("skills") && skills.length > 0 && (
        <div className="flex flex-wrap border-b border-gray-200" style={{ backgroundColor: color + "08" }}>
          {skills.map((skill, i) => (
            <div
              key={skill.id}
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider border-r border-gray-200"
              style={{ color: i % 3 === 0 ? color : i % 3 === 1 ? "#374151" : "#9ca3af" }}
            >
              {skill.name}
            </div>
          ))}
        </div>
      )}

      {/* Two column body */}
      <div className="flex">
        {/* Main */}
        <div className="flex-1 px-8 pt-6 pb-8 border-r border-gray-200">
          {visible("summary") && summary && (
            <Section title="Resumen" color={color}>
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </Section>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <Section title="Experiencia" color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-black text-sm uppercase tracking-wide text-gray-900">{job.jobTitle}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-semibold mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                    {job.description && (
                      <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {visible("education") && education.length > 0 && (
            <Section title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-sm text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color }}>{edu.institution}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Side */}
        <div className="w-52 shrink-0 px-6 pt-6 pb-8">
          {visible("languages") && languages.length > 0 && (
            <Section title={label("languages")} color={color}>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p className="text-xs font-semibold text-gray-800">{lang.name}</p>
                    <p className="text-[10px] text-gray-500">{lang.level.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <Section title={label("certifications")} color={color}>
              <div className="space-y-2.5">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                    <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-black uppercase tracking-widest mb-2.5 pb-1 border-b-2 resume-section-title" style={{ color, borderColor: color }}>{title}</h3>
      {children}
    </div>
  )
}
