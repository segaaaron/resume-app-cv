"use client"

/**
 * Glass — Glassmorphism + gradientes suaves.
 * Tendencia 2024-2026: fondos translúcidos, blur, gradientes pastel.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function GlassTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  const bgGradient = `linear-gradient(135deg, ${color}1a 0%, ${color}08 50%, ${color}14 100%)`

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", background: bgGradient }}>
      {/* Glass header */}
      <div
        className="mx-6 mt-6 rounded-2xl px-8 py-7 border border-white/60"
        style={{ background: `${color}18`, backdropFilter: "blur(10px)" }}
      >
        <div className="flex items-center gap-6">
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.photoUrl} alt="" className="w-22 h-22 rounded-2xl object-cover border-2 border-white/50 shrink-0 w-20 h-20" style={{ objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-white/50 shrink-0 text-2xl font-black" style={{ background: `${color}25`, color }}>
              {initials || "?"}
            </div>
          )}
          <div className="flex-1">
            {fullName && <h1 className="text-2xl font-black text-gray-900 tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-sm font-semibold mt-0.5" style={{ color }}>{pd.jobTitle}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2.5 text-xs text-gray-600">
              {pd.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" style={{ color }} />{pd.email}</span>}
              {pd.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" style={{ color }} />{pd.phone}</span>}
              {(pd.city || pd.country) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color }} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
              {pd.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" style={{ color }} />{pd.website}</span>}
              {pd.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" style={{ color }} />{pd.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-6 pt-4 pb-6">
        {/* Main */}
        <div className="flex-1 space-y-4">
          {visible("summary") && summary && (
            <GlassCard color={color}>
              <GlassTitle title={L.profile} color={color} />
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </GlassCard>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <GlassCard color={color}>
              <GlassTitle title={L.experience} color={color} />
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
                    {job.description && <div className="resume-desc text-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {visible("education") && education.length > 0 && (
            <GlassCard color={color}>
              <GlassTitle title={label("education")} color={color} />
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry pl-3 border-l-2" style={{ borderColor: `${color}45` }}>
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
            </GlassCard>
          )}
        </div>

        {/* Side */}
        <div className="w-44 shrink-0 space-y-4">
          {visible("skills") && skills.length > 0 && (
            <GlassCard color={color}>
              <GlassTitle title={L.skills} color={color} />
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <p className="text-xs font-medium mb-1 text-gray-800">{skill.name}</p>
                    <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        background: `linear-gradient(90deg, ${color}, ${color}99)`,
                        width: skill.level === "expert" ? "100%" : skill.level === "advanced" ? "80%" : skill.level === "intermediate" ? "60%" : "40%"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {visible("languages") && languages.length > 0 && (
            <GlassCard color={color}>
              <GlassTitle title={label("languages")} color={color} />
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-800">{lang.name}</span>
                  <span className="text-gray-400 text-[10px]">{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </GlassCard>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <GlassCard color={color}>
              <GlassTitle title={label("certifications")} color={color} />
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <p className="text-xs font-semibold text-gray-800">{cert.name}</p>
                  <p className="text-[10px] text-gray-400">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </GlassCard>
          )}

          {visible("hobbies") && hobbies && (
            <GlassCard color={color}>
              <GlassTitle title={L.interests} color={color} />
              <p className="text-xs text-gray-600 leading-relaxed">{hobbies}</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

function GlassCard({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 border border-white/60"
      style={{ background: "rgba(255,255,255,0.60)", backdropFilter: "blur(8px)", boxShadow: `0 2px 14px ${color}12` }}
    >
      {children}
    </div>
  )
}

function GlassTitle({ title, color }: { title: string; color: string }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-widest mb-2.5 resume-section-title" style={{ color }}>{title}</h3>
  )
}
