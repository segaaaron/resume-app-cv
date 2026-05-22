"use client"

/**
 * Coral — Header con foto circular centrada y nombre debajo, contenido en
 * dos columnas con acento lateral de color en cada sección.
 * Inspirado en templates tipo CVapp/Mi CV Ideal.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function CoralTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies, volunteer, references } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  const DOTS: Record<string, number> = {
    beginner: 1, intermediate: 2, advanced: 3, expert: 4,
  }
  const LANG_DOTS: Record<string, number> = {
    a1: 1, a2: 2, b1: 3, b2: 3, c1: 4, c2: 5, native: 5,
  }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ── Header band ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center px-8 pt-7 pb-5 text-center"
        style={{ backgroundColor: color }}
      >
        {/* Photo */}
        <div className="mb-3">
          <div
              className="rounded-full flex items-center justify-center font-extrabold text-2xl text-white"
              style={{ width: 84, height: 84, border: "3px solid rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
            </div>
        </div>

        {fullName && (
          <h1 className="font-extrabold text-white text-[22px] leading-tight tracking-tight">{fullName}</h1>
        )}
        {pd.jobTitle && (
          <p className="text-white/70 text-[11px] font-medium uppercase tracking-widest mt-1">{pd.jobTitle}</p>
        )}

        {/* Contact row */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3">
          {pd.email && <CoralContact icon={<Mail className="h-3 w-3" />} text={pd.email} />}
          {pd.phone && <CoralContact icon={<Phone className="h-3 w-3" />} text={pd.phone} />}
          {(pd.city || pd.country) && (
            <CoralContact icon={<MapPin className="h-3 w-3" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} />
          )}
          {pd.linkedin && <CoralContact icon={<Link2 className="h-3 w-3" />} text={pd.linkedin} />}
          {pd.website && <CoralContact icon={<Globe className="h-3 w-3" />} text={pd.website} />}
          {pd.github && <CoralContact icon={<GitFork className="h-3 w-3" />} text={pd.github} />}
        </div>
      </div>

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="flex">

        {/* Main column */}
        <div className="flex-1 px-7 pt-6 pb-8">

          {visible("summary") && summary && (
            <CoralSection title={label("summary")} color={color}>
              <p className="text-[11.5px] text-gray-600 leading-relaxed">{summary}</p>
            </CoralSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <CoralSection title={label("workExperience")} color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">{job.jobTitle}</h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold mb-1" style={{ color }}>
                      {job.employer}{job.city ? `, ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc text-[11px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </CoralSection>
          )}

          {visible("education") && education.length > 0 && (
            <CoralSection title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-bold text-[12px] text-gray-900">
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </h4>
                      <span className="text-[10.5px] text-gray-400 whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </CoralSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <CoralSection title={label("projects")} color={color}>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <h4 className="font-bold text-[12px] text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-[11px] font-semibold" style={{ color }}>{proj.role}</p>}
                    {proj.description && <p className="text-[11px] text-gray-600 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </CoralSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <CoralSection title={label("volunteer")} color={color}>
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
            </CoralSection>
          )}
        </div>

        {/* Side column */}
        <div className="shrink-0 px-5 pt-6 pb-8" style={{ width: "185px", borderLeft: `2px solid ${color}20` }}>

          {visible("skills") && skills.length > 0 && (
            <CoralSide title={label("skills")} color={color}>
              <div className="space-y-2">
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <p className="text-[11px] text-gray-700 mb-1">{sk.name}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className="rounded-sm flex-1 h-1.5"
                          style={{ backgroundColor: i < (DOTS[sk.level] ?? 2) ? color : "#e5e7eb" }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CoralSide>
          )}

          {visible("languages") && languages.length > 0 && (
            <CoralSide title={label("languages")} color={color}>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p className="text-[11px] text-gray-700 mb-1">{lang.name}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{ width: 8, height: 8, backgroundColor: i < (LANG_DOTS[lang.level] ?? 3) ? color : "#e5e7eb" }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CoralSide>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <CoralSide title={label("certifications")} color={color}>
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
            </CoralSide>
          )}

          {visible("hobbies") && hobbies && (
            <CoralSide title={label("hobbies")} color={color}>
              <p className="text-[11px] text-gray-600 leading-relaxed">{hobbies}</p>
            </CoralSide>
          )}

          {visible("references") && references.length > 0 && (
            <CoralSide title={label("references")} color={color}>
              <div className="space-y-2">
                {references.map((ref) => (
                  <div key={ref.id}>
                    <p className="text-[11px] text-gray-700 font-semibold">{ref.name}</p>
                    {ref.company && <p className="text-[10px] text-gray-500">{ref.company}</p>}
                    {ref.email && <p className="text-[10px] text-gray-400">{ref.email}</p>}
                  </div>
                ))}
              </div>
            </CoralSide>
          )}
        </div>
      </div>
    </div>
  )
}

function CoralContact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/75 text-[10.5px]">
      {icon}
      <span>{text}</span>
    </div>
  )
}

function CoralSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 pl-3" style={{ borderLeft: `3px solid ${color}` }}>
      <h2 className="text-[12px] font-extrabold uppercase tracking-[0.15em] mb-2 resume-section-title" style={{ color }}>{title}</h2>
      {children}
    </div>
  )
}

function CoralSide({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3
        className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2 pb-1 resume-section-title"
        style={{ color, borderBottom: `2px solid ${color}` }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
