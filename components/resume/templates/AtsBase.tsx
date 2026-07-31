"use client"

/**
 * AtsBase — one ATS-safe engine, 15 looks.
 *
 * Ported from the ReadyCV premium ATS set. Every variant is single column, no
 * tables, no images: semantic text a parser reads in order. They differ by
 * header treatment, section style, typography and bullet marker — NOT by colour:
 * the accent is always config.colorScheme so the user keeps their palette across
 * every ATS layout. System fonts only (serif/sans) so the PDF microservice never
 * depends on a CDN font at render time.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

type HeaderStyle = "band" | "rule" | "split" | "minimal"
type SectionStyle = "badge" | "underline" | "bar"
type Marker = "check" | "dot" | "dash"

export interface AtsVariant {
  header: HeaderStyle
  section: SectionStyle
  marker: Marker
  serif?: boolean
}

// 15 distinct looks. Colour is intentionally absent — it comes from the user.
export const ATS_VARIANTS: Record<string, AtsVariant> = {
  meridian: { header: "band", section: "badge", marker: "check" },
  verdant: { header: "band", section: "badge", marker: "dot" },
  cardinal: { header: "rule", section: "underline", marker: "dash", serif: true },
  cobalt: { header: "split", section: "bar", marker: "check" },
  slate: { header: "minimal", section: "underline", marker: "dash" },
  nordic: { header: "rule", section: "bar", marker: "dot" },
  onyx: { header: "minimal", section: "badge", marker: "dot" },
  sable: { header: "band", section: "underline", marker: "dash", serif: true },
  cerulean: { header: "band", section: "bar", marker: "check" },
  ivory: { header: "minimal", section: "underline", marker: "dot" },
  garnet: { header: "rule", section: "underline", marker: "dash", serif: true },
  copper: { header: "band", section: "bar", marker: "dot", serif: true },
  harbor: { header: "split", section: "badge", marker: "check" },
  graphite: { header: "band", section: "bar", marker: "dash" },
  sequoia: { header: "split", section: "badge", marker: "check", serif: true },
}

const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const MARKERS: Record<Marker, string> = { check: "✓", dot: "•", dash: "–" }

export default function AtsBase({ variant }: { variant: AtsVariant }) {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer } = sectionData
  const color = config.colorScheme
  const font = variant.serif ? SERIF : SANS
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const contact = [pd.email, pd.phone, [pd.city, pd.country].filter(Boolean).join(", "), pd.linkedin, pd.github, pd.website].filter(Boolean)

  const Section = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <SectionTitle title={label(id)} color={color} style={variant.section} />
      {children}
    </div>
  )

  return (
    <div data-print-layout="single-column" className="text-gray-900" style={{ fontFamily: font, minHeight: "297mm", lineHeight: 1.55 }}>
      <Header style={variant.header} color={color} fullName={fullName} jobTitle={pd.jobTitle} contact={contact} serif={variant.serif} />

      <div style={{ padding: variant.header === "band" ? "24px 46px 32px" : "20px 46px 32px" }}>
        {visible("summary") && summary && (
          <Section id="summary"><p className="text-[11.2px] leading-relaxed text-gray-700">{summary}</p></Section>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <Section id="workExperience">
            <div className="flex flex-col gap-4">
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-3">
                    <strong className="text-[13px] font-extrabold text-gray-900">{job.jobTitle}</strong>
                    <span className="text-[10px] font-bold whitespace-nowrap shrink-0" style={{ color }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 mb-1.5">{job.employer}{job.city ? ` — ${job.city}` : ""}</div>
                  {job.description && (
                    <div
                      className="resume-desc ats-bullets text-[11px] leading-relaxed text-gray-700"
                      style={{ ["--mk" as string]: `"${MARKERS[variant.marker]}"`, ["--mkc" as string]: color }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                    />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {visible("skills") && skills.length > 0 && (
          <Section id="skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s.id} className="text-[10.5px] px-2.5 py-1 rounded-md" style={{ background: `${color}12`, color }}>{s.name}</span>
              ))}
            </div>
          </Section>
        )}

        {visible("education") && education.length > 0 && (
          <Section id="education">
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry mb-2.5">
                <div className="flex justify-between items-baseline gap-3">
                  <strong className="text-[12.5px] font-bold text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}</strong>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <div className="text-[11px] font-semibold" style={{ color }}>{edu.institution}{edu.city ? ` · ${edu.city}` : ""}</div>
              </div>
            ))}
          </Section>
        )}

        {visible("languages") && languages.length > 0 && (
          <Section id="languages"><p className="text-[11px] text-gray-700">{languages.map((l) => `${l.name} (${l.level.toUpperCase()})`).join("  ·  ")}</p></Section>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <Section id="certifications">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline text-[11px] mb-1">
                <strong className="text-gray-900">{cert.name}</strong>
                <span className="text-[10px] text-gray-500 shrink-0 ml-2">{cert.issuer}{cert.date ? ` (${cert.date})` : ""}</span>
              </div>
            ))}
          </Section>
        )}

        {visible("projects") && projects.length > 0 && (
          <Section id="projects">
            {projects.map((proj) => (
              <div key={proj.id} className="mb-2.5">
                <div className="flex items-baseline gap-2">
                  <strong className="text-[12px] text-gray-900">{proj.name}</strong>
                  {proj.role && <span className="text-[10.5px] text-gray-600">— {proj.role}</span>}
                </div>
                {proj.description && <p className="text-[11px] text-gray-700 mt-0.5 leading-relaxed">{proj.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <Section id="volunteer">
            {volunteer.map((vol) => (
              <div key={vol.id} className="mb-2">
                <div className="flex justify-between items-baseline gap-3">
                  <strong className="text-[12px] text-gray-900">{vol.role} — {vol.organization}</strong>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">{vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}</span>
                </div>
                {vol.description && <p className="text-[11px] text-gray-700 mt-0.5">{vol.description}</p>}
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Bullet marker per variant, applied to the pasted HTML lists. */}
      <style>{`.ats-bullets ul{list-style:none;margin:0;padding:0}.ats-bullets li{position:relative;padding-left:15px;margin-bottom:3px}.ats-bullets li::before{content:var(--mk);position:absolute;left:0;color:var(--mkc);font-weight:800}`}</style>
    </div>
  )
}

