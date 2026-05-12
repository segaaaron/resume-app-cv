import React from "react"

function SidebarThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="22" height="110" fill={color} opacity="0.85" />
      <circle cx="11" cy="18" r="6" fill="white" opacity="0.4" />
      <rect x="3" y="28" width="16" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="5" y="32" width="12" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="3" y="38" width="10" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="3" y="42" width="14" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="28" y="12" width="24" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="28" y="20" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="24" width="40" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="28" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="35" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="39" width="38" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="43" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="47" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="90" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
    </svg>
  )
}

function ElegantThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="10" y="10" width="60" height="3" rx="1.5" fill={color} opacity="0.25" />
      <rect x="20" y="16" width="40" height="2.5" rx="1.25" fill={color} opacity="0.7" />
      <rect x="28" y="21" width="24" height="1.5" rx="0.75" fill="#9ca3af" />
      <rect x="10" y="28" width="28" height="1" fill={color} opacity="0.5" />
      <rect x="37" y="27" width="3" height="3" rx="0" transform="rotate(45 38.5 28.5)" fill={color} opacity="0.5" />
      <rect x="42" y="28" width="28" height="1" fill={color} opacity="0.5" />
      <rect x="10" y="35" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="39" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="47" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="58" width="58" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="90" width="18" height="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function SplitThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="28" fill={color} opacity="0.85" />
      <circle cx="14" cy="14" r="7" fill="white" opacity="0.3" />
      <rect x="25" y="8" width="22" height="2.5" rx="1.25" fill="white" opacity="0.7" />
      <rect x="25" y="13" width="16" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="56" y="8" width="18" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="58" y="12" width="16" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="60" y="16" width="14" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="10" y="35" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="39" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="47" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="58" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="90" width="18" height="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function ExecutiveThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="3" fill={color} />
      <rect x="8" y="10" width="40" height="4" rx="1" fill="#1f2937" />
      <rect x="8" y="16" width="22" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="8" y="22" width="64" height="0.8" fill="#e5e7eb" />
      <rect x="8" y="28" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="32" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="36" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="43" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="47" width="50" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="51" width="58" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="58" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="62" width="45" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="46" y="90" width="26" height="0.8" fill={color} opacity="0.7" />
      <rect x="46" y="93" width="18" height="1.5" rx="0.75" fill="#374151" />
    </svg>
  )
}

function MaterialThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f3f4f6" />
      <rect x="6" y="6" width="68" height="98" rx="4" fill="white" />
      <rect x="6" y="6" width="68" height="22" rx="4" fill={color} opacity="0.9" />
      <rect x="6" y="20" width="68" height="8" fill={color} opacity="0.9" />
      <circle cx="40" cy="32" r="7" fill="white" />
      <circle cx="40" cy="32" r="5" fill={color} opacity="0.4" />
      <rect x="18" y="44" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="22" y="48" width="36" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="12" y="55" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="59" width="50" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="63" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="12" y="70" width="50" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="12" y="74" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="12" y="90" width="22" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="12" y="94" width="16" height="0.8" fill={color} opacity="0.4" />
    </svg>
  )
}

function GradientThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <defs>
        <linearGradient id="cl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="32" fill="url(#cl-grad)" />
      <rect x="0" y="22" width="80" height="10" fill="url(#cl-grad)" />
      <ellipse cx="80" cy="32" rx="80" ry="8" fill="#f9fafb" />
      <rect x="10" y="8" width="32" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="10" y="13" width="20" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="10" y="40" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="44" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="51" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="55" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="90" width="20" height="2" rx="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function TwoToneThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="28" height="110" fill={color} opacity="0.9" />
      <circle cx="14" cy="20" r="8" fill="white" opacity="0.35" />
      <rect x="3" y="31" width="22" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="5" y="35" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
      <rect x="3" y="41" width="10" height="1" rx="0.5" fill="white" opacity="0.35" />
      <rect x="3" y="45" width="14" height="1" rx="0.5" fill="white" opacity="0.35" />
      <rect x="3" y="49" width="12" height="1" rx="0.5" fill="white" opacity="0.35" />
      <rect x="33" y="10" width="40" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="33" y="14" width="34" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="33" y="22" width="40" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="33" y="26" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="33" y="30" width="40" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="33" y="37" width="40" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="33" y="41" width="30" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="33" y="90" width="20" height="2" rx="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function TimelineThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <line x1="16" y1="0" x2="16" y2="110" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <circle cx="16" cy="16" r="7" fill={color} opacity="0.3" />
      <circle cx="16" cy="16" r="4" fill={color} opacity="0.6" />
      <rect x="5" y="27" width="8" height="1" rx="0.5" fill={color} opacity="0.3" />
      <rect x="5" y="32" width="6" height="1" rx="0.5" fill={color} opacity="0.3" />
      <rect x="5" y="37" width="8" height="1" rx="0.5" fill={color} opacity="0.3" />
      <rect x="26" y="8" width="30" height="3" rx="1.5" fill="#374151" />
      <rect x="26" y="13" width="18" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="26" y="22" width="48" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="26" y="26" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="26" y="33" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="26" y="37" width="40" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="26" y="44" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="26" y="90" width="16" height="0.8" fill={color} opacity="0.6" />
    </svg>
  )
}

function MinimalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="10" width="38" height="4" rx="1" fill="#9ca3af" />
      <rect x="8" y="17" width="22" height="1.5" fill={color} opacity="0.7" />
      <rect x="8" y="22" width="50" height="1" rx="0.5" fill="#f3f4f6" />
      <rect x="8" y="38" width="52" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="44" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="50" width="52" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="58" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="64" width="48" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="72" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="90" width="20" height="1.2" rx="0.6" fill="#6b7280" />
    </svg>
  )
}

function MonogramThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="8" width="14" height="14" rx="3" fill={color} opacity="0.9" />
      <rect x="11" y="12" width="8" height="6" rx="1" fill="white" opacity="0.6" />
      <rect x="26" y="10" width="28" height="3.5" rx="1" fill="#374151" />
      <rect x="26" y="16" width="16" height="2" rx="1" fill="#9ca3af" />
      <rect x="8" y="26" width="64" height="0.8" fill="#e5e7eb" />
      <rect x="8" y="33" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="37" width="36" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="44" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="48" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="55" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="90" width="24" height="0.8" fill={color} opacity="0.7" />
      <rect x="68" y="96" width="6" height="1" fill={color} opacity="0.5" />
      <rect x="74" y="90" width="1" height="7" fill={color} opacity="0.5" />
    </svg>
  )
}

function ArchitectThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="0" y="0" width="80" height="110" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="0" y="0" width="80" height="22" fill="#f9fafb" />
      <line x1="40" y1="0" x2="40" y2="22" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="5" y="6" width="28" height="3" rx="1" fill="#374151" />
      <rect x="5" y="11" width="16" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="44" y="7" width="3" height="3" rx="0.5" fill={color} opacity="0.5" />
      <rect x="49" y="8" width="18" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="44" y="13" width="3" height="3" rx="0.5" fill={color} opacity="0.5" />
      <rect x="49" y="14" width="14" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="30" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="34" width="48" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="41" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="45" width="44" height="1.5" rx="0.75" fill="#f3f4f6" />
      <rect x="8" y="52" width="56" height="1.5" rx="0.75" fill="#f3f4f6" />
      <line x1="0" y1="98" x2="80" y2="98" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="8" y="101" width="20" height="1.5" rx="0.75" fill="#374151" />
      <rect x="60" y="100" width="12" height="0.8" fill={color} opacity="0.6" />
    </svg>
  )
}

function DiagonalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <polygon points="0,0 80,0 80,26 0,36" fill={color} opacity="0.9" />
      <rect x="8" y="6" width="28" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="11" width="18" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="8" y="16" width="40" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="8" y="46" width="56" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="50" width="48" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="57" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="61" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="90" width="20" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="74" y="55" width="2" height="16" fill={color} opacity="0.25" />
    </svg>
  )
}

function NewspaperThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      <rect x="8" y="8" width="64" height="4" rx="1" fill="#374151" opacity="0.9" />
      <rect x="8" y="14" width="64" height="0.8" fill="#374151" opacity="0.9" />
      <rect x="8" y="16" width="64" height="0.4" fill="#9ca3af" opacity="0.7" />
      <rect x="8" y="20" width="35" height="1.2" rx="0.6" fill="#9ca3af" />
      <rect x="50" y="20" width="22" height="1.2" rx="0.6" fill="#9ca3af" />
      <rect x="8" y="24" width="64" height="0.8" fill="#374151" opacity="0.9" />
      <rect x="8" y="26" width="64" height="0.4" fill="#9ca3af" opacity="0.7" />
      <rect x="8" y="32" width="34" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="36" width="34" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="40" width="30" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="44" width="34" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="48" width="28" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="47" y="32" width="25" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="47" y="36" width="25" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="47" y="40" width="22" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="47" y="44" width="25" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="47" y="48" width="20" height="1.2" rx="0.6" fill="#e5e7eb" />
      <line x1="44" y1="30" x2="44" y2="55" stroke="#e5e7eb" strokeWidth="0.8" />
      <rect x="8" y="90" width="24" height="0.8" fill={color} opacity="0.7" />
    </svg>
  )
}

export function CoverLetterThumbnail({ id, color }: { id: string; color: string }) {
  if (id === "sidebar") return <SidebarThumb color={color} />
  if (id === "elegant" || id === "classic") return <ElegantThumb color={color} />
  if (id === "split") return <SplitThumb color={color} />
  if (id === "executive") return <ExecutiveThumb color={color} />
  if (id === "material") return <MaterialThumb color={color} />
  if (id === "gradient") return <GradientThumb color={color} />
  if (id === "twotone") return <TwoToneThumb color={color} />
  if (id === "timeline") return <TimelineThumb color={color} />
  if (id === "minimal") return <MinimalThumb color={color} />
  if (id === "monogram") return <MonogramThumb color={color} />
  if (id === "architect") return <ArchitectThumb color={color} />
  if (id === "diagonal") return <DiagonalThumb color={color} />
  if (id === "newspaper") return <NewspaperThumb color={color} />
  return <ElegantThumb color={color} />
}
