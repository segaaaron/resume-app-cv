// Pro template thumbnails — batch C (ClassicMono → end)
import React from "react"
import { PageShadow } from "./thumbnails-free"

export function ClassicMonoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fbfaf7" />
      {/* Sidebar */}
      <rect x="0" y="0" width="26" height="110" fill="#f0ede8" />
      {/* Photo circle */}
      <circle cx="13" cy="16" r="8" fill="#d8d4cc" />
      {/* Name */}
      <rect x="3" y="28" width="20" height="2.5" rx="1" fill="#1a1a1a" />
      <rect x="3" y="33" width="14" height="1.2" rx="0.5" fill="#6b6b6b" opacity="0.7" />
      {/* Skill bars */}
      <rect x="3" y="42" width="20" height="0.8" rx="0" fill="#e4e4e1" />
      <rect x="3" y="42" width="16" height="0.8" rx="0" fill="#1a1a1a" opacity="0.8" />
      <rect x="3" y="46" width="20" height="0.8" rx="0" fill="#e4e4e1" />
      <rect x="3" y="46" width="12" height="0.8" rx="0" fill="#1a1a1a" opacity="0.8" />
      <rect x="3" y="50" width="20" height="0.8" rx="0" fill="#e4e4e1" />
      <rect x="3" y="50" width="18" height="0.8" rx="0" fill="#1a1a1a" opacity="0.8" />
      {/* Main — dark header bar */}
      <rect x="28" y="6" width="46" height="10" fill="#1a1a1a" />
      <rect x="31" y="9" width="20" height="1.5" rx="0.5" fill="#fbfaf7" opacity="0.8" />
      <rect x="62" y="9" width="9" height="1.5" rx="0.5" fill="#fbfaf7" opacity="0.4" />
      {/* Section heading */}
      <rect x="28" y="22" width="18" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.7" />
      <rect x="48" y="23" width="26" height="0.5" fill="#e4e4e1" />
      {/* Content lines */}
      <rect x="28" y="26" width="44" height="1.2" rx="0.5" fill="#d1d5db" />
      <rect x="28" y="30" width="38" height="1.2" rx="0.5" fill="#d1d5db" />
      <rect x="28" y="38" width="18" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.7" />
      <rect x="48" y="39" width="26" height="0.5" fill="#e4e4e1" />
      <rect x="28" y="43" width="44" height="1.2" rx="0.5" fill="#e5e7eb" />
      <rect x="28" y="47" width="36" height="1.2" rx="0.5" fill="#e5e7eb" />
      <rect x="28" y="51" width="44" height="1.2" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function EditorialSerifThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5efe4" />
      {/* Top rule */}
      <rect x="6" y="6" width="68" height="1.5" fill="#2a221c" />
      {/* Masthead strip */}
      <rect x="6" y="9" width="20" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="30" y="9" width="20" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="56" y="9" width="18" height="1" rx="0.5" fill={color} opacity="0.7" />
      {/* Big serif name */}
      <rect x="6" y="13" width="50" height="9" rx="1" fill="#2a221c" opacity="0.85" />
      <rect x="6" y="24" width="40" height="6" rx="1" fill="#2a221c" opacity="0.85" />
      {/* Job title italic */}
      <rect x="6" y="33" width="30" height="2" rx="1" fill={color} opacity="0.7" />
      {/* bottom rule */}
      <rect x="6" y="38" width="68" height="1.5" fill="#2a221c" />
      {/* Drop cap block */}
      <rect x="6" y="42" width="6" height="8" rx="0.5" fill={color} opacity="0.8" />
      <rect x="14" y="42" width="22" height="1.5" rx="0.5" fill="#2a221c" opacity="0.5" />
      <rect x="14" y="46" width="22" height="1.5" rx="0.5" fill="#2a221c" opacity="0.5" />
      <rect x="6" y="51" width="30" height="1.5" rx="0.5" fill="#2a221c" opacity="0.5" />
      {/* 3-col body */}
      <rect x="6" y="58" width="20" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="30" y="58" width="20" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="54" y="58" width="20" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="6" y="62" width="20" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="6" y="65" width="18" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="6" y="68" width="20" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="30" y="62" width="20" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="30" y="65" width="16" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="54" y="62" width="20" height="1" rx="0.5" fill="#d9d0bf" />
      <rect x="54" y="65" width="14" height="1" rx="0.5" fill="#d9d0bf" />
      {/* Footer strip */}
      <rect x="6" y="100" width="68" height="0.8" fill="#2a221c" />
      <rect x="6" y="103" width="68" height="1" rx="0.5" fill="#6b5e4d" opacity="0.6" />
    </svg>
  )
}

export function BoldBlockThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0ebe2" />
      {/* Dark header */}
      <rect x="0" y="0" width="80" height="38" fill="#0e0e0e" />
      {/* Decorative circle */}
      <circle cx="72" cy="4" r="20" fill={color} opacity="0.85" />
      {/* HOLA SOY label */}
      <rect x="6" y="6" width="18" height="1.2" rx="0.5" fill={color} opacity="0.9" />
      {/* Big name */}
      <rect x="6" y="10" width="36" height="7" rx="1" fill="#f0ebe2" opacity="0.95" />
      <rect x="6" y="19" width="28" height="7" rx="1" fill="#f0ebe2" opacity="0.95" />
      {/* Job title */}
      <rect x="6" y="29" width="24" height="1.5" rx="0.5" fill="#f0ebe2" opacity="0.6" />
      {/* Contact row */}
      <rect x="6" y="33" width="14" height="1" rx="0.5" fill="#bdb6a8" opacity="0.7" />
      <rect x="22" y="33" width="14" height="1" rx="0.5" fill="#bdb6a8" opacity="0.7" />
      {/* Photo rounded rect */}
      <rect x="56" y="6" width="18" height="20" rx="3" fill="#d8d4cc" opacity="0.4" />
      {/* Body 2 cols */}
      <rect x="0" y="38" width="40" height="72" fill="#f0ebe2" />
      <rect x="40" y="38" width="40" height="72" fill="#f0ebe2" />
      <rect x="40" y="38" width="1" height="72" fill="#0e0e0e" />
      {/* Left: section heading */}
      <rect x="5" y="43" width="20" height="1.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="5" y="48" width="32" height="1.2" rx="0.5" fill="#3a3530" opacity="0.5" />
      <rect x="5" y="51" width="28" height="1.2" rx="0.5" fill="#3a3530" opacity="0.5" />
      {/* Skill pills */}
      <rect x="5" y="58" width="10" height="3" rx="0" fill="#0e0e0e" />
      <rect x="17" y="58" width="12" height="3" rx="0" fill="#0e0e0e" />
      <rect x="5" y="63" width="14" height="3" rx="0" fill="#0e0e0e" />
      {/* Right: experience */}
      <rect x="44" y="43" width="20" height="1.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="44" y="48" width="18" height="1.5" rx="0.5" fill="#3a3530" opacity="0.7" />
      <rect x="44" y="52" width="14" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="44" y="55" width="30" height="1" rx="0.5" fill="#3a3530" opacity="0.4" />
      <rect x="44" y="61" width="18" height="1.5" rx="0.5" fill="#3a3530" opacity="0.7" />
      <rect x="44" y="65" width="14" height="1" rx="0.5" fill={color} opacity="0.6" />
    </svg>
  )
}

export function TimelineVerticalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f7f6f1" />
      {/* Header */}
      <circle cx="12" cy="14" r="7" fill="#d8d4cc" />
      <rect x="23" y="10" width="30" height="5" rx="1" fill="#1c2329" opacity="0.8" />
      <rect x="23" y="17" width="20" height="1.5" rx="0.5" fill="#7a8b7c" opacity="0.7" />
      <rect x="0" y="24" width="80" height="0.8" fill="#1c2329" />
      {/* Pull quote */}
      <rect x="6" y="28" width="68" height="1.5" rx="0.5" fill="#1c2329" opacity="0.4" />
      <rect x="6" y="32" width="55" height="1.5" rx="0.5" fill="#1c2329" opacity="0.4" />
      <rect x="6" y="36" width="0.8" height="8" fill="#1c2329" opacity="0.4" />
      {/* Timeline spine */}
      <rect x="39.5" y="42" width="1" height="56" fill="#1c2329" opacity="0.8" />
      {/* Dots and cards */}
      <circle cx="40" cy="46" r="2.5" fill={color} />
      <rect x="6" y="43" width="28" height="1.5" rx="0.5" fill="#1c2329" opacity="0.7" />
      <rect x="6" y="47" width="22" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="6" y="50" width="28" height="1" rx="0.5" fill="#3d4248" opacity="0.4" />

      <circle cx="40" cy="60" r="2.5" fill={color} />
      <rect x="46" y="57" width="28" height="1.5" rx="0.5" fill="#1c2329" opacity="0.7" />
      <rect x="46" y="61" width="22" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="46" y="64" width="28" height="1" rx="0.5" fill="#3d4248" opacity="0.4" />

      <circle cx="40" cy="74" r="2.5" fill={color} />
      <rect x="6" y="71" width="28" height="1.5" rx="0.5" fill="#1c2329" opacity="0.7" />
      <rect x="6" y="75" width="22" height="1" rx="0.5" fill={color} opacity="0.6" />

      <circle cx="40" cy="87" r="2.5" fill={color} />
      <rect x="46" y="84" width="28" height="1.5" rx="0.5" fill="#1c2329" opacity="0.7" />
      <rect x="46" y="88" width="22" height="1" rx="0.5" fill={color} opacity="0.6" />

      {/* Footer */}
      <rect x="0" y="100" width="80" height="0.8" fill="#1c2329" />
      <rect x="6" y="104" width="20" height="1" rx="0.5" fill="#7a8b7c" opacity="0.6" />
      <rect x="30" y="104" width="20" height="1" rx="0.5" fill="#7a8b7c" opacity="0.6" />
      <rect x="54" y="104" width="20" height="1" rx="0.5" fill="#7a8b7c" opacity="0.6" />
    </svg>
  )
}

export function SwissGridThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Grid lines */}
      <line x1="0" y1="16" x2="80" y2="16" stroke="#ececec" strokeWidth="0.5" />
      <line x1="0" y1="32" x2="80" y2="32" stroke="#ececec" strokeWidth="0.5" />
      <line x1="0" y1="48" x2="80" y2="48" stroke="#ececec" strokeWidth="0.5" />
      <line x1="0" y1="64" x2="80" y2="64" stroke="#ececec" strokeWidth="0.5" />
      <line x1="0" y1="80" x2="80" y2="80" stroke="#ececec" strokeWidth="0.5" />
      <line x1="0" y1="96" x2="80" y2="96" stroke="#ececec" strokeWidth="0.5" />
      <line x1="16" y1="0" x2="16" y2="110" stroke="#ececec" strokeWidth="0.5" />
      <line x1="32" y1="0" x2="32" y2="110" stroke="#ececec" strokeWidth="0.5" />
      <line x1="48" y1="0" x2="48" y2="110" stroke="#ececec" strokeWidth="0.5" />
      <line x1="64" y1="0" x2="64" y2="110" stroke="#ececec" strokeWidth="0.5" />
      {/* Top bar */}
      <rect x="0" y="4" width="80" height="0.8" fill="#0a0a0a" />
      <rect x="4" y="6" width="14" height="1" rx="0.5" fill="#0a0a0a" opacity="0.7" />
      <rect x="50" y="6" width="26" height="1" rx="0.5" fill="#0a0a0a" opacity="0.5" />
      {/* Mega number */}
      <text x="4" y="42" style={{ fontFamily: "monospace", fontSize: "40px", fontWeight: 900, fill: "#0a0a0a", letterSpacing: "-4px" }}>14</text>
      {/* Red label */}
      <rect x="4" y="45" width="24" height="1.5" rx="0.5" fill={color} opacity="0.85" />
      {/* Name right */}
      <rect x="42" y="20" width="32" height="5" rx="1" fill="#0a0a0a" opacity="0.85" />
      <rect x="42" y="27" width="20" height="2" rx="0.5" fill="#0a0a0a" opacity="0.5" />
      <rect x="42" y="32" width="24" height="1" rx="0.5" fill="#555" opacity="0.6" />
      <rect x="42" y="35" width="20" height="1" rx="0.5" fill="#555" opacity="0.5" />
      {/* Body */}
      <rect x="0" y="50" width="80" height="0.6" fill="#0a0a0a" />
      <rect x="4" y="53" width="20" height="1.2" rx="0.5" fill={color} opacity="0.8" />
      <rect x="4" y="57" width="44" height="1" rx="0.5" fill="#0a0a0a" opacity="0.4" />
      <rect x="4" y="61" width="38" height="1" rx="0.5" fill="#0a0a0a" opacity="0.4" />
      {/* Skills bars right */}
      <rect x="50" y="53" width="26" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="50" y="57" width="26" height="1.5" rx="0.5" fill="#ececec" />
      <rect x="50" y="57" width="22" height="1.5" rx="0.5" fill="#0a0a0a" opacity="0.7" />
      <rect x="50" y="61" width="26" height="1.5" rx="0.5" fill="#ececec" />
      <rect x="50" y="61" width="16" height="1.5" rx="0.5" fill="#0a0a0a" opacity="0.7" />
      {/* Footer */}
      <rect x="0" y="103" width="80" height="0.8" fill="#0a0a0a" />
      <rect x="4" y="106" width="18" height="1" rx="0.5" fill="#777" opacity="0.7" />
      <rect x="56" y="106" width="18" height="1" rx="0.5" fill="#777" opacity="0.7" />
    </svg>
  )
}


