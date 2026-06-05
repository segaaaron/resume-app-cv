// Pro template thumbnails — batch C2 (City/Style)
// Lazy-loaded chunk split from thumbnails-pro-c.tsx
import React from "react"
import { PageShadow } from "./thumbnails-free"

export function CobaltThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cobaltSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0d2137" />
        </linearGradient>
        <linearGradient id="cobaltAvatar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" fill="#eef2f7" />
      <PageShadow />
      <rect x="2" y="2" width="76" height="106" fill="#ffffff" />
      {/* Deep cobalt sidebar with gradient */}
      <rect x="2" y="2" width="26" height="106" fill="url(#cobaltSide)" />
      {/* Cyan accent edge */}
      <rect x="26" y="2" width="0.8" height="106" fill={color} opacity="0.7" />
      {/* Avatar with cyan ring */}
      <circle cx="15" cy="18" r="8" fill="url(#cobaltAvatar)" />
      <circle cx="15" cy="18" r="8" fill="none" stroke={color} strokeWidth="0.8" opacity="0.9" />
      <circle cx="15" cy="16" r="2.6" fill="#ffffff" opacity="0.65" />
      <path d="M9 24 Q15 20 21 24 L21 25.5 L9 25.5 Z" fill="#ffffff" opacity="0.65" />
      {/* Sidebar contact rows */}
      <circle cx="5" cy="34" r="1" fill={color} />
      <rect x="7.5" y="33.5" width="16" height="1" rx="0.5" fill="#ffffff" opacity="0.75" />
      <circle cx="5" cy="38" r="1" fill={color} />
      <rect x="7.5" y="37.5" width="14" height="1" rx="0.5" fill="#ffffff" opacity="0.6" />
      <circle cx="5" cy="42" r="1" fill={color} />
      <rect x="7.5" y="41.5" width="15" height="1" rx="0.5" fill="#ffffff" opacity="0.6" />
      {/* Sidebar section: Skills */}
      <rect x="5" y="50" width="14" height="1.6" rx="0.8" fill={color} />
      <rect x="5" y="54" width="18" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y="54" width="14" height="0.8" rx="0.4" fill={color} />
      <rect x="5" y="57" width="18" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y="57" width="11" height="0.8" rx="0.4" fill={color} />
      <rect x="5" y="60" width="18" height="0.8" rx="0.4" fill="#ffffff" opacity="0.18" />
      <rect x="5" y="60" width="16" height="0.8" rx="0.4" fill={color} />
      {/* Sidebar section: Languages */}
      <rect x="5" y="68" width="14" height="1.6" rx="0.8" fill={color} />
      <rect x="5" y="72" width="18" height="0.9" rx="0.45" fill="#ffffff" opacity="0.4" />
      <rect x="5" y="75.5" width="14" height="0.9" rx="0.45" fill="#ffffff" opacity="0.4" />
      {/* Main column */}
      <rect x="32" y="10" width="40" height="3.5" rx="1" fill="#0f172a" />
      <rect x="32" y="16" width="26" height="1.8" rx="0.9" fill={color} />
      <rect x="32" y="22" width="42" height="0.6" fill={color} opacity="0.4" />
      <rect x="32" y="26" width="42" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="32" y="29.5" width="36" height="1.2" rx="0.6" fill="#cbd5e1" />
      <rect x="32" y="33" width="40" height="1.2" rx="0.6" fill="#cbd5e1" />
      {/* Experience */}
      <rect x="32" y="40" width="20" height="2" rx="1" fill={color} />
      <rect x="32" y="46" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="32" y="49.5" width="36" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="32" y="53" width="40" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="32" y="60" width="22" height="2" rx="1" fill={color} />
      <rect x="32" y="66" width="42" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="32" y="69.5" width="32" height="1.1" rx="0.55" fill="#e2e8f0" />
      <rect x="32" y="73" width="38" height="1.1" rx="0.55" fill="#e2e8f0" />
    </svg>
  )
}

export function DualityThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="54" y="0" width="26" height="110" fill="#2a5298" />
      <rect x="6" y="8" width="40" height="3" rx="0.5" fill="#222" />
      <rect x="6" y="13" width="28" height="1.5" rx="0.5" fill="#555" />
      <rect x="6" y="20" width="18" height="1.5" rx="0.5" fill={color} />
      <rect x="6" y="24" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="6" y="27" width="40" height="1" rx="0.3" fill="#999" />
      <rect x="6" y="30" width="42" height="1" rx="0.3" fill="#999" />
      <rect x="6" y="36" width="18" height="1.5" rx="0.5" fill={color} />
      <rect x="6" y="40" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="6" y="43" width="38" height="1" rx="0.3" fill="#999" />
      <circle cx="67" cy="18" r="8" fill="#ffffff40" />
      <rect x="57" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="57" y="33" width="16" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="57" y="40" width="18" height="1" rx="0.5" fill="#fff" opacity="0.4" />
      <rect x="57" y="43" width="14" height="1" rx="0.5" fill="#fff" opacity="0.4" />
    </svg>
  )
}

