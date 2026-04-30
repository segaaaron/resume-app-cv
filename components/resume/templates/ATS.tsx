"use client"

/**
 * ATS Pro — Template optimizado para Applicant Tracking Systems.
 * Una sola columna, sin colores de fondo, sin tablas, sin gráficas.
 * Puro texto semántico que los parsers de RRHH pueden leer sin errores.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function ATSTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="px-10 py-9 text-gray-900" style={{ minHeight: "297mm", lineHeight: "1.55" }}>
      {/* Header */}
      <div className="mb-5">
        {fullName && <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{fullName}</h1>}
        {pd.jobTitle && <p className="text-sm font-semibold text-gray-500 mt-0.5">{pd.jobTitle}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-600">
          {pd.email && <span>{pd.email}</span>}
          {pd.phone && <span>| {pd.phone}</span>}
          {(pd.city || pd.country) && <span>| {[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.linkedin && <span>| {pd.linkedin}</span>}
          {pd.github && <span>| {pd.github}</span>}
          {pd.website && <span>| {pd.website}</span>}
        </div>
      </div>

      <div className="h-0.5 mb-5" style={{ background: `linear-gradient(to right, ${color}, ${color}20, transparent)` }} />

      {visible("summary") && summary && (
        <ATSSection title="Resumen Profesional" color={color}>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </ATSSection>
      )}

      {visible("workExperience") && workExperience.length > 0 && (
        <ATSSection title={label("workExperience")} color={color}>
          {workExperience.map((job) => (
            <div key={job.id} className="resume-entry mb-4">
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-sm font-bold text-gray-900">{job.jobTitle}</strong>
                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                  {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                </span>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color }}>{job.employer}{job.city ? `, ${job.city}` : ""}</p>
              {job.description && (
                <div
                  className="resume-desc text-xs text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                />
              )}
            </div>
          ))}
        </ATSSection>
      )}

      {visible("education") && education.length > 0 && (
        <ATSSection title={label("education")} color={color}>
          {education.map((edu) => (
            <div key={edu.id} className="resume-entry mb-3">
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-sm font-bold text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ""}</strong>
                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                  {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
            </div>
          ))}
        </ATSSection>
      )}

      {visible("skills") && skills.length > 0 && (
        <ATSSection title={label("skills")} color={color}>
          <p className="text-sm text-gray-700">{skills.map((s) => s.name).join(" · ")}</p>
        </ATSSection>
      )}

      {visible("languages") && languages.length > 0 && (
        <ATSSection title={label("languages")} color={color}>
          <p className="text-sm text-gray-700">
            {languages.map((l) => `${l.name} (${l.level.toUpperCase()})`).join(" · ")}
          </p>
        </ATSSection>
      )}

      {visible("certifications") && certifications.length > 0 && (
        <ATSSection title={label("certifications")} color={color}>
          {certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between items-baseline text-sm mb-1">
              <strong className="text-gray-900">{cert.name}</strong>
              <span className="text-xs text-gray-500 shrink-0 ml-2">{cert.issuer ? `${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}</span>
            </div>
          ))}
        </ATSSection>
      )}

      {visible("projects") && projects.length > 0 && (
        <ATSSection title={label("projects")} color={color}>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex items-baseline gap-2">
                <strong className="text-sm text-gray-900">{proj.name}</strong>
                {proj.role && <span className="text-xs text-gray-600">— {proj.role}</span>}
              </div>
              {proj.description && <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{proj.description}</p>}
            </div>
          ))}
        </ATSSection>
      )}

      {visible("volunteer") && volunteer.length > 0 && (
        <ATSSection title={label("volunteer")} color={color}>
          {volunteer.map((vol) => (
            <div key={vol.id} className="mb-2">
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-sm text-gray-900">{vol.role} — {vol.organization}</strong>
                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">{vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}</span>
              </div>
              {vol.description && <p className="text-xs text-gray-700 mt-0.5">{vol.description}</p>}
            </div>
          ))}
        </ATSSection>
      )}
    </div>
  )
}

function ATSSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-0.5 border-b-2 resume-section-title" style={{ borderColor: color, color }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
