// Pro template thumbnails — batch B (Oslo → Reykjavik)
import React from "react"

export function OsloThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="10" width="40" height="2.5" rx="0.5" fill="#1f2937" opacity="0.9" />
      <rect x="8" y="15" width="3" height="3" transform="rotate(45 9.5 16.5)" fill={color} />
      <rect x="14" y="16" width="28" height="1" rx="0.5" fill="#9ca3af" />
      <rect x="8" y="21" width="64" height="1.5" rx="0.75" fill={color} opacity="0.5" />
      <circle cx="9" cy="30" r="2" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="14" y="28" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="14" y="32" width="56" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="14" y="35" width="48" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="9" y="44" width="4" height="4" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="16" y="44" width="18" height="1.5" rx="0.75" fill="#374151" />
      <rect x="16" y="48" width="52" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="16" y="51" width="44" height="1" rx="0.5" fill="#e5e7eb" />
      <polygon points="9,61 13,69 5,69" fill="none" stroke={color} strokeWidth="0.8" />
      <rect x="16" y="62" width="14" height="1.5" rx="0.75" fill="#374151" />
      <rect x="16" y="66" width="40" height="1" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function KyotoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="26" height="110" fill="#F7F5F0" />
      <rect x="3" y="10" width="20" height="20" rx="0" fill="none" stroke="#2C2C2C" strokeWidth="1.2" />
      <rect x="5" y="34" width="16" height="1.2" rx="0.6" fill="#2C2C2C" opacity="0.6" />
      <rect x="5" y="38" width="12" height="1" rx="0.5" fill="#9ca3af" opacity="0.5" />
      <rect x="5" y="46" width="8" height="1.2" rx="0.6" fill={color} opacity="0.7" />
      <rect x="5" y="50" width="18" height="1" rx="0.5" fill="#9ca3af" opacity="0.3" />
      <rect x="5" y="54" width="16" height="1" rx="0.5" fill="#9ca3af" opacity="0.3" />
      <rect x="32" y="10" width="28" height="3" rx="1" fill="#2C2C2C" />
      <rect x="32" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="32" y="26" width="42" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="32" y="30" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="32" y="38" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="32" y="42" width="30" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function GenevaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="18" y="8" width="44" height="3.5" rx="1" fill="#1f2937" />
      <rect x="26" y="14" width="28" height="1.5" rx="0.75" fill="#6b7280" />
      {/* dashed line with diamond */}
      <line x1="8" y1="24" x2="34" y2="24" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />
      <polygon points="40,21.5 43,24 40,26.5 37,24" fill={color} opacity="0.7" />
      <line x1="46" y1="24" x2="72" y2="24" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />
      <rect x="10" y="30" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="34" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <line x1="8" y1="41" x2="34" y2="41" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <rect x="37" y="39" width="3" height="3" transform="rotate(45 38.5 40.5)" fill={color} opacity="0.6" />
      <line x1="46" y1="41" x2="72" y2="41" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      <rect x="10" y="47" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="51" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="57" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function WindsorThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="28" fill="#1B2A4A" />
      <rect x="8" y="7" width="36" height="3.5" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="13" width="22" height="1.5" rx="0.75" fill="#C9A84C" opacity="0.9" />
      <rect x="8" y="18" width="48" height="1" rx="0.5" fill="rgba(255,255,255,0.2)" />
      <rect x="0" y="28" width="80" height="2" fill="#C9A84C" />
      <rect x="8" y="36" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="40" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="47" width="24" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="8" y="53" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="57" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="61" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function MilanThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="52" y="0" width="28" height="110" fill="#2D2D2D" />
      <rect x="8" y="10" width="36" height="4" rx="1" fill="#1f2937" />
      <rect x="8" y="16" width="12" height="2" rx="0.5" fill={color} />
      <rect x="8" y="22" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="26" width="30" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="33" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="37" width="28" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="55" y="8" width="20" height="1.2" rx="0.6" fill="white" opacity="0.4" />
      <rect x="55" y="12" width="18" height="1" rx="0.5" fill="white" opacity="0.25" />
      <rect x="55" y="22" width="8" height="1.2" rx="0.6" fill={color} opacity="0.7" />
      <rect x="55" y="26" width="20" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="55" y="30" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
    </svg>
  )
}

