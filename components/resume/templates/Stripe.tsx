"use client"

/**
 * Stripe — Header completo con foto a la derecha y nombre a la izquierda
 * sobre un fondo de color de acento. Contenido en dos columnas debajo.
 * Inspirado en los diseños modernos de Canva/Enhancv con banda de color.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function StripeTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies, volunteer, references } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  const SKILL_WIDTH: Record<string, string> = {
    beginner: "25%", intermediate: "55%", advanced: "78%", expert: "100%",
  }

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ── Full-width Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-9 py-7"
        style={{ backgroundColor: color, minHeight: "120px" }}
      >
        {/* Left: name + title + contact chips */}
        <div className="flex-1 pr-6">
          {fullName && (
            <h1 className="font-extrabold text-white leading-tight mb-1" style={{ fontSize: "26px" }}>
              {fullName}
            </h1>
          )}
          {pd.jobTitle && (
            <p className="text-white/75 font-medium text-[12px] uppercase tracking-widest mb-3">{pd.jobTitle}</p>
          )}
          {/* Inline contact chips */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {pd.email && <HeaderContact icon={<Mail className="h-3 w-3" />} text={pd.email} />}
            {pd.phone && <HeaderContact icon={<Phone className="h-3 w-3" />} text={pd.phone} />}
            {(pd.city || pd.country) && (
              <HeaderContact icon={<MapPin className="h-3 w-3" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} />
            )}
            {pd.linkedin && <HeaderContact icon={<Link2 className="h-3 w-3" />} text={pd.linkedin} />}
            {pd.website && <HeaderContact icon={<Globe className="h-3 w-3" />} text={pd.website} />}
            {pd.github && <HeaderContact icon={<GitFork className="h-3 w-3" />} text={pd.github} />}
          </div>
        </div>

        {/* Right: photo */}
        <div className="shrink-0">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.photoUrl}
              alt=""
              className="object-cover"
              style={{ width: 88, height: 88, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.4)", objectPosition: `center ${config.photoPosition ?? 15}%` }}
            />
          ) : (
            <div
              className="flex items-center justify-center font-extrabold text-2xl"
              style={{
                width: 88, height: 88, borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.4)",
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="flex">

        {/* Left column: sidebar content */}
        <div className="shrink-0 px-6 pt-6 pb-8" style={{ width: "195px", borderRight: "1px solid #f0f0f0" }}>

          {visible("skills") && skills.length > 0 && (
            <SideSection title={label("skills")} color={color}>
              <div className="space-y-2.5">
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <p className="text-[11px] text-gray-700 mb-1">{sk.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: SKILL_WIDTH[sk.level] ?? "60%", backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </SideSection>
          )}

          {visible("languages") && languages.length > 0 && (
            <SideSection title={label("languages")} color={color}>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-700">{lang.name}</span>
                    <span className="text-[10px] text-gray-400">{lang.level.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </SideSection>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <SideSection title={label("certifications")} color={color}>
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
            </SideSection>
          )}

          {visible("hobbies") && hobbies && (
            <SideSection title={label("hobbies")} color={color}>
              <p className="text-[11px] text-gray-600 leading-relaxed">{hobbies}</p>
            </SideSection>
          )}

          {visible("references") && references.length > 0 && (
            <SideSection title={label("references")} color={color}>
              <div className="space-y-2">
                {references.map((ref) => (
                  <div key={ref.id}>
                    <p className="text-[11px] text-gray-700 font-semibold">{ref.name}</p>
                    {ref.company && <p className="text-[10px] text-gray-500">{ref.company}</p>}
                    {ref.email && <p className="text-[10px] text-gray-400">{ref.email}</p>}
                  </div>
                ))}
              </div>
            </SideSection>
          )}
        </div>

        {/* Right column: main content */}
        <div className="flex-1 px-7 pt-6 pb-8">

          {visible("summary") && summary && (
            <MainSection title={label("summary")} color={color}>
              <p className="text-[11.5px] text-gray-600 leading-relaxed">{summary}</p>
            </MainSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <MainSection title={label("workExperience")} color={color}>
              <div className="space-y-4">
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry pl-3" style={{ borderLeft: `2px solid ${color}20` }}>
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
            </MainSection>
          )}

          {visible("education") && education.length > 0 && (
            <MainSection title={label("education")} color={color}>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry pl-3" style={{ borderLeft: `2px solid ${color}20` }}>
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
                    {edu.description && (
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <MainSection title={label("projects")} color={color}>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry pl-3" style={{ borderLeft: `2px solid ${color}20` }}>
                    <h4 className="font-bold text-[12px] text-gray-900">{proj.name}</h4>
                    {proj.role && <p className="text-[11px] font-semibold" style={{ color }}>{proj.role}</p>}
                    {proj.description && <p className="text-[11px] text-gray-600 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <MainSection title={label("volunteer")} color={color}>
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
                    {vol.description && <p className="text-[11px] text-gray-600 leading-relaxed">{vol.description}</p>}
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}

function HeaderContact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1 text-white/75 text-[10px]">
      {icon}
      <span className="leading-tight">{text}</span>
    </div>
  )
}

function SideSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2 resume-section-title" style={{ color }}>{title}</h3>
      <div className="mb-2 h-px" style={{ backgroundColor: color + "30" }} />
      {children}
    </div>
  )
}

function MainSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 resume-section-title">
        <h2 className="text-[12px] font-extrabold uppercase tracking-[0.15em]" style={{ color }}>{title}</h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      {children}
    </div>
  )
}
