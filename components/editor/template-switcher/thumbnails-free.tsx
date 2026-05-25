// Free template thumbnail components
import React from "react"

export function ClassicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="8" y="8" width="36" height="3.5" rx="1" fill="#1f2937" />
      <rect x="8" y="14" width="22" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="8" y="20" width="64" height="0.8" fill={color} opacity="0.5" />
      <rect x="8" y="26" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="30" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="34" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="40" width="30" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="46" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="50" width="54" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="57" width="30" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="63" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="67" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="71" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function ModernThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="24" height="110" fill="#1f2937" />
      <circle cx="12" cy="16" r="6" fill={color} opacity="0.5" />
      <rect x="3" y="26" width="18" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="3" y="30" width="14" height="1" rx="0.5" fill="white" opacity="0.25" />
      <rect x="3" y="38" width="10" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="3" y="42" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="46" width="16" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="50" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="58" width="10" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="3" y="62" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="3" y="66" width="14" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="30" y="10" width="32" height="3" rx="1" fill="#1f2937" />
      <rect x="30" y="16" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="30" y="24" width="42" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="28" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="35" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="30" y="39" width="30" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="30" y="43" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function SidebarResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="22" height="110" fill={color} opacity="0.85" />
      <circle cx="11" cy="16" r="6" fill="white" opacity="0.35" />
      <rect x="3" y="26" width="16" height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="3" y="30" width="12" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="3" y="38" width="16" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="3" y="42" width="12" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="28" y="10" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="28" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="28" y="24" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="28" width="38" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="35" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="39" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="43" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function ElegantResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="18" y="10" width="44" height="3" rx="1.5" fill="#1f2937" />
      <rect x="26" y="15" width="28" height="1.5" rx="0.75" fill="#6b7280" />
      <rect x="10" y="22" width="28" height="0.8" fill={color} opacity="0.5" />
      <rect x="37" y="21" width="3" height="3" rx="0" transform="rotate(45 38.5 22.5)" fill={color} opacity="0.6" />
      <rect x="42" y="22" width="28" height="0.8" fill={color} opacity="0.5" />
      <rect x="10" y="30" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="34" width="54" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="38" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="45" width="32" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="10" y="51" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="55" width="52" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="32" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <rect x="10" y="68" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="72" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function ProfessionalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="22" fill={color} opacity="0.9" />
      <rect x="8" y="6" width="32" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="12" width="20" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <rect x="0" y="22" width="80" height="2" fill={color} />
      {/* left column — skills with progress bars */}
      <rect x="4" y="29" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="4" y="34" width="20" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="4" y="34" width="14" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="4" y="38" width="20" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="4" y="38" width="18" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="4" y="42" width="20" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="4" y="42" width="10" height="1" rx="0.5" fill={color} opacity="0.6" />
      {/* right column — content */}
      <rect x="30" y="29" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="33" width="38" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="40" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="30" y="44" width="32" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="30" y="48" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      {/* vertical divider */}
      <line x1="26" y1="26" x2="26" y2="80" stroke="#e5e7eb" strokeWidth="0.8" />
    </svg>
  )
}

export function ExecutiveResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="6" fill={color} />
      <rect x="8" y="12" width="40" height="4" rx="1" fill="#1f2937" />
      <rect x="8" y="18" width="24" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="8" y="24" width="64" height="0.8" fill="#d1d5db" />
      <rect x="8" y="30" width="56" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="34" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="38" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="44" width="28" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="50" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="54" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="58" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function MinimalResumeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="10" width="30" height="2.5" rx="1" fill="#374151" />
      <rect x="8" y="15" width="16" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="8" y="30" width="60" height="1" rx="0.5" fill="#f3f4f6" />
      <rect x="8" y="38" width="52" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="44" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="50" width="48" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="58" width="60" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="64" width="42" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="72" width="60" height="1.5" rx="0.75" fill="#f3f4f6" />
    </svg>
  )
}