export function HavanaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#c0645a" />
      <circle cx="13" cy="18" r="8" fill="#ffffff40" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="48" width="16" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="0" y="0" width="80" height="10" fill="#c0645a" opacity="0.3" />
      <rect x="30" y="12" width="44" height="3" rx="0.5" fill="#222" />
      <rect x="30" y="17" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="25" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="29" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="32" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="39" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="43" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="46" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function HelixThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#0d1117" />
      <circle cx="13" cy="18" r="7" fill="none" stroke={color} strokeWidth="1.5" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill={color} opacity="0.9" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="#fff" opacity="0.4" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="#fff" opacity="0.4" />
      <rect x="3" y="48" width="16" height="1" rx="0.5" fill="#fff" opacity="0.4" />
      <rect x="3" y="58" width="18" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#222" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="20" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="24" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="27" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="34" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="38" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="41" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function LisbonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill={color} opacity="0.9" />
      <circle cx="13" cy="18" r="8" fill="#ffffff40" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="48" width="16" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#222" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="20" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="24" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="27" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="34" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="38" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="41" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function NauticalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#1e3a5f" />
      <circle cx="13" cy="18" r="8" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="13" cy="18" r="6" fill="#ffffff20" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="48" width="16" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#1e3a5f" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="20" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="24" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="27" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="34" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="38" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="41" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function PrismThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#1b2a3b" />
      <circle cx="13" cy="18" r="8" fill={color} opacity="0.7" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="3" y="45" width="20" height="1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="3" y="49" width="20" height="1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="3" y="53" width="16" height="1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#222" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="20" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="24" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="27" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="34" width="20" height="1.5" rx="0.5" fill={color} />
      <rect x="30" y="38" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="41" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function TokyoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#0D0D0D" />
      <circle cx="13" cy="18" r="7" fill={color} opacity="0.6" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="3" y="46" width="20" height="1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="3" y="50" width="16" height="1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#111" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="30" y="19" width="20" height="1" rx="0.5" fill="#888" />
      <rect x="30" y="24" width="44" height="1" rx="0.3" fill="#bbb" />
      <rect x="30" y="27" width="38" height="1" rx="0.3" fill="#bbb" />
      <rect x="30" y="32" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="30" y="36" width="44" height="1" rx="0.3" fill="#bbb" />
      <rect x="30" y="39" width="36" height="1" rx="0.3" fill="#bbb" />
      <rect x="30" y="45" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="30" y="49" width="44" height="1" rx="0.3" fill="#bbb" />
    </svg>
  )
}

export function VitaeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="26" height="110" fill="#1e2d3d" />
      <circle cx="13" cy="18" r="8" fill="#ffffff30" />
      <rect x="3" y="30" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="3" y="33" width="15" height="1" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="3" y="48" width="16" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="30" y="8" width="44" height="3" rx="0.5" fill="#222" />
      <rect x="30" y="13" width="30" height="1.5" rx="0.5" fill="#555" />
      <rect x="30" y="19" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="25" width="20" height="2" rx="1" fill={color} opacity="0.8" />
      <rect x="30" y="29" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="32" width="38" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="39" width="20" height="2" rx="1" fill={color} opacity="0.8" />
      <rect x="30" y="43" width="44" height="1" rx="0.3" fill="#999" />
      <rect x="30" y="46" width="36" height="1" rx="0.3" fill="#999" />
    </svg>
  )
}

