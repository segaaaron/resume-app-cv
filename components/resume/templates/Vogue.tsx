"use client"

/**
 * Vogue — Estilo editorial tipo revista. Nombre gigante en la parte superior
 * a toda anchura, foto cuadrada en la esquina superior derecha del header,
 * líneas divisorias finas. Layout de una columna principal con sección lateral
 * flotante de datos de contacto.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function VogueTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  const SKILL_LABEL: Record<string, string> = {
    beginner: "●○○○○", intermediate: "●●●○○", advanced: "●●●●○", expert: "●●●●●",
  }
  const LANG_LABEL: Record<string, string> = {
    elementary: "A1", limited: "A2-B1", professional: "B2", full_professional: "C1", native: "Nativo",
  }

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative px-10 pt-8" style={{ borderBottom: `3px solid ${color}` }}>

        {/* Photo — absolute top-right */}
        <div className="absolute top-0 right-0" style={{ width: 110, height: 110 }}>
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-extrabold text-2xl text-white"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name — big editorial style */}
        <div style={{ paddingRight: "120px" }}>
          {pd.firstName && (
            <p className="font-black leading-none mb-0" style={{ fontSize: "38px", color, letterSpacing: "-0.02em" }}>
              {pd.firstName.toUpperCase()}
            </p>
          )}
          {pd.lastName && (
            <p className="font-black leading-none mb-2" style={{ fontSize: "38px", color: "#111", letterSpacing: "-0.02em" }}>
              {pd.lastName.toUpperCase()}
            </p>
          )}
          {pd.jobTitle && (
            <p className="text-[12px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: "#888" }}>
              {pd.jobTitle}
            </p>
          )}

          {/* Contact row */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-5">
            {pd.email && <MetaItem icon={<Mail className="h-3 w-3" />} text={pd.email} color={color} />}
            {pd.phone && <MetaItem icon={<Phone className="h-3 w-3" />} text={pd.phone} color={color} />}
            {(pd.city || pd.country) && (
              <MetaItem icon={<MapPin className="h-3 w-3" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} color={color} />
            )}
            {pd.linkedin && <MetaItem icon={<Link2 className="h-3 w-3" />} text={pd.linkedin} color={color} />}
            {pd.website && <MetaItem icon={<Globe className="h-3 w-3" />} text={pd.website} color={color} />}
            {pd.github && <MetaItem icon={<GitFork className="h-3 w-3" />} text={pd.github} color={color} />}
          </div>
        </div>
      </div>

      {/* ── Body: two-column ──────────────────────────────────────────────── */}
      <div className="flex">

        {/* Main column */}
        <div className="flex-1 px-10 pt-6 pb-8">

          {visible("summary") && summary && (
            <VogueSection title={label("summary")} color={color}>
              <p className="text-[11.5px] text-gray-600 leading-relaxed italic">{summary}</p>
            </VogueSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <VogueSection title={label("workExperience")} color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12.5px] text-gray-900">{job.jobTitle}</h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0 font-medium">
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold mb-1" style={{ color }}>
                      {job.employer}{job.city ? ` · ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="text-[11px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </VogueSection>
          )}

          {visible("education") && education.length > 0 && (
            <VogueSection title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12.5px] text-gray-900">
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && <p className="text-[11px] text-gray-500 mt-0.5">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </VogueSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <VogueSection title={label("projects")} color={color}>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <h4 className="font-bold text-[12.5px] text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-[11px] font-semibold" style={{ color }}>{proj.role}</p>}
                    {proj.description && <p className="text-[11px] text-gray-600 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </VogueSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <VogueSection title={label("volunteer")} color={color}>
              <div className="space-y-3">
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">{vol.role}</h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color }}>{vol.organization}</p>
                  </div>
                ))}
              </div>
            </VogueSection>
          )}
        </div>

        {/* Side column */}
        <div className="shrink-0 px-6 pt-6 pb-8" style={{ width: "175px", borderLeft: "1px solid #eee" }}>

          {visible("skills") && skills.length > 0 && (
            <VogueSide title={label("skills")} color={color}>
              <div className="space-y-1.5">
                {skills.map((sk) => (
                  <div key={sk.id} className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-gray-700 truncate">{sk.name}</span>
                    <span className="text-[9px] tracking-tight shrink-0" style={{ color }}>{SKILL_LABEL[sk.level] ?? "●●●○○"}</span>
                  </div>
                ))}
              </div>
            </VogueSide>
          )}

          {visible("languages") && languages.length > 0 && (
            <VogueSide title={label("languages")} color={color}>
              <div className="space-y-1.5">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-gray-700">{lang.name}</span>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color }}>{LANG_LABEL[lang.level] ?? "B2"}</span>
                  </div>
                ))}
              </div>
            </VogueSide>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <VogueSide title={label("certifications")} color={color}>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="text-[11px] text-gray-700 font-medium leading-snug">{cert.name}</p>
                    {(cert.issuer || cert.date) && (
                      <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                    )}
                  </div>
                ))}
              </div>
            </VogueSide>
          )}

          {visible("hobbies") && hobbies && (
            <VogueSide title={label("hobbies")} color={color}>
              <p className="text-[11px] text-gray-600 leading-relaxed">{hobbies}</p>
            </VogueSide>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500">
      <span style={{ color }}>{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function VogueSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2.5 resume-section-title">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.35em] whitespace-nowrap" style={{ color }}>{title}</h2>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "40" }} />
      </div>
      {children}
    </div>
  )
}

function VogueSide({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[9.5px] font-extrabold uppercase tracking-[0.3em] mb-1.5 pb-1 resume-section-title" style={{ color, borderBottom: `1px solid ${color}30` }}>{title}</h3>
      {children}
    </div>
  )
}