export function ZurichThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* large muted number 01 */}
      <text x="4" y="34" fontSize="28" fontWeight="900" fill="#d1d5db" opacity="0.6">01</text>
      <rect x="8" y="36" width="22" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="32" y="36" width="38" height="0.8" fill="#d1d5db" />
      <rect x="8" y="42" width="62" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="46" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      {/* large muted number 02 */}
      <text x="4" y="66" fontSize="24" fontWeight="900" fill="#d1d5db" opacity="0.5">02</text>
      <rect x="8" y="68" width="22" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="32" y="68" width="38" height="0.8" fill="#e5e7eb" />
      <rect x="8" y="74" width="62" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="78" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}


export function PortoThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* diagonal split */}
      <polygon points="0,0 55,0 45,30 0,30" fill={color} opacity="0.85" />
      <rect x="8" y="8" width="28" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="14" width="18" height="1.5" rx="0.75" fill="white" opacity="0.7" />
      <rect x="8" y="36" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="40" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="47" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="51" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="55" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function BarcelonaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="52" y="0" width="28" height="110" fill="#f9fafb" />
      <rect x="8" y="8" width="34" height="4" rx="1" fill="#111827" />
      <rect x="8" y="15" width="20" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="8" y="24" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="28" width="30" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="35" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="39" width="26" height="1.5" rx="0.75" fill="#e5e7eb" />
      {/* chip grid in sidebar */}
      <rect x="54" y="8" width="12" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="54" y="14" width="10" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="66" y="14" width="8" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="54" y="20" width="8" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.7" />
      <rect x="64" y="20" width="12" height="4" rx="2" fill="none" stroke={color} strokeWidth="0.7" />
    </svg>
  )
}

export function ViennaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* faint monogram */}
      <text x="50" y="26" fontSize="36" fontWeight="900" fill="#111827" opacity="0.04">M</text>
      <rect x="8" y="8" width="38" height="3.5" rx="1" fill="#1f2937" />
      <rect x="8" y="14" width="22" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      {/* left accent bars on sections */}
      <rect x="8" y="26" width="3" height="10" rx="0.5" fill={color} />
      <rect x="14" y="27" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="14" y="31" width="56" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="14" y="34" width="48" height="1" rx="0.5" fill="#d1d5db" />
      <rect x="8" y="42" width="3" height="10" rx="0.5" fill={color} />
      <rect x="14" y="43" width="18" height="1.5" rx="0.75" fill="#374151" />
      <rect x="14" y="47" width="56" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="14" y="50" width="40" height="1" rx="0.5" fill="#e5e7eb" />
    </svg>
  )
}

export function BerlinThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="8" width="36" height="3" rx="0" fill="#111827" />
      <rect x="8" y="14" width="22" height="1.5" rx="0" fill={color} opacity="0.8" />
      {/* › prefix on section headers */}
      <text x="8" y="28" fontSize="6" fill={color} fontWeight="700">›</text>
      <rect x="15" y="25" width="20" height="1.5" rx="0" fill="#374151" />
      <rect x="15" y="29" width="56" height="1" rx="0" fill="#d1d5db" />
      <rect x="15" y="32" width="48" height="1" rx="0" fill="#d1d5db" />
      <text x="8" y="42" fontSize="6" fill={color} fontWeight="700">›</text>
      <rect x="15" y="39" width="16" height="1.5" rx="0" fill="#374151" />
      <rect x="15" y="43" width="56" height="1" rx="0" fill="#e5e7eb" />
      <rect x="15" y="46" width="44" height="1" rx="0" fill="#e5e7eb" />
      {/* skill chips with border */}
      <rect x="8" y="55" width="14" height="4" rx="0.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="24" y="55" width="12" height="4" rx="0.5" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="38" y="55" width="16" height="4" rx="0.5" fill="none" stroke={color} strokeWidth="0.6" />
    </svg>
  )
}

