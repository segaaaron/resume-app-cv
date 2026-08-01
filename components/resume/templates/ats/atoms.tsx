"use client"

/**
 * ATS atoms — faithful React port of the reference design's ATS kit
 * (planillas-lujosas / cv-ats-kit.jsx). These primitives reproduce the exact
 * icons, section headings, bullets, chips, groups, bars and metric rows of the
 * original 15 ATS templates, so each Ats* component can be rebuilt 1:1 instead
 * of going through the generic AtsBase engine.
 *
 * ATS-safe by construction: real selectable text, single logical column, icons
 * are decorative SVG always paired with a plain-text label, no text inside
 * images. System-safe: colour comes from the template (signature or the user's
 * override), never hardcoded here.
 */

import React from "react"

/** rgba() from a hex + alpha. */
export function aFade(hex: string, a: number): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
/** Darken a hex toward black by amt (0..1). */
export function aMix(hex: string, amt: number): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h
  const n = parseInt(full, 16)
  const f = (x: number) => Math.round(x * (1 - amt))
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
}

export type IconKey =
  | "mail" | "phone" | "pin" | "globe" | "link" | "git" | "brief" | "cap" | "medal"
  | "star" | "spark" | "chart" | "target" | "code" | "check" | "gear" | "users"
  | "book" | "shield" | "flag" | "layers" | "lang" | "clock" | "user" | "bolt"

/** Inline monoline/solid icons — exact reproduction of the reference AtsIco set. */
export const ATS_ICONS: Record<IconKey, React.ReactNode> = {
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M6.6 3h-2A1.6 1.6 0 0 0 3 4.7C3 13.2 10.8 21 19.3 21A1.6 1.6 0 0 0 21 19.4v-2a1.5 1.5 0 0 0-1.2-1.5l-3-.6a1.5 1.5 0 0 0-1.5.6l-.9 1.2a13 13 0 0 1-5.5-5.5l1.2-.9a1.5 1.5 0 0 0 .6-1.5l-.6-3A1.5 1.5 0 0 0 8.6 3z" />,
  pin: <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z" /></>,
  link: <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zM8.4 18H6V9.8h2.4V18zM7.2 8.6a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8zM18 18h-2.4v-4c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1a1.7 1.7 0 0 0-.1.7V18h-2.4V9.8h2.4v1.1a2.9 2.9 0 0 1 2.5-1.3c1.7 0 2.6 1.1 2.6 3.4V18z" />,
  git: <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.4-1.1-1.1-1.4-1.1-1.4-.9-.7 0-.6 0-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.3 1.1 2.9.9.1-.7.4-1.1.6-1.4-2.2-.2-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9.4.3.7.9.7 1.9v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />,
  brief: <path d="M9 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a2 2 0 0 0-2-2H9zm0 2h6v1H9V5z" />,
  cap: <path d="M12 3 1 8.5 12 14l11-5.5L12 3zM5 12.6V17c0 1.9 3.1 3.4 7 3.4s7-1.5 7-3.4v-4.4l-7 3.5-7-3.5z" />,
  medal: <path d="M12 2 8.5 8h7L12 2zM6.8 9 3 9.6l2.7 2.4-.7 3.6 3.4-1.7L12 15.6V9H6.8zM12 9v6.6l3.6-1.7 3.4 1.7-.7-3.6L21 9.6 17.2 9H12z" />,
  star: <path d="m12 2 3 6.5 7 .9-5.2 4.8 1.3 7L12 17.8 5.9 21.2l1.3-7L2 9.4l7-.9L12 2z" />,
  spark: <path d="M12 2l1.8 6.9L21 11l-7.2 2.1L12 22l-1.8-8.9L3 11l7.2-2.1L12 2z" />,
  chart: <path d="M4 20h16v2H2V2h2v18zm3-3V9h3v8H7zm5 0V5h3v12h-3zm5 0v-6h3v6h-3z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></>,
  code: <path d="m15.5 5.5 5.5 6.5-5.5 6.5M8.5 5.5 3 12l5.5 6.5" />,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M4.3 4.3l2.1 2.1M17.6 17.6l2.1 2.1M2.5 12h3M18.5 12h3M4.3 19.7l2.1-2.1M17.6 6.4l2.1-2.1" /></>,
  users: <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4zm8-2a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm.5 2c-.7 0-1.3.1-1.9.3 1.5 1 2.4 2.4 2.4 3.9V19h5v-1.8c0-2.3-2.5-4.2-5.5-4.2z" />,
  book: <path d="M4 3h6a3 3 0 0 1 2 .8V21a3 3 0 0 0-2-.8H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm16 0h-6a3 3 0 0 0-2 .8V21a3 3 0 0 1 2-.8h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" />,
  shield: <path d="M12 2 4 5v7c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V5l-8-3zm-1 13.4-3.2-3.2 1.4-1.4 1.8 1.8 4-4 1.4 1.4-5.4 5.4z" />,
  flag: <path d="M5 3v18H3V3h2zm2 0h13l-3 5 3 5H7V3z" />,
  layers: <path d="m12 2 10 5.5-10 5.5L2 7.5 12 2zm7.7 8.2L22 11.5 12 17 2 11.5l2.3-1.3L12 14.4l7.7-4.2zm0 4.5L22 16 12 21.5 2 16l2.3-1.3L12 18.9l7.7-4.2z" />,
  lang: <path d="M11.5 3v1.6H3V6.3h2.1a10 10 0 0 0 2.6 4.6A11 11 0 0 1 3 13.2l.6 1.7a13 13 0 0 0 5.4-2.8 13 13 0 0 0 2.4 1.6l.7-1.6a10 10 0 0 1-1.9-1.2 11 11 0 0 0 3-4.6h1.3V4.6h-3V3h-2zm-.4 3.3a8 8 0 0 1-2.1 3.3A8 8 0 0 1 7 6.3h4.1zM17 12l-4.4 10h2l1-2.4h4l1 2.4h2L18 12h-1zm.5 3 1.2 3h-2.5l1.3-3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.5 2" /></>,
  user: <path d="M12 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 11c-4.4 0-8 2.4-8 5.3V21h16v-1.7c0-2.9-3.6-5.3-8-5.3z" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
}

