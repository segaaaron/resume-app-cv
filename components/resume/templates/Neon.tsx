"use client"

/**
 * Neon — Neo-brutalism vibrante para perfiles creativos y tech.
 * Tendencia 2024-2026: bordes gruesos, colores planos, sombras offset.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function NeonTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="p-8 bg-white" style={{ minHeight: "297mm" }}>
      {/* Hero header — neobrutalist */}
      <div
        className="p-7 mb-6 border-4 border-black"
        style={{ backgroundColor: color, boxShadow: "6px 6px 0 #000" }}
      >
        {fullName && <h1 className="text-4xl font-black text-white tracking-tight leading-none">{fullName}</h1>}
        {pd.jobTitle && <p className="text-white/90 font-bold mt-1.5 uppercase tracking-[0.3em] text-[11px]">{pd.jobTitle}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-white/80">
          {pd.email && <span className="font-mono">{pd.email}</span>}
          {pd.phone && <span className="font-mono">{pd.phone}</span>}
          {(pd.city || pd.country) && <span className="font-mono">{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.linkedin && <span className="font-mono">{pd.linkedin}</span>}
          {pd.github && <span className="font-mono">{pd.github}</span>}
          {pd.website && <span className="font-mono">{pd.website}</span>}
        </div>
      </div>

      {visible("summary") && summary && (
        <NeonBlock title="// SOBRE_MÍ" color={color}>
          <p className="text-xs text-gray-800 leading-relaxed">{summary}</p>
        </NeonBlock>
      )}

      {visible("workExperience") && workExperience.length > 0 && (
        <NeonBlock title="// EXPERIENCIA" color={color}>
          <div className="space-y-4">
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry border-l-4 border-black pl-4">
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <h4 className="font-black text-sm uppercase text-gray-900">{job.jobTitle}</h4>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 border-2 border-black font-mono whitespace-nowrap shrink-0"
                    style={{ backgroundColor: color + "30" }}
                  >
                    {job.startDate}{job.currentlyWorking ? " → NOW" : job.endDate ? ` → ${job.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-bold uppercase mt-0.5" style={{ color }}>{job.employer}{job.city ? ` / ${job.city}` : ""}</p>
                {job.description && <div className="resume-desc text-xs text-gray-700 mt-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
              </div>
            ))}
          </div>
        </NeonBlock>
      )}

      {visible("education") && education.length > 0 && (
        <NeonBlock title="// EDUCACIÓN" color={color}>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry border-l-4 pl-4" style={{ borderColor: color }}>
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <h4 className="font-black text-sm uppercase text-gray-900">{edu.degree}</h4>
                  <span className="text-[10px] font-bold font-mono text-gray-500 whitespace-nowrap shrink-0">
                    {edu.startDate}{edu.currentlyStudying ? " → NOW" : edu.endDate ? ` → ${edu.endDate}` : ""}
                  </span>
                </div>
                <p className="text-xs font-bold mt-0.5" style={{ color }}>{edu.institution}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
              </div>
            ))}
          </div>
        </NeonBlock>
      )}

      <div className="grid grid-cols-2 gap-4">
        {visible("skills") && skills.length > 0 && (
          <NeonBlock title="// SKILLS" color={color}>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="text-[10px] font-black uppercase border-2 border-black px-2 py-0.5 font-mono"
                  style={{
                    backgroundColor: skill.level === "expert" || skill.level === "advanced" ? color : "transparent",
                    color: skill.level === "expert" || skill.level === "advanced" ? "white" : "black"
                  }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </NeonBlock>
        )}

        {visible("languages") && languages.length > 0 && (
          <NeonBlock title="// IDIOMAS" color={color}>
            {languages.map((lang) => (
              <div key={lang.id} className="flex justify-between text-xs mb-1.5 border-b border-dashed border-gray-200 pb-1">
                <span className="font-black uppercase text-gray-900">{lang.name}</span>
                <span className="font-mono text-gray-500 text-[10px]">{lang.level.toUpperCase()}</span>
              </div>
            ))}
          </NeonBlock>
        )}
      </div>

      {visible("projects") && projects.length > 0 && (
        <NeonBlock title="// PROYECTOS" color={color}>
          <div className="grid grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="border-2 border-black p-3"
                style={{ boxShadow: `3px 3px 0 ${color}` }}
              >
                <h4 className="font-black text-xs uppercase text-gray-900">{proj.name}</h4>
                {proj.role && <p className="text-[10px] font-bold mt-0.5" style={{ color }}>{proj.role}</p>}
                {proj.description && <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">{proj.description}</p>}
              </div>
            ))}
          </div>
        </NeonBlock>
      )}

      {visible("certifications") && certifications.length > 0 && (
        <NeonBlock title="// CERTIFICACIONES" color={color}>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="border-2 border-black px-3 py-2">
                <p className="text-xs font-black text-gray-900">{cert.name}</p>
                <p className="text-[10px] text-gray-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
              </div>
            ))}
          </div>
        </NeonBlock>
      )}

      {visible("hobbies") && hobbies && (
        <NeonBlock title="// INTERESES" color={color}>
          <p className="text-xs text-gray-700 font-mono">{hobbies}</p>
        </NeonBlock>
      )}
    </div>
  )
}

function NeonBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-black mb-2.5 font-mono resume-section-title" style={{ color }}>{title}</h3>
      {children}
    </div>
  )
}