export function ApexThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Full-width diagonal header */}
      <polygon points="0,0 80,0 80,28 0,36" fill={color} />
      {/* Concentric circles decoration */}
      <circle cx="68" cy="4" r="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
      <circle cx="68" cy="4" r="6" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
      {/* Photo circle */}
      <circle cx="12" cy="14" r="7" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {/* Name in header */}
      <rect x="22" y="8" width="30" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="22" y="14" width="22" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      {/* Contact strip in header */}
      <rect x="8" y="22" width="14" height="1" rx="0.5" fill="white" opacity="0.7" />
      <rect x="26" y="22" width="14" height="1" rx="0.5" fill="white" opacity="0.7" />
      <rect x="44" y="22" width="14" height="1" rx="0.5" fill="white" opacity="0.7" />
      {/* Pill section header */}
      <rect x="8" y="42" width="18" height="4" rx="2" fill={color} />
      <rect x="28" y="43" width="28" height="1.5" rx="0.75" fill="#e5e7eb" />
      {/* Experience entries */}
      <rect x="8" y="50" width="32" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="8" y="54" width="20" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="8" y="58" width="44" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="8" y="61" width="38" height="1" rx="0.5" fill="#e5e7eb" />
      {/* Pill section header 2 */}
      <rect x="8" y="70" width="16" height="4" rx="2" fill={color} />
      <rect x="26" y="71" width="28" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="78" width="28" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="8" y="82" width="18" height="1" rx="0.5" fill={color} opacity="0.7" />
      {/* Right sidebar skills */}
      <rect x="57" y="42" width="18" height="4" rx="2" fill={color} />
      <rect x="57" y="50" width="18" height="1" rx="0.5" fill="#374151" />
      <rect x="57" y="50" width="18" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="57" y="50" width="14" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="57" y="54" width="18" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="57" y="54" width="10" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="57" y="58" width="18" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="57" y="58" width="16" height="1.5" rx="0.75" fill={color} opacity="0.5" />
    </svg>
  )
}

export function NovaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Left name area — white */}
      <rect x="0" y="0" width="46" height="36" fill="#f9fafb" />
      {/* Right accent block */}
      <rect x="46" y="0" width="34" height="36" fill={color} />
      {/* Big name */}
      <rect x="6" y="10" width="34" height="4" rx="1" fill="#111827" opacity="0.85" />
      <rect x="6" y="17" width="28" height="4" rx="1" fill={color} opacity="0.85" />
      <rect x="6" y="24" width="22" height="1.5" rx="0.75" fill="#6b7280" />
      {/* Contact in right block */}
      <rect x="50" y="10" width="24" height="1" rx="0.5" fill="white" opacity="0.7" />
      <rect x="50" y="14" width="18" height="1" rx="0.5" fill="white" opacity="0.7" />
      <rect x="50" y="18" width="20" height="1" rx="0.5" fill="white" opacity="0.7" />
      {/* Body — numbered sections */}
      {/* 01 summary */}
      <rect x="6" y="42" width="8" height="5" rx="0.5" fill={color} opacity="0.15" />
      <text x="6" y="47" fontSize="5" fontWeight="900" fill={color} opacity="0.3">01</text>
      <rect x="18" y="44" width="16" height="1.5" rx="0.75" fill="#374151" />
      <rect x="36" y="44.5" width="30" height="0.5" fill="#d1d5db" strokeDasharray="2 1" />
      <rect x="6" y="50" width="64" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="6" y="53" width="56" height="1" rx="0.5" fill="#e5e7eb" />
      {/* 02 experience */}
      <rect x="6" y="60" width="8" height="5" rx="0.5" fill={color} opacity="0.15" />
      <text x="6" y="65" fontSize="5" fontWeight="900" fill={color} opacity="0.3">02</text>
      <rect x="18" y="62" width="20" height="1.5" rx="0.75" fill="#374151" />
      {/* Timeline entry */}
      <rect x="6" y="71" width="12" height="1" rx="0.5" fill="#9ca3af" />
      <rect x="22" y="71" width="22" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="22" y="75" width="16" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="22" y="79" width="40" height="1" rx="0.5" fill="#e5e7eb" />
      {/* Skills dots */}
      <rect x="6" y="90" width="8" height="5" rx="0.5" fill={color} opacity="0.15" />
      <text x="6" y="95" fontSize="5" fontWeight="900" fill={color} opacity="0.3">03</text>
      <rect x="18" y="92" width="14" height="1.5" rx="0.75" fill="#374151" />
      <circle cx="22" cy="100" r="1.5" fill={color} opacity="0.8" />
      <circle cx="27" cy="100" r="1.5" fill={color} opacity="0.8" />
      <circle cx="32" cy="100" r="1.5" fill={color} opacity="0.8" />
      <circle cx="37" cy="100" r="1.5" fill="#e5e7eb" />
    </svg>
  )
}

export function CascadeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Gradient sidebar — simulated with two rects */}
      <rect x="0" y="0" width="26" height="55" fill={color} opacity="0.9" />
      <rect x="0" y="55" width="26" height="55" fill="#1a1a2e" opacity="0.9" />
      {/* Wave between sidebar and main */}
      <path d="M26,50 Q30,46 26,42 L26,54 Z" fill={color} opacity="0.3" />
      {/* Photo circle */}
      <circle cx="13" cy="16" r="7" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      {/* Name */}
      <rect x="3" y="27" width="18" height="2" rx="1" fill="white" opacity="0.85" />
      <rect x="5" y="31" width="12" height="1" rx="0.5" fill="white" opacity="0.55" />
      {/* Wave SVG separator */}
      <path d="M0,40 Q13,37 26,40" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
      {/* Contact */}
      <rect x="3" y="44" width="18" height="1" rx="0.5" fill="white" opacity="0.35" />
      <rect x="3" y="47" width="15" height="1" rx="0.5" fill="white" opacity="0.35" />
      {/* Skills bars */}
      <rect x="3" y="56" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="56" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.6)" />
      <rect x="3" y="60" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="60" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.6)" />
      <rect x="3" y="64" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="64" width="16" height="1" rx="0.5" fill="rgba(255,255,255,0.6)" />
      {/* Main — timeline with dot markers */}
      {/* Circle header */}
      <circle cx="33" cy="13" r="4" fill={color} opacity="0.85" />
      <rect x="40" y="12" width="18" height="2" rx="1" fill="#374151" />
      <rect x="33" y="20" width="38" height="0.5" rx="0.25" fill="#e5e7eb" />
      {/* Timeline entry 1 */}
      <circle cx="31" cy="26" r="2.5" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="31" y="29" width="1" height="15" fill="#e5e7eb" />
      <rect x="36" y="25" width="22" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="36" y="29" width="16" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="36" y="33" width="32" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="36" y="36" width="28" height="1" rx="0.5" fill="#e5e7eb" />
      {/* Timeline entry 2 */}
      <circle cx="31" cy="48" r="2.5" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="36" y="47" width="20" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="36" y="51" width="14" height="1" rx="0.5" fill={color} opacity="0.7" />
    </svg>
  )
}

export function OnyxThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#141414" />
      {/* Header surface */}
      <rect x="0" y="0" width="80" height="30" fill="#1e1e1e" />
      {/* Photo circle */}
      <circle cx="12" cy="15" r="7" fill="none" stroke={color} strokeWidth="1" />
      {/* Name */}
      <rect x="22" y="8" width="28" height="3" rx="1" fill="white" opacity="0.85" />
      <rect x="22" y="14" width="18" height="1.5" rx="0.75" fill={color} opacity="0.85" />
      {/* Contact */}
      <rect x="22" y="20" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.35)" />
      <rect x="38" y="20" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.35)" />
      {/* Accent bars decoration */}
      <rect x="68" y="10" width="7" height="2" rx="1" fill={color} />
      <rect x="68" y="14" width="5" height="2" rx="1" fill={color} opacity="0.5" />
      <rect x="68" y="18" width="3" height="2" rx="1" fill={color} opacity="0.25" />
      {/* Main section label */}
      <rect x="8" y="36" width="3" height="8" rx="1" fill={color} />
      <rect x="14" y="38" width="14" height="1.5" rx="0.75" fill="white" opacity="0.7" />
      {/* Dark card entry */}
      <rect x="8" y="48" width="38" height="12" rx="2" fill="#1e1e1e" />
      <rect x="11" y="51" width="18" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      <rect x="11" y="55" width="12" height="1" rx="0.5" fill={color} opacity="0.8" />
      <rect x="11" y="58" width="28" height="1" rx="0.5" fill="rgba(255,255,255,0.2)" />
      {/* Second entry */}
      <rect x="8" y="64" width="38" height="10" rx="2" fill="#1e1e1e" />
      <rect x="11" y="67" width="14" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      <rect x="11" y="71" width="10" height="1" rx="0.5" fill={color} opacity="0.8" />
      {/* Right sidebar */}
      <rect x="52" y="36" width="21" height="0.5" rx="0.25" fill={color} opacity="0.5" />
      <rect x="52" y="42" width="21" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />
      <rect x="52" y="42" width="16" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="52" y="46" width="21" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />
      <rect x="52" y="46" width="12" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="52" y="50" width="21" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />
      <rect x="52" y="50" width="18" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      {/* Lang badge */}
      <rect x="52" y="64" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.4)" />
      <rect x="64" y="64" width="9" height="3" rx="1" fill={color} opacity="0.7" />
    </svg>
  )
}

export function MosaicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Header left — gray tile */}
      <rect x="0" y="0" width="46" height="32" fill="#f9fafb" />
      {/* Header right — accent tile */}
      <rect x="46" y="0" width="34" height="32" fill={color} />
      {/* Photo with accent border */}
      <rect x="6" y="6" width="14" height="14" rx="2" fill="none" stroke={color} strokeWidth="1.2" />
      {/* Name */}
      <rect x="6" y="23" width="28" height="3" rx="0.5" fill="#111827" opacity="0.85" />
      <rect x="6" y="28" width="6" height="1.5" rx="0.75" fill={color} />
      <rect x="14" y="28.5" width="16" height="1" rx="0.5" fill="#6b7280" />
      {/* Contact in right tile */}
      <rect x="50" y="10" width="24" height="1" rx="0.5" fill="white" opacity="0.75" />
      <rect x="50" y="14" width="18" height="1" rx="0.5" fill="white" opacity="0.75" />
      <rect x="50" y="18" width="20" height="1" rx="0.5" fill="white" opacity="0.75" />
      {/* Body */}
      {/* Left main — section with square tile header */}
      <rect x="6" y="37" width="4" height="4" fill={color} />
      <line x1="7" y1="39" x2="9" y2="39" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <line x1="8" y1="38" x2="8" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <rect x="12" y="38.5" width="18" height="1.5" rx="0.75" fill="#374151" />
      {/* Entry */}
      <rect x="6" y="45" width="34" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="6" y="49" width="24" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="6" y="53" width="38" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="6" y="56" width="32" height="1" rx="0.5" fill="#e5e7eb" />
      {/* Second tile header */}
      <rect x="6" y="63" width="4" height="4" fill={color} />
      <rect x="12" y="64.5" width="14" height="1.5" rx="0.75" fill="#374151" />
      <rect x="6" y="71" width="28" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="6" y="75" width="16" height="1" rx="0.5" fill={color} opacity="0.7" />
      {/* Right sidebar — light gray */}
      <rect x="50" y="36" width="22" height="74" fill="#f9fafb" />
      {/* Skill chips */}
      <rect x="52" y="40" width="4" height="4" fill={color} />
      <rect x="58" y="41" width="12" height="1.5" rx="0.75" fill="#374151" />
      <rect x="52" y="48" width="8" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="62" y="48" width="9" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="52" y="53" width="11" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="65" y="53" width="6" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="0.7" />
      {/* Lang badge */}
      <rect x="52" y="62" width="10" height="1" rx="0.5" fill="#374151" />
      <rect x="63" y="61" width="8" height="3" rx="1" fill={color} opacity="0.8" />
    </svg>
  )
}

