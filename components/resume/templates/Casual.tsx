"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function CasualTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, hobbies } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const initials = [pd.firstName?.charAt(0), pd.lastName?.charAt(0)].filter(Boolean).join("").toUpperCase()

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm" }}>
      {/* Gradient header */}
      <div
        className="relative px-10 pt-9 pb-14 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
        <div className="absolute right-16 bottom-2 w-20 h-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />

        <div className="relative flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border-4 border-white/30">
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span className="text-2xl font-black text-white">{initials || "N"}</span>}
            </div>
          <div>
            {fullName && <h1 className="text-3xl font-black text-white tracking-tight">{fullName}</h1>}
            {pd.jobTitle && <p className="text-white/80 text-sm font-semibold mt-0.5">{pd.jobTitle}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2.5">
              {pd.email && <span className="text-xs text-white/70 flex items-center gap-1"><Mail className="h-3 w-3" />{pd.email}</span>}
              {pd.phone && <span className="text-xs text-white/70 flex items-center gap-1"><Phone className="h-3 w-3" />{pd.phone}</span>}
              {(pd.city || pd.country) && <span className="text-xs text-white/70 flex items-center gap-1"><MapPin className="h-3 w-3" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex px-10 pt-6 pb-8 gap-7">
        {/* Main */}
        <div className="flex-1">
          {visible("summary") && summary && (
            <Section title={L.aboutMe} color={color}>
              <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
            </Section>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <Section title={L.experience} color={color}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry mb-4 p-3.5 rounded-xl border" style={{ backgroundColor: color + "06", borderColor: color + "20" }}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[13px] text-gray-900">{job.jobTitle}</h4>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5 mb-1.5" style={{ color }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</p>
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
                <div key={edu.id} className="resume-entry mb-3 p-3.5 rounded-xl border" style={{ backgroundColor: color + "06", borderColor: color + "20" }}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[13px] text-gray-900">{edu.degree}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5" style={{ color }}>{edu.institution}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Side */}
        <div className="w-44 shrink-0">
          {visible("skills") && skills.length > 0 && (
            <Section title={L.skills} color={color}>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{ backgroundColor: color + "12", borderColor: color + "50", color }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {visible("languages") && languages.length > 0 && (
            <Section title={label("languages")} color={color}>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id} className="text-xs">
                    <span className="font-semibold text-gray-800">{lang.name}</span>
                    <span className="text-gray-400 ml-1.5 text-[10px]">({lang.level.toUpperCase()})</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(pd.website || pd.linkedin) && (
            <Section title="Links" color={color}>
              <div className="space-y-1">
                {pd.website && <p className="text-[10px] flex items-center gap-1 text-gray-600 break-all"><Globe className="h-3 w-3 shrink-0" style={{ color }} />{pd.website}</p>}
                {pd.linkedin && <p className="text-[10px] flex items-center gap-1 text-gray-600 break-all"><Link2 className="h-3 w-3 shrink-0" style={{ color }} />{pd.linkedin}</p>}
              </div>
            </Section>
          )}

          {visible("hobbies") && hobbies && (
            <Section title={L.interests} color={color}>
              <p className="text-[10px] text-gray-600 leading-relaxed">{hobbies}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-black uppercase tracking-widest mb-2.5 resume-section-title" style={{ color }}>{title}</h3>
      {children}
    </div>
  )
}