export function MedicalChartThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f4f6f4" />
      <rect x="0" y="0" width="80" height="16" fill={color} />
      <rect x="5" y="4" width="8" height="8" rx="1.5" fill="none" stroke="#fff" strokeWidth="0.8" />
      <rect x="8" y="5.5" width="2" height="5" fill="#fff" />
      <rect x="6" y="7" width="6" height="2" fill="#fff" />
      <rect x="16" y="5" width="28" height="2" rx="0.5" fill="#fff" />
      <rect x="16" y="9" width="18" height="1.5" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="2" y="19" width="76" height="11" fill="none" stroke="#cfd6cf" strokeWidth="0.5" />
      <line x1="21" y1="19" x2="21" y2="30" stroke="#cfd6cf" strokeWidth="0.5" />
      <line x1="40" y1="19" x2="40" y2="30" stroke="#cfd6cf" strokeWidth="0.5" />
      <line x1="59" y1="19" x2="59" y2="30" stroke="#cfd6cf" strokeWidth="0.5" />
      <rect x="4" y="24" width="12" height="1.5" rx="0.5" fill="#333" />
      <rect x="2" y="33" width="36" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="2" y="37" width="36" height="1" rx="0.3" fill="#555" />
      <rect x="2" y="40" width="30" height="1" rx="0.3" fill="#555" />
      <rect x="2" y="48" width="36" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="2" y="52" width="10" height="1" rx="0.3" fill={color} opacity="0.8" />
      <rect x="42" y="33" width="35" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="42" y="37" width="35" height="1" rx="0.3" fill="#555" />
      <rect x="42" y="40" width="28" height="1" rx="0.3" fill="#555" />
      <rect x="42" y="48" width="35" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="42" y="52" width="30" height="1" rx="0.3" fill="#555" />
      <rect x="0" y="100" width="80" height="10" fill={color} />
      <rect x="4" y="103" width="18" height="1.5" rx="0.5" fill="#fff" opacity="0.8" />
    </svg>
  )
}

export function VitalSignsThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f1f7f7" />
      <rect x="2" y="7" width="34" height="3.5" rx="0.5" fill="#0f2424" />
      <rect x="2" y="13" width="22" height="1.5" rx="0.5" fill={color} />
      <polyline points="46,13 50,13 52,7 54,19 56,13 62,13 64,10 66,16 68,13 78,13" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="0" y1="20" x2="80" y2="20" stroke={color} strokeWidth="1.5" />
      <rect x="2" y="23" width="17" height="13" fill="#fff" />
      <rect x="2" y="23" width="3" height="13" fill={color} />
      <rect x="21" y="23" width="17" height="13" fill="#fff" />
      <rect x="21" y="23" width="3" height="13" fill={color} />
      <rect x="40" y="23" width="17" height="13" fill="#fff" />
      <rect x="40" y="23" width="3" height="13" fill={color} />
      <rect x="61" y="23" width="17" height="13" fill="#fff" />
      <rect x="61" y="23" width="3" height="13" fill={color} />
      <rect x="2" y="40" width="25" height="1.5" rx="0.5" fill={color} opacity="0.5" />
      <rect x="2" y="44" width="4" height="14" fill={color} opacity="0.3" />
      <rect x="7" y="45" width="20" height="1" rx="0.3" fill="#333" />
      <rect x="2" y="60" width="25" height="1.5" rx="0.5" fill={color} opacity="0.5" />
      <rect x="42" y="40" width="35" height="1.5" rx="0.5" fill={color} opacity="0.5" />
      <rect x="42" y="44" width="35" height="1" rx="0.3" fill="#555" />
      <rect x="42" y="56" width="14" height="4" rx="2" fill={color} />
      <rect x="58" y="56" width="10" height="4" rx="2" fill={color} />
      <rect x="42" y="62" width="10" height="4" rx="2" fill={color} />
    </svg>
  )
}

export function VetCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5e6cc" />
      <rect x="0" y="0" width="80" height="26" fill={color} />
      <circle cx="12" cy="14" r="7" fill="#f5e6cc" opacity="0.9" />
      <ellipse cx="7" cy="9" rx="3" ry="4" fill="#f5e6cc" opacity="0.9" />
      <ellipse cx="17" cy="9" rx="3" ry="4" fill="#f5e6cc" opacity="0.9" />
      <circle cx="10" cy="13" r="0.8" fill={color} />
      <circle cx="14" cy="13" r="0.8" fill={color} />
      <path d="M10.5 16 Q12 17.5 13.5 16" stroke={color} strokeWidth="0.6" fill="none" />
      <rect x="24" y="7" width="34" height="3" rx="0.8" fill="#f5e6cc" />
      <rect x="24" y="13" width="22" height="1.8" rx="0.5" fill="#f5e6cc" opacity="0.7" />
      <rect x="2" y="30" width="26" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="2" y="34" width="38" height="1" rx="0.3" fill="#3b2a1a" opacity="0.7" />
      <rect x="2" y="44" width="36" height="1.5" rx="0.5" fill="#3b2a1a" opacity="0.8" />
      <rect x="2" y="55" width="36" height="1.5" rx="0.5" fill="#3b2a1a" opacity="0.8" />
      <rect x="2" y="64" width="26" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="2" y="68" width="12" height="5" rx="2.5" fill="#5a8c4a" />
      <rect x="16" y="68" width="10" height="5" rx="2.5" fill="#5a8c4a" />
      <rect x="28" y="68" width="12" height="5" rx="2.5" fill="#5a8c4a" />
      <rect x="44" y="30" width="33" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="44" y="34" width="33" height="1" rx="0.3" fill="#555" />
      <rect x="44" y="37" width="26" height="1" rx="0.3" fill="#555" />
    </svg>
  )
}


