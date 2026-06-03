// Free template thumbnail components — premium SVG mockups
// All thumbs share viewBox="0 0 80 110" (A4-ish). Each thumb uses the user's
// `color` as protagonist (headers, dividers, accents, dots) and a subtle
// drop shadow rect behind the document body to lift it off the card frame.
import React from "react"

// ---------- shared helpers ----------
// Subtle drop-shadow rect placed behind the document body. Use as the very
// first child after the background so it sits beneath the page surface.
// We render a single near-flat rect with low opacity — keeps SVG cheap.
export const PageShadow = () => (
  <rect x="2.5" y="3" width="76.5" height="106" rx="1" fill="#0f172a" opacity="0.05" />
)

// Tiny reusable contact-icon glyphs for sidebars (circle + line).
const ContactGlyph = ({ x, y, fill }: { x: number; y: number; fill: string }) => (
  <g>
    <circle cx={x} cy={y} r="1.2" fill={fill} opacity="0.7" />
    <rect x={x + 2.2} y={y - 0.5} width="10" height="1" rx="0.5" fill={fill} opacity="0.45" />
  </g>
)

// ============================================================
// CLASSIC — clean black/white doc with color divider + section dots
// ============================================================
export function ClassicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="classicBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fafbfd" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="url(#classicBg)" />
      {/* Name + title */}
      <rect x="8" y="9" width="38" height="3.5" rx="1" fill="#0f172a" />
      <rect x="8" y="15" width="24" height="1.5" rx="0.75" fill={color} />
      {/* Divider */}
      <rect x="8" y="20" width="64" height="0.8" fill={color} opacity="0.5" />
      {/* Summary lines (varied widths) */}
      <rect x="8" y="25" width="62" height="1.3" rx="0.65" fill="#cbd5e1" />
      <rect x="8" y="29" width="48" height="1.3" rx="0.65" fill="#cbd5e1" />
      <rect x="8" y="33" width="58" height="1.3" rx="0.65" fill="#cbd5e1" />
      {/* Section: Experience (dot + label) */}
      <circle cx="9.5" cy="41.5" r="1.2" fill={color} />
      <rect x="12" y="40.5" width="22" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="8" y="46" width="62" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="50" width="50" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="54" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      {/* Section: Education */}
      <circle cx="9.5" cy="62.5" r="1.2" fill={color} />
      <rect x="12" y="61.5" width="22" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="8" y="67" width="62" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="71" width="44" height="1.2" rx="0.6" fill="#e2e8f0" />
      {/* Section: Skills */}
      <circle cx="9.5" cy="80.5" r="1.2" fill={color} />
      <rect x="12" y="79.5" width="18" height="2" rx="1" fill={color} opacity="0.85" />
      {/* Skill chips */}
      <rect x="8" y="85" width="14" height="3" rx="1.5" fill={color} opacity="0.18" />
      <rect x="24" y="85" width="11" height="3" rx="1.5" fill={color} opacity="0.18" />
      <rect x="37" y="85" width="16" height="3" rx="1.5" fill={color} opacity="0.18" />
      <rect x="55" y="85" width="12" height="3" rx="1.5" fill={color} opacity="0.18" />
    </svg>
  )
}

