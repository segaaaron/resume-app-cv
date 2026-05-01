"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function HorizontalTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm" }}>
      {/* Full-width top bar with name + contact */}
      <div className="px-10 py-7" style={{ backgroundColor: color }}>
        <div className="flex items-start justify-between">
          <div>
            {fullName && <h1 className="text-3xl font-extrabold text-white tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-white/70 text-xs mt-1 uppercase tracking-widest font-semibold">{pd.jobTitle}</p>}
          </div>
          <div className="text-right space-y-1">
            {pd.email && <p className="text-xs text-white/80 flex items-center justify-end gap-1.5"><Mail className="h-3 w-3 shrink-0" />{pd.email}</p>}
            {pd.phone && <p className="text-xs text-white/80 flex items-center justify-end gap-1.5"><Phone className="h-3 w-3 shrink-0" />{pd.phone}</p>}
            {(pd.city || pd.country) && <p className="text-xs text-white/80 flex items-center justify-end gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{[pd.city, pd.country].filter(Boolean).join(", ")}</p>}
            {pd.website && <p className="text-xs text-white/80 flex items-center justify-end gap-1.5"><Globe className="h-3 w-3 shrink-0" />{pd.website}</p>}
            {pd.linkedin && <p className="text-xs text-white/80 flex items-center justify-end gap-1.5"><Link2 className="h-3 w-3 shrink-0" />{pd.linkedin}</p>}
          </div>
        </div>
      </div>

      {/* Skills ribbon */}
      {visible("skills") && skills.length > 0 && (
        <div className="px-10 py-3 flex flex-wrap gap-2 border-b border-gray-100" style={{ backgroundColor: color + "10" }}>
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: color + "50", color, backgroundColor: color + "0d" }}
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}

      {/* Two column body */}
      <div className="flex px-10 pt-6 pb-8 gap-8">
        {/* Main */}
        <div className="flex-1">
          {visible("summary") && summary && (
            <Section title="Sobre mí" color={color}>
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </Section>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <Section title="Experiencia" color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
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
              </div>
            </Section>
          )}

          {visible("projects") && projects.length > 0 && (
            <Section title={label("projects")} color={color}>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <h4 className="font-semibold text-[13px] text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-xs font-medium" style={{ color }}>{proj.role}</p>}
                    {proj.description && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Side */}
        <div className="w-48 shrink-0">
          {visible("education") && education.length > 0 && (
            <Section title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <h4 className="font-semibold text-xs text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                    <p className="text-[10px] font-medium" style={{ color }}>{edu.institution}</p>
                    <p className="text-[10px] text-gray-400">{edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {visible("languages") && languages.length > 0 && (
            <Section title={label("languages")} color={color}>
              <div className="space-y-1.5">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-800">{lang.name}</span>
                    <span className="text-gray-400 text-[10px]">{lang.level.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <Section title={label("certifications")} color={color}>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id}>
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
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pb-1 border-b resume-section-title" style={{ color, borderColor: color + "40" }}>{title}</h3>
      {children}
    </div>
  )
}
