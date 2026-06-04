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

// ─────────────────────────────────────────────────────────────────────────────
// 30 PREMIUM TEMPLATES (cover-letter v2) — thumbnails derived from each
// template's actual palette + layout. Fixed palette; colorScheme is ignored
// per product decision (these templates ship with their own brand identity).
// ─────────────────────────────────────────────────────────────────────────────

function EchoThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="10" y="14" width="46" height="6" rx="0.5" fill="#0a0a0a" opacity="0.85" />
      <rect x="10" y="23" width="18" height="1.4" fill="#bbb" />
      <line x1="10" y1="30" x2="70" y2="30" stroke="#111" strokeWidth="0.6" />
      <rect x="10" y="34" width="48" height="0.8" fill="#aaa" />
      <rect x="10" y="46" width="50" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.65" />
      <rect x="10" y="50" width="44" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.45" />
      <rect x="10" y="54" width="46" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.45" />
      <rect x="10" y="62" width="48" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.35" />
      <rect x="10" y="66" width="42" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.35" />
      <rect x="10" y="88" width="18" height="1" fill="#999" />
      <rect x="10" y="92" width="22" height="2" fill="#0a0a0a" />
      <text x="68" y="106" fontSize="3.5" fill="#ddd" letterSpacing="0.4">01</text>
    </svg>
  )
}

function LumenThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <circle cx="40" cy="22" r="9" fill="#C9A84C" />
      <text x="40" y="25" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">AC</text>
      <rect x="22" y="36" width="36" height="2" rx="1" fill="#1a1a1a" />
      <rect x="28" y="40" width="24" height="1.2" fill="#c8b060" />
      <text x="40" y="48" textAnchor="middle" fontSize="4" fill="#d4b870">·  ✦  ·</text>
      <rect x="14" y="52" width="52" height="1" fill="#b0a080" />
      <rect x="10" y="64" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="10" y="68" width="58" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="10" y="72" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="10" y="76" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="30" y="90" width="20" height="1.5" fill="#8a7860" />
      <rect x="32" y="94" width="16" height="2" fill="#1a1a1a" />
    </svg>
  )
}

function AtlasThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="22" fill="#111" />
      <rect x="8" y="6" width="40" height="6" fill="#fff" />
      <rect x="8" y="14" width="22" height="2" fill="#aaa" />
      <rect x="0" y="22" width="80" height="1.5" fill="#C9A84C" />
      <rect x="0" y="23.5" width="80" height="5" fill="#f4f4f4" />
      <rect x="6" y="25" width="14" height="1" fill="#666" />
      <rect x="24" y="25" width="14" height="1" fill="#666" />
      <rect x="42" y="25" width="14" height="1" fill="#666" />
      <rect x="8" y="36" width="50" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="40" width="56" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="46" width="56" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="50" width="50" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="54" width="56" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="92" width="22" height="2.5" fill="#111" />
    </svg>
  )
}

function ConsulThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="28" height="110" fill="#0F172A" />
      <defs>
        <linearGradient id="consul-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06B6D4" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1.5" height="110" fill="url(#consul-grad)" />
      <rect x="4" y="10" width="20" height="2.5" fill="#F1F5F9" />
      <rect x="4" y="14" width="14" height="1.2" fill="#64748B" />
      <rect x="4" y="22" width="20" height="0.6" fill="#1E293B" />
      <rect x="4" y="28" width="18" height="1" fill="#94A3B8" />
      <rect x="4" y="32" width="16" height="1" fill="#94A3B8" />
      <rect x="4" y="36" width="18" height="1" fill="#94A3B8" />
      <rect x="34" y="10" width="40" height="1.2" rx="0.6" fill="#9ca3af" />
      <rect x="34" y="20" width="40" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="34" y="24" width="36" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="34" y="32" width="40" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="34" y="36" width="32" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="34" y="40" width="40" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="34" y="92" width="20" height="2" fill="#0F172A" />
    </svg>
  )
}

function SterlingThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <defs>
        <linearGradient id="sterling-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="28" fill="url(#sterling-bg)" />
      <rect x="20" y="10" width="40" height="3" fill="#F8FAFC" />
      <rect x="28" y="16" width="24" height="1.2" fill="#94A3B8" />
      <rect x="0" y="28" width="80" height="1.5" fill="#C9A84C" />
      <rect x="0" y="29.5" width="80" height="5" fill="#F8FAFC" />
      <circle cx="22" cy="32" r="0.8" fill="#C9A84C" />
      <rect x="24" y="31" width="10" height="1" fill="#64748B" />
      <rect x="44" y="31" width="10" height="1" fill="#64748B" />
      <rect x="10" y="42" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="10" y="46" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="10" y="54" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="10" y="58" width="56" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="10" y="92" width="22" height="2" fill="#0F172A" />
    </svg>
  )
}

function FortisThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="8" y="10" width="32" height="4" fill="#0f172a" />
      <rect x="8" y="16" width="18" height="1.5" fill="#64748B" />
      <rect x="50" y="10" width="22" height="1.2" fill="#64748B" />
      <rect x="52" y="13" width="20" height="1.2" fill="#64748B" />
      <rect x="54" y="16" width="18" height="1.2" fill="#64748B" />
      <rect x="8" y="24" width="64" height="2.4" fill="#0f172a" />
      <rect x="8" y="27" width="64" height="0.8" fill="#e2e8f0" />
      <rect x="8" y="36" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="40" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="8" y="48" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="52" width="50" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="56" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="8" y="92" width="20" height="2" fill="#0f172a" />
    </svg>
  )
}

function PrismThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <polygon points="0,0 48,0 40,28 0,28" fill="#FF6B6B" />
      <rect x="6" y="10" width="26" height="3" fill="#fff" />
      <rect x="6" y="16" width="16" height="1.5" fill="#fff" opacity="0.7" />
      <rect x="52" y="10" width="22" height="1.2" fill="#FF6B6B" />
      <rect x="56" y="14" width="18" height="1.2" fill="#FF6B6B" />
      <rect x="0" y="28" width="80" height="6" fill="#fff5f5" />
      <rect x="0" y="28" width="80" height="1" fill="#FF6B6B" />
      <rect x="6" y="30" width="50" height="1" fill="#cc3333" />
      <rect x="6" y="44" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="48" width="56" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="56" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="60" width="50" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="92" width="22" height="2" fill="#FF6B6B" />
    </svg>
  )
}

function EmberThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <defs>
        <linearGradient id="ember-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F97316" />
          <stop offset="0.6" stopColor="#EA580C" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="28" fill="url(#ember-grad)" />
      <circle cx="62" cy="-4" r="20" fill="#fff" opacity="0.06" />
      <circle cx="14" cy="14" r="7" fill="#fff" opacity="0.18" stroke="#fff" strokeWidth="0.6" />
      <text x="14" y="16" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">AC</text>
      <rect x="26" y="10" width="30" height="2.5" fill="#fff" />
      <rect x="26" y="15" width="18" height="1.4" fill="#fff" opacity="0.7" />
      <rect x="0" y="28" width="80" height="6" fill="#FFF7ED" />
      <rect x="6" y="30" width="12" height="1.2" fill="#C2410C" />
      <rect x="22" y="30" width="12" height="1.2" fill="#C2410C" />
      <rect x="6" y="42" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="46" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="54" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="92" width="22" height="2" fill="#EA580C" />
    </svg>
  )
}

function VantageThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="24" height="110" fill="#0E7490" />
      <text x="2" y="46" fontSize="56" fontWeight="900" fill="#fff" opacity="0.1" fontFamily="Georgia">A</text>
      <rect x="3" y="60" width="18" height="2" fill="#F0FDFA" />
      <rect x="3" y="64" width="14" height="1" fill="#67E8F9" />
      <rect x="3" y="70" width="18" height="0.5" fill="#fff" opacity="0.2" />
      <rect x="3" y="74" width="6" height="0.8" fill="#67E8F9" opacity="0.7" />
      <rect x="3" y="76" width="14" height="1" fill="#A5F3FC" />
      <rect x="3" y="82" width="6" height="0.8" fill="#67E8F9" opacity="0.7" />
      <rect x="3" y="84" width="12" height="1" fill="#A5F3FC" />
      <rect x="30" y="14" width="40" height="1" fill="#94A3B8" />
      <rect x="30" y="24" width="44" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="30" y="28" width="40" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="30" y="36" width="44" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="30" y="40" width="36" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="30" y="92" width="20" height="2" fill="#0E7490" />
    </svg>
  )
}

function MosaicThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#FAF5FF" />
      <g fill="#7C3AED" opacity="0.13">
        {Array.from({ length: 5 }, (_, r) => (
          <g key={r}>
            {Array.from({ length: 7 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={6 + c * 11} cy={6 + r * 6} r="0.7" />
            ))}
          </g>
        ))}
      </g>
      <rect x="0" y="32" width="80" height="1.2" fill="#7C3AED" />
      <rect x="6" y="6" width="16" height="3" rx="1.5" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="0.4" />
      <rect x="6" y="12" width="34" height="3.5" fill="#1E1B4B" />
      <rect x="6" y="18" width="22" height="1.8" fill="#7C3AED" />
      <rect x="6" y="24" width="14" height="1" fill="#6D28D9" />
      <rect x="24" y="24" width="14" height="1" fill="#6D28D9" />
      <rect x="6" y="44" width="3" height="14" fill="#7C3AED" />
      <rect x="12" y="44" width="60" height="1.2" rx="0.6" fill="#1E1B4B" opacity="0.3" />
      <rect x="12" y="48" width="56" height="1.2" rx="0.6" fill="#1E1B4B" opacity="0.3" />
      <rect x="12" y="52" width="60" height="1.2" rx="0.6" fill="#1E1B4B" opacity="0.3" />
      <rect x="6" y="62" width="60" height="1.2" rx="0.6" fill="#1E1B4B" opacity="0.2" />
      <rect x="6" y="66" width="50" height="1.2" rx="0.6" fill="#1E1B4B" opacity="0.2" />
      <rect x="6" y="92" width="22" height="2" fill="#7C3AED" />
    </svg>
  )
}

function VertexThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="28" fill="#0A2248" />
      <g stroke="#fff" strokeWidth="0.3" opacity="0.15">
        <line x1="0" y1="6" x2="80" y2="6" />
        <line x1="0" y1="14" x2="80" y2="14" />
        <line x1="0" y1="22" x2="80" y2="22" />
        <line x1="16" y1="0" x2="16" y2="28" />
        <line x1="32" y1="0" x2="32" y2="28" />
        <line x1="48" y1="0" x2="48" y2="28" />
        <line x1="64" y1="0" x2="64" y2="28" />
      </g>
      <rect x="6" y="8" width="30" height="3.5" fill="#F0F7FF" />
      <rect x="6" y="14" width="18" height="1.2" fill="#60A5FA" />
      <defs><linearGradient id="vertex-rule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2563EB" /><stop offset="0.5" stopColor="#60A5FA" /><stop offset="1" stopColor="transparent" /></linearGradient></defs>
      <rect x="6" y="22" width="60" height="1" fill="url(#vertex-rule)" />
      <rect x="0" y="28" width="80" height="5" fill="#F0F7FF" />
      <rect x="6" y="30" width="12" height="1" fill="#1D4ED8" />
      <rect x="22" y="30" width="12" height="1" fill="#1D4ED8" />
      <rect x="6" y="42" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="46" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="54" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="58" width="48" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="92" width="22" height="2" fill="#2563EB" />
    </svg>
  )
}

function FolioThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#FFFDF8" />
      <line x1="10" y1="14" x2="70" y2="14" stroke="#2a2a2a" strokeWidth="0.9" />
      <rect x="20" y="18" width="40" height="4" fill="#111" />
      <rect x="26" y="24" width="28" height="1.2" fill="#666" />
      <rect x="20" y="29" width="40" height="0.8" fill="#999" />
      <line x1="10" y1="32" x2="70" y2="32" stroke="#2a2a2a" strokeWidth="0.4" />
      <text x="10" y="46" fontSize="14" fontWeight="bold" fill="#111" fontFamily="Georgia">A</text>
      <rect x="20" y="42" width="50" height="1" fill="#d1d5db" />
      <rect x="20" y="46" width="50" height="1" fill="#d1d5db" />
      <rect x="10" y="52" width="60" height="1" fill="#d1d5db" />
      <rect x="10" y="56" width="56" height="1" fill="#d1d5db" />
      <rect x="10" y="62" width="60" height="1" fill="#e5e7eb" />
      <rect x="10" y="66" width="50" height="1" fill="#e5e7eb" />
      <rect x="10" y="88" width="22" height="1.5" fill="#555" />
      <rect x="10" y="92" width="18" height="1.8" fill="#111" />
    </svg>
  )
}

function GazetteThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="6" y="6" width="68" height="1.5" fill="#111" />
      <rect x="6" y="9" width="68" height="0.5" fill="#777" />
      <rect x="6" y="12" width="68" height="5" fill="#111" />
      <text x="40" y="16.5" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#fff" letterSpacing="0.8" fontFamily="Georgia">NAME</text>
      <rect x="6" y="19" width="68" height="0.5" fill="#111" />
      <rect x="8" y="21" width="14" height="1" fill="#666" />
      <rect x="36" y="21" width="14" height="1" fill="#666" />
      <rect x="58" y="21" width="14" height="1" fill="#666" />
      <rect x="6" y="28" width="42" height="1" fill="#d1d5db" />
      <rect x="6" y="32" width="42" height="1" fill="#d1d5db" />
      <rect x="6" y="36" width="38" height="1" fill="#e5e7eb" />
      <rect x="6" y="40" width="42" height="1" fill="#e5e7eb" />
      <rect x="6" y="44" width="42" height="1" fill="#e5e7eb" />
      <line x1="50" y1="26" x2="50" y2="68" stroke="#ddd" strokeWidth="0.4" />
      <rect x="54" y="28" width="18" height="1.4" fill="#111" />
      <rect x="54" y="33" width="6" height="0.8" fill="#999" />
      <rect x="54" y="36" width="18" height="1" fill="#333" />
      <rect x="54" y="40" width="6" height="0.8" fill="#999" />
      <rect x="54" y="43" width="16" height="1" fill="#333" />
      <rect x="6" y="90" width="22" height="1.4" fill="#111" />
    </svg>
  )
}

function VersoThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#FDFAF5" />
      <text x="40" y="14" textAnchor="middle" fontSize="6" fill="#c8b8a0">— ✦ —</text>
      <text x="40" y="26" textAnchor="middle" fontSize="6" fontStyle="italic" fill="#1a1a1a" fontFamily="Georgia">Name</text>
      <rect x="22" y="30" width="36" height="1" fill="#a08878" />
      <rect x="14" y="40" width="52" height="1" fill="#b8a898" />
      <rect x="10" y="52" width="60" height="1.2" rx="0.6" fill="#333" opacity="0.4" />
      <rect x="10" y="56" width="56" height="1.2" rx="0.6" fill="#333" opacity="0.4" />
      <rect x="10" y="62" width="60" height="1.2" rx="0.6" fill="#333" opacity="0.35" />
      <rect x="10" y="66" width="50" height="1.2" rx="0.6" fill="#333" opacity="0.35" />
      <rect x="50" y="88" width="20" height="1" fill="#7a6858" />
      <rect x="50" y="92" width="18" height="1.5" fill="#1a1a1a" />
      <text x="40" y="104" textAnchor="middle" fontSize="5" fill="#c8b8a0">· · ·</text>
    </svg>
  )
}

function AurumThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#FAF7F0" />
      <defs>
        <linearGradient id="aurum-rule" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="transparent" />
          <stop offset="0.2" stopColor="#C9A84C" />
          <stop offset="0.5" stopColor="#e8d090" />
          <stop offset="0.8" stopColor="#C9A84C" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="68" height="0.5" fill="url(#aurum-rule)" />
      <text x="9" y="28" fontSize="20" fontWeight="bold" fill="#C9A84C" fontFamily="Georgia">A</text>
      <rect x="20" y="14" width="40" height="3.5" fill="#1a140a" />
      <rect x="20" y="20" width="22" height="1.2" fill="#C9A84C" />
      <rect x="6" y="30" width="14" height="1" fill="#8a7455" />
      <rect x="24" y="30" width="14" height="1" fill="#8a7455" />
      <rect x="42" y="30" width="14" height="1" fill="#8a7455" />
      <rect x="6" y="36" width="68" height="0.5" fill="url(#aurum-rule)" />
      <rect x="6" y="44" width="60" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="48" width="54" height="1.2" rx="0.6" fill="#d1d5db" />
      <rect x="6" y="56" width="60" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="60" width="50" height="1.2" rx="0.6" fill="#e5e7eb" />
      <rect x="6" y="88" width="20" height="1.4" fill="#6a5840" />
      <rect x="6" y="92" width="22" height="1.8" fill="#1a140a" />
      <rect x="6" y="100" width="68" height="0.5" fill="url(#aurum-rule)" />
    </svg>
  )
}

function OnyxThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a1a1a" />
      <text x="8" y="22" fontSize="6" letterSpacing="0.8" fill="#fff" fontWeight="200">NAME</text>
      <rect x="8" y="26" width="20" height="1.2" fill="#777" />
      <rect x="8" y="32" width="60" height="0.6" fill="#C9A84C" />
      <rect x="8" y="38" width="22" height="0.8" fill="#555" />
      <rect x="8" y="42" width="22" height="0.8" fill="#555" />
      <rect x="8" y="46" width="22" height="0.8" fill="#555" />
      <rect x="8" y="56" width="60" height="1.2" rx="0.6" fill="#CCC" opacity="0.5" />
      <rect x="8" y="60" width="54" height="1.2" rx="0.6" fill="#CCC" opacity="0.5" />
      <rect x="8" y="68" width="60" height="1.2" rx="0.6" fill="#CCC" opacity="0.3" />
      <rect x="8" y="72" width="50" height="1.2" rx="0.6" fill="#CCC" opacity="0.3" />
      <rect x="8" y="88" width="14" height="1.4" fill="#777" />
      <rect x="8" y="92" width="24" height="2" fill="#fff" />
    </svg>
  )
}

function VelvetThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#F9F4EF" />
      <defs><linearGradient id="velvet-rib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7C2D3E" /><stop offset="0.5" stopColor="#C05068" /><stop offset="1" stopColor="#7C2D3E" /></linearGradient></defs>
      <rect x="0" y="0" width="80" height="4" fill="url(#velvet-rib)" />
      <rect x="6" y="10" width="40" height="3.5" fill="#1a0a08" />
      <rect x="6" y="16" width="22" height="1.2" fill="#7C2D3E" />
      <rect x="6" y="22" width="14" height="1" fill="#8a6858" />
      <rect x="24" y="22" width="14" height="1" fill="#8a6858" />
      <rect x="42" y="22" width="14" height="1" fill="#8a6858" />
      <rect x="0" y="28" width="80" height="0.6" fill="#D9C4B8" />
      <rect x="6" y="36" width="60" height="1.2" rx="0.6" fill="#5a3828" opacity="0.55" />
      <rect x="6" y="40" width="54" height="1.2" rx="0.6" fill="#5a3828" opacity="0.55" />
      <rect x="6" y="48" width="3" height="14" fill="#7C2D3E" />
      <rect x="12" y="48" width="60" height="1.2" rx="0.6" fill="#5a3828" opacity="0.45" />
      <rect x="12" y="52" width="56" height="1.2" rx="0.6" fill="#5a3828" opacity="0.45" />
      <rect x="12" y="56" width="58" height="1.2" rx="0.6" fill="#5a3828" opacity="0.45" />
      <rect x="6" y="70" width="60" height="1.2" rx="0.6" fill="#5a3828" opacity="0.55" />
      <rect x="6" y="88" width="18" height="1.4" fill="#7C2D3E" />
      <rect x="6" y="92" width="22" height="1.8" fill="#1a0a08" />
      <rect x="0" y="106" width="80" height="4" fill="url(#velvet-rib)" />
    </svg>
  )
}

function SignalThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="32" fill="#0f2240" />
      <circle cx="68" cy="6" r="10" fill="#00b8c4" opacity="0.15" />
      <circle cx="62" cy="28" r="6" fill="#00b8c4" opacity="0.1" />
      <rect x="6" y="8" width="40" height="4" fill="#fff" />
      <rect x="6" y="14" width="22" height="1.4" fill="#00b8c4" />
      <rect x="6" y="22" width="14" height="1.2" fill="#c8d8e8" />
      <rect x="22" y="22" width="14" height="1.2" fill="#c8d8e8" />
      <rect x="6" y="40" width="40" height="1.2" fill="#7a8a9a" />
      <rect x="6" y="46" width="50" height="1.2" fill="#0f2240" />
      <rect x="6" y="56" width="12" height="1.5" fill="#00b8c4" />
      <rect x="6" y="62" width="60" height="1.2" rx="0.6" fill="#2c3e50" opacity="0.5" />
      <rect x="6" y="66" width="54" height="1.2" rx="0.6" fill="#2c3e50" opacity="0.5" />
      <rect x="6" y="74" width="60" height="1.2" rx="0.6" fill="#2c3e50" opacity="0.35" />
      <rect x="6" y="92" width="22" height="2" fill="#0f2240" />
      <rect x="0" y="106" width="80" height="4" fill="#0f2240" />
    </svg>
  )
}

function MeridianThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fdf9f3" />
      <g opacity="0.08" stroke="#8a6d3b" fill="none">
        <circle cx="40" cy="55" r="22" />
        <circle cx="40" cy="55" r="14" strokeWidth="0.4" />
        <line x1="40" y1="33" x2="40" y2="77" strokeWidth="0.4" />
        <line x1="18" y1="55" x2="62" y2="55" strokeWidth="0.4" />
      </g>
      <line x1="20" y1="14" x2="32" y2="14" stroke="#c9a96e" strokeWidth="0.5" />
      <polygon points="35,14 38,11 41,14 38,17" fill="none" stroke="#c9a96e" strokeWidth="0.5" />
      <line x1="44" y1="14" x2="60" y2="14" stroke="#c9a96e" strokeWidth="0.5" />
      <text x="40" y="28" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1a1208" fontFamily="Georgia">Name</text>
      <line x1="20" y1="32" x2="32" y2="32" stroke="#c9a96e" strokeWidth="0.4" />
      <rect x="34" y="31" width="12" height="1" fill="#8a6d3b" />
      <line x1="48" y1="32" x2="60" y2="32" stroke="#c9a96e" strokeWidth="0.4" />
      <rect x="20" y="36" width="40" height="1" fill="#5c4a2a" />
      <line x1="6" y1="40" x2="74" y2="40" stroke="#c9a96e" strokeWidth="0.3" />
      <rect x="14" y="52" width="52" height="1.2" rx="0.6" fill="#3a2e1a" opacity="0.45" />
      <rect x="14" y="56" width="46" height="1.2" rx="0.6" fill="#3a2e1a" opacity="0.45" />
      <rect x="14" y="62" width="52" height="1.2" rx="0.6" fill="#3a2e1a" opacity="0.35" />
      <rect x="14" y="66" width="40" height="1.2" rx="0.6" fill="#3a2e1a" opacity="0.35" />
      <rect x="14" y="88" width="20" height="2" fill="#1a1208" />
      <line x1="6" y1="100" x2="74" y2="100" stroke="#c9a96e" strokeWidth="0.3" />
    </svg>
  )
}

function NovaThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fafafa" />
      <defs>
        <linearGradient id="nova-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16213e" />
          <stop offset="0.6" stopColor="#0f3460" />
          <stop offset="1" stopColor="#533483" />
        </linearGradient>
        <linearGradient id="nova-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff57ba" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="32" fill="url(#nova-hero)" />
      <g opacity="0.4">
        <line x1="60" y1="2" x2="60" y2="30" stroke="#ff57ba" strokeWidth="0.3" />
        <line x1="50" y1="16" x2="74" y2="16" stroke="#a855f7" strokeWidth="0.3" />
        <circle cx="60" cy="16" r="6" stroke="#06b6d4" strokeWidth="0.3" fill="none" />
        <circle cx="60" cy="16" r="1.4" fill="#ff57ba" />
      </g>
      <rect x="78" y="0" width="2" height="32" fill="url(#nova-side)" />
      <rect x="6" y="6" width="20" height="2.5" fill="#ff57ba" opacity="0.4" />
      <rect x="6" y="12" width="32" height="4" fill="#fff" />
      <rect x="0" y="32" width="22" height="78" fill="#f0f0f7" />
      <rect x="4" y="40" width="14" height="1" fill="#7c3aed" />
      <rect x="4" y="44" width="16" height="0.8" fill="#3a3a5c" />
      <rect x="4" y="48" width="14" height="0.8" fill="#3a3a5c" />
      <rect x="4" y="56" width="14" height="1" fill="#7c3aed" />
      <rect x="4" y="60" width="16" height="0.8" fill="#3a3a5c" />
      <rect x="26" y="40" width="48" height="1.2" rx="0.6" fill="#2c2c4a" opacity="0.6" />
      <rect x="26" y="44" width="44" height="1.2" rx="0.6" fill="#2c2c4a" opacity="0.6" />
      <rect x="26" y="50" width="48" height="1.2" rx="0.6" fill="#2c2c4a" opacity="0.45" />
      <rect x="26" y="54" width="42" height="1.2" rx="0.6" fill="#2c2c4a" opacity="0.45" />
      <rect x="26" y="90" width="22" height="2" fill="#1a1a2e" />
    </svg>
  )
}

function ObsidianThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a1a1a" />
      <defs><linearGradient id="obs-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="transparent" /><stop offset="0.5" stopColor="#f0c040" /><stop offset="1" stopColor="transparent" /></linearGradient></defs>
      <rect x="0" y="0" width="80" height="1" fill="url(#obs-gold)" />
      <rect x="2" y="2" width="76" height="106" stroke="#2a2a2a" strokeWidth="0.5" fill="none" />
      <path d="M6,6 L14,6 M6,6 L6,14" stroke="#f0c040" strokeWidth="0.6" fill="none" />
      <path d="M74,6 L66,6 M74,6 L74,14" stroke="#f0c040" strokeWidth="0.6" fill="none" />
      <text x="40" y="22" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#f0c040" fontFamily="Georgia">Name</text>
      <rect x="20" y="26" width="40" height="1" fill="#8a7a5a" />
      <rect x="6" y="32" width="68" height="0.6" fill="#b8960c" />
      <rect x="6" y="40" width="60" height="1.2" rx="0.6" fill="#c8b898" opacity="0.5" />
      <rect x="6" y="44" width="54" height="1.2" rx="0.6" fill="#c8b898" opacity="0.5" />
      <rect x="6" y="52" width="60" height="1.2" rx="0.6" fill="#c8b898" opacity="0.35" />
      <rect x="6" y="56" width="48" height="1.2" rx="0.6" fill="#c8b898" opacity="0.35" />
      <rect x="6" y="86" width="22" height="2" fill="#f0c040" />
      <circle cx="64" cy="92" r="6" stroke="#b8960c" strokeWidth="0.4" fill="none" />
      <circle cx="64" cy="92" r="3" stroke="#b8960c" strokeWidth="0.4" fill="none" />
      <circle cx="64" cy="92" r="1" fill="#f0c040" />
      <rect x="0" y="100" width="80" height="1" fill="url(#obs-gold)" />
    </svg>
  )
}

function CodexThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f8f5ee" />
      <rect x="3" y="3" width="74" height="104" stroke="#8b6340" strokeWidth="0.6" fill="none" />
      <rect x="6" y="6" width="68" height="98" stroke="#c9a96e" strokeWidth="0.3" fill="none" />
      <circle cx="40" cy="6" r="1" fill="#c9a96e" />
      <circle cx="40" cy="104" r="1" fill="#c9a96e" />
      <path d="M20,14 C20,12 28,10 40,10 C52,10 60,12 60,14 L60,22 L40,28 L20,22 Z" fill="#c9a96e" opacity="0.1" stroke="#8b6340" strokeWidth="0.3" />
      <circle cx="40" cy="18" r="2" stroke="#8b6340" strokeWidth="0.3" fill="none" />
      <text x="40" y="34" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#2c1f0e" fontFamily="Georgia">Name</text>
      <rect x="22" y="38" width="36" height="1" fill="#8b6340" />
      <rect x="22" y="40" width="36" height="0.5" fill="#8b6340" />
      <text x="40" y="48" textAnchor="middle" fontSize="4" fontStyle="italic" fill="#6b4a25" fontFamily="Georgia">Title</text>
      <text x="14" y="58" fontSize="6" fontWeight="bold" fill="#8b6340" fontFamily="Georgia">D</text>
      <rect x="22" y="56" width="48" height="1.2" rx="0.6" fill="#2c1f0e" opacity="0.45" />
      <rect x="14" y="60" width="56" height="1.2" rx="0.6" fill="#2c1f0e" opacity="0.45" />
      <rect x="14" y="64" width="56" height="1.2" rx="0.6" fill="#2c1f0e" opacity="0.4" />
      <rect x="14" y="70" width="56" height="1.2" rx="0.6" fill="#2c1f0e" opacity="0.4" />
      <rect x="50" y="90" width="22" height="2" fill="#2c1f0e" />
    </svg>
  )
}

function AxiomThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#1a1f2a" />
      <g opacity="0.2" stroke="#58a6ff" strokeWidth="0.4" fill="none">
        <path d="M50 6 L60 6 L60 12 L70 12" />
        <path d="M55 12 L55 20 L70 20" />
        <circle cx="60" cy="6" r="0.8" fill="#58a6ff" />
        <circle cx="60" cy="12" r="0.8" fill="#58a6ff" />
      </g>
      <circle cx="6" cy="8" r="1" fill="#3fb950" />
      <rect x="9" y="7" width="22" height="1" fill="#3fb950" />
      <rect x="6" y="12" width="36" height="4" fill="#f0f6fc" />
      <rect x="6" y="18" width="18" height="2.5" rx="1" fill="#222831" stroke="#30363D" strokeWidth="0.3" />
      <rect x="8" y="19" width="14" height="1" fill="#58a6ff" />
      <rect x="6" y="26" width="68" height="14" rx="1" fill="#222831" stroke="#30363D" strokeWidth="0.3" />
      <rect x="9" y="29" width="50" height="1" fill="#8b949e" />
      <rect x="9" y="32" width="14" height="1" fill="#79c0ff" />
      <rect x="25" y="32" width="20" height="1" fill="#a8d5a2" />
      <rect x="9" y="35" width="14" height="1" fill="#79c0ff" />
      <rect x="25" y="35" width="20" height="1" fill="#a8d5a2" />
      <rect x="6" y="46" width="14" height="1" fill="#3fb950" />
      <rect x="6" y="50" width="60" height="1.2" rx="0.6" fill="#c9d1d9" opacity="0.6" />
      <rect x="6" y="54" width="54" height="1.2" rx="0.6" fill="#c9d1d9" opacity="0.6" />
      <rect x="6" y="60" width="60" height="1.2" rx="0.6" fill="#c9d1d9" opacity="0.4" />
      <rect x="6" y="92" width="22" height="2" fill="#f0f6fc" />
    </svg>
  )
}

function TerraThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f7f4ef" />
      <rect x="0" y="0" width="24" height="110" fill="#2a2418" />
      <path d="M12 22 C12 22 5 17 5 11 C5 8 8 6 11 7 C9 10 9 14 12 16 C15 14 15 10 13 7 C16 6 19 8 19 11 C19 17 12 22 12 22Z" fill="#6b8f4e" />
      <rect x="3" y="32" width="18" height="2" fill="#f7f4ef" />
      <rect x="3" y="36" width="14" height="1" fill="#8a7a5a" />
      <rect x="3" y="42" width="14" height="0.8" fill="#5a5030" />
      <rect x="3" y="46" width="16" height="0.8" fill="#c8b898" />
      <rect x="3" y="50" width="14" height="0.8" fill="#c8b898" />
      <rect x="3" y="54" width="18" height="0.8" fill="#c8b898" />
      <rect x="30" y="14" width="40" height="1" fill="#8a7a5a" />
      <rect x="30" y="20" width="22" height="2" fill="#2a2418" />
      <rect x="30" y="26" width="8" height="0.8" fill="#6b8f4e" />
      <rect x="30" y="34" width="44" height="1.2" rx="0.6" fill="#3a3020" opacity="0.45" />
      <rect x="30" y="38" width="40" height="1.2" rx="0.6" fill="#3a3020" opacity="0.45" />
      <rect x="30" y="46" width="44" height="1.2" rx="0.6" fill="#3a3020" opacity="0.35" />
      <rect x="30" y="50" width="36" height="1.2" rx="0.6" fill="#3a3020" opacity="0.35" />
      <rect x="30" y="86" width="16" height="1.4" fill="#6a5a3a" />
      <rect x="30" y="92" width="22" height="2" fill="#2a2418" />
    </svg>
  )
}

function FlareThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <defs><linearGradient id="flare-hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6b35" /><stop offset="0.5" stopColor="#f7c948" /><stop offset="1" stopColor="#ff6b35" /></linearGradient></defs>
      <rect x="0" y="0" width="80" height="36" fill="url(#flare-hero)" />
      <g opacity="0.18" fill="#1a0a2e">
        <polygon points="68,4 70,18 68,20 66,18" />
        <polygon points="68,32 70,22 68,20 66,22" />
        <polygon points="60,18 68,18 70,20 68,22" />
        <polygon points="76,18 68,18 66,20 68,22" />
      </g>
      <rect x="6" y="6" width="20" height="1.4" fill="#1a0a2e" opacity="0.5" />
      <rect x="6" y="12" width="36" height="5" fill="#1a0a2e" />
      <rect x="6" y="20" width="18" height="2" fill="#1a0a2e" opacity="0.7" />
      <rect x="6" y="26" width="14" height="3" rx="1.5" fill="#1a0a2e" opacity="0.15" />
      <rect x="22" y="26" width="14" height="3" rx="1.5" fill="#1a0a2e" opacity="0.15" />
      <polyline points="6,42 14,46 22,42 30,46 38,42 46,46 54,42 62,46 70,42" stroke="#f7c948" strokeWidth="1" fill="none" />
      <rect x="6" y="52" width="60" height="1.2" rx="0.6" fill="#2a1a3e" opacity="0.45" />
      <rect x="6" y="56" width="54" height="1.2" rx="0.6" fill="#2a1a3e" opacity="0.45" />
      <rect x="6" y="62" width="60" height="1.2" rx="0.6" fill="#2a1a3e" opacity="0.35" />
      <rect x="6" y="66" width="50" height="1.2" rx="0.6" fill="#2a1a3e" opacity="0.35" />
      <rect x="6" y="92" width="22" height="2" fill="#1a0a2e" />
    </svg>
  )
}

function HeraldThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fff" />
      <rect x="0" y="0" width="80" height="3" fill="#3d1a5c" />
      <path d="M14,12 L24,16 L24,28 C24,34 19,40 14,42 C9,40 4,34 4,28 L4,16 Z" fill="#f5f0fa" stroke="#3d1a5c" strokeWidth="0.5" />
      <polygon points="14,22 15,25 18,25 15.5,27 16.5,30 14,28 11.5,30 12.5,27 10,25 13,25" fill="#8a5aaa" opacity="0.7" />
      <rect x="28" y="14" width="40" height="4" fill="#1a1025" />
      <rect x="28" y="22" width="22" height="1.4" fill="#8a5aaa" />
      <rect x="28" y="28" width="14" height="1" fill="#5a4a6a" />
      <rect x="46" y="28" width="14" height="1" fill="#5a4a6a" />
      <defs><linearGradient id="herald-rule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3d1a5c" /><stop offset="1" stopColor="#8a5aaa" /></linearGradient></defs>
      <rect x="6" y="48" width="14" height="1.5" fill="url(#herald-rule)" />
      <rect x="6" y="54" width="60" height="1.2" rx="0.6" fill="#2a1a35" opacity="0.5" />
      <rect x="6" y="58" width="54" height="1.2" rx="0.6" fill="#2a1a35" opacity="0.5" />
      <rect x="6" y="66" width="60" height="1.2" rx="0.6" fill="#2a1a35" opacity="0.35" />
      <rect x="6" y="70" width="48" height="1.2" rx="0.6" fill="#2a1a35" opacity="0.35" />
      <rect x="6" y="92" width="22" height="2" fill="#1a1025" />
      <rect x="6" y="96" width="14" height="1" fill="#8a5aaa" />
    </svg>
  )
}

function BloomThumb() {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#fef8f8" />
      <rect x="0" y="0" width="80" height="36" fill="#fff0f5" />
      <rect x="0" y="35" width="80" height="1" fill="#f0c0d0" />
      <g opacity="0.4">
        <circle cx="8" cy="12" r="3.5" fill="#f090b0" />
        <ellipse cx="4" cy="12" rx="2.5" ry="1.5" fill="#f0a0c0" />
        <ellipse cx="12" cy="12" rx="2.5" ry="1.5" fill="#f0a0c0" />
        <line x1="8" y1="16" x2="8" y2="26" stroke="#c06080" strokeWidth="0.6" />
        <ellipse cx="5" cy="22" rx="3" ry="1.6" fill="#f0c0d0" />
      </g>
      <g opacity="0.4">
        <circle cx="72" cy="12" r="3.5" fill="#f090b0" />
        <ellipse cx="76" cy="12" rx="2.5" ry="1.5" fill="#f0a0c0" />
        <ellipse cx="68" cy="12" rx="2.5" ry="1.5" fill="#f0a0c0" />
        <line x1="72" y1="16" x2="72" y2="26" stroke="#c06080" strokeWidth="0.6" />
        <ellipse cx="75" cy="22" rx="3" ry="1.6" fill="#f0c0d0" />
      </g>
      <rect x="18" y="10" width="40" height="4" fill="#5a1a2e" />
      <rect x="18" y="18" width="22" height="1.4" fill="#c06080" />
      <rect x="18" y="24" width="14" height="1" fill="#7a4a5a" />
      <rect x="34" y="24" width="14" height="1" fill="#7a4a5a" />
      <line x1="6" y1="46" x2="34" y2="46" stroke="#f0c0d0" strokeWidth="0.4" />
      <circle cx="40" cy="46" r="2" fill="#c06080" />
      <line x1="46" y1="46" x2="74" y2="46" stroke="#f0c0d0" strokeWidth="0.4" />
      <rect x="6" y="54" width="60" height="1.2" rx="0.6" fill="#2a1820" opacity="0.55" />
      <rect x="6" y="58" width="54" height="1.2" rx="0.6" fill="#2a1820" opacity="0.55" />
      <rect x="6" y="66" width="60" height="1.2" rx="0.6" fill="#2a1820" opacity="0.4" />
      <rect x="6" y="70" width="50" height="1.2" rx="0.6" fill="#2a1820" opacity="0.4" />
      <rect x="6" y="92" width="22" height="2" fill="#5a1a2e" />
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
  // ── 30 premium templates (cover-letter v2). Fixed palette; colorScheme is ignored. ──
  if (id === "echo") return <EchoThumb />
  if (id === "lumen") return <LumenThumb />
  if (id === "atlas") return <AtlasThumb />
  if (id === "consul") return <ConsulThumb />
  if (id === "sterling") return <SterlingThumb />
  if (id === "fortis") return <FortisThumb />
  if (id === "prism") return <PrismThumb />
  if (id === "ember") return <EmberThumb />
  if (id === "vantage") return <VantageThumb />
  if (id === "mosaic") return <MosaicThumb />
  if (id === "vertex") return <VertexThumb />
  if (id === "folio") return <FolioThumb />
  if (id === "gazette") return <GazetteThumb />
  if (id === "verso") return <VersoThumb />
  if (id === "aurum") return <AurumThumb />
  if (id === "onyx") return <OnyxThumb />
  if (id === "velvet") return <VelvetThumb />
  if (id === "signal") return <SignalThumb />
  if (id === "meridian") return <MeridianThumb />
  if (id === "nova") return <NovaThumb />
  if (id === "obsidian") return <ObsidianThumb />
  if (id === "codex") return <CodexThumb />
  if (id === "axiom") return <AxiomThumb />
  if (id === "terra") return <TerraThumb />
  if (id === "flare") return <FlareThumb />
  if (id === "herald") return <HeraldThumb />
  if (id === "bloom") return <BloomThumb />
  return <ElegantThumb color={color} />
}