// ============================================================
// MODERN — dark sidebar (gradient) + photo ring + main column
// ============================================================
export function ModernThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="modernSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Dark sidebar with subtle gradient */}
      <rect x="2" y="2" width="24" height="106" fill="url(#modernSide)" />
      {/* Photo ring */}
      <circle cx="14" cy="16" r="7" fill="#374151" />
      <circle cx="14" cy="16" r="7" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="14" cy="14" r="2.5" fill="#9ca3af" opacity="0.6" />
      <path d="M8 22 Q14 18 20 22 L20 24 L8 24 Z" fill="#9ca3af" opacity="0.6" />
      {/* Contact glyphs */}
      <ContactGlyph x={5} y={30} fill="#ffffff" />
      <ContactGlyph x={5} y={34} fill="#ffffff" />
      <ContactGlyph x={5} y={38} fill="#ffffff" />
      {/* Sidebar section: Skills */}
      <rect x="5" y={44} width="14" height="1.5" rx="0.75" fill={color} />
      <rect x="5" y={48} width="16" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y={48} width="11" height="0.8" rx="0.4" fill={color} opacity="0.85" />
      <rect x="5" y={51} width="16" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y={51} width="14" height="0.8" rx="0.4" fill={color} opacity="0.85" />
      <rect x="5" y={54} width="16" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y={54} width="9" height="0.8" rx="0.4" fill={color} opacity="0.85" />
      {/* Sidebar section: Languages */}
      <rect x="5" y={62} width="14" height="1.5" rx="0.75" fill={color} />
      <rect x="5" y={66} width="16" height="0.9" rx="0.45" fill="#ffffff" opacity="0.25" />
      <rect x="5" y={70} width="13" height="0.9" rx="0.45" fill="#ffffff" opacity="0.25" />
      {/* Main column header */}
      <rect x="30" y="10" width="38" height="3.5" rx="1" fill="#0f172a" />
      <rect x="30" y="16" width="24" height="1.6" rx="0.8" fill={color} />
      <rect x="30" y="22" width="40" height="0.6" fill={color} opacity="0.4" />
      {/* Summary block */}
      <rect x="30" y="26" width="44" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="30" y="29.5" width="38" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="30" y="33" width="42" height="1.2" rx="0.6" fill="#cbd5e1" />
      {/* Experience entry */}
      <rect x="30" y="40" width="18" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="60" y="40.5" width="12" height="1.2" rx="0.6" fill="#94a3b8" />
      <rect x="30" y="45" width="44" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="48.5" width="36" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="52" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      {/* Second entry */}
      <rect x="30" y="59" width="20" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="60" y="59.5" width="12" height="1.2" rx="0.6" fill="#94a3b8" />
      <rect x="30" y="64" width="44" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="67.5" width="40" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="71" width="36" height="1.1" rx="0.55" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// SIDEBAR RESUME — color sidebar (saturated) with white glyphs
// ============================================================
export function SidebarResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sideAccent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Saturated color sidebar */}
      <rect x="2" y="2" width="24" height="106" fill="url(#sideAccent)" />
      {/* Avatar */}
      <circle cx="14" cy="16" r="7" fill="#ffffff" opacity="0.95" />
      <circle cx="14" cy="14.5" r="2.3" fill={color} opacity="0.55" />
      <path d="M8.5 22 Q14 18.5 19.5 22 L19.5 23 L8.5 23 Z" fill={color} opacity="0.55" />
      {/* Contact glyphs in white */}
      <ContactGlyph x={5} y={30} fill="#ffffff" />
      <ContactGlyph x={5} y={34} fill="#ffffff" />
      <ContactGlyph x={5} y={38} fill="#ffffff" />
      {/* Sidebar label */}
      <rect x="5" y="46" width="14" height="1.6" rx="0.8" fill="#ffffff" />
      <rect x="5" y="50" width="16" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      <rect x="5" y="53" width="12" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      <rect x="5" y="56" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      {/* Languages */}
      <rect x="5" y="64" width="14" height="1.6" rx="0.8" fill="#ffffff" />
      <rect x="5" y="68" width="16" height="0.9" rx="0.45" fill="#ffffff" opacity="0.3" />
      <rect x="5" y="68" width="12" height="0.9" rx="0.45" fill="#ffffff" />
      <rect x="5" y="72" width="16" height="0.9" rx="0.45" fill="#ffffff" opacity="0.3" />
      <rect x="5" y="72" width="9" height="0.9" rx="0.45" fill="#ffffff" />
      {/* Main header */}
      <rect x="30" y="10" width="36" height="3.5" rx="1" fill="#0f172a" />
      <rect x="30" y="16" width="22" height="1.6" rx="0.8" fill={color} />
      <rect x="30" y="22" width="44" height="0.6" fill={color} opacity="0.45" />
      {/* Main content */}
      <rect x="30" y="26" width="44" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="30" y="29.5" width="38" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="30" y="33" width="42" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="30" y="40" width="20" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="30" y="45" width="44" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="48.5" width="38" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="52" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="59" width="22" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="30" y="64" width="44" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="30" y="67.5" width="36" height="1.1" rx="0.55" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// ELEGANT — centered serif feel with diamond divider
