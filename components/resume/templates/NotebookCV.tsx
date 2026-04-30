"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

export default function NotebookCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fafafa"
  const ink = "#1e1e1e"
  const blue = config.colorScheme || "#0050a3"
  const red = "#d63d3d"
  const green = "#0a7a3a"

  function Cell({ kind = "code", n, children }: { kind?: "code" | "md" | "output"; n?: number; children: React.ReactNode }) {
    return (
      <div style={{
        display: "flex",
        borderTop: "1px solid #ddd",
        fontFamily: kind === "code" ? "'JetBrains Mono', 'Fira Code', monospace" : "'Inter', sans-serif",
        fontSize: 11,
        lineHeight: 1.55,
      }}>
        <div style={{
          width: 80,
          padding: "10px 12px",
          background: "#f0f0f0",
          color: blue,
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          {kind === "code" ? `In [${n}]:` : kind === "output" ? "Out:" : ""}
        </div>
        <div style={{
          flex: 1,
          padding: "10px 14px",
          background: kind === "code" ? "#fff" : paper,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          {children}
        </div>
      </div>
    )
  }

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  return (
    <div style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Title bar */}
      <div style={{
        background: "#212121",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>📓 resume.ipynb</div>
        <div style={{ marginLeft: "auto", fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#aaa" }}>
          {config.language === "en" ? "● Kernel idle" : "● Kernel inactivo"}
        </div>
      </div>

      {/* Menu bar */}
      <div style={{ background: "#fff", padding: "8px 16px", display: "flex", gap: 14, fontSize: 11, color: "#555", borderBottom: "1px solid #ddd" }}>
        {["File", "Edit", "View", "Insert", "Cell", "Kernel", "Help"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Cells */}
      <div style={{ flex: 1, overflow: "hidden" }}>

        {/* Header cell — name & title */}
        <Cell kind="md">
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            # {fullName}{pd.jobTitle ? ` · ${pd.jobTitle}` : ""}
          </h1>
          <div style={{ marginTop: 6, color: "#555" }}>
            {[pd.email, pd.phone, location, pd.linkedin, pd.website].filter(Boolean).join(" · ")}
          </div>
        </Cell>

        {/* Summary cell */}
        {visible("summary") && summary && (
          <>
            <Cell n={1}>
              <span style={{ color: red }}>import</span> profile <span style={{ color: red }}>as</span> p<br />
              p.<span style={{ color: blue }}>summary</span>()
            </Cell>
            <Cell kind="output">
              <pre style={{ margin: 0, fontFamily: "ui-monospace, monospace", color: "#444", fontSize: 11, whiteSpace: "pre-wrap" }}>
                {`"""\n${summary}\n"""`}
              </pre>
            </Cell>
          </>
        )}

        {/* Work experience cell */}
        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <Cell n={2}>
              <span style={{ color: "#777" }}># {label("workExperience")}</span><br />
              experience = [<br />
              {workExperience.map((job, i) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear}-${endYear}` : startYear || endYear
                return (
                  <span key={job.id}>
                    &nbsp;&nbsp;{"{"}
                    <span style={{ color: green }}>"yr"</span>: <span style={{ color: green }}>"{yr}"</span>,{" "}
                    <span style={{ color: green }}>"co"</span>: <span style={{ color: green }}>"{job.employer}"</span>,{" "}
                    <span style={{ color: green }}>"role"</span>: <span style={{ color: green }}>"{job.jobTitle}"</span>
                    {"}"}{i < workExperience.length - 1 ? "," : ""}
                    <br />
                  </span>
                )
              })}
              ]
            </Cell>
            {workExperience.some((j) => j.description) && (
              <Cell kind="output">
                {workExperience.filter((j) => j.description).slice(0, 2).map((job) => (
                  <div key={job.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: blue, fontSize: 11 }}>{job.jobTitle} @ {job.employer}</div>
                    <div className="resume-desc" style={{ fontSize: 10.5, color: "#444" }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description ?? "") }} />
                  </div>
                ))}
              </Cell>
            )}
          </>
        )}

        {/* Skills bar chart cell */}
        {visible("skills") && skills.length > 0 && (
          <>
            <Cell n={3}>
              <span style={{ color: "#777" }}># {label("skills")} as DataFrame</span><br />
              skills.plot.bar()
            </Cell>
            <Cell kind="output">
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginTop: 4, paddingBottom: 12, borderBottom: "1px solid #ddd" }}>
                {skills.slice(0, 12).map((sk) => {
                  const pct = SKILL_PCT[sk.level] ?? 50
                  const h = Math.round((pct / 100) * 72)
                  const abbr = sk.name.slice(0, 4)
                  return (
                    <div key={sk.id} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: h, background: blue, marginBottom: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, wordBreak: "break-all" }}>{abbr}</div>
                    </div>
                  )
                })}
              </div>
            </Cell>
          </>
        )}

        {/* Education cell */}
        {visible("education") && education.length > 0 && (
          <Cell n={4}>
            <span style={{ color: "#777" }}># {label("education")}</span><br />
            edu = <span style={{ color: blue }}>Education</span>(<br />
            {education.map((edu, i) => {
              const startYear = edu.startDate?.match(/\d{4}/)?.[0] ?? ""
              const endYear = edu.currentlyStudying ? present : (edu.endDate?.match(/\d{4}/)?.[0] ?? "")
              const yr = startYear && endYear ? `${startYear}-${endYear}` : startYear || endYear
              return (
                <span key={edu.id}>
                  &nbsp;&nbsp;{i === 0 ? "degree" : `degree_${i + 1}`}=<span style={{ color: green }}>
                    "{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}{edu.institution ? ` · ${edu.institution}` : ""}{yr ? ` · ${yr}` : ""}"
                  </span>,<br />
                </span>
              )
            })}
            {certifications.length > 0 && (
              <>
                &nbsp;&nbsp;cert=[{certifications.slice(0, 3).map((c, i) => (
                  <span key={c.id}>
                    <span style={{ color: green }}>"{c.name}"</span>
                    {i < Math.min(certifications.length, 3) - 1 ? ", " : ""}
                  </span>
                ))}]<br />
              </>
            )}
            )
          </Cell>
        )}

        {/* Languages + contact cell */}
        <Cell n={5}>
          profile.contact()
        </Cell>
        <Cell kind="output">
          <pre style={{ margin: 0, fontFamily: "ui-monospace, monospace", color: "#444", fontSize: 11 }}>
            {JSON.stringify({
              email: pd.email || "",
              phone: pd.phone || "",
              city: location || "",
              linkedin: pd.linkedin || "",
              website: pd.website || "",
              ...(languages.length > 0 ? { languages: languages.map((l) => `${l.name} · ${l.level.toUpperCase()}`).join(", ") } : {}),
            }, null, 2)}
          </pre>
        </Cell>

        {/* Projects cell */}
        {visible("projects") && projects && projects.length > 0 && (
          <Cell n={6}>
            <span style={{ color: "#777" }}># {label("projects")}</span><br />
            projects = [<br />
            {projects.map((p, i) => (
              <span key={p.id}>
                &nbsp;&nbsp;<span style={{ color: green }}>"{p.name}"</span>{i < projects.length - 1 ? "," : ""}
                <br />
              </span>
            ))}
            ]
          </Cell>
        )}
      </div>
    </div>
  )
}