export function ChronoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* vertical timeline line */}
      <line x1="18" y1="28" x2="18" y2="95" stroke={color} strokeWidth="1.2" opacity="0.3" />
      <rect x="8" y="8" width="32" height="3" rx="1" fill="#1f2937" />
      <rect x="8" y="14" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      {/* timeline dots + content rows */}
      <circle cx="18" cy="32" r="2.5" fill={color} opacity="0.8" />
      <rect x="26" y="30" width="14" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="26" y="34" width="44" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="26" y="37" width="38" height="1" rx="0.5" fill="#d1d5db" />
      <circle cx="18" cy="47" r="2.5" fill={color} opacity="0.8" />
      <rect x="26" y="45" width="14" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="26" y="49" width="44" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="26" y="52" width="36" height="1" rx="0.5" fill="#e5e7eb" />
      <circle cx="18" cy="62" r="2.5" fill={color} opacity="0.8" />
      <rect x="26" y="60" width="14" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="26" y="64" width="44" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="26" y="67" width="30" height="1" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function CarbonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="30" fill="#111827" />
      <rect x="8" y="7" width="36" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="13" width="22" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="8" y="18" width="50" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="8" y="36" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="40" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="47" width="28" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="53" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="57" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="61" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function VerticalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="16" fill={color} opacity="0.15" />
      <rect x="8" y="5" width="28" height="2.5" rx="1" fill={color} opacity="0.8" />
      <rect x="8" y="10" width="16" height="1.2" rx="0.6" fill="#6b7280" />
      {/* two equal columns */}
      <line x1="40" y1="20" x2="40" y2="100" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="6" y="24" width="18" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="6" y="29" width="30" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="6" y="33" width="26" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="6" y="37" width="30" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="6" y="44" width="18" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="6" y="49" width="30" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="6" y="53" width="24" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="44" y="24" width="18" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="44" y="29" width="30" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="44" y="33" width="24" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="44" y="37" width="30" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="44" y="44" width="18" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="44" y="49" width="30" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="44" y="53" width="20" height="1" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function HorizontalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="20" fill={color} opacity="0.12" />
      <rect x="8" y="6" width="40" height="4" rx="1" fill={color} opacity="0.9" />
      <rect x="8" y="13" width="60" height="1" rx="0.5" fill="#9ca3af" />
      {/* horizontal section labels */}
      <rect x="8" y="26" width="16" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="30" y="26" width="16" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="52" y="26" width="16" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="8" y="31" width="56" height="0.8" fill="#e5e7eb" />
      <rect x="8" y="36" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="40" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="47" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="51" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="55" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function GlassThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0f4ff" />
      <defs>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="28" fill="url(#glassGrad)" />
      <rect x="4" y="4" width="72" height="20" rx="4" fill="white" opacity="0.15" />
      <rect x="8" y="8" width="30" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="14" width="20" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      {/* frosted card sections */}
      <rect x="6" y="32" width="68" height="16" rx="3" fill="white" opacity="0.7" />
      <rect x="10" y="35" width="40" height="1.5" rx="0.75" fill="#374151" opacity="0.6" />
      <rect x="10" y="39" width="32" height="1.5" rx="0.75" fill="#6b7280" opacity="0.5" />
      <rect x="6" y="52" width="68" height="16" rx="3" fill="white" opacity="0.6" />
      <rect x="10" y="55" width="44" height="1.5" rx="0.75" fill="#374151" opacity="0.5" />
      <rect x="10" y="59" width="36" height="1.5" rx="0.75" fill="#6b7280" opacity="0.4" />
      <rect x="6" y="72" width="68" height="16" rx="3" fill="white" opacity="0.5" />
      <rect x="10" y="75" width="36" height="1.5" rx="0.75" fill="#374151" opacity="0.4" />
    </svg>
  )
}

export function NeonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0f0f1a" />
      <rect x="8" y="8" width="36" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="14" width="22" height="1.5" rx="0.75" fill={color} />
      {/* neon border accent */}
      <rect x="0" y="0" width="80" height="110" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <rect x="8" y="22" width="64" height="0.8" fill={color} opacity="0.5" />
      <rect x="8" y="30" width="60" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="34" width="50" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="41" width="16" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="8" y="47" width="60" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="51" width="44" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="58" width="60" height="1.5" rx="0.75" fill="#374151" />
      {/* neon glow dot */}
      <circle cx="70" cy="10" r="3" fill={color} opacity="0.6" />
    </svg>
  )
}

export function BauhausThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* geometric color blocks */}
      <rect x="0" y="0" width="80" height="8" fill={color} />
      <rect x="0" y="0" width="8" height="110" fill={color} opacity="0.3" />
      <circle cx="68" cy="90" r="14" fill={color} opacity="0.12" />
      <rect x="14" y="14" width="40" height="3.5" rx="0" fill="#1f2937" />
      <rect x="14" y="20" width="22" height="1.5" rx="0" fill="#6b7280" />
      <rect x="14" y="30" width="56" height="1.5" rx="0" fill="#d1d5db" />
      <rect x="14" y="34" width="48" height="1.5" rx="0" fill="#d1d5db" />
      <rect x="14" y="38" width="56" height="1.5" rx="0" fill="#d1d5db" />
      <rect x="14" y="45" width="20" height="2" rx="0" fill={color} opacity="0.8" />
      <rect x="14" y="51" width="56" height="1.5" rx="0" fill="#e5e7eb" />
      <rect x="14" y="55" width="44" height="1.5" rx="0" fill="#e5e7eb" />
    </svg>
  )
}

export function OutlineThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* outline header box */}
      <rect x="6" y="6" width="68" height="20" rx="2" fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
      <rect x="12" y="10" width="28" height="2.5" rx="1" fill="#1f2937" />
      <rect x="12" y="15" width="18" height="1.5" rx="0.75" fill="#6b7280" />
      {/* outline section boxes */}
      <rect x="6" y="30" width="68" height="18" rx="2" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="10" y="34" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="10" y="38" width="56" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="10" y="42" width="48" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="6" y="52" width="68" height="18" rx="2" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="10" y="56" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="10" y="60" width="56" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="10" y="64" width="44" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="6" y="74" width="68" height="14" rx="2" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="10" y="78" width="56" height="1" rx="0.5" fill="#f3f4f6" />
      <rect x="10" y="82" width="40" height="1" rx="0.5" fill="#f3f4f6" />
    </svg>
  )
}

export function StripeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* thin left color stripe */}
      <rect x="0" y="0" width="5" height="110" fill={color} />
      <rect x="12" y="10" width="32" height="3" rx="1" fill="#1f2937" />
      <rect x="12" y="16" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="12" y="24" width="60" height="0.8" fill="#f3f4f6" />
      <rect x="12" y="30" width="58" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="12" y="34" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="12" y="38" width="58" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="12" y="45" width="22" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="12" y="51" width="58" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="55" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="62" width="58" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function NordicThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="4" fill={color} />
      <rect x="8" y="12" width="40" height="3.5" rx="1" fill="#1f2937" />
      <rect x="8" y="18" width="24" height="1.5" rx="0.75" fill="#9ca3af" />
      <rect x="8" y="32" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="37" width="52" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="42" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="50" width="24" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="8" y="56" width="60" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="60" width="48" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="66" width="60" height="1.5" rx="0.75" fill="#f3f4f6" />
    </svg>
  )
}