export function ThompsonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Header dark full-width */}
      <rect x="0" y="0" width="80" height="30" fill="#2c2f35" />
      {/* Photo circle — overlapping header/body */}
      <circle cx="14" cy="27" r="10" fill="#444" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      {/* Name large */}
      <rect x="28" y="8" width="26" height="4" rx="0.5" fill="white" opacity="0.95" />
      <rect x="28" y="14" width="18" height="2" rx="0.5" fill={color} opacity="0.85" />
      {/* Job title */}
      <rect x="28" y="18" width="22" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)" />
      {/* Contact strip */}
      <rect x="28" y="24" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.45)" />
      <rect x="38" y="24" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.45)" />
      <rect x="52" y="24" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.45)" />

      {/* LEFT SIDEBAR */}
      {/* Education heading */}
      <rect x="4" y="36" width="20" height="1.2" rx="0.3" fill="#2c2f35" />
      <rect x="4" y="37.5" width="20" height="0.5" fill="#2c2f35" />
      {/* Filled bullet + edu entry */}
      <rect x="4" y="42" width="3" height="3" rx="0.5" fill="#2c2f35" />
      <rect x="9" y="42" width="4" height="1.2" rx="0.3" fill="#2c2f35" opacity="0.8" />
      <rect x="9" y="45" width="14" height="1" rx="0.3" fill="#555" opacity="0.6" />
      <rect x="9" y="48" width="10" height="1" rx="0.3" fill="#888" opacity="0.5" />
      <rect x="4" y="53" width="3" height="3" rx="0.5" fill="#2c2f35" />
      <rect x="9" y="53" width="4" height="1.2" rx="0.3" fill="#2c2f35" opacity="0.8" />
      <rect x="9" y="56" width="16" height="1" rx="0.3" fill="#555" opacity="0.6" />
      {/* Knowledge heading */}
      <rect x="4" y="64" width="20" height="1.2" rx="0.3" fill="#2c2f35" />
      <rect x="4" y="65.5" width="20" height="0.5" fill="#2c2f35" />
      {/* Progress bars */}
      <rect x="4" y="70" width="18" height="0.8" rx="0.3" fill="#555" opacity="0.6" />
      <rect x="4" y="72" width="22" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="4" y="72" width="18" height="1.5" rx="0.75" fill="#2c2f35" />
      <rect x="4" y="77" width="14" height="0.8" rx="0.3" fill="#555" opacity="0.6" />
      <rect x="4" y="79" width="22" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="4" y="79" width="12" height="1.5" rx="0.75" fill="#2c2f35" />
      <rect x="4" y="84" width="16" height="0.8" rx="0.3" fill="#555" opacity="0.6" />
      <rect x="4" y="86" width="22" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="4" y="86" width="20" height="1.5" rx="0.75" fill="#2c2f35" />

      {/* RIGHT MAIN */}
      {/* Separator */}
      <rect x="29" y="32" width="0.8" height="78" fill="#ebebeb" />
      {/* About heading */}
      <rect x="33" y="36" width="16" height="1.2" rx="0.3" fill="#2c2f35" />
      <rect x="33" y="37.5" width="40" height="0.5" fill="#2c2f35" />
      <rect x="33" y="41" width="40" height="1" rx="0.5" fill="#ccc" />
      <rect x="33" y="44" width="36" height="1" rx="0.5" fill="#ccc" />
      <rect x="33" y="47" width="38" height="1" rx="0.5" fill="#ccc" />
      {/* Experience heading */}
      <rect x="33" y="54" width="20" height="1.2" rx="0.3" fill="#2c2f35" />
      <rect x="33" y="55.5" width="40" height="0.5" fill="#2c2f35" />
      {/* Job entry 1 */}
      <rect x="33" y="59" width="28" height="1.8" rx="0.3" fill="#2c2f35" opacity="0.9" />
      <rect x="33" y="63" width="14" height="1" rx="0.3" fill="#bbb" />
      {/* Hollow bullets */}
      <circle cx="35" cy="68.5" r="1.2" fill="none" stroke="#bbb" strokeWidth="0.6" />
      <rect x="38" y="68" width="32" height="1" rx="0.5" fill="#ddd" />
      <circle cx="35" cy="72.5" r="1.2" fill="none" stroke="#bbb" strokeWidth="0.6" />
      <rect x="38" y="72" width="28" height="1" rx="0.5" fill="#ddd" />
      {/* Job entry 2 */}
      <rect x="33" y="78" width="24" height="1.8" rx="0.3" fill="#2c2f35" opacity="0.9" />
      <rect x="33" y="82" width="12" height="1" rx="0.3" fill="#bbb" />
      <circle cx="35" cy="87.5" r="1.2" fill="none" stroke="#bbb" strokeWidth="0.6" />
      <rect x="38" y="87" width="30" height="1" rx="0.5" fill="#ddd" />
    </svg>
  )
}

export function LarssonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* Sidebar navy */}
      <rect x="0" y="0" width="28" height="110" fill="#1c2333" />
      {/* Sidebar header darker */}
      <rect x="0" y="0" width="28" height="34" fill="#141824" />
      {/* Diamond photo frame */}
      <rect x="7" y="6" width="14" height="14" fill="none" stroke={color} strokeWidth="1.2" transform="rotate(45 14 13)" />
      {/* Name */}
      <rect x="4" y="24" width="20" height="2.5" rx="0.5" fill="white" opacity="0.9" />
      <rect x="6" y="29" width="16" height="1.5" rx="0.75" fill={color} opacity="0.85" />
      {/* Contact labels */}
      <rect x="4" y="38" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
      <rect x="4" y="41" width="18" height="1" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="0" y="44" width="28" height="0.5" fill="rgba(255,255,255,0.07)" />
      <rect x="4" y="47" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
      <rect x="4" y="50" width="16" height="1" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="0" y="53" width="28" height="0.5" fill="rgba(255,255,255,0.07)" />
      <rect x="4" y="56" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
      <rect x="4" y="59" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.7)" />
      {/* Skills section */}
      <rect x="4" y="68" width="10" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
      {/* Skill dots */}
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={4 + i * 4} cy="74" r="1.5"
          fill={i < 4 ? color : "rgba(255,255,255,0.18)"} />
      ))}
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={4 + i * 4} cy="80" r="1.5"
          fill={i < 3 ? color : "rgba(255,255,255,0.18)"} />
      ))}
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={4 + i * 4} cy="86" r="1.5"
          fill={i < 5 ? color : "rgba(255,255,255,0.18)"} />
      ))}
      {/* Main area */}
      {/* Section header: PROFILE ────── */}
      <rect x="33" y="10" width="14" height="1.5" rx="0.75" fill="#1c2333" opacity="0.85" />
      <rect x="49" y="10.5" width="24" height="0.5" fill="#e5e7eb" />
      <rect x="33" y="16" width="36" height="1" rx="0.5" fill="#6b7280" opacity="0.6" />
      <rect x="33" y="19" width="32" height="1" rx="0.5" fill="#6b7280" opacity="0.6" />
      {/* Experience header */}
      <rect x="33" y="27" width="18" height="1.5" rx="0.75" fill="#1c2333" opacity="0.85" />
      <rect x="53" y="27.5" width="20" height="0.5" fill="#e5e7eb" />
      {/* Experience entry */}
      <rect x="33" y="34" width="22" height="1.5" rx="0.75" fill="#1c2333" />
      <rect x="33" y="38" width="16" height="1" rx="0.5" fill={color} opacity="0.8" />
      <rect x="33" y="41" width="10" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="33" y="45" width="36" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="33" y="48" width="30" height="1" rx="0.5" fill="#e5e7eb" />
      {/* Entry 2 */}
      <rect x="33" y="54" width="20" height="1.5" rx="0.75" fill="#1c2333" />
      <rect x="33" y="58" width="14" height="1" rx="0.5" fill={color} opacity="0.8" />
      <rect x="33" y="61" width="10" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="33" y="65" width="36" height="1" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function CharcoalClassicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fbfaf6" />
      {/* Pill header */}
      <rect x="4" y="4" width="72" height="22" rx="11" fill="#2a2a2a" />
      <circle cx="17" cy="15" r="7" fill="#cfd5db" />
      <rect x="28" y="10" width="30" height="3" rx="1.5" fill="#fff" opacity="0.9" />
      <rect x="28" y="15" width="20" height="1.5" rx="0.75" fill="#bdbdbd" opacity="0.7" />
      {/* Sidebar */}
      <rect x="4" y="32" width="22" height="74" rx="4" fill="#2a2a2a" />
      {/* Skill bars */}
      <rect x="7" y="38" width="16" height="1.2" rx="0.5" fill="#444" />
      <rect x="7" y="38" width="13" height="1.2" rx="0.5" fill={color} />
      <rect x="7" y="42" width="16" height="1.2" rx="0.5" fill="#444" />
      <rect x="7" y="42" width="9" height="1.2" rx="0.5" fill={color} />
      <rect x="7" y="46" width="16" height="1.2" rx="0.5" fill="#444" />
      <rect x="7" y="46" width="14" height="1.2" rx="0.5" fill={color} />
      {/* Main */}
      <rect x="30" y="34" width="16" height="1.5" rx="0.75" fill="#2a2a2a" opacity="0.7" />
      <rect x="30" y="38" width="44" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="30" y="41" width="40" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="30" y="48" width="20" height="1.5" rx="0.75" fill="#2a2a2a" opacity="0.7" />
      <rect x="30" y="52" width="44" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="30" y="55" width="36" height="1" rx="0.5" fill="#d1d5db" />
    </svg>
  )
}

export function NavyExecutiveThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f7f3e8" />
      {/* Navy sidebar */}
      <rect x="0" y="0" width="28" height="110" fill="#0e2a44" />
      <circle cx="14" cy="16" r="9" fill="#1a3956" />
      {/* Gold accent line */}
      <rect x="5" y="28" width="10" height="1.5" rx="0.75" fill="#b48a3c" />
      <rect x="5" y="32" width="18" height="1.2" rx="0.5" fill="#dde3ea" opacity="0.8" />
      <rect x="5" y="35" width="14" height="1" rx="0.5" fill="#b48a3c" opacity="0.6" />
      {/* Skill bars gold */}
      <rect x="5" y="48" width="18" height="1.5" rx="0.5" fill="#1a3956" />
      <rect x="5" y="48" width="14" height="1.5" rx="0.5" fill="#b48a3c" />
      <rect x="5" y="53" width="18" height="1.5" rx="0.5" fill="#1a3956" />
      <rect x="5" y="53" width="10" height="1.5" rx="0.5" fill="#b48a3c" />
      {/* Main header Curriculum Vitae */}
      <rect x="33" y="8" width="38" height="0.5" fill="#0e2a44" />
      <rect x="33" y="6" width="22" height="2.5" rx="1" fill="#0e2a44" opacity="0.6" />
      {/* Section blocks */}
      <rect x="33" y="18" width="16" height="2.5" rx="1" fill="#0e2a44" opacity="0.8" />
      <rect x="33" y="22" width="8" height="1.5" rx="0.5" fill="#b48a3c" />
      <rect x="33" y="26" width="40" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="33" y="29" width="34" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="33" y="36" width="14" height="2.5" rx="1" fill="#0e2a44" opacity="0.8" />
      <rect x="33" y="40" width="8" height="1.5" rx="0.5" fill="#b48a3c" />
      <rect x="33" y="44" width="40" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="33" y="47" width="30" height="1" rx="0.5" fill="#d1d5db" />
    </svg>
  )
}

export function CoralSidebarThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdf6ec" />
      {/* Right coral sidebar */}
      <rect x="52" y="0" width="28" height="110" fill={color} />
      {/* Big name */}
      <rect x="4" y="8" width="44" height="6" rx="2" fill="#2b2118" opacity="0.9" />
      <rect x="4" y="16" width="30" height="2" rx="1" fill={color} opacity="0.8" />
      {/* Color accent bar */}
      <rect x="4" y="20" width="14" height="3" rx="1.5" fill={color} />
      {/* Experience rows */}
      <rect x="4" y="30" width="8" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="16" y="30" width="28" height="1.5" rx="0.75" fill="#2b2118" opacity="0.8" />
      <rect x="16" y="33" width="20" height="1" rx="0.5" fill="#5d4d3c" opacity="0.6" />
      <rect x="4" y="40" width="8" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="16" y="40" width="24" height="1.5" rx="0.75" fill="#2b2118" opacity="0.8" />
      <rect x="16" y="43" width="18" height="1" rx="0.5" fill="#5d4d3c" opacity="0.6" />
      {/* Sidebar content */}
      <circle cx="66" cy="16" r="8" fill="rgba(0,0,0,0.2)" />
      <rect x="56" y="30" width="18" height="1" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="56" y="34" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.5)" />
      {/* Skill chips */}
      <rect x="56" y="44" width="12" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
      <rect x="56" y="50" width="16" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}

export function NeoBrutalistThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fef6e4" />
      {/* Hero card with shadow */}
      <rect x="6" y="6" width="68" height="22" fill={color} stroke="#0d0d0d" strokeWidth="2.5" />
      <rect x="9" y="9" width="68" height="22" fill="none" stroke="#0d0d0d" strokeWidth="1" opacity="0.3" />
      <rect x="8" y="14" width="36" height="5" rx="0" fill="#0d0d0d" opacity="0.8" />
      <rect x="8" y="21" width="22" height="2" rx="0" fill="#0d0d0d" opacity="0.5" />
      {/* HIRE ME badge */}
      <rect x="50" y="10" width="16" height="10" fill="#0d0d0d" />
      <rect x="51" y="12" width="14" height="6" rx="0" fill={color} opacity="0.3" />
      {/* Two-col layout */}
      {/* Pink card */}
      <rect x="6" y="33" width="32" height="18" fill="#f582ae" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="9" y="36" width="8" height="1.5" rx="0" fill="#0d0d0d" />
      <rect x="9" y="40" width="24" height="1" rx="0" fill="#0d0d0d" opacity="0.5" />
      <rect x="9" y="43" width="20" height="1" rx="0" fill="#0d0d0d" opacity="0.5" />
      {/* Blue card */}
      <rect x="42" y="33" width="32" height="18" fill="#8bd3dd" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="45" y="36" width="8" height="1.5" rx="0" fill="#0d0d0d" />
      <rect x="45" y="40" width="24" height="1" rx="0" fill="#0d0d0d" opacity="0.5" />
      {/* Green skills */}
      <rect x="6" y="56" width="42" height="20" fill="#a8e6a3" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="9" y="59" width="10" height="1.5" rx="0" fill="#0d0d0d" />
      {["0","8","16","24"].map((x, i) => (
        <rect key={i} x={9 + parseInt(x)} y="64" width="6" height="5" fill="#0d0d0d" />
      ))}
    </svg>
  )
}

export function SageBotanicalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f1ede4" />
      {/* Curved sage header */}
      <path d="M0,0 L80,0 L80,30 Q40,46 0,30 Z" fill={color} />
      <circle cx="16" cy="15" r="8" fill="rgba(0,0,0,0.2)" />
      <rect x="28" y="9" width="28" height="4" rx="1.5" fill="rgba(255,255,255,0.9)" />
      <rect x="28" y="15" width="18" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
      {/* Two columns */}
      <rect x="4" y="52" width="34" height="1.5" rx="0.75" fill="#c2774a" opacity="0.8" />
      <rect x="4" y="56" width="34" height="1" rx="0.5" fill="#2a3a29" opacity="0.4" />
      <rect x="4" y="59" width="30" height="1" rx="0.5" fill="#2a3a29" opacity="0.4" />
      <rect x="4" y="66" width="18" height="1.5" rx="0.75" fill="#c2774a" opacity="0.8" />
      {/* Left border accent */}
      <rect x="4" y="70" width="2" height="18" fill="#c2774a" opacity="0.6" />
      <rect x="8" y="71" width="24" height="1.5" rx="0.75" fill="#2a3a29" opacity="0.7" />
      <rect x="8" y="75" width="18" height="1" rx="0.5" fill="#2a3a29" opacity="0.4" />
      {/* Right column tags */}
      <rect x="42" y="52" width="16" height="1.5" rx="0.75" fill="#c2774a" opacity="0.8" />
      {[0,6,12,18].map((dy) => (
        <rect key={dy} x="42" y={57 + dy} width="14" height="4" rx="2" fill="transparent" stroke="#2a3a29" strokeWidth="0.8" />
      ))}
    </svg>
  )
}