export function StockholmThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="30" height="110" fill="#F3F4F6" />
      <circle cx="15" cy="18" r="6" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* progress bars with labels */}
      <rect x="3" y="30" width="24" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="30" width="18" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="3" y="34" width="24" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="34" width="14" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="3" y="38" width="24" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="38" width="22" height="1" rx="0.5" fill={color} opacity="0.7" />
      <rect x="36" y="8" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="36" y="14" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="36" y="24" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="36" y="28" width="30" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="36" y="35" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="36" y="39" width="26" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function DublinThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="8" width="24" height="2" rx="0" fill="#111827" />
      <rect x="8" y="12" width="14" height="1" rx="0" fill={color} opacity="0.7" />
      <rect x="8" y="18" width="64" height="0.6" fill={color} opacity="0.4" />
      <rect x="8" y="22" width="64" height="0.5" stroke="#d1d5db" strokeDasharray="2 2" />
      <rect x="8" y="27" width="16" height="1.2" rx="0" fill="#374151" />
      <rect x="8" y="31" width="64" height="0.8" rx="0.4" fill="#d1d5db" />
      <rect x="8" y="34" width="56" height="0.8" rx="0.4" fill="#d1d5db" />
      <rect x="8" y="37" width="64" height="0.8" rx="0.4" fill="#d1d5db" />
      <rect x="8" y="43" width="64" height="0.5" stroke="#d1d5db" strokeDasharray="2 2" />
      <rect x="8" y="48" width="14" height="1.2" rx="0" fill="#374151" />
      <rect x="8" y="52" width="64" height="0.8" rx="0.4" fill="#e5e7eb" />
      <rect x="8" y="55" width="52" height="0.8" rx="0.4" fill="#e5e7eb" />
    </svg>
  )
}

export function HelsinkiThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="20" height="110" fill="#f9fafb" />
      {/* timeline vertical line */}
      <line x1="10" y1="12" x2="10" y2="90" stroke="#d1d5db" strokeWidth="1.2" />
      <circle cx="10" cy="18" r="2.5" fill={color} opacity="0.8" />
      <rect x="3" y="22" width="14" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="22" width="10" height="1" rx="0.5" fill={color} opacity="0.6" />
      <circle cx="10" cy="32" r="2.5" fill={color} opacity="0.8" />
      <rect x="3" y="36" width="14" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="36" width="7" height="1" rx="0.5" fill={color} opacity="0.6" />
      <circle cx="10" cy="46" r="2.5" fill={color} opacity="0.8" />
      <rect x="3" y="50" width="14" height="1" rx="0.5" fill="#e5e7eb" />
      <rect x="3" y="50" width="12" height="1" rx="0.5" fill={color} opacity="0.6" />
      <rect x="26" y="8" width="28" height="3" rx="1" fill="#111827" />
      <rect x="26" y="18" width="46" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="26" y="22" width="38" height="1.5" rx="0.75" fill="#d1d5db" />
      {/* project card */}
      <rect x="26" y="30" width="46" height="14" rx="2" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="29" y="33" width="30" height="1.5" rx="0.75" fill="#374151" />
      <rect x="29" y="37" width="22" height="1" rx="0.5" fill="#9ca3af" />
    </svg>
  )
}


export function LagosThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="24" height="110" fill={color} opacity="0.9" />
      <circle cx="12" cy="18" r="7" fill="rgba(255,255,255,0.25)" />
      <circle cx="12" cy="18" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <rect x="3" y="31" width="18" height="1.2" rx="0.6" fill="white" opacity="0.4" />
      <rect x="3" y="35" width="14" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="3" y="42" width="8" height="1.2" rx="0.6" fill="white" opacity="0.4" />
      <rect x="3" y="46" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="30" y="10" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="30" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      {/* left accent borders on sections */}
      <rect x="30" y="24" width="2.5" height="12" rx="0.5" fill={color} opacity="0.7" />
      <rect x="34" y="26" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="34" y="30" width="30" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="40" width="2.5" height="12" rx="0.5" fill={color} opacity="0.7" />
      <rect x="34" y="42" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="34" y="46" width="28" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function SeoulThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#FAFAFA" />
      <rect x="0" y="0" width="24" height="110" fill="#1C1C1E" />
      {/* dot grid pattern */}
      <circle cx="4" cy="4" r="0.6" fill="white" opacity="0.3" />
      <circle cx="10" cy="4" r="0.6" fill="white" opacity="0.3" />
      <circle cx="16" cy="4" r="0.6" fill="white" opacity="0.3" />
      <circle cx="4" cy="10" r="0.6" fill="white" opacity="0.3" />
      <circle cx="10" cy="10" r="0.6" fill="white" opacity="0.3" />
      <circle cx="16" cy="10" r="0.6" fill="white" opacity="0.3" />
      <circle cx="4" cy="16" r="0.6" fill="white" opacity="0.3" />
      <circle cx="10" cy="16" r="0.6" fill="white" opacity="0.3" />
      <circle cx="16" cy="16" r="0.6" fill="white" opacity="0.3" />
      <circle cx="12" cy="26" r="5" fill="rgba(255,255,255,0.15)" />
      {/* colored contact dots */}
      <circle cx="4" cy="36" r="1.5" fill="#22c55e" />
      <circle cx="4" cy="42" r="1.5" fill="#3b82f6" />
      <circle cx="4" cy="48" r="1.5" fill="#f59e0b" />
      <rect x="8" y="35" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.4)" />
      <rect x="8" y="41" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.4)" />
      <rect x="8" y="47" width="14" height="1" rx="0.5" fill="rgba(255,255,255,0.4)" />
      <rect x="30" y="10" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="30" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="30" y="26" width="42" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="30" y="30" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
    </svg>
  )
}

