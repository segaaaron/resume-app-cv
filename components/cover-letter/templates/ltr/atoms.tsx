"use client"

/**
 * Cover-letter atoms — the letter-specific pieces (recipient block, body,
 * signature) that pair with the shared ATS atoms so each Ltr* cover letter can
 * be a faithful 1:1 port of the reference design (cv-letters-*.jsx) instead of
 * a shared generic engine. Body is the user's real HTML (sanitised);
 * nothing is fabricated (the reference "3 numbers" proof blocks are dropped —
 * we never invent metrics).
 */

import React from "react"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "../types"

export interface LtrView {
  name: string
  jobTitle: string
  first: string
  last: string
  initials: string
  contacts: Array<[import("@/components/resume/templates/ats/atoms").IconKey, string]>
  date: string
  recipient: { name: string; title: string; company: string }
  role: string
  subject: string
  greeting: string
  bodyHtml: string
  closing: string
}

export function useLtrView({ content, candidate }: TemplateProps, locale: "es" | "en" = "es"): LtrView {
  const first = (candidate.name || "").split(" ")[0] || candidate.name || ""
  const last = (candidate.name || "").split(" ").slice(1).join(" ")
  const initials = (candidate.name || "")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "·"
  const contacts: LtrView["contacts"] = []
  if (candidate.email) contacts.push(["mail", candidate.email])
  if (candidate.phone) contacts.push(["phone", candidate.phone])
  if (candidate.address) contacts.push(["pin", candidate.address])
  if (candidate.linkedin) contacts.push(["link", candidate.linkedin])
  if (candidate.website) contacts.push(["globe", candidate.website])

  const greetingBase = content.recipientName
    ? (locale === "en" ? `Dear ${content.recipientName},` : `Estimado/a ${content.recipientName},`)
    : (locale === "en" ? "Dear Hiring Manager," : "Estimado equipo de selección,")
  const role = content.subject || content.company || (locale === "en" ? "the role" : "el puesto")

  return {
    name: candidate.name || "Your Name",
    jobTitle: candidate.jobTitle || "",
    first, last, initials, contacts,
    date: "", // rendered by the template using toLocaleDateString at call site
    recipient: { name: content.recipientName || "", title: content.recipientTitle || "", company: content.company || "" },
    role,
    subject: content.subject || "",
    greeting: greetingBase,
    bodyHtml: content.body || "",
    closing: content.closing || (locale === "en" ? "Sincerely" : "Atentamente"),
  }
}

/** Recipient block ("To" address). */
export function LTo({ v, font, color }: { v: LtrView; font: string; color: string }) {
  if (!v.recipient.name && !v.recipient.title && !v.recipient.company) return null
  return (
    <div style={{ fontFamily: font, lineHeight: 1.4 }}>
      {v.recipient.name && <div style={{ fontSize: "11pt", fontWeight: 700 }}>{v.recipient.name}</div>}
      {v.recipient.title && <div style={{ fontSize: "10.5pt", color: "#444" }}>{v.recipient.title}</div>}
      {v.recipient.company && <div style={{ fontSize: "10.5pt", color: color, fontWeight: 600 }}>{v.recipient.company}</div>}
    </div>
  )
}

/** Letter body — the candidate's real HTML, sanitised. */
export function LBody({ v, font, fs = 11, lh = 1.6, indent = 0 }: { v: LtrView; font: string; fs?: number; lh?: number; indent?: number }) {
  if (!v.bodyHtml) return null
  return (
    <div
      style={{ fontFamily: font, fontSize: `${fs}pt`, lineHeight: lh, color: "#2a2d33" }}
      className={`[&>p]:mb-[10pt] [&>ul]:mb-[10pt] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[10pt] [&>ol]:list-decimal [&>ol]:pl-5${indent ? " [&>p]:indent-[22px]" : ""}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.bodyHtml) }}
    />
  )
}

/** Signature block — accent rule + name + title. */
export function LSign({ v, font, color, line = true, centered = false }: { v: LtrView; font: string; color: string; line?: boolean; centered?: boolean }) {
  return (
    <div style={{ fontFamily: font, textAlign: centered ? "center" : "left" }}>
      <div style={{ fontSize: "11pt", color: "#2a2d33", marginBottom: 8 }}>{v.closing},</div>
      {line && <div style={{ height: 1.5, width: 100, background: color, opacity: 0.8, marginBottom: 6, marginLeft: centered ? "auto" : 0, marginRight: centered ? "auto" : 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />}
      {v.name && <div style={{ fontSize: "11pt", fontWeight: 700, color }}>{v.name}</div>}
      {v.jobTitle && <div style={{ fontSize: "9.5pt", color: "#666", marginTop: 2 }}>{v.jobTitle}</div>}
    </div>
  )
}

/** Localised today string. */
export function formatToday(locale: "es" | "en"): string {
  return new Date().toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { year: "numeric", month: "long", day: "numeric" })
}