export function TerminalCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1e1f2e" />
      {/* Title bar */}
      <rect x="0" y="0" width="80" height="10" fill="#15161f" />
      <circle cx="8" cy="5" r="2.5" fill="#ff5f57" />
      <circle cx="15" cy="5" r="2.5" fill="#febc2e" />
      <circle cx="22" cy="5" r="2.5" fill="#28c840" />
      <rect x="28" y="3.5" width="24" height="3" rx="1.5" fill="#7f8094" opacity="0.5" />
      {/* Tab bar */}
      <rect x="0" y="10" width="80" height="7" fill="#252638" />
      <rect x="0" y="10" width="24" height="7" fill="#1e1f2e" />
      <rect x="2" y="12" width="20" height="3" rx="1" fill="#e6e6f0" opacity="0.7" />
      {/* File nav */}
      <rect x="0" y="17" width="22" height="93" fill="#252638" />
      <rect x="3" y="21" width="16" height="1.5" rx="0.75" fill="#6cb6ff" opacity="0.7" />
      <rect x="3" y="25" width="14" height="1" rx="0.5" fill="#7f8094" opacity="0.6" />
      <rect x="3" y="28" width="12" height="1" rx="0.5" fill="#7f8094" opacity="0.5" />
      <rect x="3" y="31" width="16" height="1" rx="0.5" fill="#7f8094" opacity="0.5" />
      {/* Code lines */}
      <rect x="26" y="20" width="8" height="1.5" rx="0.75" fill="#ff7b9c" opacity="0.9" />
      <rect x="36" y="20" width="14" height="1.5" rx="0.75" fill="#c39bff" opacity="0.9" />
      <rect x="26" y="24" width="6" height="1.5" rx="0.75" fill="#ff7b9c" opacity="0.9" />
      <rect x="34" y="24" width="8" height="1.5" rx="0.75" fill="#6cb6ff" opacity="0.8" />
      <rect x="44" y="24" width="2" height="1.5" rx="0.75" fill="#e6e6f0" opacity="0.4" />
      <rect x="48" y="24" width="16" height="1.5" rx="0.75" fill="#ffa657" opacity="0.8" />
      <rect x="26" y="28" width="6" height="1.5" rx="0.75" fill="#ff7b9c" opacity="0.9" />
      <rect x="34" y="28" width="10" height="1.5" rx="0.75" fill="#6cb6ff" opacity="0.8" />
      <rect x="46" y="28" width="2" height="1.5" fill="#e6e6f0" opacity="0.4" />
      <rect x="50" y="28" width="12" height="1.5" rx="0.75" fill="#ffa657" opacity="0.8" />
      {/* Terminal prompt line "$ _" with blinking cursor accent */}
      <text x="26" y="98" fill="#7cdba4" opacity="0.9" style={{ fontSize: "5px", fontFamily: "ui-monospace, 'Courier New', monospace", fontWeight: 700 }}>{">_"}</text>
      <rect x="34" y="93.6" width="6" height="5" fill={color} opacity="0.7" />
      {/* Status bar */}
      <rect x="0" y="104" width="80" height="6" fill="#15161f" />
      <rect x="4" y="106" width="16" height="2" rx="1" fill="#7cdba4" opacity="0.7" />
      <rect x="50" y="106" width="24" height="2" rx="1" fill="#7f8094" opacity="0.5" />
    </svg>
  )
}

export function IOSAppCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f2f2f7" />
      {/* Status bar */}
      <rect x="0" y="0" width="80" height="8" fill="#f2f2f7" />
      <rect x="4" y="2" width="8" height="3" rx="1" fill="#1c1c1e" opacity="0.7" />
      <rect x="58" y="2" width="18" height="3" rx="1" fill="#1c1c1e" opacity="0.4" />
      {/* Big title */}
      <rect x="4" y="14" width="28" height="5" rx="1.5" fill="#1c1c1e" opacity="0.9" />
      <rect x="4" y="21" width="18" height="2" rx="1" fill="#8e8e93" opacity="0.7" />
      {/* Profile card */}
      <rect x="4" y="26" width="72" height="18" rx="6" fill="#fff" />
      <circle cx="16" cy="35" r="7" fill="#c7c7cc" />
      <rect x="28" y="29" width="28" height="3" rx="1.5" fill="#1c1c1e" opacity="0.8" />
      <rect x="28" y="34" width="20" height="2" rx="1" fill="#8e8e93" opacity="0.6" />
      <rect x="58" y="31" width="14" height="8" rx="4" fill={color} />
      {/* Stats grid */}
      {[0,1,2,3].map((i) => (
        <rect key={i} x={4 + i * 18} y="48" width="16" height="12" rx="4" fill="#fff" />
      ))}
      {/* Section label */}
      <rect x="4" y="64" width="28" height="2" rx="1" fill="#8e8e93" opacity="0.5" />
      {/* List rows */}
      <rect x="4" y="69" width="72" height="30" rx="6" fill="#fff" />
      {[0,1,2].map((i) => (
        <rect key={i} x="10" y={74 + i * 8} width="52" height="4" rx="2" fill="#e5e7eb" />
      ))}
      {/* Tab bar */}
      <rect x="0" y="102" width="80" height="8" fill="rgba(255,255,255,0.9)" />
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={8 + i * 16} cy="106" r="2" fill={i === 0 ? color : "#8e8e93"} opacity="0.7" />
      ))}
    </svg>
  )
}

export function DataDrivenThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fafafa" />
      {/* Top rule */}
      <rect x="0" y="6" width="80" height="0.5" fill="#0a0a0a" />
      {/* Big number */}
      <text x="4" y="38" style={{ fontFamily: "ui-monospace, sans-serif", fontSize: "40px", fontWeight: 900, letterSpacing: "-0.07em", fill: "#0a0a0a", opacity: 0.9 }}>10</text>
      <rect x="4" y="40" width="30" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      {/* Name */}
      <rect x="42" y="18" width="32" height="5" rx="1.5" fill="#0a0a0a" opacity="0.85" />
      <rect x="42" y="25" width="22" height="2" rx="1" fill="#0a0a0a" opacity="0.4" />
      {/* Bottom rule */}
      <rect x="0" y="48" width="80" height="0.5" fill="#0a0a0a" />
      {/* Metric strip */}
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x={4 + i * 15} y="52" width="12" height="8" rx="1" fill={i === 0 ? color : "#ececec"} opacity="0.6" />
      ))}
      <rect x="0" y="64" width="80" height="0.5" fill="#0a0a0a" />
      {/* Skill bars */}
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x="4" y={68 + i * 6} width={32 + i * 4} height="3" rx="1.5" fill="#0a0a0a" opacity={0.8 - i * 0.1} />
      ))}
      {/* Sparkline */}
      <rect x="0" y="100" width="80" height="0.5" fill="#0a0a0a" />
      <polyline points="4,107 18,105 32,102 46,99 60,96 74,92" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
      <circle cx="74" cy="92" r="2.5" fill={color} />
    </svg>
  )
}

export function BoardingPassThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#e8e3d6" />
      {/* Ticket 1 */}
      <rect x="4" y="4" width="72" height="32" fill="#fbf6ec" />
      <rect x="56" y="4" width="20" height="32" fill="#f4eedf" />
      <rect x="56" y="4" width="2" height="32" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
      <rect x="8" y="8" width="24" height="2" rx="1" fill={color} opacity="0.7" />
      {/* FROM / plane / TO */}
      <rect x="8" y="13" width="14" height="8" rx="1" fill="#1a1a1a" opacity="0.15" />
      <rect x="8" y="14" width="12" height="4" rx="1" fill="#1a1a1a" opacity="0.7" />
      <text x="28" y="21" style={{ fontSize: "10px", fill: color, fontWeight: 700 }}>✈</text>
      <rect x="38" y="14" width="12" height="4" rx="1" fill="#1a1a1a" opacity="0.7" />
      {/* Barcode */}
      {[0,2,4,6,8,10,12].map((x) => (
        <rect key={x} x={60 + x} y="12" width="1.5" height="14" fill="#1a1a1a" opacity={x % 4 === 0 ? 0.8 : 0.3} />
      ))}
      {/* Fields */}
      <rect x="8" y="26" width="18" height="1.5" rx="0.75" fill="#1a1a1a" opacity="0.3" />
      <rect x="29" y="26" width="22" height="1.5" rx="0.75" fill="#1a1a1a" opacity="0.3" />
      {/* Ticket 2 */}
      <rect x="4" y="40" width="72" height="22" fill="#fbf6ec" />
      <rect x="56" y="40" width="20" height="22" fill="#f4eedf" />
      <rect x="56" y="40" width="2" height="22" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
      <rect x="8" y="44" width="22" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      {[0,1,2,3].map((i) => (
        <rect key={i} x="8" y={48 + i * 4} width="42" height="1.5" rx="0.75" fill="#1a1a1a" opacity="0.15" />
      ))}
      {/* Ticket 3 */}
      <rect x="4" y="66" width="72" height="14" fill="#fbf6ec" />
      <rect x="56" y="66" width="20" height="14" fill="#f4eedf" />
      <rect x="8" y="70" width="42" height="1" rx="0.5" fill="#1a1a1a" opacity="0.2" />
      <rect x="8" y="74" width="30" height="1" rx="0.5" fill="#1a1a1a" opacity="0.2" />
    </svg>
  )
}

export function MagazineSpreadThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5efe4" />
      {/* Top metadata row */}
      <rect x="4" y="4" width="14" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="32" y="4" width="16" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="60" y="4" width="16" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      {/* Huge italic first name */}
      <rect x="4" y="10" width="50" height="12" rx="2" fill="#211c16" opacity="0.85" />
      {/* Last name normal */}
      <rect x="4" y="24" width="38" height="8" rx="2" fill="#211c16" opacity="0.7" />
      {/* Job title italic */}
      <rect x="4" y="34" width="28" height="2.5" rx="1" fill={color} opacity="0.8" />
      {/* Bottom header rule */}
      <rect x="0" y="40" width="80" height="1.5" fill="#211c16" />
      {/* Drop cap paragraph */}
      <rect x="4" y="44" width="10" height="14" rx="1" fill={color} opacity="0.6" />
      <rect x="16" y="44" width="28" height="2" rx="1" fill="#211c16" opacity="0.25" />
      <rect x="16" y="48" width="28" height="2" rx="1" fill="#211c16" opacity="0.25" />
      <rect x="4" y="52" width="40" height="2" rx="1" fill="#211c16" opacity="0.25" />
      <rect x="4" y="56" width="36" height="2" rx="1" fill="#211c16" opacity="0.25" />
      {/* Three columns */}
      <rect x="4" y="64" width="21" height="2.5" rx="1" fill={color} opacity="0.7" />
      <rect x="30" y="64" width="21" height="2.5" rx="1" fill={color} opacity="0.7" />
      <rect x="56" y="64" width="21" height="2.5" rx="1" fill={color} opacity="0.7" />
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x="4" y={69 + i * 5} width="21" height="1.5" rx="0.75" fill="#211c16" opacity={0.3 - i * 0.04} />
      ))}
      {[0,1,2,3].map((i) => (
        <rect key={i} x="30" y={69 + i * 5} width="21" height="1.5" rx="0.75" fill="#211c16" opacity={0.3 - i * 0.04} />
      ))}
      {[0,1,2,3].map((i) => (
        <rect key={i} x="56" y={69 + i * 5} width="21" height="1.5" rx="0.75" fill="#211c16" opacity={0.3 - i * 0.04} />
      ))}
      {/* Footer tags */}
      <rect x="0" y="104" width="80" height="1" fill="#211c16" opacity="0.5" />
      <rect x="4" y="106" width="68" height="2" rx="1" fill="#6b5e4d" opacity="0.4" />
    </svg>
  )
}

export function CodeEditorThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1e1e2e" />
      {/* Title bar */}
      <rect x="0" y="0" width="80" height="8" fill="#181825" />
      <circle cx="6" cy="4" r="2" fill="#f38ba8" />
      <circle cx="12" cy="4" r="2" fill="#f9e2af" />
      <circle cx="18" cy="4" r="2" fill="#a6e3a1" />
      <rect x="24" y="3" width="30" height="2" rx="1" fill="#313244" />
      {/* Line numbers */}
      <rect x="0" y="10" width="10" height="90" fill="#181825" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
        <rect key={i} x="2" y={13 + i * 7} width="6" height="1.5" rx="0.5" fill="#7c7f93" opacity="0.4" />
      ))}
      {/* Code lines */}
      <rect x="13" y="13" width="14" height="1.5" rx="0.5" fill="#cba6f7" />
      <rect x="29" y="13" width="25" height="1.5" rx="0.5" fill={color} />
      <rect x="13" y="21" width="10" height="1.5" rx="0.5" fill="#cba6f7" />
      <rect x="25" y="21" width="8" height="1.5" rx="0.5" fill="#f9e2af" />
      <rect x="35" y="21" width="20" height="1.5" rx="0.5" fill="#a6e3a1" />
      <rect x="13" y="29" width="18" height="1.5" rx="0.5" fill="#cba6f7" />
      <rect x="33" y="29" width="28" height="1.5" rx="0.5" fill={color} />
      <rect x="16" y="37" width="12" height="1.5" rx="0.5" fill="#a6e3a1" />
      <rect x="16" y="44" width="22" height="1.5" rx="0.5" fill="#a6e3a1" />
      <rect x="16" y="51" width="16" height="1.5" rx="0.5" fill="#7c7f93" opacity="0.6" />
      <rect x="13" y="58" width="20" height="1.5" rx="0.5" fill="#cba6f7" />
      <rect x="35" y="58" width="24" height="1.5" rx="0.5" fill={color} />
      <rect x="16" y="65" width="14" height="1.5" rx="0.5" fill="#a6e3a1" />
      <rect x="16" y="72" width="26" height="1.5" rx="0.5" fill="#a6e3a1" />
      <rect x="13" y="79" width="8" height="1.5" rx="0.5" fill="#cba6f7" />
      <rect x="13" y="86" width="22" height="1.5" rx="0.5" fill="#7c7f93" opacity="0.5" />
      {/* Status bar */}
      <rect x="0" y="104" width="80" height="6" fill={color} />
      <rect x="3" y="106" width="20" height="1.5" rx="0.5" fill="#1e1e2e" opacity="0.6" />
      <rect x="55" y="106" width="22" height="1.5" rx="0.5" fill="#1e1e2e" opacity="0.6" />
    </svg>
  )
}

