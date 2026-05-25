// Pro template thumbnails — batch A (Aurora → Prestige)
import React from "react"

export function AuroraThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f0f4ff" />
      <defs>
        <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="60%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="32" fill="url(#aurora)" />
      <ellipse cx="80" cy="32" rx="60" ry="10" fill="#f0f4ff" />
      <rect x="8" y="7" width="30" height="3" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="13" width="20" height="1.5" rx="0.75" fill="white" opacity="0.7" />
      <rect x="8" y="40" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="44" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="51" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="55" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function LumiereThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fffbf0" />
      {/* gold double border */}
      <rect x="3" y="3" width="74" height="104" rx="1" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <rect x="5" y="5" width="70" height="100" rx="1" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3" />
      <rect x="20" y="12" width="40" height="3" rx="1" fill="#1f2937" />
      <rect x="26" y="17" width="28" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      {/* decorative gold line */}
      <rect x="10" y="24" width="28" height="0.8" fill={color} opacity="0.6" />
      <rect x="37" y="23" width="3" height="3" rx="0" transform="rotate(45 38.5 24.5)" fill={color} opacity="0.7" />
      <rect x="42" y="24" width="28" height="0.8" fill={color} opacity="0.6" />
      <rect x="10" y="32" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="36" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="47" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function ConsulThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="26" fill="#1f2937" />
      <rect x="8" y="7" width="36" height="3.5" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="13" width="22" height="1.5" rx="0.75" fill={color} opacity="0.9" />
      <rect x="8" y="18" width="50" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="8" y="32" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="36" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="43" width="22" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="49" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="53" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="57" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function RoseThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff5f6" />
      {/* soft pink top accent */}
      <rect x="0" y="0" width="80" height="3" fill={color} opacity="0.7" />
      <circle cx="40" cy="18" r="10" fill={color} opacity="0.08" />
      <circle cx="40" cy="18" r="6" fill={color} opacity="0.1" />
      <rect x="18" y="12" width="44" height="3" rx="1" fill="#374151" />
      <rect x="24" y="17" width="32" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="10" y="26" width="60" height="0.8" fill={color} opacity="0.3" />
      <rect x="10" y="32" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="36" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="47" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function WaveThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="24" fill={color} opacity="0.85" />
      {/* wavy SVG path at bottom of header */}
      <path d="M0,24 Q10,30 20,24 Q30,18 40,24 Q50,30 60,24 Q70,18 80,24 L80,32 L0,32 Z" fill="white" />
      <rect x="8" y="5" width="28" height="3" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="11" width="18" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <rect x="8" y="38" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="42" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="49" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="53" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="60" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function BannerThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      {/* large banner header */}
      <rect x="0" y="0" width="80" height="36" fill={color} opacity="0.9" />
      <rect x="8" y="8" width="44" height="4" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="15" width="28" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="8" y="20" width="60" height="1" rx="0.5" fill="white" opacity="0.25" />
      <rect x="8" y="24" width="48" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="8" y="44" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="48" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="55" width="24" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="61" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="65" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function VertexThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* triangular accent corner top-right */}
      <polygon points="50,0 80,0 80,40" fill={color} opacity="0.8" />
      <rect x="8" y="10" width="34" height="3.5" rx="1" fill="#1f2937" />
      <rect x="8" y="16" width="22" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="8" y="26" width="64" height="0.8" fill="#e5e7eb" />
      <rect x="8" y="33" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="37" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="44" width="22" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="8" y="50" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="54" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="61" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function PrestigeThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fafaf8" />
      {/* double border — luxury */}
      <rect x="2" y="2" width="76" height="106" rx="1" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      <rect x="5" y="5" width="70" height="100" rx="1" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3" />
      <rect x="20" y="12" width="40" height="4" rx="1" fill="#1f2937" />
      <rect x="25" y="19" width="30" height="1.5" rx="0.75" fill="#6b7280" />
      <rect x="15" y="26" width="22" height="0.8" fill={color} opacity="0.6" />
      <rect x="37" y="25" width="3" height="3" rx="0" transform="rotate(45 38.5 26.5)" fill={color} opacity="0.7" />
      <rect x="42" y="26" width="22" height="0.8" fill={color} opacity="0.6" />
      <rect x="12" y="34" width="56" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="12" y="38" width="48" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="12" y="45" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="49" width="40" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="56" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}
