"use client"

import React from "react"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function LedgerCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fafaf2"
  const ink = "#1a1a1a"
  const green = config.colorScheme || "#2a7a3a"
  const red = "#b22d2d"

  function Th({ children, right, colSpan }: { children: React.ReactNode; right?: boolean; colSpan?: number }) {
    return (
      <th colSpan={colSpan} style={{
        textAlign: right ? "right" : "left",
        padding: "8px 10px", fontSize: 9, letterSpacing: "0.18em",
        borderRight: "1px solid #444",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {children}
      </th>
    )
  }

  function Td({
    children, right, isGreen, isRed, bold, colSpan,
  }: {
    children: React.ReactNode; right?: boolean; isGreen?: boolean; isRed?: boolean; bold?: boolean; colSpan?: number;
  }) {
    return (
      <td colSpan={colSpan} style={{
        padding: "6px 10px",
        textAlign: right ? "right" : "left",
        borderRight: "1px solid #ccc",
        color: isGreen ? green : isRed ? red : ink,
        fontWeight: bold ? 700 : 400,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {children}
      </td>
    )
  }

  function Cell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ border: `1px solid ${ink}`, padding: 12 }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.18em",
          borderBottom: `1px solid ${ink}`, paddingBottom: 4, marginBottom: 8,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {title}
        </div>
        <div style={{ lineHeight: 1.85, fontSize: 10.5 }}>{children}</div>
      </div>
    )
  }

  // Build ledger rows from all sections
  const rows: Array<{
    date: string; account: string; description: string; debit: string; credit: string; jobDesc?: string;
  }> = []

  // Work experience rows
  if (visible("workExperience")) {
    workExperience.forEach((job) => {
      const startY = job.startDate?.match(/\d{4}/)?.[0] ?? ""
      const endY = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
      rows.push({
        date: startY ? `${startY}${endY ? `-${endY.slice(-2)}` : ""}` : "—",
        account: job.jobTitle || "",
        description: `${job.employer || ""}${job.city ? ` · ${job.city}` : ""}`,
        debit: "",
        credit: "",
        jobDesc: job.description || undefined,
      })
    })
  }

  // Education rows
  if (visible("education")) {
    education.forEach((edu, i) => {
      const y = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
      rows.push({
        date: `EDU-${String(i + 1).padStart(2, "0")}`,
        account: [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" "),
        description: `${edu.institution || ""}${y ? ` · ${y}` : ""}`,
        debit: "",
        credit: "",
      })
    })
  }

  // Certifications rows
  if (visible("certifications") && certifications.length > 0) {
    certifications.forEach((cert, i) => {
      rows.push({
        date: cert.date?.match(/\d{4}/)?.[0] ?? `CERT-${String(i + 1).padStart(2, "0")}`,
        account: cert.name,
        description: cert.issuer || "",
        debit: "",
        credit: "",
      })
    })
  }

  // Languages row
  if (visible("languages") && languages.length > 0) {
    rows.push({
      date: "LANG",
      account: label("languages"),
      description: languages.map((l) => `${l.name} ${l.level.toUpperCase()}`).join(" · "),
      debit: "",
      credit: "",
    })
  }

  // Skills row
  if (visible("skills") && skills.length > 0) {
    rows.push({
      date: "TOOL",
      account: label("skills"),
      description: skills.map((s) => s.name).join(" · "),
      debit: "",
      credit: "",
    })
  }

  // Summary row
  if (visible("summary") && summary) {
    rows.push({
      date: "SUM",
      account: config.language === "en" ? "Total experience" : "Experiencia total",
      description: summary.slice(0, 80) + (summary.length > 80 ? "…" : ""),
      debit: `${workExperience.length} ${config.language === "en" ? "positions" : "cargos"}`,
      credit: "",
    })
  }

  const totalYears = (() => {
    let total = 0
    workExperience.forEach((job) => {
      const start = parseInt(job.startDate?.match(/\d{4}/)?.[0] ?? "0")
      const end = job.currentlyWorking
        ? new Date().getFullYear()
        : parseInt(job.endDate?.match(/\d{4}/)?.[0] ?? String(start))
      if (start > 0) total += end - start
    })
    return total
  })()

  const now = new Date()
  const dateStr = `${config.language === "en" ? "APR" : "ABR"} ${now.getFullYear()}`

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "ui-monospace, monospace", fontSize: 10.5, padding: 36,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Ledger header */}
      <div style={{
        borderTop: `2px solid ${ink}`, borderBottom: `2px solid ${ink}`,
        padding: "8px 12px", display: "flex", justifyContent: "space-between",
        fontSize: 9.5, letterSpacing: "0.18em", marginBottom: 14,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>{config.language === "en" ? "GENERAL LEDGER · CV" : "LIBRO MAYOR · CV"}</span>
        <span>FOLIO 001</span>
        <span>FY {now.getFullYear()}</span>
      </div>

      {/* Name & title */}
      <h1 style={{
        fontFamily: "'Inter Tight', sans-serif", fontWeight: 800,
        fontSize: 44, margin: 0, letterSpacing: "-0.02em",
        textTransform: "uppercase" as const,
      }}>
        {pd.firstName || "FIRST"} {pd.lastName || "LAST"}
      </h1>
      {pd.jobTitle && (
        <div style={{ fontSize: 12 }}>{pd.jobTitle}</div>
      )}

      {/* Main ledger table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 22, fontSize: 10.5 }}>
        <thead>
          <tr style={{
            background: ink, color: paper,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            <Th>{config.language === "en" ? "DATE" : "FECHA"}</Th>
            <Th>{config.language === "en" ? "ACCOUNT" : "CUENTA"}</Th>
            <Th>{config.language === "en" ? "DESCRIPTION" : "DESCRIPCIÓN"}</Th>
            <Th right>{config.language === "en" ? "DEBIT" : "DEBE"}</Th>
            <Th right>{config.language === "en" ? "CREDIT" : "HABER"}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <tr style={{
                background: i % 2 ? "#f0f0e6" : paper,
                WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
              }}>
                <Td>{r.date}</Td>
                <Td bold>{r.account}</Td>
                <Td>{r.description}</Td>
                <Td right isGreen>{r.debit}</Td>
                <Td right isRed>{r.credit}</Td>
              </tr>
              {r.jobDesc && (
                <tr key={`${i}-d`} style={{
                  background: i % 2 ? "#f0f0e6" : paper,
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                }}>
                  <td />
                  <td colSpan={4} style={{ padding: "2px 8px 8px", borderBottom: "1px solid #ddd" }}>
                    <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(r.jobDesc) }} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr style={{
            borderTop: `2px solid ${ink}`, fontWeight: 700,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            <Td colSpan={3}>{config.language === "en" ? "BALANCE FORWARD" : "SALDO ACUMULADO"}</Td>
            <Td right isGreen>{totalYears > 0 ? `${totalYears} ${config.language === "en" ? "yrs" : "años"}` : "—"}</Td>
            <Td right>—</Td>
          </tr>
        </tfoot>
      </table>

      {/* Three-column footer cells */}
      <section style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        <Cell title={`${config.language === "en" ? "ASSETS" : "ACTIVOS"} · ${label("skills")}`}>
          {skills.map((sk) => (
            <div key={sk.id}>● {sk.name}</div>
          ))}
        </Cell>

        <Cell title={`${config.language === "en" ? "LIABILITIES" : "PASIVOS"} · ${config.language === "en" ? "seeking" : "buscando"}`}>
          {projects && projects.length > 0 ? (
            projects.slice(0, 3).map((proj) => (
              <div key={proj.id}>○ {proj.name}</div>
            ))
          ) : (
            <>
              <div>○ {config.language === "en" ? "New challenges" : "Nuevos retos"}</div>
              <div>○ {config.language === "en" ? "Great team" : "Buen equipo"}</div>
            </>
          )}
        </Cell>

        <Cell title={`${config.language === "en" ? "EQUITY" : "PATRIMONIO"} · ${config.language === "en" ? "contact" : "contacto"}`}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
          {pd.linkedin && <div>{pd.linkedin}</div>}
          {pd.website && <div>{pd.website}</div>}
          <div style={{ marginTop: 6, color: green, fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            STATUS: {config.language === "en" ? "AVAILABLE ✓" : "DISPONIBLE ✓"}
          </div>
        </Cell>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", borderTop: `2px solid ${ink}`, paddingTop: 8,
        display: "flex", justifyContent: "space-between",
        fontSize: 9, letterSpacing: "0.2em",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>{config.language === "en" ? "RECONCILED" : "CONCILIADO"} · {dateStr}</span>
        <span>{config.language === "en" ? "AUDITOR" : "AUDITOR"}: {(pd.firstName?.[0] ?? "X")}. {pd.lastName || "LAST"}</span>
        <span>STAMP ✓</span>
      </footer>
    </div>
  )
}