export function CopenhagenThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* tinted section blocks */}
      <rect x="6" y="24" width="68" height="18" rx="3" fill="#EFF6FF" />
      <rect x="10" y="27" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="10" y="31" width="56" height="1" rx="0.5" fill="#bfdbfe" opacity="0.8" />
      <rect x="10" y="34" width="48" height="1" rx="0.5" fill="#bfdbfe" opacity="0.8" />
      <rect x="6" y="46" width="68" height="18" rx="3" fill="#F0FDF4" />
      <rect x="10" y="49" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="10" y="53" width="56" height="1" rx="0.5" fill="#bbf7d0" opacity="0.8" />
      <rect x="10" y="56" width="40" height="1" rx="0.5" fill="#bbf7d0" opacity="0.8" />
      <rect x="6" y="68" width="68" height="18" rx="3" fill="#FFF7ED" />
      <rect x="10" y="71" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="10" y="75" width="56" height="1" rx="0.5" fill="#fed7aa" opacity="0.8" />
      {/* header */}
      <rect x="8" y="6" width="32" height="3" rx="1" fill="#111827" />
      <rect x="8" y="12" width="20" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      {/* rounded photo */}
      <rect x="58" y="6" width="14" height="14" rx="3" fill="none" stroke="#d1d5db" strokeWidth="1" />
    </svg>
  )
}

export function GenevanoirThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="24" fill="#121212" />
      <rect x="8" y="7" width="40" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="13" width="26" height="1.5" rx="0.75" fill="#9ca3af" opacity="0.6" />
      {/* dark pill badge sections */}
      <rect x="8" y="32" width="24" height="6" rx="3" fill="#222" />
      <rect x="8" y="32" width="24" height="6" rx="3" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="8" y="42" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="46" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="56" width="22" height="6" rx="3" fill="#222" />
      <rect x="8" y="56" width="22" height="6" rx="3" fill="none" stroke={color} strokeWidth="0.6" />
      <rect x="8" y="66" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="70" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

export function ReykjavikThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* thin vertical separator */}
      <line x1="16" y1="0" x2="16" y2="110" stroke="#e5e7eb" strokeWidth="0.8" />
      {/* rotated labels in left margin */}
      <text x="12" y="40" fontSize="5" fill="#9ca3af" transform="rotate(-90 12 40)" textAnchor="middle">EXPERIENCE</text>
      <text x="12" y="70" fontSize="5" fill="#9ca3af" transform="rotate(-90 12 70)" textAnchor="middle">EDUCATION</text>
      {/* header */}
      <rect x="20" y="8" width="30" height="3" rx="1" fill="#111827" />
      <rect x="20" y="14" width="18" height="1.5" rx="0.75" fill="#6b7280" />
      <line x1="16" y1="22" x2="16" y2="22" stroke={color} strokeWidth="2" />
      <rect x="20" y="24" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="20" y="28" width="42" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="20" y="35" width="50" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="20" y="39" width="38" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="20" y="55" width="50" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="20" y="59" width="40" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}