// ============================================================
export function ElegantResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Centered name */}
      <rect x="20" y="12" width="40" height="4" rx="1.5" fill="#0f172a" />
      <rect x="26" y="18" width="28" height="1.6" rx="0.8" fill="#64748b" />
      {/* Diamond divider */}
      <rect x="10" y="26" width="24" height="0.8" fill={color} opacity="0.6" />
      <g transform="translate(40 26) rotate(45)">
        <rect x="-2.2" y="-2.2" width="4.4" height="4.4" fill={color} />
      </g>
      <rect x="46" y="26" width="24" height="0.8" fill={color} opacity="0.6" />
      {/* Profile paragraph */}
      <rect x="14" y="34" width="52" height="1.3" rx="0.65" fill="#cbd5e1" />
      <rect x="14" y="38" width="48" height="1.3" rx="0.65" fill="#cbd5e1" />
      <rect x="14" y="42" width="52" height="1.3" rx="0.65" fill="#cbd5e1" />
      <rect x="18" y="46" width="44" height="1.3" rx="0.65" fill="#cbd5e1" />
      {/* Section: Experience — centered label */}
      <rect x="30" y="54" width="20" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="32" y="58" width="16" height="0.6" fill={color} opacity="0.5" />
      <rect x="10" y="62" width="60" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="10" y="65.5" width="52" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="10" y="69" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      {/* Section: Education */}
      <rect x="30" y="76" width="20" height="2" rx="1" fill={color} opacity="0.85" />
      <rect x="32" y="80" width="16" height="0.6" fill={color} opacity="0.5" />
      <rect x="10" y="84" width="60" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="10" y="87.5" width="44" height="1.2" rx="0.6" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// PROFESSIONAL — full color header band + skill bars + content
// ============================================================
export function ProfessionalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="proHeader" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Header band */}
      <rect x="2" y="2" width="76" height="24" fill="url(#proHeader)" />
      <rect x="8" y="8" width="38" height="3.5" rx="1" fill="#ffffff" />
      <rect x="8" y="14" width="26" height="1.6" rx="0.8" fill="#ffffff" opacity="0.75" />
      {/* Header info row */}
      <rect x="8" y="19" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      <rect x="26" y="19" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      <rect x="44" y="19" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.55" />
      <rect x="2" y="26" width="76" height="2" fill={color} opacity="0.55" />
      {/* Left column — skills with progress bars */}
      <rect x="6" y="32" width="18" height="1.8" rx="0.9" fill={color} />
      <rect x="6" y="38" width="20" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="6" y="38" width="16" height="1.2" rx="0.6" fill={color} opacity="0.85" />
      <rect x="6" y="42" width="20" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="6" y="42" width="18" height="1.2" rx="0.6" fill={color} opacity="0.85" />
      <rect x="6" y="46" width="20" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="6" y="46" width="11" height="1.2" rx="0.6" fill={color} opacity="0.85" />
      <rect x="6" y="50" width="20" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="6" y="50" width="14" height="1.2" rx="0.6" fill={color} opacity="0.85" />
      {/* Languages */}
      <rect x="6" y="58" width="18" height="1.8" rx="0.9" fill={color} />
      <rect x="6" y="63" width="22" height="1" rx="0.5" fill="#94a3b8" />
      <rect x="6" y="66" width="18" height="1" rx="0.5" fill="#94a3b8" />
      {/* Vertical divider */}
      <line x1="30" y1="32" x2="30" y2="100" stroke="#e2e8f0" strokeWidth="0.6" />
      {/* Right column — experience */}
      <rect x="34" y="32" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="34" y="38" width="40" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="34" y="41.5" width="34" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="34" y="45" width="38" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="34" y="52" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="34" y="58" width="40" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="34" y="61.5" width="32" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="34" y="65" width="38" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="34" y="72" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="34" y="78" width="40" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="34" y="81.5" width="28" height="1.2" rx="0.6" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// EXECUTIVE — top stripe + serif name + monogram crest
