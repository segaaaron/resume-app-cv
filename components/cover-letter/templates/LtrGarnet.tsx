"use client"

/**
 * Garnet Letter — faithful 1:1 port (cv-letters-b.jsx · 06). EB Garamond display
 * name, icon trio, hairline rules over a warm cream page. Lato body chrome, EB
 * Garamond letter body. Plum is the user-overridable signature — ATS-safe.
 * The reference "3 numbers" proof block is dropped (we never invent metrics).
 */

import type { TemplateProps } from "./types"
import { AIco } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'
const GARA = 'var(--font-eb-garamond), Garamond, Georgia, serif'

export default function LtrGarnet(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#5b2a55")
  const today = formatToday("es")
  const trio = (["mail", "phone", "pin"] as const).filter((k) => v.contacts.some(([ck]) => ck === k))
  const meta = [props.candidate.email, props.candidate.phone, props.candidate.address].filter(Boolean).join(" · ")

  return (
    <div style={{ fontFamily: LATO, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fffdff", color: "#1a1a1a" }}>
      <div style={{ padding: "42px 52px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, borderBottom: `2px solid ${c}`, paddingBottom: 13 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: GARA, fontSize: 40, fontWeight: 500, lineHeight: 1 }}>{v.name}</h1>
            {v.jobTitle && <div style={{ fontSize: "10.5pt", letterSpacing: "0.24em", textTransform: "uppercase", color: c, marginTop: 7, fontWeight: 700 }}>{v.jobTitle}</div>}
          </div>
          {trio.length > 0 && <div style={{ display: "flex", gap: 6 }}>{trio.map((k) => <AIco key={k} k={k} c={c} size={26} variant="soft" shape="circle" />)}</div>}
        </div>
        {(meta || today) && (
          <div style={{ marginTop: 11, display: "flex", justifyContent: "space-between", gap: 16, fontSize: "10.2pt", color: "#5b6068" }}>
            <span>{meta}</span>
            <span style={{ fontFamily: GARA, fontSize: 12, fontStyle: "italic" }}>{today}</span>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 52px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 16 }}><LTo v={v} font={LATO} color={c} /></div>
        <div style={{ fontFamily: GARA, fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{v.greeting}</div>
        <LBody v={v} font={GARA} fs={13.2} lh={1.62} />
        <div style={{ marginTop: "auto", paddingTop: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <LSign v={v} font={LATO} color={c} />
          <AIco k="spark" c={c} size={34} variant="outline" shape="circle" />
        </div>
      </div>
    </div>
  )
}
