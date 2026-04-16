"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function ClassicTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const spacing = config.spacing

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="px-10 py-8" style={{ lineHeight: spacing * 1.5 }}>
      {/* Header */}
      <div className="mb-6">
        {fullName && (
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">{fullName}</h1>
        )}
        {pd.jobTitle && (
          <p className="text-base font-medium text-gray-500 mb-3">{pd.jobTitle}</p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          {pd.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0" style={{ color }} /> {pd.email}
            </span>
          )}
          {pd.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" style={{ color }} /> {pd.phone}
            </span>
          )}
          {(pd.city || pd.country) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" style={{ color }} /> {[pd.city, pd.country].filter(Boolean).join(", ")}
            </span>
          )}
          {pd.website && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 shrink-0" style={{ color }} /> {pd.website}
            </span>
          )}
          {pd.linkedin && (
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 shrink-0" style={{ color }} /> {pd.linkedin}
            </span>
          )}
          {pd.github && (
            <span className="flex items-center gap-1.5">
              <GitFork className="h-3 w-3 shrink-0" style={{ color }} /> {pd.github}
            </span>
          )}
        </div>

        {/* Decorative rule */}
        <div className="mt-4 h-0.5 w-full" style={{ background: `linear-gradient(to right, ${color}, ${color}30, transparent)` }} />
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <Section title={label("summary")} color={color}>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </Section>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Section title={label("workExperience")} color={color}>
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
                  <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <Section title={label("education")} color={color}>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-medium mb-1" style={{ color }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
                {edu.description && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <Section title={label("skills")} color={color}>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="text-[11px] font-medium px-3 py-1 rounded-full border"
                style={{ borderColor: color + "60", color, backgroundColor: color + "0d" }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <Section title={label("languages")} color={color}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {languages.map((lang) => (
              <div key={lang.id} className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-800">{lang.name}</span>
                <span className="text-[10px] text-gray-400 capitalize">{lang.level.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <Section title={label("certifications")} color={color}>
          <div className="space-y-1.5">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline text-xs">
                <span className="font-semibold text-gray-800">{cert.name}</span>
                <span className="text-gray-400 shrink-0 ml-2">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hobbies */}
      {visible("hobbies") && hobbies && (
        <Section title={label("hobbies")} color={color}>
          <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3 resume-section-title">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "25" }} />
      </div>
      {children}
    </div>
  )
}
