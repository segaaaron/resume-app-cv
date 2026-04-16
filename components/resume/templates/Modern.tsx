"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function ModernTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div className="flex" style={{ minHeight: "297mm" }}>
      {/* Sidebar */}
      <div className="w-[34%] shrink-0 text-white px-6 pt-8 pb-8 flex flex-col gap-6" style={{ backgroundColor: color }}>
        {/* Photo */}
        <div className="flex justify-center">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/25 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-white/70">
                {pd.firstName?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>

        {/* Name block in sidebar */}
        <div className="text-center -mt-2">
          {fullName && <p className="text-base font-bold text-white leading-tight">{fullName}</p>}
          {pd.jobTitle && <p className="text-[10px] text-white/65 mt-0.5 uppercase tracking-widest">{pd.jobTitle}</p>}
        </div>

        {/* Contact */}
        <div>
          <SideTitle>{config.language === "en" ? "Contact" : "Contacto"}</SideTitle>
          <div className="space-y-2 mt-1">
            {pd.email && <ContactRow icon={<Mail className="h-3 w-3 shrink-0" />} text={pd.email} />}
            {pd.phone && <ContactRow icon={<Phone className="h-3 w-3 shrink-0" />} text={pd.phone} />}
            {(pd.city || pd.country) && <ContactRow icon={<MapPin className="h-3 w-3 shrink-0" />} text={[pd.city, pd.country].filter(Boolean).join(", ")} />}
            {pd.website && <ContactRow icon={<Globe className="h-3 w-3 shrink-0" />} text={pd.website} />}
            {pd.linkedin && <ContactRow icon={<Link2 className="h-3 w-3 shrink-0" />} text={pd.linkedin} />}
          </div>
        </div>

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <div>
            {label("skills") && <SideTitle>{label("skills")}</SideTitle>}
            <div className="space-y-2.5 mt-2">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <p className="text-[11px] text-white/90 mb-1">{skill.name}</p>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full"
                      style={{
                        width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div>
            {label("languages") && <SideTitle>{label("languages")}</SideTitle>}
            <div className="space-y-2 mt-2">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between items-center">
                  <span className="text-[11px] text-white/90 font-medium">{lang.name}</span>
                  <span className="text-[10px] text-white/55 capitalize">{lang.level.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 px-8 pt-8 pb-8">
        {fullName && <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-0.5">{fullName}</h1>}
        {pd.jobTitle && <p className="text-sm font-medium text-gray-500 mb-6">{pd.jobTitle}</p>}

        {visible("summary") && summary && (
          <Section title="Perfil" color={color}>
            <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
          </Section>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <Section title="Experiencia" color={color}>
            <div className="space-y-4">
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry pl-3 border-l-2" style={{ borderColor: color + "70" }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                  {job.description && <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {visible("education") && education.length > 0 && (
          <Section title={label("education")} color={color}>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry pl-3 border-l-2" style={{ borderColor: color + "40" }}>
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 border-b border-white/20 pb-1 resume-section-title">{children}</h3>
  )
}

function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[11px] text-white/80 break-all">
      <span className="mt-0.5">{icon}</span> {text}
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 resume-section-title">
        <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "30" }} />
      </div>
      {children}
    </div>
  )
}