export function ATSThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="8" y="8" width="40" height="4" rx="0.5" fill="#111" opacity="0.85" /><rect x="8" y="14" width="26" height="2" rx="0.5" fill="#666" opacity="0.5" /><rect x="8" y="21" width="64" height="1.5" rx="0" fill={color} opacity="0.65" /><rect x="8" y="27" width="22" height="2" rx="0.5" fill={color} opacity="0.6" />{[31,35,39].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="47" width="22" height="2" rx="0.5" fill={color} opacity="0.6" />{[51,55,59,63].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="71" width="22" height="2" rx="0.5" fill={color} opacity="0.6" />{[75,79,83].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function BlueprintThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f8fafc" /><rect x="0" y="0" width="26" height="28" fill={color} /><circle cx="13" cy="13" r="7" fill="#fff" opacity="0.25" /><rect x="3" y="22" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.8" /><rect x="0" y="28" width="26" height="82" fill="#fff" /><rect x="3" y="32" width="16" height="1.5" rx="0.5" fill={color} opacity="0.5" />{[37,41,45,51,55,59].map(y=><rect key={y} x="3" y={y} width="18" height="1" rx="0.3" fill="#999" opacity="0.4" />)}<rect x="30" y="8" width="44" height="3.5" rx="0.5" fill="#222" /><rect x="30" y="13" width="28" height="2" rx="0.5" fill="#555" opacity="0.6" /><rect x="30" y="22" width="16" height="1.5" rx="0.5" fill={color} opacity="0.6" />{[26,30,34,40,44,48,54,58,62].map(y=><rect key={y} x="30" y={y} width="44" height="1" rx="0.3" fill="#ccc" />)}</svg>)
}

export function CasualThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="0" y="0" width="80" height="34" fill={color} /><circle cx="82" cy="-8" r="32" fill="#fff" opacity="0.07" /><circle cx="62" cy="32" r="16" fill="#fff" opacity="0.07" /><rect x="7" y="8" width="14" height="14" rx="2" fill="#fff" opacity="0.2" /><rect x="27" y="10" width="34" height="4" rx="0.5" fill="#fff" opacity="0.9" /><rect x="27" y="16" width="22" height="2" rx="0.5" fill="#fff" opacity="0.6" /><rect x="8" y="42" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[47,51,55,59].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="67" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[71,75,79,83].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function CircularThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><path d="M0,0 L80,0 L80,30 Q40,44 0,30 Z" fill={color} /><circle cx="40" cy="14" r="7" fill="#fff" opacity="0.25" /><rect x="20" y="26" width="40" height="1.5" rx="0.5" fill="#fff" opacity="0.6" /><rect x="4" y="50" width="22" height="2" rx="0.5" fill={color} opacity="0.6" />{[54,58,62].map(y=><rect key={y} x="4" y={y} width="22" height="1" rx="0.3" fill="#ccc" />)}<rect x="30" y="50" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[54,58,62].map(y=><rect key={y} x="30" y={y} width="20" height="1" rx="0.3" fill="#ccc" />)}<rect x="54" y="50" width="22" height="2" rx="0.5" fill={color} opacity="0.6" />{[54,58,62].map(y=><rect key={y} x="54" y={y} width="18" height="1" rx="0.3" fill="#ccc" />)}</svg>)
}

