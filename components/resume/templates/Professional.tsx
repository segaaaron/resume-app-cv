"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"

export default function ProfessionalTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")

  return (
    <div style={{ minHeight: "297mm" }}>
      {/* Header band */}
      <div className="px-10 py-8 text-white" style={{ backgroundColor: color }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{fullName || "Tu Nombre"}</h1>
        {pd.jobTitle && <p className="text-white/75 mt-1 text-sm font-medium tracking-wide">{pd.jobTitle}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-xs text-white/70">
          {pd.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{pd.email}</span>}
          {pd.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{pd.phone}</span>}
          {pd.city && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{pd.city}</span>}
          {pd.website && <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" />{pd.website}</span>}
          {pd.linkedin && <span className="flex items-center gap-1.5"><Link2 className="h-3 w-3" />{pd.linkedin}</span>}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-[30%] bg-gray-50 px-6 pt-7 pb-8 border-r border-gray-200" style={{ minHeight: "calc(297mm - 90px)" }}>
          {visible("skills") && skills.length > 0 && (
            <div className="mb-6">
              <SideHeading title={label("skills")} color={color} />
              <div className="space-y-1.5 mt-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-700">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {visible("languages") && languages.length > 0 && (
            <div>
              <SideHeading title={label("languages")} color={color} />
              <div className="space-y-2 mt-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-700">{lang.name}</span>
                      <span className="text-gray-400 text-[10px]">{lang.level.toUpperCase()}</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        backgroundColor: color,
                        width: ({ a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%" } as Record<string, string>)[lang.level] ?? "50%"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 px-8 pt-7 pb-8">
          {visible("summary") && summary && (
            <Section title="Resumen" color={color}>
              <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
            </Section>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <Section title={label("workExperience")} color={color}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry mb-4">
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
            </Section>
          )}

          {visible("education") && education.length > 0 && (
            <Section title={label("education")} color={color}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry mb-3">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-semibold text-[13px] text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</p>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function SideHeading({ title, color }: { title: string; color: string }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest pb-1 border-b resume-section-title" style={{ color, borderColor: color + "40" }}>{title}</h3>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pb-1 border-b resume-section-title" style={{ color, borderColor: color + "40" }}>{title}</h3>
      {children}
    </div>
  )
}
