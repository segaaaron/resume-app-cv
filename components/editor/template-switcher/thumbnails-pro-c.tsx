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

export function BlueprintCVThumb({ color }: { color: string }) {
  return (<svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="110" fill="#1a3a5c" />{[10,20,30,40,50,60,70,80,90,100].map(y=><line key={y} x1="0" y1={y} x2="80" y2={y} stroke="#4a7ab5" strokeWidth="0.3" opacity="0.5" />)}{[8,16,24,32,40,48,56,64,72].map(x=><line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#4a7ab5" strokeWidth="0.3" opacity="0.5" />)}<rect x="6" y="6" width="68" height="98" fill="none" stroke="#7ab8e8" strokeWidth="1" /><rect x="10" y="10" width="26" height="18" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="40" y="10" width="30" height="18" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="10" y="32" width="56" height="22" fill="none" stroke="#7ab8e8" strokeWidth="0.7" /><rect x="14" y="7" width="12" height="3" rx="0.5" fill="#7ab8e8" opacity="0.7" /><rect x="44" y="7" width="12" height="3" rx="0.5" fill="#7ab8e8" opacity="0.7" /></svg>)
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

// ─── Elite / Exec / Luxe — pilot batch (planillas-lujosas-Jun-2026) ───────────

// Atlas — left charcoal panel with portrait band + ochre tag, right bone content
// with numbered sections. Mini-rep of source EliteAtlas masthead structure.
export function EliteAtlasThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5f1e8" />
      {/* charcoal left panel */}
      <rect x="0" y="0" width="30" height="110" fill="#1c1b19" />
      {/* portrait band gradient */}
      <rect x="0" y="0" width="30" height="36" fill="#2a2723" />
      <rect x="3" y="30" width="8" height="1.2" fill="#c08433" />
      <rect x="3" y="33" width="20" height="1" fill="#c08433" opacity="0.85" />
      {/* sidebar tick rows (contact + skills) */}
      {[42, 47, 52, 57].map((y) => (
        <rect key={y} x="4" y={y} width="22" height="0.8" fill="#f5f1e8" opacity="0.45" />
      ))}
      <rect x="4" y="64" width="14" height="1" fill="#c08433" />
      {[68, 71, 74, 77, 80].map((y) => (
        <rect key={y} x="4" y={y} width="22" height="0.7" fill="#f5f1e8" opacity="0.3" />
      ))}
      {/* right hero — title eyebrow */}
      <rect x="34" y="10" width="18" height="1.4" fill="#c08433" />
      <rect x="34" y="14" width="34" height="5" rx="0.5" fill="#1c1b19" />
      <rect x="34" y="20" width="26" height="5" rx="0.5" fill="#1c1b19" opacity="0.85" />
      {/* numbered section divider */}
      <text x="34" y="36" fontSize="3" fill="#c08433" fontWeight="700">01</text>
      <rect x="40" y="34.5" width="10" height="0.8" fill="#1c1b19" opacity="0.7" />
      <rect x="51" y="35" width="22" height="0.4" fill="#dcd5c5" />
      {[40, 44, 48].map((y) => (
        <rect key={y} x="34" y={y} width="38" height="0.9" fill="#5a564f" opacity="0.5" />
      ))}
      <text x="34" y="60" fontSize="3" fill="#c08433" fontWeight="700">02</text>
      <rect x="40" y="58.5" width="10" height="0.8" fill="#1c1b19" opacity="0.7" />
      <rect x="51" y="59" width="22" height="0.4" fill="#dcd5c5" />
      {[64, 68].map((y) => (
        <rect key={y} x="34" y={y} width="38" height="0.9" fill="#5a564f" opacity="0.5" />
      ))}
      <text x="34" y="80" fontSize="3" fill="#c08433" fontWeight="700">03</text>
      <rect x="40" y="78.5" width="10" height="0.8" fill="#1c1b19" opacity="0.7" />
      <rect x="51" y="79" width="22" height="0.4" fill="#dcd5c5" />
      {[84, 88, 92].map((y) => (
        <rect key={y} x="34" y={y} width="38" height="0.9" fill="#5a564f" opacity="0.5" />
      ))}
    </svg>
  )
}

// Porcelain — ivory bg, centered serif name + guilloché wave + edu/lang grid
export function ExecPorcelainThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f3efe7" />
      {/* eyebrow uppercase title */}
      <rect x="28" y="10" width="24" height="1" fill="#b08d4f" />
      {/* centered serif name */}
      <rect x="18" y="14" width="44" height="6" rx="0.5" fill="#1b1a16" />
      {/* guilloché wave — 3 sines */}
      <path d="M22 28 Q26 26 30 28 T38 28 T46 28 T54 28 T58 28" fill="none" stroke="#b08d4f" strokeWidth="0.8" />
      <path d="M22 29 Q26 27.5 30 29 T38 29 T46 29 T54 29 T58 29" fill="none" stroke="#b08d4f" strokeWidth="0.5" opacity="0.6" />
      <path d="M22 30 Q26 28.5 30 30 T38 30 T46 30 T54 30 T58 30" fill="none" stroke="#b08d4f" strokeWidth="0.4" opacity="0.4" />
      {/* contact strip */}
      {[24, 38, 52].map((x) => (
        <rect key={x} x={x} y="34" width="10" height="0.8" fill="#8d8678" />
      ))}
      {/* italic summary */}
      {[40, 43, 46].map((y) => (
        <rect key={y} x="14" y={y} width="52" height="0.8" fill="#46423a" opacity="0.7" />
      ))}
      {/* Experience header */}
      <rect x="6" y="54" width="18" height="1.2" fill="#1b1a16" />
      <rect x="26" y="54.4" width="48" height="0.4" fill="#ddd6c8" />
      {/* timeline rows (date | content) */}
      {[58, 66, 74].map((y) => (
        <g key={y}>
          <rect x="6" y={y} width="14" height="0.8" fill="#b08d4f" />
          <rect x="6" y={y + 2} width="10" height="0.7" fill="#8d8678" />
          <rect x="24" y={y} width="22" height="1.2" fill="#1b1a16" />
          <rect x="24" y={y + 2} width="14" height="0.7" fill="#b08d4f" />
          <rect x="24" y={y + 4} width="44" height="0.7" fill="#57534a" opacity="0.7" />
        </g>
      ))}
      {/* edu + lang grid */}
      <rect x="6" y="92" width="14" height="1.2" fill="#1b1a16" />
      <rect x="22" y="92.4" width="14" height="0.4" fill="#ddd6c8" />
      <rect x="6" y="96" width="30" height="1.1" fill="#1b1a16" />
      <rect x="6" y="99" width="22" height="0.7" fill="#8d8678" />
      <rect x="42" y="92" width="14" height="1.2" fill="#1b1a16" />
      <rect x="58" y="92.4" width="14" height="0.4" fill="#ddd6c8" />
      {[96, 99, 102].map((y) => (
        <rect key={y} x="42" y={y} width="30" height="0.7" fill="#1b1a16" opacity="0.7" />
      ))}
    </svg>
  )
}