// ============================================================
export function ExecutiveResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Top accent stripe (gradient) */}
      <defs>
        <linearGradient id="execStripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="76" height="6" fill="url(#execStripe)" />
      {/* Monogram crest */}
      <circle cx="14" cy="20" r="6" fill="none" stroke={color} strokeWidth="1.2" />
      <rect x="11" y="17.5" width="6" height="5" rx="0.5" fill={color} opacity="0.6" />
      {/* Name */}
      <rect x="24" y="15" width="42" height="4" rx="1" fill="#0f172a" />
      <rect x="24" y="21" width="26" height="2" rx="1" fill={color} />
      {/* Thin rule */}
      <rect x="8" y="28" width="64" height="0.6" fill="#0f172a" opacity="0.3" />
      {/* Profile */}
      <rect x="8" y="32" width="22" height="1.8" rx="0.9" fill={color} opacity="0.85" />
      <rect x="8" y="37" width="62" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="8" y="40.5" width="56" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="8" y="44" width="60" height="1.2" rx="0.6" fill="#cbd5e1" />
      {/* Experience */}
      <rect x="8" y="51" width="22" height="1.8" rx="0.9" fill={color} opacity="0.85" />
      <rect x="8" y="56" width="62" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="59.5" width="48" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="63" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      {/* Bottom accent */}
      <rect x="8" y="100" width="20" height="1" fill={color} opacity="0.5" />
    </svg>
  )
}

// ============================================================
// MINIMAL — heaps of whitespace, only black + one tiny color tick
// ============================================================
export function MinimalResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Very small color tick — the only chromatic accent */}
      <rect x="8" y="11" width="3" height="3" fill={color} />
      <rect x="14" y="11" width="32" height="3" rx="0.5" fill="#0f172a" />
      <rect x="14" y="16" width="20" height="1.2" rx="0.6" fill="#94a3b8" />
      {/* Hairline divider */}
      <rect x="8" y="24" width="64" height="0.4" fill="#0f172a" opacity="0.5" />
      {/* Section headings — uppercase feel via small caps bar */}
      <rect x="8" y="32" width="14" height="1.4" rx="0.7" fill="#0f172a" />
      <rect x="8" y="38" width="56" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="42" width="48" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="46" width="52" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="56" width="14" height="1.4" rx="0.7" fill="#0f172a" />
      <rect x="8" y="62" width="58" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="66" width="44" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="70" width="56" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="80" width="14" height="1.4" rx="0.7" fill="#0f172a" />
      <rect x="8" y="86" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="90" width="48" height="1.1" rx="0.55" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// CHRONO — vertical timeline with date sidebar + dots connected
// ============================================================
export function ChronoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Header */}
      <rect x="8" y="10" width="36" height="3.5" rx="1" fill="#0f172a" />
      <rect x="8" y="16" width="24" height="1.6" rx="0.8" fill={color} />
      {/* Date sidebar background tint */}
      <rect x="2" y="26" width="20" height="82" fill={color} opacity="0.06" />
      {/* Vertical timeline line */}
      <line x1="24" y1="30" x2="24" y2="100" stroke={color} strokeWidth="0.8" opacity="0.45" />
      {/* Timeline entries */}
      {[32, 50, 68, 86].map((y, i) => (
        <g key={y}>
          {/* Date chip */}
          <rect x="5" y={y - 1} width="14" height="3.5" rx="1.5" fill={color} opacity="0.18" />
          <rect x="7" y={y + 0.2} width="10" height="1.2" rx="0.6" fill={color} />
          {/* Dot on line */}
          <circle cx="24" cy={y + 1} r="2.2" fill={color} />
          <circle cx="24" cy={y + 1} r="3.6" fill="none" stroke={color} strokeWidth="0.4" opacity="0.4" />
          {/* Content */}
          <rect x="30" y={y - 1} width="22" height="1.6" rx="0.8" fill="#0f172a" />
          <rect x="30" y={y + 2.5} width="18" height="1" rx="0.5" fill={color} opacity="0.7" />
          <rect x="30" y={y + 6} width={36 - i * 4} height="1.1" rx="0.55" fill="#cbd5e1" />
          <rect x="30" y={y + 9.5} width={32 - i * 4} height="1.1" rx="0.55" fill="#e2e8f0" />
        </g>
      ))}
    </svg>
  )
}

