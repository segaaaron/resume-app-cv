"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function PostcardCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const sky = "#cfe6f0"
  const paper = "#fcf6e8"
  const ink = "#1f1a14"
  const red = config.colorScheme || "#c1352e"
  const green = "#3a7d44"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Caveat', cursive",
        fontSize: 30,
        color: red,
        margin: "14px 0 4px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  const location = [pd.city, pd.country].filter(Boolean).join(", ").toUpperCase() || "MY CITY"

  return (
    <div style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11.5,
      padding: 36,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Postcard top section */}
      <div style={{
        background: "#fff",
        border: `1px solid ${ink}`,
        padding: 16,
        transform: "rotate(-0.5deg)",
        boxShadow: "6px 8px 0 rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: scenery illustration */}
          <div style={{ height: 220, background: sky, position: "relative", overflow: "hidden", border: `1px solid ${ink}` }}>
            {config.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.photoUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${config.photoPosition ?? 20}%`,
                }}
              />
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 200 220">
                <rect width="200" height="220" fill={sky} />
                <polygon points="0,140 60,80 110,120 160,60 200,100 200,220 0,220" fill={green} opacity="0.6" />
                <polygon points="0,170 80,110 140,140 200,120 200,220 0,220" fill={green} />
                <circle cx="160" cy="50" r="18" fill="#ffd23f" />
                <text x="100" y="195" fontSize="18" textAnchor="middle" fontFamily="'Caveat', cursive" fill="#fff" fontWeight="700">
                  {config.language === "en" ? "Greetings from" : "Saludos desde"}
                </text>
                <text x="100" y="214" fontSize="11" textAnchor="middle" fontFamily="ui-monospace, monospace" fill="#fff" letterSpacing="0.3em">
                  {location.slice(0, 18)}
                </text>
              </svg>
            )}
          </div>

          {/* Right: postcard message */}
          <div style={{ position: "relative" }}>
            {/* Stamp */}
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 56,
              height: 64,
              border: `2px solid ${red}`,
              padding: 4,
              fontSize: 8,
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "ui-monospace, monospace", color: red }}>CV</div>
              <div style={{ marginTop: 4, fontFamily: "'Caveat', cursive", fontSize: 18, color: red, transform: "rotate(-12deg)" }}>★</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 7, color: red, marginTop: 2 }}>
                {new Date().getFullYear().toString().slice(2)}·{String(new Date().getMonth() + 1).padStart(2, "0")}
              </div>
            </div>

            <div style={{ paddingRight: 70, fontFamily: "'Caveat', cursive", fontSize: 20, lineHeight: 1.3 }}>
              <div>{config.language === "en" ? "Hello!" : "¡Hola!"}</div>
              <div style={{ marginTop: 6, fontSize: 17 }}>
                {config.language === "en" ? "I'm " : "Soy "}
                <b>{pd.firstName || "First"} {pd.lastName || "Last"}</b>
                {pd.jobTitle && <>, {pd.jobTitle}</>}
                {(pd.city || pd.country) && <> — {[pd.city, pd.country].filter(Boolean).join(", ")}</>}.
              </div>
              {summary && (
                <div style={{ marginTop: 8, fontSize: 16 }}>{summary}</div>
              )}
              <div style={{ marginTop: 12, fontSize: 18 }}>
                {config.language === "en" ? "Shall we talk?" : "¿Hablamos?"}
              </div>
              <div style={{ marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                {pd.email && <div>{pd.email}</div>}
                {pd.phone && <div>{pd.phone}</div>}
                {pd.linkedin && <div>{pd.linkedin}</div>}
                {pd.website && <div>{pd.website}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main two-column */}
      <main style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        {/* Left column */}
        <section>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{config.language === "en" ? "Professional itinerary" : "Itinerario profesional"}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const dateRange = startYear && endYear ? `${startYear} — ${endYear}` : startYear || endYear
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr", padding: "8px 0", borderBottom: `1px dashed ${ink}`, gap: 10 }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>{dateRange}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.employer}</div>
                      <div style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</div>
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 10.5, color: "#555", marginTop: 3, lineHeight: 1.4 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{proj.name}</div>
                  {proj.description && (
                    <div className="resume-desc" style={{ fontSize: 11, color: "#555" }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {education.map((edu, i) => {
                  const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                  return (
                    <span key={edu.id}>
                      {year && <><b>{year}</b> · </>}
                      {edu.degree && <>{edu.degree}</>}
                      {edu.fieldOfStudy && <>, {edu.fieldOfStudy}</>}
                      {edu.institution && <> · {edu.institution}</>}
                      {i < education.length - 1 && <br />}
                    </span>
                  )
                })}
              </p>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} · {lang.level}
                    {i < languages.length - 1 && " · "}
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    {cert.name}
                    {cert.issuer && ` · ${cert.issuer}`}
                    {cert.date && ` · ${cert.date}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
