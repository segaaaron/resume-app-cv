"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function LuxuriousTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div style={{ minHeight: "297mm", background: "#1a1a2e" }}>
      {/* Dark header */}
      <div className="px-10 py-9" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderBottom: `2px solid ${color}` }}>
        <div className="flex items-center gap-7">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.photoUrl}
              alt="Foto"
              className="w-24 h-24 rounded-full object-cover border-2 shrink-0"
              style={{ borderColor: color }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: color, background: `${color}20` }}
            >
              <span className="text-3xl font-extrabold" style={{ color }}>{initials || "?"}</span>
            </div>
          )}
          <div className="flex-1">
            {fullName && <h1 className="text-3xl font-extrabold text-white tracking-wide">{fullName}</h1>}
            {pd.jobTitle && <p className="mt-1 text-[11px] tracking-widest uppercase font-semibold" style={{ color }}>{pd.jobTitle}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-3">
              {pd.email && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Mail className="h-3 w-3" />{pd.email}</span>}
              {pd.phone && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Phone className="h-3 w-3" />{pd.phone}</span>}
              {(pd.city || pd.country) && <span className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin className="h-3 w-3" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
              {pd.website && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Globe className="h-3 w-3" />{pd.website}</span>}
              {pd.linkedin && <span className="text-xs text-gray-400 flex items-center gap-1.5"><Link2 className="h-3 w-3" />{pd.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Body on white */}
      <div className="bg-white px-10 pt-8 pb-10">
        {visible("summary") && summary && (
          <Section title="Perfil" color={color}>
            <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
          </Section>
        )}

        <div className="grid grid-cols-3 gap-7">
          <div className="col-span-2 space-y-5">
            {visible("workExperience") && workExperience.length > 0 && (
              <Section title="Experiencia Profesional" color={color}>
                <div className="space-y-4">
                  {workExperience.map((job) => (
                    <div key={job.id} className="resume-entry relative pl-4 border-l-2" style={{ borderColor: color }}>
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-semibold text-[13px] text-gray-900">{job.jobTitle}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                          {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                        </span>
                      </div>
                      <p className="text-xs font-medium mb-1" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
                      {job.description && (
                        <div className="text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {visible("education") && education.length > 0 && (
              <Section title="Formación Académica" color={color}>
                <div className="space-y-3">
                  {education.map((edu) => (
                    <div key={edu.id} className="resume-entry pl-4 border-l-2" style={{ borderColor: color + "40" }}>
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                          {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                        </span>
                      </div>
                      <p className="text-xs font-medium" style={{ color }}>{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-4">
            {visible("skills") && skills.length > 0 && (
              <Section title="Competencias" color={color}>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <p className="text-xs font-medium text-gray-800 mb-1">{skill.name}</p>
                      <div className="h-1 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full rounded"
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
                      <span className="text-gray-400 text-[10px] capitalize">{lang.level.replace("_", " ")}</span>
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

            {visible("hobbies") && hobbies && (
              <Section title="Intereses" color={color}>
                <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
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
    <div className="mb-5">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pb-1 border-b resume-section-title" style={{ color, borderColor: color + "30" }}>{title}</h3>
      {children}
    </div>
  )
}