export function CivilEngThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f3eddc" />
      <rect x="4" y="4" width="72" height="3" fill="#1a1f17" />
      <rect x="4" y="9" width="48" height="4" rx="0.5" fill="#1a1f17" />
      <rect x="4" y="15" width="30" height="1.5" rx="0.5" fill="#3f5d3a" />
      <rect x="60" y="7" width="16" height="8" fill={color} opacity="0.85" />
      <rect x="4" y="22" width="72" height="22" fill="rgba(63,93,58,0.08)" stroke="#1a1f17" strokeWidth="0.5" />
      <line x1="8" y1="40" x2="72" y2="40" stroke="#1a1f17" strokeWidth="0.6" />
      {[16,30,46,60].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={40} r="2.5" fill={color} />
          <line x1={x} y1={40} x2={x} y2={28 + i * 2} stroke="#1a1f17" strokeWidth="0.5" />
          <rect x={x - 6} y={25 + i * 2 - 3} width="12" height="2" fill="#1a1f17" opacity="0.5" rx="0.5" />
        </g>
      ))}
      <text x="40" y="27" fontSize="5" fill={color} textAnchor="middle" fontFamily="monospace">FIG.1—TIMELINE</text>
      <rect x="4" y="50" width="42" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="8" y={55 + i * 8} width="8" height="1.2" rx="0.5" fill={color} opacity="0.6" />
          <rect x="18" y={55 + i * 8} width="26" height="2" rx="0.5" fill="#1a1f17" opacity="0.5" />
          <rect x="18" y={58 + i * 8} width="20" height="1.2" rx="0.5" fill="#555" opacity="0.35" />
        </g>
      ))}
      <rect x="50" y="50" width="26" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x="50" y={55 + i * 5} width="26" height="1.5" rx="0.5" fill="#1a1f17" opacity={0.4 - i * 0.05} />
      ))}
      <rect x="0" y="104" width="80" height="0.8" fill="#1a1f17" />
      <rect x="4" y="106" width="72" height="1.5" rx="0.5" fill="#1a1f17" opacity="0.25" />
    </svg>
  )
}

export function MechanicalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fafaf6" />
      <rect x="4" y="4" width="72" height="1.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="4" y="8" width="52" height="5" rx="0.5" fill="#101010" opacity="0.85" />
      <rect x="4" y="15" width="34" height="1.5" rx="0.5" fill="#666" opacity="0.5" />
      {/* Exploded diagram */}
      <rect x="4" y="21" width="36" height="72" fill="white" stroke="#101010" strokeWidth="0.6" />
      <circle cx="22" cy="34" r="8" fill="none" stroke="#101010" strokeWidth="1" />
      <text x="22" y="36" fontSize="5" fill="#101010" textAnchor="middle" fontWeight="bold">EXP</text>
      <line x1="22" y1="42" x2="22" y2="48" stroke="#101010" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <rect x="14" y="48" width="16" height="10" fill="none" stroke="#101010" strokeWidth="1" />
      <text x="22" y="55" fontSize="5" fill="#101010" textAnchor="middle" fontWeight="bold">EDU</text>
      <line x1="22" y1="58" x2="22" y2="64" stroke="#101010" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <polygon points="22,64 30,70 22,76 14,70" fill="none" stroke="#101010" strokeWidth="1" />
      <text x="22" y="72" fontSize="5" fill="#101010" textAnchor="middle" fontWeight="bold">SKL</text>
      {/* Callouts */}
      <line x1="30" y1="34" x2="38" y2="30" stroke={color} strokeWidth="0.7" />
      <circle cx="30" cy="34" r="1.2" fill={color} />
      <line x1="30" y1="53" x2="38" y2="49" stroke={color} strokeWidth="0.7" />
      <circle cx="30" cy="53" r="1.2" fill={color} />
      {/* Right section content */}
      <rect x="45" y="21" width="18" height="1.5" rx="0.5" fill="#101010" opacity="0.7" />
      {[0,1,2].map((i) => (
        <g key={i}>
          <rect x="45" y={26 + i * 10} width="8" height="1.2" rx="0.5" fill={color} opacity="0.7" />
          <rect x="45" y={29 + i * 10} width="30" height="1.5" rx="0.5" fill="#101010" opacity="0.5" />
          <rect x="45" y={32 + i * 10} width="22" height="1.2" rx="0.5" fill="#666" opacity="0.35" />
        </g>
      ))}
      <rect x="45" y="57" width="14" height="1.5" rx="0.5" fill="#101010" opacity="0.7" />
      {[0,1,2,3].map((i) => (
        <rect key={i} x="45" y={62 + i * 4} width="28" height="1.2" rx="0.5" fill="#101010" opacity={0.35 - i * 0.05} />
      ))}
      <rect x="0" y="99" width="80" height="0.8" fill="#101010" />
      <rect x="4" y="101" width="72" height="1.5" rx="0.5" fill="#666" opacity="0.3" />
    </svg>
  )
}

export function DevOpsTerminalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0a0a0a" />
      {/* Top bar */}
      <rect x="0" y="0" width="80" height="8" fill="#1a1a1a" />
      <rect x="4" y="3" width="36" height="2" rx="0.5" fill="#666" opacity="0.5" />
      <rect x="58" y="3" width="18" height="2" rx="0.5" fill="#666" opacity="0.4" />
      {/* Log lines */}
      {[
        ["#666", "#ffae00", color],
        ["#666", "#ffae00", "#dcdcdc"],
        ["#666", "#ffae00", "#dcdcdc"],
        [color, "#ffae00", "#dcdcdc"],
        ["#666", null, "#313244"],
        ["#666", "#ffae00", "#dcdcdc"],
        ["#666", "#ffae00", "#dcdcdc"],
        [color, "#ffae00", "#dcdcdc"],
        ["#666", null, "#313244"],
        ["#666", "#ffae00", "#dcdcdc"],
        ["#666", "#ffae00", "#dcdcdc"],
        [color, "#ffae00", "#dcdcdc"],
      ].map((row, i) => row[1] ? (
        <g key={i}>
          <rect x="4" y={12 + i * 7} width="10" height="2" rx="0.5" fill={row[0] ?? undefined} opacity="0.7" />
          <rect x="16" y={12 + i * 7} width="12" height="2" rx="0.5" fill={row[1] ?? undefined} opacity="0.8" />
          <rect x="30" y={12 + i * 7} width="44" height="2" rx="0.5" fill={row[2] as string} opacity="0.65" />
        </g>
      ) : (
        <rect key={i} x="4" y={12 + i * 7} width="72" height="0.8" rx="0" fill={row[0] ?? undefined} opacity="0.4" />
      ))}
      {/* Cursor */}
      <rect x="8" y="98" width="4" height="6" rx="0.5" fill={color} opacity="0.8" />
      {/* Bottom bar */}
      <rect x="0" y="104" width="80" height="6" fill="#1a1a1a" />
      <rect x="4" y="106" width="16" height="1.5" rx="0.5" fill="#666" opacity="0.5" />
      <rect x="55" y="106" width="20" height="1.5" rx="0.5" fill="#666" opacity="0.4" />
    </svg>
  )
}

export function ProcessFlowThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5f4ee" />
      <rect x="0" y="0" width="80" height="3" fill={color} />
      <rect x="4" y="6" width="72" height="1.5" rx="0.5" fill={color} opacity="0.4" />
      <rect x="4" y="10" width="50" height="5" rx="0.5" fill="#1c1c1c" opacity="0.8" />
      <rect x="4" y="17" width="32" height="1.5" rx="0.5" fill="#666" opacity="0.5" />
      {/* DMAIC arrows */}
      <rect x="4" y="23" width="72" height="16" fill="white" stroke="#1c1c1c" strokeWidth="0.4" />
      {[0,1,2,3,4].map((i) => (
        <g key={i}>
          <polygon
            points={`${5 + i * 14},25 ${16 + i * 14},25 ${18 + i * 14},31 ${16 + i * 14},37 ${5 + i * 14},37 ${7 + i * 14},31`}
            fill={i < 2 ? color : "#e07a1c"}
            opacity="0.85"
          />
          <rect x={7 + i * 14} y={29} width="8" height="1.5" rx="0.5" fill="white" opacity="0.6" />
        </g>
      ))}
      {/* Content grid */}
      <rect x="4" y="45" width="44" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={50 + i * 9} width="8" height="1.2" rx="0.5" fill="#e07a1c" opacity="0.6" />
          <rect x="14" y={50 + i * 9} width="32" height="2" rx="0.5" fill="#1c1c1c" opacity="0.5" />
          <rect x="14" y={53 + i * 9} width="24" height="1.2" rx="0.5" fill="#666" opacity="0.3" />
        </g>
      ))}
      <rect x="52" y="45" width="24" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x="52" y={50 + i * 6} width="22" height="1.5" rx="0.5" fill="#1c1c1c" opacity={0.4 - i * 0.05} />
      ))}
    </svg>
  )
}

export function FrontPageThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f6f1e4" />
      <rect x="4" y="4" width="72" height="8" fill="#0a0a0a" />
      <rect x="8" y="6" width="40" height="4" rx="0.5" fill="#f6f1e4" opacity="0.8" />
      <rect x="4" y="14" width="72" height="0.8" fill="#0a0a0a" opacity="0.5" />
      <rect x="4" y="18" width="72" height="5" rx="0.5" fill="#0a0a0a" opacity="0.85" />
      <rect x="20" y="26" width="40" height="2" rx="0.4" fill={color} opacity="0.7" />
      {[0,1,2].map((c) => [0,1,2,3,4,5,6,7,8,9,10,11].map((r) => (
        <rect key={`${c}-${r}`} x={4 + c * 25} y={34 + r * 5} width="22" height="1.8" rx="0.4" fill="#0a0a0a" opacity="0.13" />
      )))}
      <rect x="4" y="55" width="22" height="2.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="29" y="73" width="22" height="2.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="54" y="89" width="22" height="2.5" rx="0.5" fill={color} opacity="0.8" />
      <rect x="4" y="104" width="72" height="0.8" fill="#0a0a0a" />
    </svg>
  )
}

export function VinylCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0e9d2" />
      <rect x="0" y="0" width="80" height="36" fill="#0a0a0a" />
      <circle cx="18" cy="18" r="14" fill="#1a1a1a" />
      <circle cx="18" cy="18" r="11" fill="none" stroke="#333" strokeWidth="0.5" />
      <circle cx="18" cy="18" r="8" fill="none" stroke="#333" strokeWidth="0.5" />
      <circle cx="18" cy="18" r="5" fill="#c1352e" />
      <circle cx="18" cy="18" r="1.2" fill="#0a0a0a" />
      <rect x="38" y="10" width="34" height="4" rx="0.5" fill="#f0e9d2" opacity="0.9" />
      <rect x="38" y="17" width="26" height="2.5" rx="0.5" fill="#f0e9d2" opacity="0.5" />
      <rect x="38" y="23" width="18" height="2" rx="0.4" fill={color} opacity="0.8" />
      {[0,1,2,3,4,5].map((i) => (
        <g key={i}>
          <rect x="4" y={42 + i * 9} width="36" height="2" rx="0.4" fill="#0a0a0a" opacity="0.55" />
          <rect x="4" y={45 + i * 9} width="26" height="1.5" rx="0.4" fill="#0a0a0a" opacity="0.25" />
          <rect x="43" y={42 + i * 9} width="3" height="3" rx="0.4" fill={color} opacity="0.7" />
        </g>
      ))}
      <rect x="0" y="104" width="80" height="6" fill="#0a0a0a" />
      <rect x="4" y="106" width="28" height="1.5" rx="0.3" fill={color} opacity="0.7" />
    </svg>
  )
}

export function CallSheetThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9f6ec" />
      <rect x="0" y="0" width="80" height="7" fill="#f4c430" />
      <rect x="4" y="2" width="28" height="2.5" rx="0.4" fill="#0c0c0c" opacity="0.5" />
      <rect x="56" y="2" width="20" height="2.5" rx="0.4" fill="#0c0c0c" opacity="0.5" />
      <rect x="4" y="11" width="44" height="6" rx="0.5" fill="#0c0c0c" opacity="0.85" />
      <rect x="4" y="19" width="28" height="2" rx="0.4" fill={color} opacity="0.7" />
      <rect x="4" y="26" width="72" height="32" fill="none" stroke="#0c0c0c" strokeWidth="0.8" />
      <rect x="4" y="26" width="72" height="5" fill="#0c0c0c" />
      {[0,1,2,3,4,5].map((i) => (
        <rect key={i} x="4" y={31 + i * 4.4} width="72" height="4.4" fill={i % 2 ? "#f3eee0" : "#fff"} />
      ))}
      <rect x="4" y="62" width="34" height="18" fill="none" stroke="#0c0c0c" strokeWidth="0.8" />
      <rect x="4" y="62" width="34" height="5" fill="#0c0c0c" />
      <rect x="42" y="62" width="34" height="18" fill="none" stroke="#0c0c0c" strokeWidth="0.8" />
      <rect x="42" y="62" width="34" height="5" fill="#0c0c0c" />
      <rect x="4" y="84" width="72" height="14" fill="none" stroke="#0c0c0c" strokeWidth="0.8" />
      <rect x="4" y="84" width="72" height="5" fill="#0c0c0c" />
      <rect x="0" y="104" width="80" height="6" fill="#0c0c0c" />
      <rect x="4" y="106" width="18" height="1.5" rx="0.3" fill="#f4c430" opacity="0.8" />
    </svg>
  )
}