// ============================================================
// CARBON — dark hero header + clean body
// ============================================================
export function CarbonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="carbonBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <pattern id="carbonDots" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="#ffffff" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="80" height="110" fill="#0f172a" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#0f172a" />
      {/* Carbon hero */}
      <rect x="2" y="2" width="76" height="106" fill="url(#carbonBg)" />
      <rect x="2" y="2" width="76" height="106" fill="url(#carbonDots)" />
      {/* Accent stripe */}
      <rect x="2" y="2" width="4" height="106" fill={color} />
      {/* Header */}
      <rect x="10" y="10" width="40" height="4" rx="1" fill="#ffffff" />
      <rect x="10" y="17" width="26" height="1.8" rx="0.9" fill={color} />
      <rect x="10" y="23" width="50" height="0.6" fill={color} opacity="0.5" />
      {/* Body text */}
      <rect x="10" y="28" width="60" height="1.2" rx="0.6" fill="#ffffff" opacity="0.55" />
      <rect x="10" y="32" width="52" height="1.2" rx="0.6" fill="#ffffff" opacity="0.55" />
      <rect x="10" y="36" width="58" height="1.2" rx="0.6" fill="#ffffff" opacity="0.55" />
      {/* Section heading */}
      <rect x="10" y="44" width="22" height="2" rx="1" fill={color} />
      <rect x="10" y="50" width="60" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="53.5" width="44" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="57" width="58" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="64" width="22" height="2" rx="1" fill={color} />
      <rect x="10" y="70" width="60" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="73.5" width="48" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      {/* Skill chips dark */}
      <rect x="10" y="82" width="12" height="3" rx="1.5" fill="#ffffff" opacity="0.08" stroke={color} strokeOpacity="0.6" strokeWidth="0.4" />
      <rect x="24" y="82" width="14" height="3" rx="1.5" fill="#ffffff" opacity="0.08" stroke={color} strokeOpacity="0.6" strokeWidth="0.4" />
      <rect x="40" y="82" width="10" height="3" rx="1.5" fill="#ffffff" opacity="0.08" stroke={color} strokeOpacity="0.6" strokeWidth="0.4" />
      <rect x="52" y="82" width="16" height="3" rx="1.5" fill="#ffffff" opacity="0.08" stroke={color} strokeOpacity="0.6" strokeWidth="0.4" />
    </svg>
  )
}

// ============================================================
// VERTICAL — two-column with subtle top tint and centered name
// ============================================================
export function VerticalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vertTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      <rect x="2" y="2" width="76" height="22" fill="url(#vertTop)" />
      <rect x="22" y="8" width="36" height="3.5" rx="1" fill="#0f172a" />
      <rect x="28" y="14" width="24" height="1.6" rx="0.8" fill={color} />
      {/* Two equal columns */}
      <line x1="40" y1="28" x2="40" y2="100" stroke={color} strokeWidth="0.5" opacity="0.4" />
      {/* Left column */}
      <rect x="6" y="30" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="6" y="35" width="30" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="6" y="38.5" width="26" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="6" y="42" width="30" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="6" y="49" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="6" y="54" width="32" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="6" y="57.5" width="28" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="6" y="61" width="30" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="6" y="68" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="6" y="73" width="30" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="6" y="76.5" width="22" height="1.1" rx="0.55" fill="#e2e8f0" />
      {/* Right column */}
      <rect x="44" y="30" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="44" y="35" width="30" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="44" y="38.5" width="26" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="44" y="42" width="30" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="44" y="49" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="44" y="54" width="32" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="44" y="57.5" width="22" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="44" y="61" width="30" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="44" y="68" width="20" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="44" y="73" width="30" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="44" y="76.5" width="24" height="1.1" rx="0.55" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// HORIZONTAL — 3 tab nav row, single body
