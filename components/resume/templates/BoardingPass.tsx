"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

function Ticket({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fbf6ec", display: "flex", boxShadow: "0 2px 0 rgba(0,0,0,0.08)", position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      {children}
    </div>
  )
}

function Stub({ children, ink }: { children: React.ReactNode; ink: string }) {
  return (
    <div style={{ width: 180, padding: "20px 24px", borderLeft: `2px dashed ${ink}`, position: "relative", background: "#f4eedf", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      {children}
    </div>
  )
}

function Field({ k, v, dim }: { k: string; v: string; dim: string }) {
  return (
    <div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, letterSpacing: "0.2em", color: dim }}>{k}</div>
      <div style={{ fontWeight: 700, fontSize: 12, marginTop: 1 }}>{v}</div>
    </div>
  )
}

export default function BoardingPassTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, workExperience, education, skills, languages, certifications } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const ink = "#1a1a1a"
  const red = config.colorScheme
  const dim = "#777"

  const fullName = `${pd.firstName || "First"} ${pd.lastName || "Last"}`

  // FROM = earliest job code, TO = latest/current job code
  const firstJob = workExperience[workExperience.length - 1]
  const lastJob = workExperience[0]
  const fromCode = firstJob?.employer ? firstJob.employer.slice(0, 2).toUpperCase() : "JR"
  const toCode = lastJob?.employer ? lastJob.employer.slice(0, 2).toUpperCase() : "SR"
  const fromLabel = firstJob ? `${firstJob.jobTitle || "Junior"}` : "Junior"
  const toLabel = lastJob ? `${lastJob.jobTitle || "Senior"}` : "Senior"

  // Barcode bars
  const barPattern = Array.from({ length: 22 }, (_, i) => (i * 7 + 3) % 10 > 4 ? 1 : 0)

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: "#e8e3d6", color: ink,
      fontFamily: "'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.5,
      padding: 36, display: "flex", flexDirection: "column", gap: 18,
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Ticket 1 — Main boarding pass */}
      <Ticket>
        <div style={{ flex: 1, padding: "28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: red }}>★ BOARDING PASS ★</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>FLIGHT CV · {new Date().getFullYear()}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>FROM</div>
              <div style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1 }}>{fromCode}</div>
              <div style={{ fontSize: 11, color: dim }}>{fromLabel}</div>
            </div>
            <div style={{ fontSize: 28, color: red }}>✈</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>TO</div>
              <div style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1 }}>{toCode}</div>
              <div style={{ fontSize: 11, color: dim }}>{toLabel}</div>
            </div>
          </div>
          <div style={{ borderTop: `1px dashed ${ink}`, marginTop: 24, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, fontSize: 10 }}>
            <Field k="PASSENGER" v={fullName} dim={dim} />
            <Field k="ROLE" v={pd.jobTitle || "Professional"} dim={dim} />
            {pd.email && <Field k="EMAIL" v={pd.email} dim={dim} />}
            {pd.phone && <Field k="PHONE" v={pd.phone} dim={dim} />}
          </div>
        </div>
        <Stub ink={ink}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>SEAT</div>
          <div style={{ fontWeight: 800, fontSize: 44, color: red, lineHeight: 1, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>1A</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, marginTop: 6, color: dim }}>GATE CV · {new Date().getFullYear()}</div>
          <div style={{ marginTop: 16, display: "flex", gap: 2 }}>
            {barPattern.map((on, i) => (
              <div key={i} style={{ width: 2, height: 36, background: on ? ink : "transparent", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
            ))}
          </div>
        </Stub>
      </Ticket>

      {/* Ticket 2 — Career itinerary */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Ticket>
          <div style={{ padding: "20px 32px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: red }}>ITINERARY · {label("workExperience").toUpperCase()}</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{workExperience.length} STOPS</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${ink}` }}>
                  <th style={{ textAlign: "left", padding: "5px 0", letterSpacing: "0.1em", fontSize: 9 }}>YEAR</th>
                  <th style={{ textAlign: "left", padding: "5px 0", letterSpacing: "0.1em", fontSize: 9 }}>CARRIER</th>
                  <th style={{ textAlign: "left", padding: "5px 0", letterSpacing: "0.1em", fontSize: 9 }}>ROLE</th>
                  <th style={{ textAlign: "right", padding: "5px 0", letterSpacing: "0.1em", fontSize: 9 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {workExperience.map((job) => (
                  <tr key={job.id} style={{ borderBottom: `1px dashed ${dim}` }}>
                    <td style={{ padding: "6px 0", fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                      {job.startDate}{job.currentlyWorking ? `—${present}` : job.endDate ? `—${job.endDate}` : ""}
                    </td>
                    <td style={{ padding: "6px 0", fontWeight: 700 }}>{job.employer}</td>
                    <td style={{ padding: "6px 0" }}>{job.jobTitle}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: red, fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Stub ink={ink}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>SKILLS</div>
            <div style={{ fontSize: 10.5, lineHeight: 1.6, marginTop: 6 }}>
              {skills.slice(0, 6).map((sk, i) => (
                <div key={sk.id}>{sk.name}{i < Math.min(skills.length, 6) - 1 ? "" : ""}</div>
              ))}
            </div>
          </Stub>
        </Ticket>
      )}

      {/* Ticket 3 — Contact / Education */}
      <Ticket>
        <div style={{ padding: "16px 32px", flex: 1, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {pd.email && <Field k="EMAIL" v={pd.email} dim={dim} />}
          {pd.phone && <Field k="PHONE" v={pd.phone} dim={dim} />}
          {(pd.city || pd.country) && <Field k="LOCATION" v={[pd.city, pd.country].filter(Boolean).join(", ")} dim={dim} />}
          {pd.linkedin && <Field k="LINKEDIN" v={pd.linkedin} dim={dim} />}
          {visible("languages") && languages.length > 0 && (
            <Field k="LANGUAGES" v={languages.map(l => l.name).join(" · ")} dim={dim} />
          )}
        </div>
        <Stub ink={ink}>
          {visible("education") && education.length > 0 ? (
            <>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>EDU</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{education[0].degree}</div>
              {education[0].institution && <div style={{ fontSize: 10, color: dim }}>{education[0].institution}</div>}
            </>
          ) : (
            <>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", color: dim }}>CERTIFICATIONS</div>
              {certifications.slice(0, 3).map((cert) => (
                <div key={cert.id} style={{ fontSize: 10, marginTop: 4 }}>{cert.name}</div>
              ))}
            </>
          )}
        </Stub>
      </Ticket>
    </div>
  )
}