export function CopywriterMagThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f4ecdc" />
      <rect x="4" y="5" width="72" height="0.8" fill="#101010" opacity="0.5" />
      <rect x="4" y="8" width="18" height="1.5" rx="0.3" fill="#101010" opacity="0.4" />
      <rect x="58" y="8" width="18" height="1.5" rx="0.3" fill="#101010" opacity="0.4" />
      <rect x="4" y="18" width="72" height="14" rx="0.8" fill="#101010" opacity="0.88" />
      <rect x="4" y="35" width="52" height="3" rx="0.5" fill={color} opacity="0.75" />
      <rect x="4" y="42" width="8" height="12" rx="0.5" fill={color} opacity="0.65" />
      {[0,1,2,3,4,5,6,7].map((i) => (
        <rect key={i} x="14" y={42 + i * 4.5} width="28" height="2" rx="0.4" fill="#101010" opacity="0.14" />
      ))}
      {[0,1,2,3,4,5,6,7].map((i) => (
        <rect key={i} x="46" y={42 + i * 4.5} width="30" height="2" rx="0.4" fill="#101010" opacity="0.14" />
      ))}
      <rect x="4" y="82" width="14" height="1.8" rx="0.3" fill={color} opacity="0.7" />
      {[0,1,2,3].map((i) => (
        <rect key={i} x="4" y={87 + i * 4} width="72" height="2" rx="0.4" fill="#101010" opacity="0.12" />
      ))}
      <rect x="4" y="104" width="72" height="0.8" fill="#101010" opacity="0.5" />
    </svg>
  )
}

export function AnimatorCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f6e9c7" />
      <rect x="4" y="4" width="72" height="0.8" fill="#1a1a1a" />
      <rect x="4" y="8" width="50" height="7" rx="0.5" fill="#1a1a1a" opacity="0.85" />
      <rect x="60" y="8" width="16" height="7" rx="0.5" fill={color} />
      <rect x="4" y="18" width="30" height="2" rx="0.4" fill="#1a1a1a" opacity="0.4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={4 + i * 9} y="23" width="8" height="5.5" fill={i % 2 ? "#f6e9c7" : "#fff"} stroke="#1a1a1a" strokeWidth="0.5" />
          <circle cx={4 + i * 9 + 3.5} cy="25.8" r={0.9 + i * 0.1} fill={i < 4 ? color : "#2a4ca8"} />
        </g>
      ))}
      <rect x="8" y="32" width="64" height="1" rx="0.3" fill="#2a4ca8" opacity="0.4" />
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={38 + i * 11} width="8" height="1.5" rx="0.3" fill={color} opacity="0.7" />
          <rect x="15" y={38 + i * 11} width="28" height="2.5" rx="0.4" fill="#1a1a1a" opacity="0.7" />
          <rect x="15" y={42 + i * 11} width="20" height="1.5" rx="0.4" fill="#1a1a1a" opacity="0.3" />
        </g>
      ))}
      {[0,1,2,3,4,5].map((i) => (
        <rect key={i} x={47 + (i % 2) * 17} y={38 + Math.floor(i / 2) * 7.5} width="14" height="4.5" rx="0.5" fill="#2a4ca8" opacity="0.65" />
      ))}
    </svg>
  )
}

export function ChefMenuThumb({ color }: { color: string }) {
  const red = color || "#8a2a1c"
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f4ecd8" />
      <line x1="0" y1="22" x2="80" y2="22" stroke="#1a120a" strokeWidth="0.6" />
      <text x="40" y="8" fontSize="4" textAnchor="middle" fontFamily="monospace" fill={red} letterSpacing="1">{"★ MENÚ ★"}</text>
      <text x="40" y="18" fontSize="9" textAnchor="middle" fontFamily="serif" fill="#1a120a" fontWeight="600">Name</text>
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={28 + i * 18} width="32" height="2" rx="0.5" fill={red} opacity="0.4" />
          <rect x="4" y={32 + i * 18} width="32" height="1.5" rx="0.5" fill="#1a120a" opacity="0.15" />
          <rect x="4" y={35 + i * 18} width="24" height="1.5" rx="0.5" fill="#1a120a" opacity="0.12" />
        </g>
      ))}
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="44" y={28 + i * 18} width="30" height="2" rx="0.5" fill={red} opacity="0.4" />
          <rect x="44" y={32 + i * 18} width="30" height="1.5" rx="0.5" fill="#1a120a" opacity="0.15" />
          <rect x="44" y={35 + i * 18} width="22" height="1.5" rx="0.5" fill="#1a120a" opacity="0.12" />
        </g>
      ))}
      <line x1="0" y1="104" x2="80" y2="104" stroke="#1a120a" strokeWidth="0.6" />
      <text x="40" y="109" fontSize="6" textAnchor="middle" fontFamily="serif" fill={red} fontStyle="italic">{"~ buen provecho ~"}</text>
    </svg>
  )
}

export function SommelierThumb({ color }: { color: string }) {
  const burgundy = color || "#5a1322"
  const gold = "#c9a23a"
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#efe6cf" />
      <rect x="4" y="4" width="72" height="102" fill="none" stroke={burgundy} strokeWidth="0.5" />
      <rect x="6" y="6" width="68" height="98" fill="none" stroke={burgundy} strokeWidth="0.8" />
      <circle cx="40" cy="20" r="8" fill="none" stroke={burgundy} strokeWidth="0.8" />
      <text x="40" y="24" fontSize="8" textAnchor="middle" fontFamily="serif" fill={burgundy} fontWeight="600">I</text>
      <text x="40" y="35" fontSize="4" textAnchor="middle" fontFamily="monospace" fill={burgundy} letterSpacing="1">{"· RESERVA ·"}</text>
      <text x="40" y="44" fontSize="9" textAnchor="middle" fontFamily="serif" fill={burgundy} fontWeight="500">Full Name</text>
      <line x1="20" y1="47" x2="60" y2="47" stroke={gold} strokeWidth="0.8" />
      {[0,1,2].map((i) => (
        <g key={i}>
          <rect x="10" y={55 + i * 14} width="26" height="2" rx="0.5" fill={burgundy} opacity="0.3" />
          <rect x="10" y={59 + i * 14} width="20" height="1.5" rx="0.5" fill="#1a0a0a" opacity="0.15" />
        </g>
      ))}
      {[0,1,2].map((i) => (
        <g key={i}>
          <rect x="45" y={55 + i * 14} width="24" height="2" rx="0.5" fill={burgundy} opacity="0.3" />
          <rect x="45" y={59 + i * 14} width="18" height="1.5" rx="0.5" fill="#1a0a0a" opacity="0.15" />
        </g>
      ))}
    </svg>
  )
}

export function HotelCVThumb({ color }: { color: string }) {
  const navy = color || "#1c3957"
  const gold = "#a98a4a"
  const sand = "#e8dfcd"
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill={sand} />
      <rect x="0" y="0" width="80" height="26" fill={navy} />
      <text x="4" y="9" fontSize="3.5" fontFamily="monospace" fill={gold} letterSpacing="0.8">{"· HOSPITALITY ·"}</text>
      <text x="4" y="18" fontSize="10" fontFamily="serif" fill={sand} fontWeight="500">Full Name</text>
      <text x="4" y="24" fontSize="4" fontFamily="serif" fill={gold} fontStyle="italic">General Manager</text>
      <rect x="0" y="26" width="80" height="5" fill={gold} />
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={36 + i * 14} width="18" height="1.5" rx="0.5" fill={navy} opacity="0.3" />
          <rect x="4" y={39 + i * 14} width="34" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.15" />
          <line x1="4" y1={46 + i * 14} x2="38" y2={46 + i * 14} stroke={gold} strokeWidth="0.5" />
        </g>
      ))}
      {[0,1,2].map((i) => (
        <g key={i}>
          <rect x="44" y={36 + i * 18} width="16" height="1.5" rx="0.5" fill={navy} opacity="0.3" />
          <rect x="44" y={39 + i * 18} width="30" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.15" />
        </g>
      ))}
      <rect x="0" y="104" width="80" height="6" fill={navy} />
    </svg>
  )
}

export function BartenderCVThumb({ color }: { color: string }) {
  const neon = color || "#ff2e63"
  const cyan = "#00d6c2"
  const gold = "#ffc645"
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0d0a0a" />
      <circle cx="16" cy="16" r="20" fill={neon} opacity="0.12" />
      <circle cx="64" cy="94" r="20" fill={cyan} opacity="0.10" />
      <line x1="0" y1="26" x2="80" y2="26" stroke={neon} strokeWidth="1" />
      <text x="40" y="20" fontSize="11" textAnchor="middle" fontFamily="serif" fill={neon} fontWeight="800">NAME</text>
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={32 + i * 16} width="32" height="2" rx="0.5" fill={gold} opacity="0.7" />
          <rect x="4" y={36 + i * 16} width="26" height="1.5" rx="0.5" fill="#f5edd6" opacity="0.15" />
          <line x1="4" y1={44 + i * 16} x2="36" y2={44 + i * 16} stroke={neon} strokeWidth="0.4" strokeDasharray="1,1" />
        </g>
      ))}
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="42" y={32 + i * 16} width="20" height="1.5" rx="0.5" fill={cyan} opacity="0.4" />
          <rect x="42" y={35 + i * 16} width="30" height="1.5" rx="0.5" fill="#f5edd6" opacity="0.15" />
        </g>
      ))}
      <rect x="0" y="104" width="80" height="6" fill={neon} />
    </svg>
  )
}

export function PostcardCVThumb({ color }: { color: string }) {
  const red = color || "#c1352e"
  const sky = "#cfe6f0"
  const green = "#3a7d44"
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fcf6e8" />
      <rect x="4" y="4" width="72" height="46" fill="#fff" stroke="#1f1a14" strokeWidth="0.5" />
      <rect x="5" y="5" width="34" height="44" fill={sky} />
      <polygon points="5,35 20,22 35,30 39,25 39,49 5,49" fill={green} opacity="0.6" />
      <polygon points="5,42 22,30 35,36 39,32 39,49 5,49" fill={green} />
      <circle cx="32" cy="12" r="4" fill="#ffd23f" />
      <rect x="66" y="6" width="9" height="11" fill="none" stroke={red} strokeWidth="0.7" />
      <text x="46" y="16" fontSize="5" fontFamily="serif" fill="#1f1a14" fontStyle="italic">{"¡Hola!"}</text>
      <rect x="41" y="19" width="22" height="1.5" rx="0.5" fill="#1f1a14" opacity="0.15" />
      <rect x="41" y="22" width="18" height="1.5" rx="0.5" fill="#1f1a14" opacity="0.12" />
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="4" y={56 + i * 12} width="8" height="1.5" rx="0.5" fill={red} opacity="0.6" />
          <rect x="14" y={56 + i * 12} width="24" height="1.5" rx="0.5" fill="#1f1a14" opacity="0.2" />
          <line x1="4" y1={64 + i * 12} x2="38" y2={64 + i * 12} stroke="#1f1a14" strokeWidth="0.3" strokeDasharray="1,1" />
        </g>
      ))}
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="44" y={56 + i * 12} width="18" height="1.5" rx="0.5" fill={red} opacity="0.4" />
          <rect x="44" y={59 + i * 12} width="30" height="1.5" rx="0.5" fill="#1f1a14" opacity="0.15" />
        </g>
      ))}
    </svg>
  )
}