// ============================================================
export function HorizontalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Top hero band with subtle gradient */}
      <defs>
        <linearGradient id="horizHero" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="76" height="22" fill="url(#horizHero)" />
      <rect x="8" y="8" width="44" height="4" rx="1" fill={color} />
      <rect x="8" y="14" width="40" height="1.4" rx="0.7" fill="#475569" />
      <rect x="8" y="18" width="24" height="0.9" rx="0.45" fill="#94a3b8" />
      {/* Tab labels */}
      <rect x="8" y="28" width="18" height="2" rx="1" fill={color} />
      <rect x="32" y="28" width="18" height="2" rx="1" fill={color} opacity="0.55" />
      <rect x="56" y="28" width="18" height="2" rx="1" fill={color} opacity="0.55" />
      <rect x="8" y="32" width="18" height="0.6" fill={color} />
      <rect x="8" y="32" width="60" height="0.4" fill="#e2e8f0" />
      {/* Body */}
      <rect x="8" y="38" width="60" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="8" y="42" width="52" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="8" y="46" width="58" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="8" y="54" width="22" height="1.8" rx="0.9" fill={color} opacity="0.85" />
      <rect x="8" y="60" width="60" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="63.5" width="44" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="67" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="75" width="22" height="1.8" rx="0.9" fill={color} opacity="0.85" />
      <rect x="8" y="81" width="60" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="8" y="84.5" width="40" height="1.2" rx="0.6" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// GLASS — translucent stacked cards + frosted blue background
// ============================================================
export function GlassThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glassBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="50%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="glassHero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="glassOrb" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="80" height="110" fill="#dbeafe" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="url(#glassBg)" />
      {/* Decorative orbs (give frosted depth) */}
      <circle cx="65" cy="20" r="14" fill="url(#glassOrb)" />
      <circle cx="15" cy="80" r="18" fill="url(#glassOrb)" />
      {/* Hero card */}
      <rect x="6" y="6" width="68" height="22" rx="4" fill="url(#glassHero)" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.5" />
      <rect x="6" y="6" width="68" height="22" rx="4" fill="#ffffff" opacity="0.15" />
      <rect x="10" y="11" width="32" height="3.5" rx="1" fill="#ffffff" />
      <rect x="10" y="17" width="20" height="1.6" rx="0.8" fill="#ffffff" opacity="0.75" />
      {/* Frosted stacked cards */}
      {[34, 54, 74].map((y, i) => (
        <g key={y}>
          <rect
            x="6"
            y={y}
            width="68"
            height="16"
            rx="3"
            fill="#ffffff"
            opacity={0.7 - i * 0.12}
            stroke="#ffffff"
            strokeOpacity={0.55 - i * 0.1}
            strokeWidth="0.5"
          />
          <rect x="10" y={y + 3} width="20" height="1.6" rx="0.8" fill={color} opacity={0.7 - i * 0.1} />
          <rect x="10" y={y + 7} width="44" height="1.1" rx="0.55" fill="#0f172a" opacity={0.35 - i * 0.05} />
          <rect x="10" y={y + 10.5} width="36" height="1.1" rx="0.55" fill="#0f172a" opacity={0.3 - i * 0.05} />
        </g>
      ))}
    </svg>
  )
}