// Icons that draw with stroke (not fill).
const STROKE_ICONS = new Set<IconKey>(["mail", "globe", "target", "code", "check", "gear", "clock"])

function Svg({ k, size, color }: { k: IconKey; size: number; color: string }) {
  const stroke = STROKE_ICONS.has(k)
  const sw = k === "check" ? 3 : k === "code" ? 2.3 : k === "target" ? 2.2 : k === "gear" || k === "clock" ? 2.2 : 2
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      fill={stroke ? "none" : color} stroke={stroke ? color : undefined}
      strokeWidth={stroke ? sw : undefined} strokeLinecap="round" strokeLinejoin="round">
      {ATS_ICONS[k]}
    </svg>
  )
}

type IcoVariant = "solid" | "soft" | "outline" | "plain"
type IcoShape = "rounded" | "circle" | "square"

/** Icon inside a prominent shape (solid | soft | outline | plain). */
export function AIco({ k, c, size = 20, variant = "solid", shape = "rounded", ink = "#fff", style }: {
  k: IconKey; c: string; size?: number; variant?: IcoVariant; shape?: IcoShape; ink?: string; style?: React.CSSProperties
}) {
  const r = shape === "circle" ? "50%" : shape === "square" ? 2 : Math.round(size * 0.28)
  const box: React.CSSProperties =
    variant === "solid" ? { background: c, color: ink }
    : variant === "soft" ? { background: aFade(c, 0.14), color: c }
    : variant === "outline" ? { background: "transparent", color: c, border: `1.5px solid ${aFade(c, 0.55)}` }
    : { background: "transparent", color: c }
  const plain = variant === "plain"
  return (
    <span style={{
      width: size, height: size, borderRadius: plain ? 0 : r, display: "inline-grid", placeItems: "center",
      flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", ...box, ...style,
    }}>
      <Svg k={k} size={Math.round(size * (plain ? 1 : 0.56))} color={plain ? c : (variant === "solid" ? ink : c)} />
    </span>
  )
}

export type HeadVariant = "bar" | "box" | "rule" | "tab" | "caps" | "split" | "badge" | "underline"