// Noir — obsidian frame with gold seal, corner brackets, italic name + two columns
export function LuxeNoirThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a1814" />
      {/* inner frame */}
      <rect x="4" y="4" width="72" height="102" fill="none" stroke="#c6a35a" strokeOpacity="0.35" strokeWidth="0.6" />
      {/* corner brackets (4) */}
      <path d="M8 14 V10 a1 1 0 0 1 1 -1 H13" fill="none" stroke="#c6a35a" strokeWidth="0.5" />
      <path d="M72 14 V10 a1 1 0 0 0 -1 -1 H67" fill="none" stroke="#c6a35a" strokeWidth="0.5" />
      <path d="M8 96 V100 a1 1 0 0 0 1 1 H13" fill="none" stroke="#c6a35a" strokeWidth="0.5" />
      <path d="M72 96 V100 a1 1 0 0 1 -1 1 H67" fill="none" stroke="#c6a35a" strokeWidth="0.5" />
      {/* seal — outer + inner circle + initials */}
      <circle cx="40" cy="20" r="8" fill="none" stroke="#c6a35a" strokeWidth="0.6" />
      <circle cx="40" cy="20" r="6" fill="none" stroke="#c6a35a" strokeWidth="0.4" opacity="0.7" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2
        const x1 = 40 + Math.cos(a) * 7.5
        const y1 = 20 + Math.sin(a) * 7.5
        const x2 = 40 + Math.cos(a) * 8.5
        const y2 = 20 + Math.sin(a) * 8.5
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c6a35a" strokeWidth="0.3" opacity="0.6" />
      })}
      <text x="40" y="21.5" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="6" fontWeight="600" fill="#ece7db">MS</text>
      {/* job title eyebrow */}
      <rect x="22" y="32" width="36" height="0.9" fill="#c6a35a" opacity="0.85" />
      {/* italic serif name */}
      <rect x="18" y="36" width="20" height="4" fill="#fff" />
      <rect x="40" y="36" width="22" height="4" fill="#fff" opacity="0.85" />
      {/* diamond divider */}
      <rect x="10" y="46" width="26" height="0.4" fill="#c6a35a" opacity="0.35" />
      <rect x="38" y="44.5" width="2" height="2" fill="#c6a35a" transform="rotate(45 39 45.5)" />
      <rect x="44" y="46" width="26" height="0.4" fill="#c6a35a" opacity="0.35" />
      {/* italic summary */}
      {[50, 53].map((y) => (
        <rect key={y} x="14" y={y} width="52" height="0.7" fill="#d6cfbf" opacity="0.6" />
      ))}
      {/* two-column body */}
      <rect x="8" y="60" width="14" height="0.9" fill="#c6a35a" />
      <rect x="23" y="60.3" width="22" height="0.3" fill="#c6a35a" opacity="0.35" />
      {[64, 68, 72, 76, 80, 84].map((y) => (
        <rect key={y} x="8" y={y} width="38" height="0.8" fill="#b8b1a2" opacity="0.5" />
      ))}
      <rect x="50" y="60" width="14" height="0.9" fill="#c6a35a" />
      <rect x="65" y="60.3" width="9" height="0.3" fill="#c6a35a" opacity="0.35" />
      {[64, 67, 70, 73, 76].map((y) => (
        <rect key={y} x="50" y={y} width="22" height="0.7" fill="#cfc8b9" opacity="0.5" />
      ))}
      <rect x="50" y="80" width="14" height="0.9" fill="#c6a35a" />
      <rect x="65" y="80.3" width="9" height="0.3" fill="#c6a35a" opacity="0.35" />
      {[84, 87, 90].map((y) => (
        <rect key={y} x="50" y={y} width="22" height="0.7" fill="#cfc8b9" opacity="0.5" />
      ))}
    </svg>
  )
}

// ─── Elite / Exec / Luxe — full batch (planillas-lujosas-Jun-2026) ────────────

// Counsel — dark sidebar-right, serif editorial, lawyer profession
export function EliteCounselThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f6f3ed" />
      <rect x="52" y="0" width="28" height="110" fill="#1a1612" />
      {[14,20,26,32].map(y=><rect key={y} x="56" y={y} width="20" height="0.7" fill="#f6f3ed" opacity="0.35" />)}
      <rect x="56" y="40" width="14" height="0.8" fill="#b89a52" />
      {[46,50,54,58,62,66].map(y=><rect key={y} x="56" y={y} width="18" height="0.6" fill="#f6f3ed" opacity="0.25" />)}
      <rect x="6" y="10" width="40" height="6" rx="0.5" fill="#1a1612" />
      <rect x="6" y="18" width="28" height="4" rx="0.3" fill="#1a1612" opacity="0.7" />
      <rect x="6" y="26" width="38" height="0.5" fill="#b89a52" />
      <rect x="6" y="29" width="16" height="0.8" fill="#b89a52" opacity="0.7" />
      {[34,38,42,46].map(y=><rect key={y} x="6" y={y} width="38" height="0.8" fill="#3d3830" opacity="0.55" />)}
      <rect x="6" y="54" width="14" height="1" fill="#1a1612" />
      <rect x="22" y="54.4" width="22" height="0.3" fill="#b89a52" opacity="0.4" />
      {[58,63,68,73,78].map(y=><rect key={y} x="6" y={y} width="38" height="0.7" fill="#3d3830" opacity="0.4" />)}
    </svg>
  )
}

// Aura — gradient hero, sparkle, designer profession
export function EliteAuraThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="aura-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
      <rect width="80" height="110" fill="#fafafa" />
      <rect x="0" y="0" width="80" height="32" fill="url(#aura-g)" />
      <circle cx="60" cy="10" r="14" fill="#fff" opacity="0.06" />
      <rect x="8" y="7" width="36" height="6" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="8" y="15" width="22" height="2.5" rx="0.5" fill="#fff" opacity="0.6" />
      <rect x="8" y="36" width="22" height="1.2" fill="#7c3aed" opacity="0.7" />
      {[40,44,48].map(y=><rect key={y} x="8" y={y} width={y===40?22:y===44?18:14} height="1.5" rx="0.3" fill="#7c3aed" opacity="0.5" />)}
      <rect x="8" y="58" width="22" height="1.2" fill="#7c3aed" opacity="0.7" />
      {[62,66,70].map(y=><g key={y}><rect x="8" y={y} width="64" height="1.5" rx="0.3" fill="#e5e7eb" /><rect x="8" y={y} width={y===62?48:y===66?36:24} height="1.5" rx="0.3" fill="#7c3aed" opacity="0.5" /></g>)}
    </svg>
  )
}