export function CoralThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="0" y="0" width="80" height="28" fill={color} /><circle cx="40" cy="13" r="7" fill="#fff" opacity="0.25" /><rect x="24" y="21" width="32" height="2" rx="0.5" fill="#fff" opacity="0.7" /><rect x="0" y="28" width="26" height="82" fill={color} opacity="0.06" /><rect x="3" y="33" width="16" height="1.5" rx="0.5" fill={color} opacity="0.5" />{[38,43,48,53,58,63].map(y=><rect key={y} x="3" y={y} width="18" height="1.2" rx="0.3" fill="#aaa" opacity="0.4" />)}<rect x="30" y="33" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[38,42,46,52,56,60,66,70,74].map(y=><rect key={y} x="30" y={y} width="44" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function FoldThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="0" y="0" width="80" height="26" fill={color} opacity="0.07" /><rect x="0" y="26" width="80" height="3" fill={color} opacity="0.2" /><rect x="8" y="8" width="36" height="4" rx="0.5" fill="#111" opacity="0.75" /><rect x="8" y="14" width="24" height="2" rx="0.5" fill={color} opacity="0.6" />{[0,1,2].map(i=><g key={i}><rect x="0" y={32+i*20} width="80" height="20" fill={color} opacity={i%2===0?0.05:0} /><rect x="8" y={34+i*20} width="18" height="2" rx="0.5" fill={color} opacity="0.5" /><rect x="8" y={38+i*20} width="44" height="1.2" rx="0.3" fill="#ddd" /><rect x="8" y={41+i*20} width="36" height="1.2" rx="0.3" fill="#ddd" /></g>)}</svg>)
}

export function LuxuriousThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#1a1a2e" /><rect x="0" y="0" width="80" height="32" fill="#16213e" /><rect x="0" y="32" width="80" height="2" fill={color} /><circle cx="16" cy="15" r="7" fill={color} opacity="0.25" /><rect x="28" y="9" width="36" height="4" rx="0.5" fill="#fff" opacity="0.85" /><rect x="28" y="15" width="22" height="2" rx="0.5" fill={color} opacity="0.7" /><rect x="8" y="42" width="22" height="2" rx="0.5" fill={color} opacity="0.7" />{[47,51,55,59].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#fff" opacity="0.15" />)}<rect x="8" y="68" width="22" height="2" rx="0.5" fill={color} opacity="0.7" />{[72,76,80,84].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#fff" opacity="0.15" />)}</svg>)
}

export function MetroThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f9fafb" /><rect x="0" y="0" width="5" height="110" fill={color} /><rect x="5" y="0" width="75" height="28" fill="#111827" /><rect x="10" y="8" width="36" height="4" rx="0.5" fill="#fff" opacity="0.9" /><rect x="10" y="14" width="22" height="2.5" rx="0.5" fill={color} opacity="0.8" /><rect x="5" y="28" width="75" height="10" fill={color} opacity="0.08" />{[0,1,2,3].map(i=><rect key={i} x={10+i*17} y="31" width="14" height="2" rx="0.5" fill={color} opacity="0.5" />)}<rect x="5" y="40" width="44" height="70" fill="#fff" /><rect x="10" y="44" width="18" height="2" rx="0.5" fill={color} opacity="0.6" />{[48,52,56,60,64].map(y=><rect key={y} x="10" y={y} width="34" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="53" y="40" width="27" height="70" fill="#f3f4f6" /><rect x="55" y="44" width="16" height="2" rx="0.5" fill={color} opacity="0.5" />{[48,52,56,60].map(y=><rect key={y} x="55" y={y} width="20" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function RivieraThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="0" y="0" width="26" height="110" fill="#1a2233" /><rect x="0" y="0" width="26" height="3" fill={color} /><circle cx="13" cy="18" r="8" fill={color} opacity="0.3" /><rect x="3" y="30" width="20" height="2" rx="0.5" fill="#fff" opacity="0.8" /><rect x="3" y="34" width="14" height="1.2" rx="0.5" fill="#fff" opacity="0.4" />{[42,46,50,54,60,64,68].map(y=><rect key={y} x="3" y={y} width="18" height="1" rx="0.3" fill="#fff" opacity="0.3" />)}<rect x="30" y="8" width="44" height="5" rx="0.5" fill="#111" /><rect x="30" y="15" width="28" height="2" rx="0.5" fill={color} opacity="0.6" /><rect x="30" y="24" width="18" height="1.5" rx="0.5" fill="#444" opacity="0.6" />{[28,32,36,42,46,50,56,60,64].map(y=><rect key={y} x="30" y={y} width="44" height="1" rx="0.3" fill="#ccc" />)}</svg>)
}