/** Section heading. Reproduces the reference AHead variants. */
export function AHead({ icon, color, variant = "badge", font, children, sub, mb = 10, size = 12.5, track = "0.14em" }: {
  icon: IconKey; color: string; variant?: HeadVariant; font: string; children: React.ReactNode
  sub?: string; mb?: number; size?: number; track?: string
}) {
  const label = <span style={{ fontFamily: font, fontWeight: 700, fontSize: size, letterSpacing: track, textTransform: "uppercase" }}>{children}</span>
  const wrap: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, marginBottom: mb, color: "#16181d" }
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  if (variant === "bar") return <div style={{ ...wrap, background: color, color: "#fff", padding: "6px 12px", borderRadius: 3, ...pca }}><AIco k={icon} c="#fff" variant="plain" size={14} />{label}</div>
  if (variant === "box") return <div style={{ ...wrap, border: `1.5px solid ${color}`, padding: "5px 12px", color }}><AIco k={icon} c={color} variant="plain" size={14} />{label}</div>
  if (variant === "rule") return <div style={{ marginBottom: mb }}><div style={{ ...wrap, marginBottom: 5, color }}><AIco k={icon} c={color} size={20} variant="soft" shape="circle" />{label}</div><div style={{ height: 2, background: aFade(color, 0.28), ...pca }}><div style={{ width: 64, height: "100%", background: color, ...pca }} /></div></div>
  if (variant === "tab") return <div style={{ marginBottom: mb }}><div style={{ ...wrap, marginBottom: 4 }}><AIco k={icon} c={color} size={18} variant="plain" />{label}</div><div style={{ height: 1, background: "#dcdde2" }} /></div>
  if (variant === "caps") return <div style={wrap}><AIco k={icon} c={color} size={22} variant="solid" shape="circle" />{label}<span style={{ flex: 1, height: 1, background: aFade(color, 0.3) }} /></div>
  if (variant === "split") return <div style={{ ...wrap, borderBottom: `2px solid ${color}`, paddingBottom: 6 }}><AIco k={icon} c={color} size={22} variant="solid" shape="square" />{label}{sub && <span style={{ marginLeft: "auto", fontSize: 9.5, letterSpacing: "0.1em", color: "#8b8f98", textTransform: "uppercase" }}>{sub}</span>}</div>
  if (variant === "underline") return <div style={{ ...wrap, borderBottom: `2px solid ${color}`, paddingBottom: 4, color }}><AIco k={icon} c={color} variant="plain" size={14} />{label}</div>
  // badge (default)
  return <div style={{ ...wrap, background: aFade(color, 0.1), padding: "5px 12px", borderRadius: 4, color, ...pca }}><AIco k={icon} c={color} variant="plain" size={14} />{label}</div>
}

/** Contact line — icon + plain text, wraps. */
export function AContact({ items, color, variant = "plain", shape = "rounded", size = 13, font, fs = 10.4, gap = "6px 18px", ink = "#3c4048", dir = "row", iconInk = "#fff" }: {
  items: Array<[IconKey, string]>; color: string; variant?: IcoVariant; shape?: IcoShape; size?: number
  font: string; fs?: number; gap?: string; ink?: string; dir?: "row" | "column"; iconInk?: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: dir, flexWrap: "wrap", gap, fontFamily: font, fontSize: fs, color: ink }}>
      {items.map(([k, t]) => <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}><AIco k={k} c={color} size={size} variant={variant} shape={shape} ink={iconInk} />{t}</span>)}
    </div>
  )
}

type Marker = "check" | "dot" | "dash" | "sq" | "star" | "medal" | "bolt"

/** Bulleted achievements with an icon/shape marker. Accepts an array or raw HTML. */
export function ABullets({ items, color, font, marker = "check", fs = 10.8, ink = "#43474f", lh = 1.55, gap = 5 }: {
  items: string[]; color: string; font: string; marker?: Marker; fs?: number; ink?: string; lh?: number; gap?: number
}) {
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, fontFamily: font }}>
      {items.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: fs, color: ink, lineHeight: lh }}>
          {marker === "dot" ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 5.5, flexShrink: 0, ...pca }} />
            : marker === "dash" ? <span style={{ width: 9, height: 2, background: color, marginTop: 7, flexShrink: 0, ...pca }} />
            : marker === "sq" ? <span style={{ width: 6, height: 6, background: color, marginTop: 5, flexShrink: 0, transform: "rotate(45deg)", ...pca }} />
            : <span style={{ marginTop: 1.5, flexShrink: 0 }}><AIco k={marker as IconKey} c={color} variant="plain" size={11} /></span>}
          <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: b }} />
        </div>
      ))}
    </div>
  )
}