export function LegalBriefThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fbfaf6" /><line x1="12" y1="8" x2="12" y2="102" stroke={color} strokeWidth="0.8" opacity="0.5" /><line x1="14.5" y1="8" x2="14.5" y2="102" stroke={color} strokeWidth="0.5" opacity="0.4" /><rect x="18" y="8" width="44" height="1.5" rx="0.75" fill={color} opacity="0.6" /><rect x="18" y="14" width="48" height="4" rx="1" fill="#0d0d0d" opacity="0.8" /><rect x="24" y="20" width="32" height="1.5" rx="0.75" fill={color} opacity="0.5" /><rect x="18" y="28" width="8" height="1.5" rx="0.75" fill={color} /><rect x="28" y="28" width="28" height="1.5" rx="0.75" fill="#0d0d0d" opacity="0.6" /><rect x="18" y="32" width="56" height="1" rx="0.5" fill="#0d0d0d" opacity="0.2" /><rect x="18" y="35" width="50" height="1" rx="0.5" fill="#0d0d0d" opacity="0.2" /><rect x="18" y="42" width="8" height="1.5" rx="0.75" fill={color} /><rect x="28" y="42" width="32" height="1.5" rx="0.75" fill="#0d0d0d" opacity="0.6" />{[0,1,2,3].map((i) => (<rect key={i} x="18" y={47 + i * 5} width="52" height="1" rx="0.5" fill="#0d0d0d" opacity="0.18" />))}<rect x="18" y="70" width="8" height="1.5" rx="0.75" fill={color} /><rect x="28" y="70" width="28" height="1.5" rx="0.75" fill="#0d0d0d" opacity="0.6" /><rect x="18" y="75" width="52" height="1" rx="0.5" fill="#0d0d0d" opacity="0.18" /><rect x="38" y="92" width="28" height="3" rx="1.5" fill={color} opacity="0.3" /></svg>)
}
export function EngravedThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f6efde" /><rect x="4" y="4" width="72" height="102" fill="none" stroke={color} strokeWidth="1.5" /><rect x="7" y="7" width="66" height="96" fill="none" stroke={color} strokeWidth="0.6" /><circle cx="40" cy="20" r="7" fill="none" stroke={color} strokeWidth="1" /><circle cx="40" cy="20" r="5" fill="none" stroke={color} strokeWidth="0.5" /><rect x="22" y="30" width="36" height="1.2" rx="0.6" fill={color} opacity="0.5" /><rect x="12" y="35" width="56" height="5" rx="1.5" fill="#0a0a0a" opacity="0.65" /><line x1="24" y1="43" x2="56" y2="43" stroke={color} strokeWidth="0.8" /><rect x="18" y="46" width="44" height="1.5" rx="0.75" fill="#0a0a0a" opacity="0.4" /><rect x="12" y="56" width="26" height="2" rx="1" fill={color} opacity="0.6" />{[0,1,2,3].map((i) => (<rect key={i} x="12" y={61 + i * 6} width="56" height="1.2" rx="0.6" fill="#0a0a0a" opacity={0.2 - i * 0.03} />))}<rect x="12" y="87" width="20" height="2" rx="1" fill={color} opacity="0.6" /><rect x="20" y="100" width="40" height="1" rx="0.5" fill={color} opacity="0.4" /></svg>)
}
export function ChalkboardThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chalkBoard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3a2e" />
          <stop offset="100%" stopColor="#13231a" />
        </linearGradient>
        <radialGradient id="chalkDust" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="chalkRough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence baseFrequency="0.9" numOctaves="1" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="0.6" />
        </filter>
      </defs>
      <rect width="80" height="110" fill="#3a2818" />
      {/* Wood frame */}
      <rect x="0" y="0" width="80" height="110" fill="#6e4a2a" />
      <rect x="3" y="3" width="74" height="104" fill="url(#chalkBoard)" />
      {/* Chalk dust haze */}
      <ellipse cx="40" cy="55" rx="40" ry="30" fill="url(#chalkDust)" />
      {/* Single <g> with filter — 1× render cost instead of 14× */}
      <g filter="url(#chalkRough)">
        {/* Handwritten name in white chalk */}
        <rect x="8" y="13" width="48" height="4" rx="1.5" fill="#ffffff" opacity="0.92" />
        <rect x="8" y="20" width="28" height="2" rx="1" fill={color} opacity="0.85" />
        {/* Underline scribble */}
        <path d="M8 25 Q20 24 32 25 T56 25" stroke="#ffffff" strokeWidth="0.6" fill="none" opacity="0.6" />
        {/* Section: pink chalk */}
        <rect x="8" y="32" width="18" height="2" rx="1" fill="#f4a3b6" opacity="0.85" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`exp-${i}`}
            x="8"
            y={37 + i * 4.5}
            width={40 - i * 5}
            height="1.1"
            rx="0.55"
            fill="#ffffff"
            opacity={0.55 - i * 0.08}
          />
        ))}
        {/* Section: yellow chalk */}
        <rect x="8" y="60" width="20" height="2" rx="1" fill="#f5d76e" opacity="0.85" />
        {[0, 1, 2].map((i) => (
          <rect
            key={`edu-${i}`}
            x="8"
            y={65 + i * 4.5}
            width={36 - i * 4}
            height="1.1"
            rx="0.55"
            fill="#ffffff"
            opacity={0.5 - i * 0.08}
          />
        ))}
        {/* Sketched diagram top-right */}
        <circle cx="62" cy="40" r="7" fill="none" stroke={color} strokeWidth="0.7" opacity="0.7" />
        <circle cx="62" cy="40" r="3" fill={color} opacity="0.45" />
        <line x1="55" y1="50" x2="69" y2="50" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
        <line x1="58" y1="53" x2="66" y2="53" stroke="#ffffff" strokeWidth="0.5" opacity="0.4" />
        {/* Skill chips chalk-outlined */}
        <rect x="8" y="84" width="14" height="3.5" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.55" />
        <rect x="24" y="84" width="12" height="3.5" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.55" />
        <rect x="38" y="84" width="16" height="3.5" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.55" />
      </g>
      {/* Chalk tray + eraser */}
      <rect x="6" y="98" width="68" height="3" fill="#6e4a2a" />
      <rect x="54" y="95" width="14" height="5" rx="1" fill="#d2b48c" />
      <rect x="56" y="96" width="10" height="2" rx="0.5" fill="#f4f1ea" opacity="0.85" />
      {/* Small chalk stick */}
      <rect x="38" y="98.5" width="8" height="1.5" rx="0.75" fill="#ffffff" opacity="0.8" />
    </svg>
  )
}
export function AcademicCVThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="white" /><rect x="8" y="8" width="44" height="5" rx="1" fill="#111" opacity="0.8" /><rect x="8" y="15" width="56" height="1.5" rx="0.75" fill="#666" opacity="0.5" /><rect x="8" y="21" width="64" height="1.5" fill="#111" opacity="0.8" /><rect x="8" y="28" width="32" height="1.5" rx="0.75" fill="#111" opacity="0.7" /><rect x="8" y="31" width="64" height="0.5" fill="#111" opacity="0.3" />{[0,1,2,3].map((i) => (<g key={i}><rect x="8" y={35 + i * 7} width="14" height="1" rx="0.5" fill={color} opacity="0.7" /><rect x="26" y={35 + i * 7} width="40" height="1" rx="0.5" fill="#111" opacity="0.3" /></g>))}<rect x="8" y="65" width="28" height="1.5" rx="0.75" fill="#111" opacity="0.7" /><rect x="8" y="100" width="64" height="0.5" fill="#111" opacity="0.4" /></svg>)
}
export function PsychologistThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f6f0e6" /><rect x="0" y="0" width="40" height="36" fill={color} opacity="0.85" /><rect x="40" y="0" width="40" height="36" fill="#c97a55" opacity="0.85" /><rect x="4" y="8" width="28" height="3" rx="1" fill="white" opacity="0.85" /><rect x="4" y="13" width="20" height="1.5" rx="0.75" fill="white" opacity="0.7" /><rect x="4" y="42" width="22" height="2" rx="1" fill={color} opacity="0.6" />{[0,1,2,3].map((i) => (<g key={i}><rect x="4" y={47 + i * 8} width="10" height="1" rx="0.5" fill="#c97a55" opacity="0.6" /><rect x="16" y={47 + i * 8} width="20" height="1.2" rx="0.6" fill="#2b2218" opacity="0.35" /></g>))}<rect x="44" y="42" width="18" height="2" rx="1" fill={color} opacity="0.6" /></svg>)
}

export function PilotLogThumb({ color }: { color: string }) {
  const navy = "#0c2545", paper = "#f6f1e4", gold = "#d4a942"
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill={paper} /><rect x="0" y="0" width="80" height="22" fill={navy} /><rect x="6" y="4" width="28" height="3" rx="1" fill={paper} opacity="0.9" /><rect x="6" y="9" width="18" height="1.5" rx="0.75" fill={gold} opacity="0.8" /><polygon points="70,11 71.5,15 76,15 72.5,17.5 73.8,22 70,19.5 66.2,22 67.5,17.5 64,15 68.5,15" fill={gold} opacity="0.9" /><rect x="6" y="26" width="68" height="12" fill="none" stroke="#0a0a0a" strokeWidth="0.8" /><rect x="6" y="42" width="68" height="6" fill={navy} />{[0,1,2,3,4].map((i) => (<rect key={i} x={8 + i * 13} y="44" width="10" height="1.5" rx="0.5" fill={paper} opacity="0.7" />))}{[0,1,2,3,4].map((i) => (<rect key={i} x="6" y={50 + i * 7} width="68" height="6" fill={i % 2 ? "#ece7d8" : paper} />))}<rect x="0" y="104" width="80" height="6" fill={navy} /><rect x="6" y="106" width="16" height="1.5" rx="0.5" fill={gold} opacity="0.8" /><rect x="56" y="106" width="16" height="1.5" rx="0.5" fill={gold} opacity="0.8" /></svg>)
}
export function OnboardingFormThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#ffffff" /><rect x="4" y="4" width="72" height="16" rx="3" fill={color} /><rect x="8" y="7" width="24" height="2" rx="1" fill="white" opacity="0.9" /><rect x="8" y="11" width="16" height="3" rx="1" fill="white" opacity="0.8" />{[0,1,2,3,4,5].map((i) => (<g key={i}><rect x="6" y={24 + i * 12} width="22" height="1" rx="0.5" fill={color} opacity="0.6" /><rect x="6" y={28 + i * 12} width="66" height="0.8" fill="#1a1a1a" opacity="0.5" /></g>))}<rect x="4" y="99" width="72" height="2" rx="0.5" fill="#1a1a1a" opacity="0.8" /><rect x="6" y="104" width="28" height="3" rx="0.5" fill={color} opacity="0.5" /></svg>)
}
export function AthleteCardThumb({ color }: { color: string }) {
  const navy = "#0c1f3d"
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f4ebd5" /><rect x="2" y="2" width="76" height="30" fill={navy} /><rect x="2" y="2" width="76" height="30" fill="none" stroke={color} strokeWidth="2.5" /><rect x="6" y="5" width="30" height="4" rx="1" fill="#f4ebd5" opacity="0.9" /><rect x="6" y="11" width="20" height="2.5" rx="1" fill={color} opacity="0.9" /><rect x="2" y="34" width="36" height="38" fill="white" stroke={navy} strokeWidth="1" /><rect x="40" y="34" width="38" height="38" fill={color} />{[0,1,2,3,4,5].map((i) => (<g key={i}><rect x="4" y={37 + i * 6} width="32" height="4" rx="0.5" fill="#eee" /><rect x="4" y={37 + i * 6} width={16 + (i * 5) % 16} height="4" rx="0.5" fill={color} opacity="0.8" /></g>))}<rect x="0" y="107" width="80" height="3" fill={navy} /></svg>)
}
export function TranslatorCVThumb({ color }: { color: string }) {
  const ink = "#1a1810"
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f5f0e3" /><rect x="15" y="10" width="50" height="2.5" rx="1" fill={ink} opacity="0.6" /><rect x="22" y="16" width="36" height="2" rx="1" fill={color} opacity="0.6" /><rect x="20" y="20" width="40" height="0.8" fill={ink} opacity="0.4" /><rect x="39" y="24" width="0.8" height="80" fill={ink} opacity="0.4" /><rect x="4" y="26" width="14" height="3" rx="1" fill={color} opacity="0.6" />{[0,1,2,3].map((i) => (<rect key={i} x="4" y={31 + i * 3.5} width={26 + (i * 4) % 10} height="2" rx="0.75" fill={ink} opacity="0.25" />))}<rect x="4" y="46" width="14" height="3" rx="1" fill={color} opacity="0.6" /><rect x="43" y="26" width="14" height="3" rx="1" fill={color} opacity="0.6" />{[0,1,2,3].map((i) => (<rect key={i} x="43" y={31 + i * 3.5} width={24 + (i * 3) % 12} height="2" rx="0.75" fill={ink} opacity="0.25" />))}<rect x="4" y="104" width="72" height="0.8" fill={ink} opacity="0.4" /></svg>)
}
export function HerbariumCVThumb({ color }: { color: string }) {
  const ink = "#1d2515", red = "#8a3a1f"
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f0e7c8" /><rect x="4" y="4" width="72" height="102" fill="none" stroke={color} strokeWidth="0.8" /><rect x="6" y="6" width="68" height="98" fill="none" stroke={color} strokeWidth="0.4" /><rect x="22" y="10" width="36" height="1.5" rx="0.5" fill={red} opacity="0.6" /><rect x="12" y="13" width="56" height="4" rx="1" fill={ink} opacity="0.5" /><rect x="42" y="25" width="0.5" height="76" fill={color} opacity="0.6" /><rect x="9" y="27" width="16" height="3" rx="0.75" fill={color} opacity="0.6" /><rect x="9" y="42" width="16" height="3" rx="0.75" fill={color} opacity="0.6" /><line x1="61" y1="27" x2="61" y2="72" stroke={color} strokeWidth="1" />{[35,45,55,65].map((y,i) => (<ellipse key={i} cx={i%2?52:70} cy={y} rx="7" ry="3" fill="none" stroke={color} strokeWidth="0.7" transform={`rotate(${i%2?-20:20} ${i%2?52:70} ${y})`} />))}<circle cx="61" cy="27" r="2" fill={red} /><rect x="20" y="100" width="40" height="1" rx="0.5" fill={color} opacity="0.4" /></svg>)
}

export function RisoDesignerThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fdf4ec" /><rect x="0" y="0" width="80" height="28" fill={color} opacity="0.15" /><rect x="8" y="8" width="40" height="6" rx="1" fill={color} opacity="0.8" /><rect x="8" y="17" width="24" height="2" rx="0.5" fill="#333" opacity="0.4" /><rect x="0" y="30" width="80" height="1.5" fill={color} opacity="0.6" /><rect x="8" y="38" width="30" height="2.5" rx="0.5" fill="#333" opacity="0.5" /><rect x="8" y="44" width="64" height="1.5" rx="0.5" fill="#ddd" /><rect x="8" y="48" width="56" height="1.5" rx="0.5" fill="#ddd" /><rect x="8" y="58" width="30" height="2.5" rx="0.5" fill="#333" opacity="0.5" /><rect x="8" y="64" width="64" height="1.5" rx="0.5" fill="#ddd" /><rect x="8" y="68" width="50" height="1.5" rx="0.5" fill="#ddd" /><circle cx="62" cy="42" r="12" fill={color} opacity="0.2" /><circle cx="62" cy="42" r="8" fill={color} opacity="0.25" /></svg>)
}

