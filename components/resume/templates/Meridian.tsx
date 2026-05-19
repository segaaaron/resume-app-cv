"use client"

/**
 * Meridian — Premium editorial/financial report style CV.
 * Two-column with dark sidebar (configurable color), gold accents,
 * Playfair Display for headings, Inter for body.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

const GOLD = "#C9A06A"
const CREAM = "#FDFCF8"

export default function MeridianTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd,
    summary,
    workExperience,
    education,
    skills,
    languages,
    certifications,
    projects,
    hobbies,
  } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  const serif = "'Playfair Display', serif"
  const sans = "'Inter', sans-serif"

  return (
    <div
      data-print-layout="sidebar-left"
      className="flex"
      style={{
        minHeight: "297mm",
        fontFamily: sans,
        backgroundColor: CREAM,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        "--pdf-sidebar-bg": color,
        "--pdf-main-bg": "#FDFCF8",
        "--pdf-sidebar-width": "224px",
      } as React.CSSProperties}
    >
      {/* Left sidebar */}
      <div
        className="w-56 shrink-0 px-6 pt-9 pb-8 flex flex-col gap-5"
        style={{
          backgroundColor: color,
          color: "white",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Photo */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.10)",
              border: `2px solid ${GOLD}`,
              fontFamily: serif,
            }}
          >
            {initials || "N"}
          </div>
        </div>

        {/* Name + job title */}
        <div className="text-center">
          {fullName && (
            <h1
              className="text-lg leading-tight text-white"
              style={{ fontFamily: serif, fontWeight: 600, letterSpacing: "0.02em" }}
            >
              {fullName}
            </h1>
          )}
          {pd.jobTitle && (
            <p
              className="text-[9px] mt-2 uppercase tracking-[0.28em] leading-snug"
              style={{ color: GOLD }}
            >
              {pd.jobTitle}
            </p>
          )}
          {/* Gold divider */}
          <div
            className="mx-auto mt-3"
            style={{ width: "28px", height: "2px", backgroundColor: GOLD }}
          />
        </div>

        {/* Contact */}
        {(pd.email || pd.phone || pd.city || pd.country || pd.linkedin || pd.website || pd.github) && (
          <div>
            <SideTitle>{L.contact}</SideTitle>
            <div className="mt-2 space-y-1.5">
              {pd.email && <SideContact icon={<Mail className="h-3 w-3 shrink-0" />} text={pd.email} />}
              {pd.phone && <SideContact icon={<Phone className="h-3 w-3 shrink-0" />} text={pd.phone} />}
              {(pd.city || pd.country) && (
                <SideContact
                  icon={<MapPin className="h-3 w-3 shrink-0" />}
                  text={[pd.city, pd.country].filter(Boolean).join(", ")}
                />
              )}
              {pd.linkedin && <SideContact icon={<Link2 className="h-3 w-3 shrink-0" />} text={pd.linkedin} />}
              {pd.website && <SideContact icon={<Globe className="h-3 w-3 shrink-0" />} text={pd.website} />}
              {pd.github && <SideContact icon={<GitFork className="h-3 w-3 shrink-0" />} text={pd.github} />}
            </div>
          </div>
        )}

        {/* Skills — editorial clean text list, no bars */}
        {visible("skills") && skills.length > 0 && (
          <div>
            <SideTitle>{label("skills")}</SideTitle>
            <ul className="mt-2 space-y-1">
              {skills.map((skill) => (
                <li
                  key={skill.id}
                  className="text-[10.5px] leading-snug"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div>
            <SideTitle>{label("languages")}</SideTitle>
            <div className="mt-2 space-y-1.5">
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p
                    className="text-[10.5px] font-medium"
                    style={{ color: "rgba(255,255,255,0.92)", fontFamily: serif }}
                  >
                    {lang.name}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {lang.level}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <div>
            <SideTitle>{label("certifications")}</SideTitle>
            <div className="mt-2 space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p
                    className="text-[10.5px] font-medium leading-snug"
                    style={{ color: "rgba(255,255,255,0.92)", fontFamily: serif }}
                  >
                    {cert.name}
                  </p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {cert.issuer}
                    {cert.date ? ` · ${cert.date}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {visible("hobbies") && hobbies && (
          <div>
            <SideTitle>{label("hobbies")}</SideTitle>
            <p
              className="text-[10.5px] mt-2 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              {hobbies}
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-9 pt-10 pb-8" style={{ backgroundColor: CREAM }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <Section title={label("summary")} color={color}>
            <p
              className="text-[11px] leading-relaxed text-gray-700"
              style={{ fontFamily: serif, fontStyle: "italic" }}
            >
              {summary}
            </p>
          </Section>
        )}

        {/* Work experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <Section title={label("workExperience")} color={color}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry mb-5">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <h3
                    className="font-semibold text-[12.5px] text-gray-900 leading-snug"
                    style={{ fontFamily: serif }}
                  >
                    {job.jobTitle}
                  </h3>
                  <span className="text-[9.5px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5 uppercase tracking-wider">
                    {job.startDate}
                    {job.currentlyWorking
                      ? ` – ${present}`
                      : job.endDate
                        ? ` – ${job.endDate}`
                        : ""}
                  </span>
                </div>
                <p className="text-[10.5px] font-medium mb-1.5 italic" style={{ color }}>
                  {job.employer}
                  {job.city ? ` · ${job.city}` : ""}
                </p>
                {job.description && (
                  <div
                    className="resume-desc text-[10.5px] text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                  />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <Section title={label("education")} color={color}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry mb-4">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <h3
                    className="font-semibold text-[12.5px] text-gray-900 leading-snug"
                    style={{ fontFamily: serif }}
                  >
                    {edu.degree}
                    {edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                  </h3>
                  <span className="text-[9.5px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5 uppercase tracking-wider">
                    {edu.startDate}
                    {edu.currentlyStudying
                      ? ` – ${present}`
                      : edu.endDate
                        ? ` – ${edu.endDate}`
                        : ""}
                  </span>
                </div>
                <p className="text-[10.5px] font-medium italic" style={{ color }}>
                  {edu.institution}
                  {edu.city ? `, ${edu.city}` : ""}
                </p>
                {edu.description && (
                  <div
                    className="resume-desc text-[10.5px] text-gray-600 leading-relaxed mt-1"
                    dangerouslySetInnerHTML={{ __html: fmtDesc(edu.description) }}
                  />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <Section title={label("projects")} color={color}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry mb-4">
                <h3
                  className="font-semibold text-[12.5px] text-gray-900 leading-snug"
                  style={{ fontFamily: serif }}
                >
                  {proj.name}
                </h3>
                {proj.role && (
                  <p className="text-[10.5px] font-medium italic" style={{ color }}>
                    {proj.role}
                  </p>
                )}
                {proj.description && (
                  <p className="text-[10.5px] text-gray-600 mt-1 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function SideContact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px] break-all" style={{ color: "rgba(255,255,255,0.8)" }}>
      <span className="mt-0.5">{icon}</span> {text}
    </div>
  )
}

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] font-bold uppercase tracking-[0.28em] mb-2 pb-1 resume-section-title"
      style={{
        color: "rgba(201,160,106,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </div>
  )
}

function Section({
  title,
  color,
  children,
}: {
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-0.5 h-5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500 resume-section-title">
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: `${color}25` }} />
      </div>
      {children}
    </div>
  )
}
