"use client"

/**
 * Spark — Header con degradado diagonal, tipografía impactante, badges de skills.
 * Tendencia 2024-2026: diseño dinámico, energético, para perfiles tech y creativos.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function SparkTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const rgb = color.startsWith("#") ? hexToRgb(color) : { r: 42, g: 114, b: 215 }
  const darker = `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`

  return (
    <div className="bg-white" style={{ minHeight: "297mm" }}>
      {/* Diagonal gradient header */}
      <div
        className="relative px-10 pt-8 pb-8 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${darker} 0%, ${color} 60%, ${color}cc 100%)` }}
      >
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10 bg-white" />
        <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full opacity-10 bg-white" />

        <div className="relative">
          {fullName && (
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">{fullName}</h1>
          )}
          {pd.jobTitle && (
            <p className="text-sm font-semibold text-white/80 mt-1.5 uppercase tracking-widest">{pd.jobTitle}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-[10px] text-white/70">
            {pd.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{pd.email}</span>}
            {pd.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{pd.phone}</span>}
            {(pd.city || pd.country) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{pd.website}</span>}
            {pd.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{pd.linkedin}</span>}
            {pd.github && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{pd.github}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-0">
        {/* Main */}
        <div className="flex-1 px-8 pt-6 pb-8">
          {visible("summary") && summary && (
            <div className="mb-5 pb-5 border-b border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
            </div>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <SparkSection title="Experiencia" color={color}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry mb-4 relative pl-4">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm text-gray-900">{job.jobTitle}</h4>
                    <span className="text-[10px] text-gray-400 ml-3 shrink-0">
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                  {job.description && (
                    <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </SparkSection>
          )}

          {visible("education") && education.length > 0 && (
            <SparkSection title={label("education")} color={color}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry mb-3 relative pl-4">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 border-2 rounded-full" style={{ borderColor: color }} />
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                    <span className="text-[10px] text-gray-400 ml-3 shrink-0">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
                </div>
              ))}
            </SparkSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <SparkSection title={label("projects")} color={color}>
              {projects.map((proj) => (
                <div key={proj.id} className="mb-3 relative pl-4">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <h4 className="font-bold text-sm">{proj.name}</h4>
                  {proj.role && <p className="text-xs font-semibold" style={{ color }}>{proj.role}</p>}
                  {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
                </div>
              ))}
            </SparkSection>
          )}
        </div>

        {/* Side */}
        <div className="w-48 shrink-0 px-5 pt-6 pb-8 bg-gray-50 border-l border-gray-100">
          {visible("skills") && skills.length > 0 && (
            <SparkSection title="Skills" color={color}>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ borderColor: color + "60", color }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </SparkSection>
          )}

          {visible("languages") && languages.length > 0 && (
            <SparkSection title={label("languages")} color={color}>
              {languages.map((lang) => (
                <div key={lang.id} className="mb-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-800">{lang.name}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      backgroundColor: color,
                      width: lang.level === "native" ? "100%" : lang.level === "full_professional" ? "85%" : lang.level === "professional" ? "70%" : lang.level === "limited" ? "50%" : "30%"
                    }} />
                  </div>
                </div>
              ))}
            </SparkSection>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <SparkSection title={label("certifications")} color={color}>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2.5">
                  <p className="text-xs font-bold text-gray-800">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </SparkSection>
          )}

          {visible("hobbies") && hobbies && (
            <SparkSection title="Intereses" color={color}>
              <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
            </SparkSection>
          )}
        </div>
      </div>
    </div>
  )
}

function SparkSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  )
}
