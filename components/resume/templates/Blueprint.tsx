"use client"

/**
 * Blueprint — Sidebar navy + main content con headings en azul acero.
 * Inspirado en el diseño clásico de dos columnas con foto circular.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork, Flag } from "lucide-react"

export default function BlueprintTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies, volunteer } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  // Dot level indicator for languages
  const LEVEL_DOTS: Record<string, number> = {
    a1: 1, a2: 2, b1: 3, b2: 3, c1: 4, c2: 5, native: 5,
  }

  return (
    <div data-print-layout="single-column" className="flex" style={{ minHeight: "297mm", fontFamily: "inherit" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col" style={{ width: "195px", backgroundColor: "#fff" }}>

        {/* Header with photo */}
        <div
          className="flex flex-col items-center px-5 pt-8 pb-6 text-center"
          style={{ backgroundColor: color }}
        >
          {/* Photo / initials */}
          <div className="mb-4">
            {config.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.photoUrl}
                alt=""
                className="rounded-full object-cover border-4 border-white/30"
                style={{ width: 88, height: 88, objectPosition: `center ${config.photoPosition ?? 15}%` }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center font-extrabold text-2xl border-4"
                style={{ width: 88, height: 88, borderColor: "rgba(255,255,255,0.3)", color: "#fff", backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {initials}
              </div>
            )}
          </div>

          {fullName && (
            <h1 className="font-extrabold leading-tight text-white text-base">{fullName}</h1>
          )}
          {pd.jobTitle && (
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{pd.jobTitle}</p>
          )}
        </div>

        {/* Sidebar content */}
        <div className="flex-1 px-5 pt-5 pb-6 flex flex-col gap-5" style={{ backgroundColor: "#f8fafc" }}>

          {/* Personal Details */}
          <SideSection title={label("personalDetails")} color={color}>
            <div className="space-y-2">
              {(pd.firstName || pd.lastName) && (
                <SideContact icon={<Flag className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {fullName}
                </SideContact>
              )}
              {pd.email && (
                <SideContact icon={<Mail className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {pd.email}
                </SideContact>
              )}
              {pd.phone && (
                <SideContact icon={<Phone className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {pd.phone}
                </SideContact>
              )}
              {(pd.city || pd.country || pd.address) && (
                <SideContact icon={<MapPin className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {[pd.address, pd.city, pd.country].filter(Boolean).join(", ")}
                </SideContact>
              )}
              {pd.website && (
                <SideContact icon={<Globe className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {pd.website}
                </SideContact>
              )}
              {pd.linkedin && (
                <SideContact icon={<Link2 className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {pd.linkedin}
                </SideContact>
              )}
              {pd.github && (
                <SideContact icon={<GitFork className="h-3 w-3 shrink-0" style={{ color }} />}>
                  {pd.github}
                </SideContact>
              )}
            </div>
          </SideSection>

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <SideSection title={label("skills")} color={color}>
              <ul className="space-y-1.5">
                {skills.map((skill) => (
                  <li key={skill.id} className="text-[11px] text-gray-700 leading-snug">{skill.name}</li>
                ))}
              </ul>
            </SideSection>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <SideSection title={label("languages")} color={color}>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p className="text-[11px] text-gray-700 font-medium mb-0.5">{lang.name}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: 8, height: 8,
                            backgroundColor: i < (LEVEL_DOTS[lang.level] ?? 3) ? color : "#d1d5db",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SideSection>
          )}

          {/* Hobbies */}
          {visible("hobbies") && hobbies && (
            <SideSection title={label("hobbies")} color={color}>
              <p className="text-[11px] text-gray-700 leading-relaxed">{hobbies}</p>
            </SideSection>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 px-8 py-8 flex flex-col gap-0 bg-white">

        {/* Summary */}
        {visible("summary") && summary && (
          <MainSection title={label("summary")} color={color}>
            <p className="text-[12px] text-gray-700 leading-relaxed">{summary}</p>
          </MainSection>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <MainSection title={label("workExperience")} color={color}>
            <div className="space-y-4">
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-[12px] text-gray-900">{job.jobTitle}</h4>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0 font-medium">
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
          </MainSection>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <MainSection title={label("education")} color={color}>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-[12px] text-gray-900">
                      {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    </h4>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0 font-medium">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                  {edu.description && (
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <MainSection title={label("projects")} color={color}>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <h4 className="font-bold text-[12px] text-gray-900">{proj.name}</h4>
                  {proj.description && (
                    <p className="text-[11px] text-gray-600 leading-relaxed">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <MainSection title={label("certifications")} color={color}>
            <div className="space-y-1.5">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline text-[11px] resume-entry">
                  <span className="font-bold text-gray-800">{cert.name}</span>
                  <span className="text-gray-500 shrink-0 ml-2 font-medium">
                    {cert.issuer ? `${cert.issuer}${cert.date ? ` · ${cert.date}` : ""}` : cert.date}
                  </span>
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <MainSection title={label("volunteer")} color={color}>
            <div className="space-y-3">
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-[12px] text-gray-900">{vol.role}</h4>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0">
                      {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color }}>{vol.organization}</p>
                </div>
              ))}
            </div>
          </MainSection>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SideSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color }}>
        {title}
      </h3>
      <div className="mb-2 h-px" style={{ backgroundColor: color + "40" }} />
      {children}
    </div>
  )
}

function SideContact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <span className="text-[10.5px] text-gray-600 leading-snug break-all">{children}</span>
    </div>
  )
}

function MainSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-bold mb-1 resume-section-title" style={{ color }}>{title}</h2>
      <div className="mb-3 h-px bg-gray-200" />
      {children}
    </div>
  )
}