// ============================================================
// NEON — dark backdrop + glowing borders + neon accents
// ============================================================
export function NeonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="neonHalo" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="80" height="110" fill="#0a0a14" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#0a0a14" />
      {/* top halo */}
      <rect x="2" y="2" width="76" height="40" fill="url(#neonHalo)" />
      {/* Outer neon border */}
      <rect x="4" y="4" width="72" height="102" rx="3" fill="none" stroke={color} strokeWidth="0.8" opacity="0.85" filter="url(#neonGlow)" />
      {/* Header with glow */}
      <rect x="10" y="10" width="38" height="3.5" rx="1" fill={color} filter="url(#neonGlow)" />
      <rect x="10" y="17" width="24" height="1.6" rx="0.8" fill="#ffffff" opacity="0.85" />
      {/* Accent dots top-right */}
      <circle cx="68" cy="11" r="1.5" fill={color} filter="url(#neonGlow)" />
      <circle cx="62" cy="11" r="1.2" fill={color} opacity="0.5" />
      {/* Body */}
      <rect x="10" y="24" width="60" height="0.6" fill={color} opacity="0.45" />
      <rect x="10" y="28" width="58" height="1.2" rx="0.6" fill="#ffffff" opacity="0.5" />
      <rect x="10" y="32" width="50" height="1.2" rx="0.6" fill="#ffffff" opacity="0.5" />
      <rect x="10" y="36" width="56" height="1.2" rx="0.6" fill="#ffffff" opacity="0.5" />
      {/* Neon section heading */}
      <rect x="10" y="44" width="22" height="2" rx="1" fill={color} filter="url(#neonGlow)" />
      <rect x="10" y="50" width="60" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="53.5" width="44" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="57" width="58" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="64" width="22" height="2" rx="1" fill={color} filter="url(#neonGlow)" />
      <rect x="10" y="70" width="60" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      <rect x="10" y="73.5" width="40" height="1.1" rx="0.55" fill="#ffffff" opacity="0.32" />
      {/* Outline neon chips */}
      <rect x="10" y="82" width="14" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.6" filter="url(#neonGlow)" />
      <rect x="26" y="82" width="12" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7" />
      <rect x="40" y="82" width="16" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7" />
    </svg>
  )
}

// ============================================================
// BAUHAUS — primary blocks (black/red/yellow) + bold geometry
// ============================================================
export function BauhausThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#f7f1e3" />
      {/* Bauhaus primary blocks — bold geometric composition */}
      <rect x="2" y="2" width="34" height="22" fill="#e63946" />
      <rect x="36" y="2" width="42" height="22" fill="#1d1d1d" />
      <rect x="2" y="24" width="14" height="18" fill="#f6c026" />
      {/* Big circle accent */}
      <circle cx="68" cy="36" r="10" fill={color} />
      {/* Vertical accent bar */}
      <rect x="2" y="42" width="14" height="66" fill="#1d1d1d" />
      {/* Name on header */}
      <rect x="40" y="9" width="32" height="3.5" rx="0" fill="#f6c026" />
      <rect x="40" y="15" width="22" height="1.8" rx="0" fill="#ffffff" opacity="0.8" />
      {/* Body content */}
      <rect x="20" y="48" width="22" height="2.5" rx="0" fill="#1d1d1d" />
      <rect x="20" y="54" width="52" height="1.4" rx="0" fill="#1d1d1d" opacity="0.45" />
      <rect x="20" y="58" width="44" height="1.4" rx="0" fill="#1d1d1d" opacity="0.45" />
      <rect x="20" y="62" width="50" height="1.4" rx="0" fill="#1d1d1d" opacity="0.45" />
      <rect x="20" y="70" width="22" height="2.5" rx="0" fill="#e63946" />
      <rect x="20" y="76" width="52" height="1.4" rx="0" fill="#1d1d1d" opacity="0.35" />
      <rect x="20" y="80" width="40" height="1.4" rx="0" fill="#1d1d1d" opacity="0.35" />
      <rect x="20" y="84" width="48" height="1.4" rx="0" fill="#1d1d1d" opacity="0.35" />
      <rect x="20" y="92" width="22" height="2.5" rx="0" fill={color} />
      <rect x="20" y="98" width="40" height="1.4" rx="0" fill="#1d1d1d" opacity="0.35" />
    </svg>
  )
}

