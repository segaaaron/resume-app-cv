"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe } from "lucide-react"

export default function ChronoTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="px-10 py-8" style={{ minHeight: "297mm" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-5 border-b-2" style={{ borderColor: color }}>
        <div>
          {fullName && <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{fullName}</h1>}
          {pd.jobTitle && <p className="text-sm mt-1 font-semibold" style={{ color }}>{pd.jobTitle}</p>}
        </div>
        <div className="text-right space-y-1">
          {pd.email && <p className="text-xs text-gray-500 flex items-center justify-end gap-1.5"><Mail className="h-3 w-3 shrink-0" style={{ color }} />{pd.email}</p>}
          {pd.phone && <p className="text-xs text-gray-500 flex items-center justify-end gap-1.5"><Phone className="h-3 w-3 shrink-0" style={{ color }} />{pd.phone}</p>}
          {(pd.city || pd.country) && <p className="text-xs text-gray-500 flex items-center justify-end gap-1.5"><MapPin className="h-3 w-3 shrink-0" style={{ color }} />{[pd.city, pd.country].filter(Boolean).join(", ")}</p>}
          {pd.website && <p className="text-xs text-gray-500 flex items-center justify-end gap-1.5"><Globe className="h-3 w-3 shrink-0" style={{ color }} />{pd.website}</p>}
        </div>
      </div>

      {visible("summary") && summary && (
        <div className="mb-6 pl-4 border-l-2" style={{ borderColor: color + "50" }}>
          <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Timeline: work + education merged chronologically */}
      {((visible("workExperience") && workExperience.length > 0) || (visible("education") && education.length > 0)) ? (
        <Section title="Trayectoria" color={color}>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: color + "35" }} />

            {visible("workExperience") && workExperience.map((job) => (
              <TimelineItem
                key={job.id}
                color={color}
                badge="Trabajo"
                title={job.jobTitle}
                subtitle={job.employer + (job.city ? ` · ${job.city}` : "")}
                date={`${job.startDate}${job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}`}
                description={job.description}
              />
            ))}

            {visible("education") && education.map((edu) => (
              <TimelineItem
                key={edu.id}
                color={color}
                badge="Estudio"
                title={`${edu.degree}${edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}`}
                subtitle={edu.institution + (edu.city ? ` · ${edu.city}` : "")}
                date={`${edu.startDate}${edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}`}
                description={edu.description}
              />
            ))}

            {visible("volunteer") && volunteer.map((vol) => (
              <TimelineItem
                key={vol.id}
                color={color}
                badge="Voluntario"
                title={vol.role}
                subtitle={vol.organization}
                date={`${vol.startDate}${vol.endDate ? ` – ${vol.endDate}` : ""}`}
                description={vol.description}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <div className="grid grid-cols-3 gap-5 mt-4">
        {visible("skills") && skills.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 resume-section-title" style={{ color }}>{label("skills")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill.id} className="text-[10px] text-gray-700 border px-1.5 py-0.5 rounded" style={{ borderColor: color + "40" }}>{skill.name}</span>
              ))}
            </div>
          </div>
        )}

        {visible("languages") && languages.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 resume-section-title" style={{ color }}>{label("languages")}</h3>
            <div className="space-y-1.5">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-800">{lang.name}</span>
                  <span className="text-gray-400 text-[10px] capitalize">{lang.level.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 resume-section-title" style={{ color }}>{label("certifications")}</h3>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({
  color, badge, title, subtitle, date, description
}: {
  color: string
  badge: string
  title: string
  subtitle: string
  date: string
  description?: string
}) {
  return (
    <div className="resume-entry relative mb-5 pl-4">
      {/* Dot */}
      <div
        className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white"
        style={{ borderColor: color }}
      />
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
          style={{ backgroundColor: color + "20", color }}
        >
          {badge}
        </span>
        <span className="text-[10px] text-gray-400">{date}</span>
      </div>
      <h4 className="font-semibold text-[13px] text-gray-900">{title}</h4>
      <p className="text-xs font-medium mb-1" style={{ color }}>{subtitle}</p>
      {description && (
        <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(description) }} />
      )}
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3 resume-section-title">
        <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "30" }} />
      </div>
      {children}
    </div>
  )
}