type ChipVariant = "pill" | "outline" | "solid" | "soft" | "square"

/** Skill chips. */
export function AChips({ items, color, font, variant = "pill", fs = 10, ink }: {
  items: string[]; color: string; font: string; variant?: ChipVariant; fs?: number; ink?: string
}) {
  const base: React.CSSProperties = { fontFamily: font, fontSize: fs, padding: variant === "square" ? "5px 9px" : "4.5px 11px", borderRadius: variant === "pill" ? 100 : variant === "square" ? 2 : 4, whiteSpace: "nowrap", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }
  const skin: React.CSSProperties = variant === "outline" ? { border: `1px solid ${aFade(color, 0.5)}`, color: ink || color, background: "#fff" }
    : variant === "solid" ? { background: color, color: "#fff", fontWeight: 600 }
    : { background: aFade(color, 0.1), color: ink || aMix(color, 0.15), fontWeight: 600 }
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{items.map((s) => <span key={s} style={{ ...base, ...skin }}>{s}</span>)}</div>
}

/** Categorised skill groups (label + items joined by · ). */
export function AGroups({ groups, color, font, cols = 2, fs = 10.5, ink = "#43474f", icon }: {
  groups: Array<{ label: string; items: string[] }>; color: string; font: string; cols?: number; fs?: number; ink?: string; icon?: IconKey
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px 26px", fontFamily: font }}>
      {groups.map((g) => (
        <div key={g.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9.8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, marginBottom: 4 }}>{icon && <AIco k={icon} c={color} variant="plain" size={11} />}{g.label}</div>
          <div style={{ fontSize: fs, color: ink, lineHeight: 1.5 }}>{g.items.join(" · ")}</div>
        </div>
      ))}
    </div>
  )
}

/** Language proficiency bars. */
export function ABars({ items, color, font, fs = 10.2, ink = "#43474f", h = 5, rounded = true }: {
  items: Array<{ name: string; level: string; pct: number }>; color: string; font: string; fs?: number; ink?: string; h?: number; rounded?: boolean
}) {
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: font }}>
      {items.map((l) => (
        <div key={l.name}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: fs, color: ink, marginBottom: 3 }}><span style={{ fontWeight: 600 }}>{l.name}</span><span style={{ color: aMix(color, 0.05) }}>{l.level}</span></div>
          <div style={{ height: h, background: aFade(color, 0.14), borderRadius: rounded ? h : 0, ...pca }}><div style={{ width: `${l.pct}%`, height: "100%", background: color, borderRadius: rounded ? h : 0, ...pca }} /></div>
        </div>
      ))}
    </div>
  )
}

/** Metric row — quantified highlights, keyword-rich for parsers. */
export function AMetrics({ items, color, font, variant = "soft" }: {
  items: Array<{ k: string; v: string }>; color: string; font: string; variant?: "soft" | "outline" | "left"
}) {
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, fontFamily: font }}>
      {items.map((m) => (
        <div key={m.k} style={{ padding: "9px 12px", borderRadius: 4, background: variant === "soft" ? aFade(color, 0.08) : "#fff", border: variant === "soft" ? "none" : `1px solid ${aFade(color, 0.35)}`, borderLeft: variant === "left" ? `3px solid ${color}` : undefined, ...pca }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: aMix(color, 0.1), letterSpacing: "-0.01em" }}>{m.k}</div>
          <div style={{ fontSize: 9.2, color: "#6b7078", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 1 }}>{m.v}</div>
        </div>
      ))}
    </div>
  )
}

export const ATS_SERIF = 'var(--font-cormorant), Georgia, "Times New Roman", serif'
export const ATS_SANS = 'var(--font-space-grotesk), "Segoe UI", system-ui, -apple-system, sans-serif'