// Pulse — bold header band, timeline spine, marketing
export function ElitePulseThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="28" fill="#15123a" />
      <rect x="0" y="0" width="5" height="28" fill="#e91e8c" />
      <rect x="8" y="7" width="48" height="8" rx="0.5" fill="#fff" opacity="0.9" />
      <rect x="8" y="18" width="30" height="3" rx="0.3" fill="#e91e8c" opacity="0.8" />
      {[32,46,60,74].map(y=><g key={y}><circle cx="10" cy={y+2} r="2" fill="#e91e8c" /><rect x="14" y={y} width="28" height="2" rx="0.3" fill="#15123a" /><rect x="14" y={y+3} width="18" height="1" fill="#e91e8c" opacity="0.5" />{[y+5,y+7].map(yy=><rect key={yy} x="14" y={yy} width="52" height="0.7" fill="#666" opacity="0.4" />)}</g>)}
    </svg>
  )
}

// Cuvée — dark chef menu, gold serif, culinary profession
export function EliteCuveeThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0f0c09" />
      <rect x="4" y="4" width="72" height="102" fill="none" stroke="#c9a227" strokeWidth="0.5" opacity="0.5" />
      <rect x="28" y="12" width="24" height="1" fill="#c9a227" opacity="0.6" />
      <rect x="18" y="16" width="44" height="7" rx="0.3" fill="#e8dfc0" />
      <rect x="24" y="25" width="32" height="0.8" fill="#c9a227" opacity="0.5" />
      {[35,51,67,83].map(y=><g key={y}><rect x="8" y={y} width="64" height="0.5" fill="#c9a227" opacity="0.35" /><rect x="8" y={y+2} width="28" height="1.2" fill="#e8dfc0" opacity="0.7" />{[y+5,y+7,y+9].map(yy=><rect key={yy} x="8" y={yy} width="58" height="0.6" fill="#7a6a4a" opacity="0.5" />)}</g>)}
    </svg>
  )
}

// Cadence — amber cinematic, dark bg, filmmaker profession
export function EliteCadenceThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#111009" />
      <rect x="0" y="0" width="80" height="38" fill="#1c1709" />
      <rect x="0" y="36" width="80" height="3" fill="#d97706" />
      <rect x="8" y="8" width="48" height="7" rx="0.3" fill="#f5e9c8" />
      <rect x="8" y="18" width="28" height="3" rx="0.3" fill="#d97706" opacity="0.8" />
      {[44,60,76,92].map(y=><g key={y}><rect x="6" y={y} width="16" height="0.7" fill="#d97706" opacity="0.6" /><rect x="24" y={y} width="24" height="1.5" fill="#f5e9c8" opacity="0.7" />{[y+3,y+5].map(yy=><rect key={yy} x="24" y={yy} width="44" height="0.7" fill="#9a8a6a" opacity="0.35" />)}</g>)}
    </svg>
  )
}

// Meridian — clinical teal, white panels, doctor profession
export function EliteMeridianThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0f9f8" />
      <rect x="0" y="0" width="80" height="26" fill="#0d7a6e" />
      <rect x="8" y="6" width="40" height="7" rx="0.3" fill="#fff" opacity="0.92" />
      <rect x="8" y="16" width="24" height="2.5" rx="0.3" fill="#a5f3ee" opacity="0.8" />
      {[32,48,64,80].map(y=><g key={y}><rect x="6" y={y} width="16" height="0.8" fill="#0d7a6e" opacity="0.7" /><rect x="24" y={y} width="22" height="1.5" fill="#0a3d37" opacity="0.8" />{[y+3,y+5,y+7].map(yy=><rect key={yy} x="24" y={yy} width="50" height="0.7" fill="#555" opacity="0.35" />)}</g>)}
    </svg>
  )
}

// Aurum — cream bg, gold rings/gauges, skill arc trio
export function LuxeAurumThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#faf6ee" />
      <rect x="0" y="0" width="80" height="30" fill="#f0e8d4" />
      <rect x="6" y="8" width="40" height="7" rx="0.3" fill="#1a1712" />
      <rect x="6" y="18" width="24" height="2.5" rx="0.3" fill="#c9a227" opacity="0.7" />
      <circle cx="65" cy="15" r="8" fill="none" stroke="#c9a227" strokeWidth="1.2" opacity="0.4" />
      <circle cx="65" cy="15" r="8" fill="none" stroke="#c9a227" strokeWidth="1.2" strokeDasharray="30 20" opacity="0.9" />
      {[30,46,62].map((x,i)=><g key={x}><circle cx={x} cy="44" r="7" fill="none" stroke="#e8dfc0" strokeWidth="1.5" /><circle cx={x} cy="44" r="7" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeDasharray={`${(i+2)*11} 44`} /></g>)}
      <rect x="8" y="58" width="18" height="1" fill="#c9a227" opacity="0.6" />
      {[62,66,70,74,78,82,86,90].map(y=><rect key={y} x="8" y={y} width="64" height="0.7" fill="#555" opacity="0.3" />)}
    </svg>
  )
}