export function SharpThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="0" y="0" width="80" height="36" fill={color} /><polygon points="0,36 80,28 80,36" fill="#fff" /><rect x="8" y="9" width="18" height="16" fill="#fff" opacity="0.2" style={{clipPath:"polygon(10% 0%,100% 0%,90% 100%,0% 100%)"}} /><rect x="32" y="11" width="34" height="4" rx="0.5" fill="#fff" opacity="0.9" /><rect x="32" y="17" width="22" height="2" rx="0.5" fill="#fff" opacity="0.6" /><rect x="8" y="44" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[49,53,57,61].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="69" width="20" height="2" rx="0.5" fill={color} opacity="0.6" />{[73,77,81].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function SimpleThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="8" y="8" width="40" height="4.5" rx="0.5" fill="#111" opacity="0.85" /><rect x="8" y="14" width="28" height="2" rx="0.5" fill="#888" opacity="0.5" /><rect x="8" y="24" width="64" height="0.8" rx="0.4" fill="#ddd" /><rect x="8" y="28" width="18" height="2" rx="0.5" fill={color} opacity="0.6" />{[32,36,40].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="48" width="64" height="0.8" rx="0.4" fill="#ddd" /><rect x="8" y="52" width="18" height="2" rx="0.5" fill={color} opacity="0.6" />{[56,60,64,68].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="78" width="64" height="0.8" rx="0.4" fill="#ddd" /><rect x="8" y="82" width="18" height="2" rx="0.5" fill={color} opacity="0.6" />{[86,90].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function SparkThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><path d="M0,0 L80,0 L80,36 L0,28 Z" fill={color} /><circle cx="82" cy="-8" r="36" fill="#fff" opacity="0.1" /><circle cx="58" cy="34" r="18" fill="#fff" opacity="0.1" /><rect x="8" y="9" width="36" height="4" rx="0.5" fill="#fff" opacity="0.9" /><rect x="8" y="15" width="22" height="2.5" rx="0.5" fill="#fff" opacity="0.6" /><rect x="8" y="44" width="34" height="66" fill="#f9fafb" /><rect x="10" y="48" width="18" height="2" rx="0.5" fill={color} opacity="0.6" />{[52,56,60,64].map(y=><rect key={y} x="10" y={y} width="28" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="46" y="44" width="34" height="66" fill="#fff" /><rect x="48" y="48" width="18" height="2" rx="0.5" fill={color} opacity="0.5" />{[52,56,60,64].map(y=><rect key={y} x="48" y={y} width="28" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export function VogueThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fff" /><rect x="60" y="0" width="20" height="20" fill={color} opacity="0.8" /><rect x="8" y="8" width="30" height="7" rx="0" fill={color} opacity="0.85" /><rect x="8" y="15" width="30" height="7" rx="0" fill="#111" opacity="0.85" /><rect x="8" y="24" width="28" height="2" rx="0.5" fill="#aaa" opacity="0.6" /><rect x="8" y="30" width="64" height="2" fill={color} /><rect x="8" y="37" width="20" height="1.5" rx="0.5" fill={color} opacity="0.6" />{[41,45,49,53].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}<rect x="8" y="61" width="20" height="1.5" rx="0.5" fill={color} opacity="0.6" />{[65,69,73,77].map(y=><rect key={y} x="8" y={y} width="64" height="1.2" rx="0.3" fill="#ddd" />)}</svg>)
}

export default function ProC2Thumb({ id, color }: { id: string; color: string }) {
  switch (id) {
    case "cobalt":       return <CobaltThumb color={color} />
    case "duality":      return <DualityThumb color={color} />
    case "havana":       return <HavanaThumb color={color} />
    case "helix":        return <HelixThumb color={color} />
    case "lisbon":       return <LisbonThumb color={color} />
    case "nautical":     return <NauticalThumb color={color} />
    case "prism":        return <PrismThumb color={color} />
    case "tokyo":        return <TokyoThumb color={color} />
    case "vitae":        return <VitaeThumb color={color} />
    case "medicalchart": return <MedicalChartThumb color={color} />
    case "vitalsigns":   return <VitalSignsThumb color={color} />
    case "vetcv":        return <VetCVThumb color={color} />
    case "ats":          return <ATSThumb color={color} />
    case "casual":       return <CasualThumb color={color} />
    case "circular":     return <CircularThumb color={color} />
    case "coral":        return <CoralThumb color={color} />
    case "fold":         return <FoldThumb color={color} />
    case "luxurious":    return <LuxuriousThumb color={color} />
    case "metro":        return <MetroThumb color={color} />
    case "riviera":      return <RivieraThumb color={color} />
    case "sharp":        return <SharpThumb color={color} />
    case "spark":        return <SparkThumb color={color} />
    case "vogue":        return <VogueThumb color={color} />
    default: return null
  }
}