export function UXTokensThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#1a1a2e" /><rect x="4" y="4" width="72" height="22" rx="2" fill="#252542" /><rect x="8" y="8" width="32" height="3" rx="1" fill="#eee" opacity="0.9" /><rect x="8" y="14" width="20" height="2" rx="0.5" fill={color} opacity="0.8" /><rect x="4" y="30" width="34" height="36" rx="2" fill="#252542" /><rect x="8" y="33" width="14" height="1.5" rx="0.5" fill={color} opacity="0.6" /><rect x="8" y="37" width="26" height="2" rx="0.5" fill="#eee" opacity="0.7" /><rect x="8" y="42" width="26" height="2" rx="0.5" fill="#eee" opacity="0.4" /><rect x="42" y="30" width="34" height="36" rx="2" fill="#252542" /><rect x="46" y="33" width="14" height="1.5" rx="0.5" fill={color} opacity="0.6" /><rect x="46" y="37" width="26" height="2" rx="0.5" fill="#eee" opacity="0.7" /><rect x="4" y="70" width="72" height="36" rx="2" fill="#252542" /><rect x="8" y="74" width="14" height="1.5" rx="0.5" fill={color} opacity="0.6" />{[0,1,2,3].map(i=><rect key={i} x={8+i*18} y={78} width={14} height={20} rx="1" fill={color} opacity={0.1+i*0.05} />)}</svg>)
}

export function SketchbookIllustratorThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fffef5" />{[14,22,30,38,46,54,62,70,78,86,94,102].map(y=><line key={y} x1="0" y1={y} x2="80" y2={y} stroke="#c8d8f0" strokeWidth="0.5" />)}<line x1="18" y1="0" x2="18" y2="110" stroke="#f08080" strokeWidth="1" opacity="0.6" /><rect x="22" y="6" width="48" height="5" rx="1" fill="#333" opacity="0.7" /><rect x="22" y="14" width="30" height="2.5" rx="0.5" fill={color} opacity="0.7" /><rect x="22" y="26" width="20" height="2" rx="0.5" fill="#333" opacity="0.5" /><rect x="22" y="31" width="50" height="1.5" rx="0.5" fill="#888" opacity="0.4" /><rect x="22" y="34" width="42" height="1.5" rx="0.5" fill="#888" opacity="0.4" /><circle cx="10" cy="12" r="5" fill="#e8d5c0" stroke="#999" strokeWidth="0.5" /></svg>)
}

export function BlueprintCVThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#1a3a5c" />{[10,20,30,40,50,60,70,80,90,100].map(y=><line key={y} x1="0" y1={y} x2="80" y2={y} stroke="#4a7ab5" strokeWidth="0.3" opacity="0.5" />)}{[8,16,24,32,40,48,56,64,72].map(x=><line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#4a7ab5" strokeWidth="0.3" opacity="0.5" />)}<rect x="6" y="6" width="68" height="98" fill="none" stroke="#7ab8e8" strokeWidth="1" /><rect x="10" y="10" width="26" height="18" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="40" y="10" width="30" height="18" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="10" y="32" width="56" height="22" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="14" y="7" width="12" height="3" rx="0.5" fill="#7ab8e8" opacity="0.7" /><rect x="44" y="7" width="12" height="3" rx="0.5" fill="#7ab8e8" opacity="0.7" /></svg>)
}

export function ContactSheetThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#111" /><rect x="2" y="2" width="76" height="12" rx="1" fill="#222" /><rect x="4" y="4.5" width="20" height="7" rx="0.5" fill="#444" /><rect x="4" y="4.5" width="20" height="7" rx="0.5" fill="none" stroke={color} strokeWidth="0.5" />{[[0,0],[24,0],[48,0],[0,16],[24,16],[48,16],[0,32],[24,32],[48,32]].map(([dx,dy],i)=><rect key={i} x={4+dx} y={18+dy} width="18" height="13" rx="0.5" fill="#2a2a2a" stroke="#444" strokeWidth="0.3" />)}<rect x="4" y="66" width="72" height="1.5" rx="0.5" fill={color} opacity="0.6" /><rect x="4" y="70" width="40" height="2" rx="0.5" fill="#eee" opacity="0.5" /><rect x="4" y="75" width="30" height="1.5" rx="0.5" fill="#aaa" opacity="0.4" /></svg>)
}

export function AnnualReportThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f8f6f2" /><rect x="0" y="0" width="80" height="32" fill="#1a1a2a" /><rect x="8" y="5" width="44" height="8" rx="1" fill="#fff" opacity="0.9" /><rect x="8" y="16" width="28" height="3" rx="0.5" fill={color} opacity="0.8" /><rect x="8" y="22" width="56" height="1.5" rx="0.5" fill="#aaa" opacity="0.5" /><rect x="8" y="36" width="30" height="2.5" rx="0.5" fill="#333" opacity="0.6" />{[42,46,50,54,58].map((y,i)=><g key={i}><rect x="8" y={y} width="64" height="1.5" rx="0.3" fill="#eee" /><rect x="8" y={y} width={20+i*8} height="1.5" rx="0.3" fill={color} opacity="0.4" /></g>)}<polyline points="8,100 20,90 32,85 44,78 56,70 68,60" fill="none" stroke={color} strokeWidth="1.2" />{[[8,100],[20,90],[32,85],[44,78],[56,70],[68,60]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.5" fill={i===5?color:"#333"} />)}</svg>)
}

export function FinanceTerminalThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#0a0e0c" /><rect x="0" y="0" width="80" height="12" fill="#1a2e20" /><rect x="4" y="3" width="36" height="3" rx="0.5" fill={color} opacity="0.9" /><rect x="60" y="3" width="16" height="3" rx="0.5" fill="#888" opacity="0.6" /><rect x="4" y="16" width="14" height="2" rx="0.3" fill="#4ade80" opacity="0.7" /><rect x="4" y="21" width="72" height="1" rx="0.3" fill="#4ade80" opacity="0.2" />{[26,31,36,41,46,51,56,61].map((y,i)=><g key={i}><rect x="4" y={y} width="16" height="2" rx="0.3" fill={color} opacity="0.5" /><rect x="24" y={y} width="28" height="2" rx="0.3" fill="#4ade80" opacity={0.3+i*0.03} /><rect x="56" y={y} width="18" height="2" rx="0.3" fill="#f59e0b" opacity="0.5" /></g>)}<rect x="0" y="102" width="80" height="8" fill="#1a2e20" /><rect x="4" y="104.5" width="24" height="1.5" rx="0.3" fill={color} opacity="0.7" /></svg>)
}

export function CampaignPosterThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill={color} /><circle cx="95" cy="-15" r="55" fill="#ffd23f" opacity="0.95" /><rect x="8" y="28" width="56" height="16" rx="0.5" fill="#fff" opacity="0.95" /><rect x="8" y="46" width="48" height="16" rx="0.5" fill="#fff" opacity="0.95" /><rect x="14" y="67" width="32" height="7" rx="100" fill="#ffd23f" opacity="0.9" /><rect x="8" y="80" width="30" height="1.5" rx="0.3" fill="#fff" opacity="0.6" />{[84,88,92].map(y=><rect key={y} x="8" y={y} width="28" height="1.2" rx="0.3" fill="#fff" opacity="0.4" />)}<rect x="42" y="80" width="30" height="1.5" rx="0.3" fill="#fff" opacity="0.6" />{[84,88,92].map(y=><rect key={y} x="42" y={y} width="26" height="1.2" rx="0.3" fill="#fff" opacity="0.4" />)}</svg>)
}

export function SalesPitchThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#f5f0e8" /><rect x="0" y="0" width="80" height="26" fill="#1a1a2a" /><rect x="6" y="5" width="40" height="6" rx="1" fill="#fff" opacity="0.9" /><rect x="52" y="5" width="22" height="6" rx="1" fill="#fff" opacity="0.1" /><rect x="6" y="14" width="24" height="2.5" rx="0.5" fill={color} opacity="0.8" /><rect x="6" y="30" width="34" height="16" rx="1" fill="#1a1a2a" />{[33,37,41].map((y,i)=><g key={i}><rect x="8" y={y} width="10" height="2" rx="0.3" fill={color} opacity="0.7" /><rect x="20" y={y} width="12" height="2" rx="0.3" fill="#fff" opacity="0.5" /></g>)}<rect x="44" y="30" width="30" height="16" rx="1" fill="#eee" />{[0,1,2,3,4,5].map(i=><rect key={i} x={44+i*5} y="38" width="3" height={8-i} rx="0.5" fill={color} opacity="0.6" />)}<rect x="6" y="50" width="68" height="2" rx="0.5" fill="#333" opacity="0.2" />{[56,62,68].map((y,i)=><g key={i}><rect x="6" y={y} width="30" height="2" rx="0.5" fill="#888" opacity="0.4" /><rect x="40" y={y} width="34" height="2" rx="0.5" fill="#888" opacity="0.3" /></g>)}</svg>)
}

export function LedgerCVThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#fafaf8" /><rect x="0" y="0" width="80" height="12" fill="#f0ece0" /><rect x="4" y="4" width="40" height="4" rx="0.5" fill="#222" opacity="0.7" /><rect x="0" y="12" width="80" height="1.5" fill="#333" opacity="0.5" /><rect x="0" y="14" width="80" height="0.5" fill="#333" opacity="0.5" />{[0,1,2,3,4,5,6,7].map(i=><g key={i}><rect x="0" y={18+i*10} width="80" height="10" fill={i%2===0?"#f8f6ee":"#fff"} /><rect x="4" y={20+i*10} width="16" height="2" rx="0.3" fill="#888" opacity="0.5" /><rect x="22" y={20+i*10} width="26" height="2" rx="0.3" fill="#333" opacity="0.5" /><rect x="52" y={20+i*10} width="10" height="2" rx="0.3" fill={color} opacity="0.5" /><rect x="65" y={20+i*10} width="10" height="2" rx="0.3" fill="#888" opacity="0.4" /></g>)}<rect x="0" y="98" width="80" height="1.5" fill="#333" opacity="0.7" /><rect x="0" y="100" width="80" height="0.5" fill="#333" opacity="0.7" /><rect x="52" y="102" width="10" height="3" rx="0.5" fill={color} opacity="0.8" /></svg>)
}

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

export function ObsidianThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a1a2e" />
      <rect x="0" y="0" width="80" height="30" fill="#16213e" />
      <circle cx="40" cy="15" r="8" fill={color} opacity="0.5" />
      <rect x="10" y="33" width="60" height="3" rx="0.5" fill="#fff" opacity="0.8" />
      <rect x="20" y="38" width="40" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="6" y="47" width="68" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="50" width="55" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="53" width="60" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="60" width="30" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="6" y="64" width="68" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="67" width="55" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="75" width="30" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="6" y="79" width="68" height="1" rx="0.3" fill="#fff" opacity="0.3" />
      <rect x="6" y="82" width="60" height="1" rx="0.3" fill="#fff" opacity="0.3" />
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


export function NotebookCVThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdfaf5" />
      <rect x="0" y="0" width="8" height="110" fill={color} opacity="0.15" />
      <line x1="8" y1="0" x2="8" y2="110" stroke={color} strokeWidth="1.2" />
      <circle cx="4" cy="20" r="2" fill={color} opacity="0.6" />
      <circle cx="4" cy="40" r="2" fill={color} opacity="0.6" />
      <circle cx="4" cy="60" r="2" fill={color} opacity="0.6" />
      <circle cx="4" cy="80" r="2" fill={color} opacity="0.6" />
      <rect x="14" y="10" width="40" height="4" rx="0.5" fill="#1a1a1a" opacity="0.85" />
      <rect x="14" y="17" width="28" height="2" rx="0.5" fill="#555" opacity="0.6" />
      <line x1="14" y1="25" x2="66" y2="25" stroke={color} strokeWidth="0.8" />
      <rect x="14" y="29" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="14" y="33" width="52" height="1" rx="0.3" fill="#333" opacity="0.7" />
      <rect x="14" y="36" width="46" height="1" rx="0.3" fill="#333" opacity="0.5" />
      <rect x="14" y="44" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="14" y="48" width="52" height="1" rx="0.3" fill="#333" opacity="0.7" />
      <rect x="14" y="51" width="38" height="1" rx="0.3" fill="#333" opacity="0.5" />
      <rect x="14" y="59" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="14" y="63" width="44" height="1" rx="0.3" fill="#333" opacity="0.7" />
    </svg>
  )
}

export function FieldJournalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#ede2c8" />
      <line x1="0" y1="20" x2="80" y2="20" stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" />
      <line x1="0" y1="46" x2="80" y2="46" stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" />
      <line x1="0" y1="72" x2="80" y2="72" stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" />
      <line x1="4" y1="22" x2="76" y2="22" stroke="#1f1a0e" strokeWidth="1.2" />
      <rect x="4" y="5" width="20" height="1.2" rx="0.3" fill="#8a3a1f" opacity="0.7" />
      <rect x="54" y="5" width="22" height="1.2" rx="0.3" fill="#8a3a1f" opacity="0.7" />
      <rect x="4" y="10" width="52" height="5" rx="0.5" fill="#1f1a0e" opacity="0.85" />
      <rect x="4" y="17" width="36" height="2.5" rx="0.5" fill="#1f1a0e" opacity="0.6" />
      <rect x="4" y="26" width="22" height="2" rx="0.5" fill={color} opacity="0.7" />
      <rect x="4" y="30" width="36" height="1.2" rx="0.3" fill="#333" opacity="0.8" />
      <rect x="4" y="40" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="4" y="47" width="30" height="1.5" rx="0.5" fill="#333" />
      <rect x="4" y="57" width="28" height="1.5" rx="0.5" fill="#333" />
      <rect x="44" y="26" width="33" height="24" fill="#d6cdb0" stroke="#1f1a0e" strokeWidth="0.5" />
      <path d="M44 38 Q52 30 60 40 T78 35 L78 50 L44 50 Z" fill={color} opacity="0.2" />
      <circle cx="52" cy="44" r="1.5" fill="#8a3a1f" />
      <circle cx="64" cy="40" r="1.5" fill="#8a3a1f" />
      <rect x="44" y="54" width="20" height="1.5" rx="0.5" fill={color} opacity="0.7" />
      <rect x="44" y="58" width="32" height="1" rx="0.3" fill="#555" />
      <line x1="4" y1="103" x2="76" y2="103" stroke="#1f1a0e" strokeWidth="0.6" />
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