// ============================================================
// OUTLINE — wireframe boxes, only strokes
// ============================================================
export function OutlineThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Header outlined */}
      <rect x="6" y="6" width="68" height="22" rx="2" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="16" cy="17" r="6" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="26" y="11" width="32" height="2.5" rx="0.5" fill="none" stroke="#0f172a" strokeWidth="0.7" />
      <rect x="26" y="16" width="22" height="1.8" rx="0.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="26" y="20" width="40" height="1" rx="0.5" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
      {/* Section A */}
      <rect x="6" y="32" width="68" height="20" rx="2" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.7" />
      <rect x="10" y="36" width="20" height="2" rx="0.5" fill="none" stroke={color} strokeWidth="0.7" />
      <line x1="10" y1="42" x2="68" y2="42" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      <line x1="10" y1="46" x2="60" y2="46" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      <line x1="10" y1="49" x2="64" y2="49" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      {/* Section B */}
      <rect x="6" y="56" width="68" height="20" rx="2" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.7" />
      <rect x="10" y="60" width="22" height="2" rx="0.5" fill="none" stroke={color} strokeWidth="0.7" />
      <line x1="10" y1="66" x2="68" y2="66" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      <line x1="10" y1="70" x2="56" y2="70" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      <line x1="10" y1="73" x2="64" y2="73" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
      {/* Section C */}
      <rect x="6" y="80" width="68" height="22" rx="2" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.7" />
      <rect x="10" y="84" width="18" height="2" rx="0.5" fill="none" stroke={color} strokeWidth="0.7" />
      {/* Outline chips */}
      <rect x="10" y="90" width="12" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="24" y="90" width="14" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="40" y="90" width="10" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="52" y="90" width="16" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.6" />
    </svg>
  )
}

// ============================================================
// STRIPE — bold left color band w/ corporate feel
// ============================================================
export function StripeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="stripeBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Bold left stripe */}
      <rect x="2" y="2" width="9" height="106" fill="url(#stripeBand)" />
      {/* Small monogram circle on stripe */}
      <circle cx="6.5" cy="16" r="3" fill="#ffffff" />
      <rect x="5" y="14.5" width="3" height="3" fill={color} />
      {/* Header */}
      <rect x="16" y="10" width="40" height="3.5" rx="1" fill="#0f172a" />
      <rect x="16" y="16" width="26" height="1.8" rx="0.9" fill={color} />
      {/* Contact row */}
      <rect x="16" y="22" width="14" height="1" rx="0.5" fill="#94a3b8" />
      <rect x="32" y="22" width="16" height="1" rx="0.5" fill="#94a3b8" />
      <rect x="50" y="22" width="18" height="1" rx="0.5" fill="#94a3b8" />
      <rect x="16" y="27" width="58" height="0.5" fill={color} opacity="0.5" />
      {/* Profile */}
      <rect x="16" y="32" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="16" y="37" width="58" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="16" y="40.5" width="50" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="16" y="44" width="56" height="1.2" rx="0.6" fill="#cbd5e1" />
      {/* Experience */}
      <rect x="16" y="51" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="16" y="56" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="16" y="59.5" width="44" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="16" y="63" width="56" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="16" y="70" width="22" height="2" rx="1" fill={color} opacity="0.9" />
      <rect x="16" y="75" width="58" height="1.2" rx="0.6" fill="#e2e8f0" />
      <rect x="16" y="78.5" width="40" height="1.2" rx="0.6" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================================
// NORDIC — scandinavian whitespace, hairline, single thin accent
// ============================================================
export function NordicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#fafaf7" />
      {/* Tiny top accent dot — Nordic minimalism */}
      <circle cx="8" cy="10" r="1.5" fill={color} />
      <rect x="14" y="9" width="38" height="3" rx="0.5" fill="#0f172a" />
      <rect x="14" y="14" width="22" height="1.4" rx="0.7" fill="#94a3b8" />
      {/* Hairline */}
      <rect x="8" y="22" width="64" height="0.4" fill="#0f172a" opacity="0.4" />
      {/* Sections — extreme whitespace */}
      <rect x="8" y="30" width="14" height="1.3" rx="0.65" fill={color} />
      <rect x="8" y="36" width="58" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="40" width="44" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="44" width="52" height="1.1" rx="0.55" fill="#cbd5e1" />
      <rect x="8" y="56" width="14" height="1.3" rx="0.65" fill={color} />
      <rect x="8" y="62" width="56" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="66" width="40" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="70" width="58" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="82" width="14" height="1.3" rx="0.65" fill={color} />
      <rect x="8" y="88" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="8" y="92" width="50" height="1.1" rx="0.55" fill="#e2e8f0" />
      {/* footer hairline */}
      <rect x="8" y="100" width="20" height="0.4" fill={color} opacity="0.6" />
    </svg>
  )
}
