"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function CircularTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm" }}>
      {/* Curved header */}
      <div
        className="relative text-white px-10 pt-9 pb-16"
        style={{ backgroundColor: color, borderRadius: "0 0 50% 50% / 0 0 40px 40px" }}
      >
        <div className="flex items-center gap-6">
          <div
            className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span className="text-3xl font-extrabold">{initials || "N"}</span>}
          </div>
          <div>
            {fullName && <h1 className="text-3xl font-extrabold mb-0.5 tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-white/75 text-sm font-medium">{pd.jobTitle}</p>}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-xs text-white/70">
          {pd.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{pd.email}</span>}
          {pd.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{pd.phone}</span>}
          {(pd.city || pd.country) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{pd.website}</span>}
          {pd.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{pd.linkedin}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="px-10 pt-6 pb-10">
        {visible("summary") && summary && (
          <Section title="Perfil" color={color}>
            <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
          </Section>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            {visible("workExperience") && workExperience.length > 0 && (
              <Section title="Experiencia" color={color}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry mb-4 pl-3 border-l-2" style={{ borderColor: color + "50" }}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? `, ${job.city}` : ""}</p>
                    {job.description && (
                      <div className="resume-desc text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </Section>
            )}

            {visible("education") && education.length > 0 && (
              <Section title={label("education")} color={color}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry mb-3 pl-3 border-l-2" style={{ borderColor: color + "35" }}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium" style={{ color }}>{edu.institution}</p>
                  </div>
                ))}
              </Section>
            )}
          </div>

          <div className="space-y-5">
            {visible("skills") && skills.length > 0 && (
              <Section title={label("skills")} color={color}>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <p className="text-xs text-gray-800 mb-1 font-medium">{skill.name}</p>
                      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: color,
                            width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {visible("languages") && languages.length > 0 && (
              <Section title={label("languages")} color={color}>
                <div className="space-y-1.5">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-800">{lang.name}</span>
                      <span className="text-gray-400 text-[10px]">{lang.level.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <Section title={label("certifications")} color={color}>
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div key={cert.id}>
                      <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                      <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5 resume-section-title">
        <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px" style={{ backgroundColor: color + "30" }} />
      </div>
      {children}
    </div>
  )
}
