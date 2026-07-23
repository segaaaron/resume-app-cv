"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { SectionIcon } from "@/lib/resume/section-icons"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function VerticalTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div data-print-layout="sidebar-left" className="flex" style={{ minHeight: "297mm", "--pdf-sidebar-bg": color + "15", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "40%" } as React.CSSProperties}>
      {/* Left sidebar */}
      <div className="w-[40%] shrink-0 p-8" style={{ backgroundColor: color + "15", borderRight: `3px solid ${color}` }}>
        {/* Photo / Avatar */}
        <div className="mb-6 text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center border-4"
            style={{ backgroundColor: color, borderColor: color }}
          >
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span className="text-3xl font-bold text-white">{initials || "N"}</span>}
          </div>
          {fullName && (
            <h1 className="text-xl font-bold mt-3 leading-tight">{fullName}</h1>
          )}
          {pd.jobTitle && (
            <p className="text-xs mt-1 font-medium" style={{ color }}>{pd.jobTitle}</p>
          )}
        </div>

        {/* Contact */}
        <SideSection id="personalDetails" title="Contacto" color={color}>
          <div className="space-y-1.5">
            {pd.email && <ContactRow icon={<Mail className="h-3 w-3" />} text={pd.email} color={color} />}
            {pd.phone && <ContactRow icon={<Phone className="h-3 w-3" />} text={pd.phone} color={color} />}
            {(pd.city || pd.country) && <ContactRow icon={<MapPin className="h-3 w-3" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} color={color} />}
            {pd.website && <ContactRow icon={<Globe className="h-3 w-3" />} text={pd.website} color={color} />}
            {pd.linkedin && <ContactRow icon={<Link2 className="h-3 w-3" />} text={pd.linkedin} color={color} />}
          </div>
        </SideSection>

        {visible("skills") && skills.length > 0 && (
          <SideSection id="skills" title={label("skills")} color={color}>
            <div className="space-y-2">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-gray-500 capitalize text-[10px]">{skill.level}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: color,
                        width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {visible("languages") && languages.length > 0 && (
          <SideSection id="languages" title={label("languages")} color={color}>
            <div className="space-y-1.5">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between text-xs">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-gray-500 text-[10px]">{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <SideSection id="certifications" title={label("certifications")} color={color}>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-xs font-medium">{cert.name}</p>
                  <p className="text-[10px] text-gray-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {visible("hobbies") && hobbies && (
          <SideSection id="hobbies" title="Intereses" color={color}>
            <p className="text-xs text-gray-600">{hobbies}</p>
          </SideSection>
        )}
      </div>

      {/* Right main content */}
      <div className="flex-1 p-8" style={{ backgroundColor: "#fff" }}>
        {visible("summary") && summary && (
          <Section id="summary" title="Perfil" color={color}>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </Section>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <Section id="workExperience" title={label("workExperience")} color={color}>
            <div className="space-y-4">
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">{job.jobTitle}</h4>
                      <p className="text-xs text-gray-500">{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {job.startDate}{job.currentlyWorking ? `–${present}` : job.endDate ? `–${job.endDate}` : ""}
                    </span>
                  </div>
                  {job.description && (
                    <div className="resume-desc text-xs text-gray-600 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {visible("education") && education.length > 0 && (
          <Section id="education" title={label("education")} color={color}>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                      <p className="text-xs text-gray-500">{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {edu.startDate}{edu.currentlyStudying ? `–${present}` : edu.endDate ? `–${edu.endDate}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {visible("projects") && projects.length > 0 && (
          <Section id="projects" title={label("projects")} color={color}>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between">
                    <h4 className="font-semibold text-sm">{proj.name}</h4>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-[10px] text-gray-400">{proj.startDate}{proj.endDate ? `–${proj.endDate}` : ""}</span>
                    )}
                  </div>
                  {proj.role && <p className="text-xs text-gray-500">{proj.role}</p>}
                  {proj.description && <p className="resume-desc text-xs text-gray-600 mt-0.5" dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function SideSection({ id, title, color, children }: { id: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color, borderColor: color + "40" }}>
        <SectionIcon sectionId={id} color={color} size={11} strokeWidth={2.25} />
        {title}
      </h3>
      {children}
    </div>
  )
}

function ContactRow({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  void color
  return (
    <div className="flex items-start gap-1.5 text-xs text-gray-700 break-all">
      <span className="mt-0.5 shrink-0">{icon}</span>
      {text}
    </div>
  )
}

function Section({ id, title, color, children }: { id: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3
        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest mb-2 pb-1"
        style={{ color, borderBottom: `2px solid ${color}` }}
      >
        <SectionIcon sectionId={id} color={color} size={11} strokeWidth={2.25} />
        {title}
      </h3>
      {children}
    </div>
  )
}