function Header({ style, color, fullName, jobTitle, contact, serif }: {
  style: HeaderStyle; color: string; fullName: string; jobTitle?: string; contact: string[]; serif?: boolean
}) {
  const nameEl = <h1 className="m-0 text-[34px] font-black tracking-tight leading-none">{fullName}</h1>
  const roleUpper = { fontSize: 11.5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.22em" }

  if (style === "band") {
    return (
      <div style={{ background: color, color: "#fff", padding: "28px 46px 22px" }}>
        {fullName && nameEl}
        {jobTitle && <div className="mt-2" style={{ ...roleUpper, color: "rgba(255,255,255,0.85)" }}>{jobTitle}</div>}
        {contact.length > 0 && (
          <>
            <div className="my-3 h-px" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10.5px]" style={{ color: "rgba(255,255,255,0.9)" }}>
              {contact.map((c, i) => <span key={i}>{c}</span>)}
            </div>
          </>
        )}
      </div>
    )
  }
  if (style === "split") {
    return (
      <div style={{ padding: "26px 46px 0" }}>
        <div className="flex justify-between items-end gap-6 pb-3" style={{ borderBottom: `3px solid ${color}` }}>
          <div>
            {fullName && nameEl}
            {jobTitle && <div className="mt-1.5" style={{ ...roleUpper, color }}>{jobTitle}</div>}
          </div>
          {contact.length > 0 && (
            <div className="flex flex-col items-end gap-0.5 text-[10px] text-gray-600 text-right">
              {contact.map((c, i) => <span key={i}>{c}</span>)}
            </div>
          )}
        </div>
      </div>
    )
  }
  if (style === "rule") {
    return (
      <div style={{ padding: "26px 46px 0" }}>
        {fullName && <h1 className="m-0 text-[34px] font-black tracking-tight leading-none" style={{ color }}>{fullName}</h1>}
        {jobTitle && <div className="mt-1.5" style={{ ...roleUpper, color: "#4b5563" }}>{jobTitle}</div>}
        <div className="mt-3 mb-1" style={{ height: 3, background: color }} />
        {contact.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-600 mt-2">{contact.map((c, i) => <span key={i}>{c}</span>)}</div>
        )}
      </div>
    )
  }
  // minimal
  return (
    <div style={{ padding: "28px 46px 0" }}>
      {fullName && <h1 className="m-0 text-[32px] font-extrabold tracking-tight leading-none text-gray-900" style={{ fontFamily: serif ? SERIF : SANS }}>{fullName}</h1>}
      {jobTitle && <div className="mt-1 text-[12px] font-semibold text-gray-500">{jobTitle}</div>}
      {contact.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-600 mt-2">{contact.map((c, i) => <span key={i}>{i > 0 ? `| ${c}` : c}</span>)}</div>
      )}
      <div className="mt-3 h-px w-full bg-gray-200" />
    </div>
  )
}

function SectionTitle({ title, color, style }: { title: string; color: string; style: SectionStyle }) {
  if (style === "badge") {
    return <h2 className="inline-block text-[10.5px] font-bold uppercase tracking-widest mb-2 px-2.5 py-1 rounded resume-section-title" style={{ background: `${color}14`, color }}>{title}</h2>
  }
  if (style === "bar") {
    return (
      <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2 resume-section-title text-gray-800">
        <span style={{ width: 4, height: 14, background: color, borderRadius: 2 }} />{title}
      </h2>
    )
  }
  // underline
  return <h2 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-0.5 resume-section-title" style={{ borderBottom: `2px solid ${color}`, color }}>{title}</h2>
}