// Vellum — ivory editorial, guilloché wave, centered serif
export function LuxeVellumThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9f5ed" />
      <rect x="20" y="8" width="40" height="7" rx="0.3" fill="#1a1712" />
      <rect x="28" y="17" width="24" height="1.5" rx="0.3" fill="#8b7355" opacity="0.6" />
      <path d="M10 24 Q20 22 30 24 T50 24 T70 24" fill="none" stroke="#8b7355" strokeWidth="0.6" />
      <path d="M10 25.5 Q20 23.5 30 25.5 T50 25.5 T70 25.5" fill="none" stroke="#8b7355" strokeWidth="0.4" opacity="0.5" />
      <path d="M10 27 Q20 25 30 27 T50 27 T70 27" fill="none" stroke="#8b7355" strokeWidth="0.3" opacity="0.3" />
      <rect x="8" y="34" width="18" height="1" fill="#1a1712" opacity="0.7" />
      <rect x="28" y="34.4" width="44" height="0.3" fill="#c8bfa8" />
      {[40,50,60,70,80,90].map(y=><g key={y}><rect x="8" y={y} width="20" height="1.2" fill="#1a1712" opacity="0.6" />{[y+2.5].map(yy=><rect key={yy} x="8" y={yy} width="64" height="0.6" fill="#666" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Régent — emerald executive, metric band, trajectory
export function LuxeRegentThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5f9f6" />
      <rect x="0" y="0" width="80" height="26" fill="#0a4a30" />
      <rect x="8" y="7" width="36" height="6" rx="0.3" fill="#fff" opacity="0.92" />
      <rect x="8" y="16" width="20" height="2" rx="0.3" fill="#4ade80" opacity="0.8" />
      <rect x="0" y="26" width="80" height="12" fill="#0d5c3a" opacity="0.5" />
      {[12,38,64].map(x=><g key={x}><rect x={x} y="29" width="16" height="4" rx="0.3" fill="#4ade80" opacity="0.25" /><rect x={x} y="30" width="10" height="1.5" rx="0.3" fill="#4ade80" opacity="0.7" /></g>)}
      <rect x="8" y="44" width="18" height="1" fill="#0a4a30" opacity="0.8" />
      <rect x="28" y="44.4" width="44" height="0.3" fill="#c8e6d4" />
      {[50,62,74,86].map(y=><g key={y}><rect x="8" y={y} width="26" height="1.5" fill="#0a4a30" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="8" y={yy} width="64" height="0.6" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Apex — charcoal tech-luxe, compass mark, mono kicker
export function LuxeApexThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0e0f14" />
      <rect x="0" y="0" width="80" height="34" fill="#161820" />
      <rect x="0" y="32" width="80" height="1.5" fill="#00bfff" opacity="0.6" />
      <rect x="8" y="10" width="48" height="8" rx="0.3" fill="#e8ecf4" />
      <rect x="8" y="21" width="26" height="2.5" rx="0.3" fill="#00bfff" opacity="0.7" />
      <circle cx="68" cy="16" r="8" fill="none" stroke="#00bfff" strokeWidth="0.6" opacity="0.5" />
      <line x1="68" y1="8" x2="68" y2="24" stroke="#00bfff" strokeWidth="0.4" opacity="0.4" />
      <line x1="60" y1="16" x2="76" y2="16" stroke="#00bfff" strokeWidth="0.4" opacity="0.4" />
      {[40,54,68,82].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#e8ecf4" opacity="0.6" /><rect x="6" y={y+2.5} width="14" height="0.8" fill="#00bfff" opacity="0.4" />{[y+5].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#6080a0" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Regency — banded editorial, serif, horizontal rule bands
export function ExecRegencyThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#faf8f2" />
      <rect x="0" y="0" width="80" height="4" fill="#1a1410" />
      <rect x="0" y="4" width="80" height="1.2" fill="#b89a52" />
      <rect x="6" y="10" width="52" height="8" rx="0.3" fill="#1a1410" />
      <rect x="6" y="21" width="30" height="2.5" rx="0.3" fill="#8c7840" opacity="0.7" />
      <rect x="0" y="28" width="80" height="1.2" fill="#b89a52" />
      <rect x="0" y="30" width="80" height="4" fill="#1a1410" />
      {[38,52,66,80].map(y=><g key={y}><rect x="6" y={y} width="26" height="1.5" fill="#1a1410" opacity="0.75" /><rect x="6" y={y+2.5} width="16" height="0.8" fill="#8c7840" opacity="0.5" />{[y+5,y+7].map(yy=><rect key={yy} x="6" y={yy} width="64" height="0.7" fill="#555" opacity="0.35" />)}</g>)}
    </svg>
  )
}

// Sovereign — navy rail left, circular portrait, dark executive
export function ExecSovereignThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f2f4f7" />
      <rect x="0" y="0" width="5" height="110" fill="#0a1628" />
      <rect x="5" y="0" width="1.2" height="110" fill="#c6a35a" opacity="0.7" />
      <circle cx="17" cy="20" r="9" fill="#0a1628" opacity="0.12" />
      <circle cx="17" cy="20" r="9" fill="none" stroke="#c6a35a" strokeWidth="0.6" />
      <rect x="28" y="8" width="44" height="7" rx="0.3" fill="#0a1628" opacity="0.85" />
      <rect x="28" y="18" width="28" height="2.5" rx="0.3" fill="#c6a35a" opacity="0.6" />
      <rect x="10" y="34" width="62" height="0.5" fill="#c6a35a" opacity="0.4" />
      {[40,54,68,82].map(y=><g key={y}><rect x="10" y={y} width="24" height="1.5" fill="#0a1628" opacity="0.65" /><rect x="10" y={y+2.5} width="14" height="0.8" fill="#c6a35a" opacity="0.5" />{[y+5].map(yy=><rect key={yy} x="10" y={yy} width="60" height="0.7" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Citadel — art-deco navy, double border frame, chevrons
export function ExecCitadelThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0f2f5" />
      <rect x="3" y="3" width="74" height="104" fill="none" stroke="#0a1e3d" strokeWidth="0.8" />
      <rect x="6" y="6" width="68" height="98" fill="none" stroke="#0a1e3d" strokeWidth="0.3" opacity="0.4" />
      <rect x="0" y="24" width="80" height="14" fill="#0a1e3d" />
      <rect x="8" y="27" width="50" height="7" rx="0.3" fill="#fff" opacity="0.9" />
      <path d="M6 22 L9 19 L12 22" fill="none" stroke="#c6a35a" strokeWidth="0.6" />
      <path d="M6 38 L9 41 L12 38" fill="none" stroke="#c6a35a" strokeWidth="0.6" />
      {[48,60,72,84].map(y=><g key={y}><rect x="8" y={y} width="26" height="1.5" fill="#0a1e3d" opacity="0.7" /><rect x="8" y={y+2.5} width="14" height="0.8" fill="#c6a35a" opacity="0.5" />{[y+5].map(yy=><rect key={yy} x="8" y={yy} width="62" height="0.6" fill="#444" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Dynasty — ornate guilloché, corner rosettes, monogram diamond
export function ExecDynastyThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0e0c0a" />
      <rect x="4" y="4" width="72" height="102" fill="none" stroke="#c9a040" strokeWidth="0.5" opacity="0.5" />
      <circle cx="4" cy="4" r="4" fill="none" stroke="#c9a040" strokeWidth="0.4" opacity="0.6" />
      <circle cx="76" cy="4" r="4" fill="none" stroke="#c9a040" strokeWidth="0.4" opacity="0.6" />
      <circle cx="4" cy="106" r="4" fill="none" stroke="#c9a040" strokeWidth="0.4" opacity="0.6" />
      <circle cx="76" cy="106" r="4" fill="none" stroke="#c9a040" strokeWidth="0.4" opacity="0.6" />
      <path d="M36 14 L40 10 L44 14 L40 18 Z" fill="#c9a040" opacity="0.7" />
      <rect x="18" y="22" width="44" height="7" rx="0.3" fill="#e8dfc0" />
      <rect x="26" y="31" width="28" height="0.8" fill="#c9a040" opacity="0.5" />
      {[42,54,66,78,90].map(y=><g key={y}><rect x="8" y={y} width="26" height="1.4" fill="#e8dfc0" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="8" y={yy} width="58" height="0.6" fill="#9a8a6a" opacity="0.35" />)}</g>)}
    </svg>
  )
}

// Oxblood — bordeaux sidebar, wax seal, executive
export function ExecOxbloodThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5f0eb" />
      <rect x="0" y="0" width="28" height="110" fill="#5a1020" />
      {[14,20,26,32].map(y=><rect key={y} x="4" y={y} width="20" height="0.7" fill="#f5f0eb" opacity="0.3" />)}
      <circle cx="14" cy="52" r="9" fill="#8a1830" />
      <circle cx="14" cy="52" r="9" fill="none" stroke="#c9a040" strokeWidth="0.5" opacity="0.8" />
      <circle cx="14" cy="52" r="6" fill="none" stroke="#c9a040" strokeWidth="0.3" opacity="0.5" />
      {[66,72,78,84].map(y=><rect key={y} x="4" y={y} width="20" height="0.7" fill="#f5f0eb" opacity="0.25" />)}
      <rect x="34" y="10" width="40" height="7" rx="0.3" fill="#1a0a0d" opacity="0.85" />
      <rect x="34" y="20" width="26" height="2.5" rx="0.3" fill="#8a1830" opacity="0.6" />
      {[32,46,60,74,88].map(y=><g key={y}><rect x="32" y={y} width="24" height="1.2" fill="#1a0a0d" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="32" y={yy} width="40" height="0.6" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Cobalt — midnight bg, platinum network constellation
export function ExecCobaltThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#060810" />
      <rect x="0" y="0" width="80" height="30" fill="#0a0d1a" />
      <rect x="0" y="28" width="80" height="1.5" fill="#4488cc" opacity="0.5" />
      <rect x="8" y="8" width="44" height="7" rx="0.3" fill="#e0e8f8" />
      <rect x="8" y="18" width="26" height="2.5" rx="0.3" fill="#4488cc" opacity="0.7" />
      <circle cx="60" cy="12" r="3" fill="none" stroke="#4488cc" strokeWidth="0.5" opacity="0.6" />
      <circle cx="68" cy="18" r="2" fill="none" stroke="#4488cc" strokeWidth="0.4" opacity="0.5" />
      <circle cx="72" cy="8" r="2.5" fill="none" stroke="#4488cc" strokeWidth="0.4" opacity="0.4" />
      <line x1="60" y1="12" x2="68" y2="18" stroke="#4488cc" strokeWidth="0.3" opacity="0.4" />
      <line x1="68" y1="18" x2="72" y2="8" stroke="#4488cc" strokeWidth="0.3" opacity="0.3" />
      {[38,52,66,80].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#e0e8f8" opacity="0.6" /><rect x="6" y={y+2.5} width="14" height="0.8" fill="#4488cc" opacity="0.4" />{[y+5].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#6080a0" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Terra — terracotta arch header, earth tones, serif executive
export function ExecTerraThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#faf5ee" />
      <rect x="0" y="0" width="80" height="30" fill="#8b3a1e" />
      <path d="M0 30 Q10 22 20 30 Q30 22 40 30 Q50 22 60 30 Q70 22 80 30" fill="none" stroke="#c06040" strokeWidth="1" opacity="0.6" />
      <rect x="8" y="7" width="44" height="7" rx="0.3" fill="#f5e8d8" opacity="0.95" />
      <rect x="8" y="17" width="28" height="2.5" rx="0.3" fill="#e8c090" opacity="0.8" />
      <rect x="0" y="30" width="80" height="2" fill="#c06040" opacity="0.5" />
      {[36,50,64,78].map(y=><g key={y}><rect x="8" y={y} width="26" height="1.5" fill="#3d1a0c" opacity="0.75" /><rect x="8" y={y+2.5} width="16" height="0.8" fill="#8b3a1e" opacity="0.5" />{[y+5,y+7].map(yy=><rect key={yy} x="8" y={yy} width="62" height="0.7" fill="#6a4030" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Nocturne — plum header, rose-gold accents, skill rings
export function ExecNocturneThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a0d1e" />
      <rect x="0" y="0" width="80" height="30" fill="#240d2a" />
      <rect x="0" y="28" width="80" height="1.5" fill="#e8a0b0" opacity="0.6" />
      <rect x="8" y="8" width="44" height="7" rx="0.3" fill="#f2e8f0" />
      <rect x="8" y="18" width="26" height="2.5" rx="0.3" fill="#e8a0b0" opacity="0.8" />
      {[22,42,62].map(x=><g key={x}><circle cx={x} cy="42" r="6" fill="none" stroke="#4a2050" strokeWidth="1.2" /><circle cx={x} cy="42" r="6" fill="none" stroke="#e8a0b0" strokeWidth="1.2" strokeDasharray="22 16" /></g>)}
      {[56,68,80,92].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.4" fill="#f2e8f0" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#9070a0" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Platine — black & platinum type, outline numerals, minimal
export function ExecPlatineThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="2" fill="#111" />
      <rect x="6" y="8" width="52" height="9" rx="0.3" fill="#111" />
      <rect x="6" y="20" width="28" height="2.5" rx="0.3" fill="#111" opacity="0.4" />
      <rect x="0" y="27" width="80" height="2" fill="#111" />
      <text x="6" y="38" fontSize="7" fill="none" stroke="#111" strokeWidth="0.4" fontWeight="700">01</text>
      <rect x="20" y="34" width="52" height="0.5" fill="#ccc" />
      {[40,48,56].map(y=><g key={y}><rect x="6" y={y} width="26" height="1.4" fill="#111" opacity="0.7" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#555" opacity="0.35" />)}</g>)}
      <text x="6" y="70" fontSize="7" fill="none" stroke="#111" strokeWidth="0.4" fontWeight="700">02</text>
      <rect x="20" y="66" width="52" height="0.5" fill="#ccc" />
      {[72,80,88].map(y=><g key={y}><rect x="6" y={y} width="20" height="1.4" fill="#111" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// ─── Wave 2: Signature / Tpl / Flagship / Showcase / By Profession ───

// Atelier — warm studio feel, kraft-paper bg, serif title, wax-dot accent
export function TplAtelierThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f4ede0" />
      <rect x="0" y="0" width="80" height="28" fill="#e8dcc8" />
      <rect x="6" y="6" width="48" height="8" rx="0.5" fill="#2c1f0e" />
      <rect x="6" y="17" width="32" height="2.5" rx="0.5" fill={color} opacity="0.7" />
      <circle cx="66" cy="14" r="7" fill={color} opacity="0.15" />
      <circle cx="66" cy="14" r="4" fill={color} opacity="0.35" />
      <rect x="0" y="28" width="80" height="1" fill="#c8b898" />
      {[36,50,64,78,92].map(y=><g key={y}><rect x="6" y={y} width="24" height="1.5" fill="#2c1f0e" opacity="0.7" /><rect x="6" y={y+2.5} width="14" height="0.8" fill={color} opacity="0.5" />{[y+5,y+7].map(yy=><rect key={yy} x="6" y={yy} width="64" height="0.7" fill="#7a6a50" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Bloom — botanical header, petal motif, spring palette
export function TplBloomThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdf8f4" />
      <rect x="0" y="0" width="80" height="32" fill="#f5e8f0" />
      {[0,60,120,180,240,300].map((deg,i)=>{
        const r=6, cx=66, cy=16, rad=deg*Math.PI/180
        return <ellipse key={i} cx={cx+Math.cos(rad)*r} cy={cy+Math.sin(rad)*r} rx="3" ry="5" transform={`rotate(${deg} ${cx+Math.cos(rad)*r} ${cy+Math.sin(rad)*r})`} fill={color} opacity="0.25" />
      })}
      <circle cx="66" cy="16" r="3" fill={color} opacity="0.6" />
      <rect x="6" y="8" width="44" height="7" rx="0.5" fill="#3d1a2e" />
      <rect x="6" y="18" width="28" height="2.5" rx="0.5" fill={color} opacity="0.6" />
      <rect x="0" y="32" width="80" height="1" fill="#e8c8e0" />
      {[40,54,68,82,96].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#3d1a2e" opacity="0.65" /><rect x="6" y={y+2.5} width="12" height="0.8" fill={color} opacity="0.5" />{[y+5].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.7" fill="#8a6a7a" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Velvet — deep eggplant bg, champagne accents, luxe sidebar
export function TplVelvetThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a0a24" />
      <rect x="0" y="0" width="28" height="110" fill="#240d30" />
      <rect x="28" y="0" width="1" fill="#d4af70" height="110" opacity="0.5" />
      <circle cx="14" cy="18" r="9" fill="#3a1040" />
      <circle cx="14" cy="18" r="9" fill="none" stroke="#d4af70" strokeWidth="0.6" opacity="0.7" />
      <rect x="4" y="32" width="20" height="2" rx="0.5" fill="#f0e8d0" opacity="0.9" />
      <rect x="4" y="37" width="16" height="1.5" rx="0.5" fill="#d4af70" opacity="0.6" />
      {[50,58,66,74,82].map(y=><rect key={y} x="4" y={y} width="18" height="0.8" fill="#d4af70" opacity="0.2" />)}
      <rect x="34" y="10" width="40" height="7" rx="0.3" fill="#f0e8d0" opacity="0.9" />
      <rect x="34" y="20" width="26" height="2.5" rx="0.3" fill="#d4af70" opacity="0.6" />
      {[32,46,60,74,88].map(y=><g key={y}><rect x="32" y={y} width="24" height="1.4" fill="#f0e8d0" opacity="0.55" />{[y+3].map(yy=><rect key={yy} x="32" y={yy} width="40" height="0.6" fill="#9080a0" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Sahara — sandy warm, terracotta accents, desert earth
export function TplSaharaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5ead8" />
      <rect x="0" y="0" width="80" height="24" fill="#c8784a" />
      <path d="M0 24 Q20 18 40 24 Q60 18 80 24" fill="none" stroke="#e8a070" strokeWidth="1.5" opacity="0.6" />
      <rect x="6" y="5" width="44" height="7" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="6" y="15" width="26" height="2" rx="0.5" fill="#ffe0c0" opacity="0.85" />
      {[32,46,60,74,88].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#5c2a10" opacity="0.65" /><rect x="6" y={y+2.5} width="12" height="0.8" fill={color} opacity="0.55" />{[y+5].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#8a6040" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Pearl — cream/ivory, thin gold lines, centered editorial
export function TplPearlThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdfaf5" />
      <rect x="0" y="0" width="80" height="2" fill="#c8a870" opacity="0.7" />
      <rect x="0" y="2" width="80" height="0.5" fill="#c8a870" opacity="0.3" />
      <rect x="20" y="10" width="40" height="8" rx="0.3" fill="#1a1510" />
      <rect x="26" y="21" width="28" height="2" rx="0.3" fill="#8a7050" opacity="0.6" />
      <rect x="0" y="28" width="80" height="0.5" fill="#c8a870" opacity="0.5" />
      <rect x="0" y="29.5" width="80" height="1.5" fill="#c8a870" opacity="0.15" />
      <rect x="0" y="31" width="80" height="0.5" fill="#c8a870" opacity="0.5" />
      {[38,52,66,80,94].map(y=><g key={y}><rect x="8" y={y} width="18" height="1.4" fill="#1a1510" opacity="0.65" /><rect x="8" y={y+2.5} width="10" height="0.7" fill="#c8a870" opacity="0.6" />{[y+5].map(yy=><rect key={yy} x="8" y={yy} width="64" height="0.6" fill="#8a7050" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Editorial2 (Gazette) — newspaper broadsheet, multi-col, bold header
export function TplGazetteThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#faf8f2" />
      <rect x="0" y="0" width="80" height="1.5" fill="#1a1510" />
      <rect x="6" y="4" width="68" height="10" rx="0.3" fill="#1a1510" />
      <rect x="6" y="17" width="68" height="0.8" fill="#1a1510" />
      <rect x="6" y="19" width="30" height="0.4" fill="#1a1510" opacity="0.4" />
      <rect x="38" y="18.5" width="36" height="1" rx="0.3" fill={color} opacity="0.7" />
      {[24,32,40].map(y=><rect key={y} x="6" y={y} width="30" height="1" fill="#333" opacity="0.4" />)}
      <rect x="40" y="24" width="36" height="22" fill="#e8e4d8" opacity="0.5" />
      <rect x="0" y="50" width="80" height="0.5" fill="#1a1510" opacity="0.5" />
      {[54,60,66,72,78].map(y=><g key={y}><rect x="6" y={y} width="20" height="1" fill="#333" opacity="0.35" /><rect x="30" y={y} width="20" height="1" fill="#333" opacity="0.35" /><rect x="54" y={y} width="20" height="1" fill="#333" opacity="0.35" /></g>)}
    </svg>
  )
}

// Confetti — white bg, scattered colored dots, playful bold header
export function TplConfettiThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#ffffff" />
      <rect x="6" y="8" width="52" height="9" rx="1" fill="#111" />
      <rect x="6" y="20" width="30" height="3" rx="1" fill={color} opacity="0.8" />
      {[[12,6],[22,4],[36,7],[48,5],[58,6],[68,4],[72,8],[10,14],[30,12],[54,11],[74,14],[8,36],[18,34],[42,38],[66,35],[74,40],[6,55],[20,58],[38,52],[60,56],[76,54],[4,74],[22,76],[48,72],[70,76]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5" fill={[color,"#ff6b6b","#4ecdc4","#ffd93d"][i%4]} opacity="0.6" />
      ))}
      {[32,46,62,78].map(y=><g key={y}><rect x="6" y={y} width="20" height="1.5" fill="#111" opacity="0.65" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.7" fill="#888" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Frame — double border frame, centered name, clean white
export function TplFrameThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#ffffff" />
      <rect x="4" y="4" width="72" height="102" fill="none" stroke={color} strokeWidth="1.2" />
      <rect x="7" y="7" width="66" height="96" fill="none" stroke={color} strokeWidth="0.4" opacity="0.4" />
      <rect x="20" y="16" width="40" height="8" rx="0.3" fill="#111" />
      <rect x="24" y="27" width="32" height="2" rx="0.3" fill={color} opacity="0.6" />
      <rect x="10" y="34" width="60" height="0.5" fill={color} opacity="0.4" />
      {[42,56,70,84,98].map(y=><g key={y}><rect x="12" y={y} width="20" height="1.5" fill="#111" opacity="0.65" />{[y+3].map(yy=><rect key={yy} x="12" y={yy} width="56" height="0.7" fill="#666" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Cameo — circular portrait cameo, showcase format, warm bg
export function ShowCameoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f8f4ee" />
      <ellipse cx="40" cy="22" rx="16" ry="18" fill="#e8dcc8" />
      <ellipse cx="40" cy="22" rx="16" ry="18" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="40" cy="22" rx="12" ry="14" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
      <rect x="20" y="44" width="40" height="6" rx="0.3" fill="#1a1510" />
      <rect x="26" y="53" width="28" height="2" rx="0.3" fill={color} opacity="0.6" />
      <rect x="10" y="60" width="60" height="0.5" fill={color} opacity="0.4" />
      {[66,76,86,96].map(y=><g key={y}><rect x="12" y={y} width="18" height="1.4" fill="#1a1510" opacity="0.6" />{[y+3].map(yy=><rect key={yy} x="12" y={yy} width="56" height="0.6" fill="#7a6a50" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Marquis — grand arch header, gold inlay, formal showcase
export function ShowMarquisThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0e0c08" />
      <path d="M10 40 Q10 8 40 8 Q70 8 70 40 L70 42 L10 42 Z" fill="#1a1610" />
      <path d="M14 40 Q14 12 40 12 Q66 12 66 40" fill="none" stroke="#c9a040" strokeWidth="0.7" opacity="0.6" />
      <rect x="20" y="24" width="40" height="7" rx="0.3" fill="#e8dfc0" />
      <rect x="24" y="34" width="32" height="2" rx="0.3" fill="#c9a040" opacity="0.6" />
      <rect x="0" y="44" width="80" height="1.2" fill="#c9a040" opacity="0.4" />
      {[52,64,76,88,100].map(y=><g key={y}><rect x="8" y={y} width="22" height="1.4" fill="#e8dfc0" opacity="0.55" />{[y+3].map(yy=><rect key={yy} x="8" y={yy} width="62" height="0.6" fill="#9a8a6a" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Soiree — evening dark navy, champagne, showtime glamour
export function ShowSoireeThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#07091a" />
      <rect x="0" y="0" width="80" height="36" fill="#0e112a" />
      <rect x="0" y="34" width="80" height="1.5" fill="#d4af70" opacity="0.5" />
      <rect x="8" y="8" width="48" height="8" rx="0.3" fill="#f0e8d0" opacity="0.9" />
      <rect x="8" y="19" width="30" height="2.5" rx="0.3" fill="#d4af70" opacity="0.7" />
      {[14,26,38,50,62,74].map((x,i)=><circle key={i} cx={x} cy="29"  r="1" fill="#d4af70" opacity={i%2===0?0.6:0.3} />)}
      {[44,58,72,86,100].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.4" fill="#f0e8d0" opacity="0.5" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#6070a0" opacity="0.25" />)}</g>)}
    </svg>
  )
}

// Plume — white clean, feather flourish right, elegant writing
export function ShowPlumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fffefa" />
      <rect x="0" y="0" width="80" height="1.5" fill={color} />
      <rect x="6" y="8" width="50" height="8" rx="0.3" fill="#1a1510" />
      <rect x="6" y="19" width="30" height="2.5" rx="0.3" fill={color} opacity="0.6" />
      <path d="M62 6 Q72 12 68 22 Q64 30 72 26 Q76 14 68 6 Q65 4 62 6Z" fill={color} opacity="0.12" />
      <path d="M65 8 Q72 14 68 22" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4" />
      <rect x="0" y="30" width="80" height="0.5" fill={color} opacity="0.4" />
      {[38,52,66,80,94].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.4" fill="#1a1510" opacity="0.65" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#666" opacity="0.28" />)}</g>)}
    </svg>
  )
}

// Chef — kitchen whites, toque icon, culinary card
export function TplChefThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fffdf8" />
      <rect x="0" y="0" width="80" height="32" fill="#1a1208" />
      <ellipse cx="16" cy="14" rx="8" ry="6" fill="#fff" opacity="0.15" />
      <rect x="10" y="14" width="12" height="8" rx="0" fill="#fff" opacity="0.12" />
      <rect x="28" y="10" width="40" height="7" rx="0.3" fill="#fff" opacity="0.9" />
      <rect x="28" y="20" width="26" height="2.5" rx="0.3" fill={color} opacity="0.8" />
      <rect x="0" y="32" width="80" height="2" fill={color} opacity="0.8" />
      {[40,54,68,82,96].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#1a1208" opacity="0.7" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Teacher — chalkboard green, chalk-white text, educational
export function TplTeacherThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#2d4a32" />
      <rect x="0" y="0" width="80" height="30" fill="#243c28" />
      <rect x="0" y="30" width="80" height="2" fill="#8fbc8f" opacity="0.5" />
      <rect x="6" y="8" width="50" height="8" rx="0.3" fill="#fff" opacity="0.88" />
      <rect x="6" y="19" width="32" height="2.5" rx="0.3" fill="#a8d8a8" opacity="0.8" />
      {[38,52,66,80,94].map(y=><g key={y}><rect x="6" y={y} width="20" height="1.4" fill="#fff" opacity="0.6" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#fff" opacity="0.25" />)}</g>)}
    </svg>
  )
}

// Journalist — broadsheet column layout, bold byline, press card
export function TplJournalistThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9f7f2" />
      <rect x="0" y="0" width="80" height="2" fill="#111" />
      <rect x="6" y="5" width="68" height="10" rx="0.3" fill="#111" />
      <rect x="6" y="18" width="68" height="0.6" fill="#111" />
      <rect x="6" y="21" width="50" height="2.5" rx="0.3" fill={color} opacity="0.8" />
      <rect x="0" y="27" width="80" height="1" fill="#111" opacity="0.8" />
      <rect x="38" y="28" width="1" height="80" fill="#ccc" />
      {[32,40,48,56,64,72,80,88].map(y=><g key={y}><rect x="6" y={y} width="28" height="0.8" fill="#333" opacity="0.35" /><rect x="42" y={y} width="32" height="0.8" fill="#333" opacity="0.35" /></g>)}
      <rect x="6" y="36" width="28" height="6" fill="#e8e4d4" opacity="0.6" />
    </svg>
  )
}

// Communicator — speech-bubble accent, bright sidebar, PR/comms
export function TplCommunicatorThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f5f8ff" />
      <rect x="0" y="0" width="80" height="28" fill={color} />
      <rect x="6" y="6" width="48" height="8" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="6" y="17" width="30" height="2.5" rx="0.5" fill="#fff" opacity="0.6" />
      <path d="M60 10 Q62 6 66 8 Q70 6 72 10 Q70 14 66 14 L62 17 L62 14 Q60 14 60 10Z" fill="#fff" opacity="0.2" />
      <rect x="0" y="28" width="80" height="2" fill={color} opacity="0.3" />
      {[36,50,64,78,92].map(y=><g key={y}><rect x="6" y={y} width="24" height="1.5" fill="#1a2a4a" opacity="0.65" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#4060a0" opacity="0.25" />)}</g>)}
    </svg>
  )
}

// Filmmaker — film strip header, clapperboard accent, dark cinematic
export function TplFilmmakerThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0a0a0a" />
      <rect x="0" y="0" width="80" height="16" fill="#111" />
      {[4,16,28,40,52,64,76].map(x=><rect key={x} x={x} y="0" width="8" height="4" fill="#222" />)}
      {[4,16,28,40,52,64,76].map(x=><rect key={x} x={x} y="12" width="8" height="4" fill="#222" />)}
      <rect x="6" y="20" width="48" height="7" rx="0.3" fill="#e8e8e8" />
      <rect x="6" y="30" width="30" height="2.5" rx="0.3" fill="#aaa" opacity="0.7" />
      <rect x="58" y="20" width="16" height="10" rx="0.5" fill="#333" />
      <rect x="58" y="20" width="16" height="3" rx="0.5" fill="#555" />
      {[40,54,68,82,96].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.4" fill="#e8e8e8" opacity="0.55" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#555" opacity="0.35" />)}</g>)}
    </svg>
  )
}

// Photographer — lens circle hero, dark bg, portfolio card
export function TplPhotographerThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#111" />
      <rect x="0" y="0" width="80" height="36" fill="#1a1a1a" />
      <circle cx="66" cy="18" r="14" fill="#222" />
      <circle cx="66" cy="18" r="14" fill="none" stroke={color} strokeWidth="0.8" opacity="0.7" />
      <circle cx="66" cy="18" r="9" fill="none" stroke={color} strokeWidth="0.4" opacity="0.4" />
      <circle cx="66" cy="18" r="5" fill={color} opacity="0.2" />
      <rect x="6" y="10" width="44" height="7" rx="0.3" fill="#e8e8e8" />
      <rect x="6" y="20" width="28" height="2.5" rx="0.3" fill={color} opacity="0.7" />
      {[42,56,70,84,98].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.4" fill="#e8e8e8" opacity="0.5" />{[y+3].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#666" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Architect — blueprint grid, technical white/blue, ruled paper
export function TplArchitectThumb({ color: _color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#e8f0f8" />
      {[10,20,30,40,50,60,70,80,90,100].map(y=><line key={y} x1="0" y1={y} x2="80" y2={y} stroke="#c0d0e8" strokeWidth="0.4" />)}
      {[10,20,30,40,50,60,70].map(x=><line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#c0d0e8" strokeWidth="0.4" />)}
      <rect x="0" y="0" width="80" height="26" fill="#0a2a5a" />
      <rect x="6" y="7" width="48" height="7" rx="0.3" fill="#fff" opacity="0.92" />
      <rect x="6" y="17" width="28" height="2" rx="0.3" fill="#4090e0" opacity="0.8" />
      <rect x="0" y="26" width="80" height="1.5" fill="#4090e0" opacity="0.5" />
      {[36,50,64,78,92].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#0a2a5a" opacity="0.7" />{[y+4,y+7].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#0a2a5a" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Doctor — clinical white, teal accent, medical card
export function TplDoctorThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f8fdfc" />
      <rect x="0" y="0" width="80" height="28" fill="#005a6e" />
      <rect x="6" y="7" width="48" height="7" rx="0.3" fill="#fff" opacity="0.92" />
      <rect x="6" y="17" width="28" height="2.5" rx="0.3" fill="#7adcd0" opacity="0.8" />
      <rect x="60" y="8" width="12" height="12" rx="1" fill="#fff" opacity="0.1" />
      <rect x="65" y="10" width="2" height="8" rx="1" fill="#fff" opacity="0.3" />
      <rect x="62" y="13" width="8" height="2" rx="1" fill="#fff" opacity="0.3" />
      <rect x="0" y="28" width="80" height="1.5" fill={color} opacity="0.5" />
      {[36,50,64,78,92].map(y=><g key={y}><rect x="6" y={y} width="22" height="1.5" fill="#005a6e" opacity="0.65" />{[y+3,y+6].map(yy=><rect key={yy} x="6" y={yy} width="66" height="0.6" fill="#4a9090" opacity="0.25" />)}</g>)}
    </svg>
  )
}

// Fashion — editorial high-fashion, black/white, italic name
export function TplFashionThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="28" height="110" fill="#0a0a0a" />
      <rect x="28" y="0" width="1.5" fill={color} height="110" />
      <rect x="4" y="8" width="20" height="2" rx="0.3" fill="#fff" opacity="0.4" />
      <circle cx="14" cy="22" r="8" fill="#1a1a1a" />
      <circle cx="14" cy="22" r="8" fill="none" stroke={color} strokeWidth="0.5" />
      <rect x="4" y="36" width="20" height="1.2" rx="0.3" fill="#fff" opacity="0.7" />
      <rect x="4" y="40" width="16" height="0.8" rx="0.3" fill={color} opacity="0.6" />
      {[50,58,66,74,82].map(y=><rect key={y} x="4" y={y} width="18" height="0.7" fill="#fff" opacity="0.2" />)}
      <rect x="34" y="10" width="40" height="9" rx="0.3" fill="#0a0a0a" />
      <rect x="34" y="22" width="24" height="2.5" rx="0.3" fill={color} opacity="0.7" />
      {[32,46,60,74,88].map(y=><g key={y}><rect x="32" y={y} width="22" height="1.4" fill="#0a0a0a" opacity="0.65" />{[y+3].map(yy=><rect key={yy} x="32" y={yy} width="42" height="0.6" fill="#555" opacity="0.3" />)}</g>)}
    </svg>
  )
}

// Writer — typewriter feel, cream paper, literary serif header
export function TplWriterThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdf8ee" />
      <rect x="0" y="0" width="80" height="1.5" fill="#2a1f0e" />
      <rect x="0" y="108.5" width="80" height="1.5" fill="#2a1f0e" />
      <rect x="18" y="10" width="44" height="9" rx="0.3" fill="#2a1f0e" />
      <rect x="22" y="22" width="36" height="2" rx="0.3" fill={color} opacity="0.6" />
      <rect x="6" y="30" width="68" height="0.5" fill="#c8a870" opacity="0.5" />
      <rect x="6" y="32" width="68" height="0.5" fill="#c8a870" opacity="0.25" />
      {[40,52,64,76,88,100].map(y=><g key={y}><rect x="8" y={y} width="18" height="1.4" fill="#2a1f0e" opacity="0.65" />{[y+3,y+6].map(yy=><rect key={yy} x="8" y={yy} width="64" height="0.6" fill="#7a6040" opacity="0.3" />)}</g>)}
    </svg>
  )
}
