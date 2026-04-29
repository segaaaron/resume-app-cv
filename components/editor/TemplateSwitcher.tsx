"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { isActive, isSuperAdmin } from "@/lib/plans"
import UpgradeModal from "./UpgradeModal"

// ── SVG thumbnails — one per template ID ─────────────────────────────────────

function ClassicThumb({ color }: { color: string }) {
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

function ModernThumb({ color }: { color: string }) {
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

function SidebarResumeThumb({ color }: { color: string }) {
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

function ElegantResumeThumb({ color }: { color: string }) {
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

function ProfessionalThumb({ color }: { color: string }) {
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

function ExecutiveResumeThumb({ color }: { color: string }) {
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

function MinimalResumeThumb({ color }: { color: string }) {
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

function ChronoThumb({ color }: { color: string }) {
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

function CarbonThumb({ color }: { color: string }) {
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

function VerticalThumb({ color }: { color: string }) {
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

function HorizontalThumb({ color }: { color: string }) {
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

function GlassThumb({ color }: { color: string }) {
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

function NeonThumb({ color }: { color: string }) {
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

function BauhausThumb({ color }: { color: string }) {
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

function OutlineThumb({ color }: { color: string }) {
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

function StripeThumb({ color }: { color: string }) {
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

function NordicThumb({ color }: { color: string }) {
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

// ── Pro templates ─────────────────────────────────────────────────────────────

function AuroraThumb({ color }: { color: string }) {
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

function HelixThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* sidebar */}
      <rect x="0" y="0" width="22" height="110" fill={color} opacity="0.1" />
      {/* spiral decorative */}
      <circle cx="11" cy="14" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="11" cy="14" r="4" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="11" cy="14" r="1.5" fill={color} opacity="0.7" />
      <rect x="3" y="27" width="16" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="3" y="31" width="14" height="1" rx="0.5" fill="#9ca3af" opacity="0.5" />
      <rect x="3" y="38" width="16" height="1" rx="0.5" fill="#9ca3af" opacity="0.3" />
      <rect x="3" y="42" width="12" height="1" rx="0.5" fill="#9ca3af" opacity="0.3" />
      <rect x="28" y="10" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="28" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="28" y="26" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="30" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="38" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="42" width="30" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function LumiereThumb({ color }: { color: string }) {
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

function PrismThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* geometric corner block */}
      <polygon points="0,0 40,0 0,35" fill={color} opacity="0.85" />
      <polygon points="40,0 80,0 80,10" fill={color} opacity="0.3" />
      <rect x="8" y="38" width="36" height="3" rx="1" fill="#1f2937" />
      <rect x="8" y="44" width="24" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="8" y="52" width="64" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="56" width="54" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="63" width="64" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="67" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="71" width="64" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function ConsulThumb({ color }: { color: string }) {
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

function RoseThumb({ color }: { color: string }) {
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

function NauticalThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* navy horizontal header */}
      <rect x="0" y="0" width="80" height="18" fill={color} opacity="0.9" />
      <rect x="8" y="5" width="30" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="8" y="10" width="18" height="1.5" rx="0.75" fill="white" opacity="0.5" />
      {/* nautical double rule */}
      <rect x="0" y="18" width="80" height="2" fill={color} />
      <rect x="0" y="21" width="80" height="0.6" fill={color} opacity="0.4" />
      <rect x="8" y="28" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="32" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="8" y="39" width="22" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="8" y="45" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="49" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="8" y="53" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function WaveThumb({ color }: { color: string }) {
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

function CobaltThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* deep left column */}
      <rect x="0" y="0" width="30" height="110" fill={color} opacity="0.9" />
      <circle cx="15" cy="18" r="7" fill="white" opacity="0.2" />
      <rect x="4" y="29" width="22" height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="4" y="33" width="18" height="1" rx="0.5" fill="white" opacity="0.3" />
      <rect x="4" y="40" width="12" height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="4" y="44" width="22" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="4" y="48" width="18" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="4" y="55" width="12" height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="4" y="59" width="22" height="1" rx="0.5" fill="white" opacity="0.2" />
      <rect x="36" y="10" width="28" height="3" rx="1" fill="#1f2937" />
      <rect x="36" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
      <rect x="36" y="26" width="36" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="36" y="30" width="28" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="36" y="37" width="36" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="36" y="41" width="24" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function BannerThumb({ color }: { color: string }) {
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

function DualityThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* left half dark, right half light — split design */}
      <rect x="0" y="0" width="40" height="110" fill="#1f2937" />
      <rect x="40" y="0" width="40" height="110" fill="white" />
      {/* left side */}
      <rect x="4" y="10" width="28" height="3" rx="1" fill="white" opacity="0.9" />
      <rect x="4" y="16" width="18" height="1.5" rx="0.75" fill={color} opacity="0.8" />
      <rect x="4" y="24" width="32" height="1.5" rx="0.75" fill="#374151" />
      <rect x="4" y="28" width="28" height="1.5" rx="0.75" fill="#374151" />
      <rect x="4" y="35" width="32" height="1.5" rx="0.75" fill="#4b5563" />
      <rect x="4" y="39" width="24" height="1.5" rx="0.75" fill="#4b5563" />
      {/* right side */}
      <rect x="44" y="10" width="28" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="44" y="16" width="32" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="44" y="20" width="28" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="44" y="27" width="32" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="44" y="31" width="24" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="44" y="38" width="32" height="1.5" rx="0.75" fill="#f3f4f6" />
    </svg>
  )
}

function ObsidianThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#0d0d0d" />
      <rect x="0" y="0" width="80" height="3" fill={color} opacity="0.8" />
      <rect x="8" y="10" width="36" height="3" rx="1" fill="white" opacity="0.85" />
      <rect x="8" y="16" width="22" height="1.5" rx="0.75" fill={color} opacity="0.9" />
      <rect x="8" y="23" width="64" height="0.6" fill={color} opacity="0.3" />
      <rect x="8" y="30" width="60" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="34" width="50" height="1.5" rx="0.75" fill="#374151" />
      <rect x="8" y="41" width="20" height="1.5" rx="0.75" fill={color} opacity="0.6" />
      <rect x="8" y="47" width="60" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="8" y="51" width="44" height="1.5" rx="0.75" fill="#1f2937" />
      <rect x="8" y="55" width="60" height="1.5" rx="0.75" fill="#1f2937" />
      <circle cx="68" cy="95" r="5" fill={color} opacity="0.2" />
    </svg>
  )
}

function VertexThumb({ color }: { color: string }) {
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

function PrestigeThumb({ color }: { color: string }) {
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

// ── New 20 Pro templates thumbnails ──────────────────────────────────────────

function OsloThumb({ color }: { color: string }) {
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

function KyotoThumb({ color }: { color: string }) {
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

function GenevaThumb({ color }: { color: string }) {
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

function WindsorThumb({ color }: { color: string }) {
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

function MilanThumb({ color }: { color: string }) {
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

function ZurichThumb({ color }: { color: string }) {
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

function LisbonThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* gradient header */}
      <defs>
        <linearGradient id="lisbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="26" fill="url(#lisbGrad)" />
      {/* sidebar hexagon photo placeholder */}
      <polygon points="11,4 16,7 16,13 11,16 6,13 6,7" fill="rgba(255,255,255,0.3)" />
      {/* name area */}
      <rect x="22" y="8" width="26" height="2.5" rx="1" fill="white" opacity="0.9" />
      <rect x="22" y="13" width="18" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      {/* sidebar body */}
      <rect x="0" y="26" width="22" height="84" fill={color} opacity="0.85" />
      <rect x="3" y="32" width="16" height="1" rx="0.5" fill="white" opacity="0.4" />
      <rect x="3" y="36" width="12" height="1" rx="0.5" fill="white" opacity="0.3" />
      {/* main body */}
      <rect x="28" y="32" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="36" width="38" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="43" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="47" width="32" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function PortoThumb({ color }: { color: string }) {
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

function BarcelonaThumb({ color }: { color: string }) {
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

function ViennaThumb({ color }: { color: string }) {
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

function BerlinThumb({ color }: { color: string }) {
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

function StockholmThumb({ color }: { color: string }) {
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

function DublinThumb({ color }: { color: string }) {
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

function HelsinkiThumb({ color }: { color: string }) {
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

function HavanaThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="white" />
      {/* name band full-width */}
      <rect x="0" y="0" width="80" height="14" fill={color} opacity="0.9" />
      <rect x="30" y="4" width="32" height="2.5" rx="1" fill="white" opacity="0.9" />
      <rect x="30" y="9" width="20" height="1.2" rx="0.6" fill="white" opacity="0.6" />
      {/* sidebar */}
      <rect x="0" y="14" width="28" height="96" fill={color} opacity="0.85" />
      <circle cx="14" cy="26" r="7" fill="rgba(255,255,255,0.25)" />
      <rect x="3" y="37" width="22" height="1" rx="0.5" fill="white" opacity="0.4" />
      <rect x="3" y="41" width="18" height="1" rx="0.5" fill="white" opacity="0.3" />
      {/* main body */}
      <rect x="34" y="20" width="38" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="34" y="24" width="32" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="34" y="32" width="38" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="34" y="36" width="28" height="1.5" rx="0.75" fill="#e5e7eb" />
    </svg>
  )
}

function LagosThumb({ color }: { color: string }) {
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

function SeoulThumb({ color }: { color: string }) {
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

function CopenhagenThumb({ color }: { color: string }) {
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

function GenevanoirThumb({ color }: { color: string }) {
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

function ReykjavikThumb({ color }: { color: string }) {
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

// ── Dispatcher ────────────────────────────────────────────────────────────────

function ResumeThumbnail({ id, color }: { id: string; color: string }) {
  switch (id) {
    case "classic":      return <ClassicThumb color={color} />
    case "modern":       return <ModernThumb color={color} />
    case "sidebar":      return <SidebarResumeThumb color={color} />
    case "elegant":      return <ElegantResumeThumb color={color} />
    case "professional": return <ProfessionalThumb color={color} />
    case "executive":    return <ExecutiveResumeThumb color={color} />
    case "minimal":      return <MinimalResumeThumb color={color} />
    case "chrono":       return <ChronoThumb color={color} />
    case "carbon":       return <CarbonThumb color={color} />
    case "vertical":     return <VerticalThumb color={color} />
    case "horizontal":   return <HorizontalThumb color={color} />
    case "glass":        return <GlassThumb color={color} />
    case "neon":         return <NeonThumb color={color} />
    case "bauhaus":      return <BauhausThumb color={color} />
    case "outline":      return <OutlineThumb color={color} />
    case "stripe":       return <StripeThumb color={color} />
    case "nordic":       return <NordicThumb color={color} />
    // Pro
    case "aurora":       return <AuroraThumb color={color} />
    case "helix":        return <HelixThumb color={color} />
    case "lumiere":      return <LumiereThumb color={color} />
    case "prism":        return <PrismThumb color={color} />
    case "consul":       return <ConsulThumb color={color} />
    case "rose":         return <RoseThumb color={color} />
    case "nautical":     return <NauticalThumb color={color} />
    case "wave":         return <WaveThumb color={color} />
    case "cobalt":       return <CobaltThumb color={color} />
    case "banner":       return <BannerThumb color={color} />
    case "duality":      return <DualityThumb color={color} />
    case "obsidian":     return <ObsidianThumb color={color} />
    case "vertex":       return <VertexThumb color={color} />
    case "prestige":     return <PrestigeThumb color={color} />
    case "oslo":         return <OsloThumb color={color} />
    case "kyoto":        return <KyotoThumb color={color} />
    case "geneva":       return <GenevaThumb color={color} />
    case "windsor":      return <WindsorThumb color={color} />
    case "milan":        return <MilanThumb color={color} />
    case "zurich":       return <ZurichThumb color={color} />
    case "lisbon":       return <LisbonThumb color={color} />
    case "porto":        return <PortoThumb color={color} />
    case "barcelona":    return <BarcelonaThumb color={color} />
    case "vienna":       return <ViennaThumb color={color} />
    case "berlin":       return <BerlinThumb color={color} />
    case "stockholm":    return <StockholmThumb color={color} />
    case "dublin":       return <DublinThumb color={color} />
    case "helsinki":     return <HelsinkiThumb color={color} />
    case "havana":       return <HavanaThumb color={color} />
    case "lagos":        return <LagosThumb color={color} />
    case "seoul":        return <SeoulThumb color={color} />
    case "copenhagen":   return <CopenhagenThumb color={color} />
    case "genevanoir":   return <GenevanoirThumb color={color} />
    case "reykjavik":    return <ReykjavikThumb color={color} />
    default:             return <ClassicThumb color={color} />
  }
}

const PRO_IDS = ["aurora", "helix", "lumiere", "prism", "consul", "rose", "minimal", "nautical", "wave", "cobalt", "banner", "duality", "obsidian", "vertex", "prestige", "oslo", "kyoto", "geneva", "windsor", "milan", "zurich", "lisbon", "porto", "barcelona", "vienna", "berlin", "stockholm", "dublin", "helsinki", "havana", "lagos", "seoul", "copenhagen", "genevanoir", "reykjavik"]

const proTemplates     = TEMPLATES.filter((t) => PRO_IDS.includes(t.id))
const regularTemplates = TEMPLATES.filter((t) => !PRO_IDS.includes(t.id))

interface Props {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  trialEndsAt?: string | null
  role?: string
}

export default function TemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, trialEndsAt, role }: Props) {
  const t = useTranslations("editor")
  const { config, setTemplate } = useResumeStore()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const hasAccess = isSuperAdmin(role) || isActive(
    plan,
    trialEndsAt ? new Date(trialEndsAt) : null,
    subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
    subscriptionStatus
  )

  function handleLockedTemplate() {
    setUpgradeOpen(true)
  }

  const TemplateThumb = ({
    template,
    locked,
  }: {
    template: typeof TEMPLATES[number]
    locked: boolean
  }) => (
    <button
      key={template.id}
      onClick={() => {
        if (locked) {
          handleLockedTemplate()
        } else {
          setTemplate(template.id)
        }
      }}
      className="shrink-0 flex flex-col items-center gap-1 group"
    >
      <div
        className={cn(
          "w-12 h-16 rounded-lg border-2 overflow-hidden transition-all relative",
          locked
            ? "border-border opacity-50 cursor-not-allowed"
            : config.templateId === template.id
              ? "border-primary shadow-md shadow-primary/20"
              : "border-border group-hover:border-primary/40"
        )}
      >
        <ResumeThumbnail id={template.id} color={locked ? "#9ca3af" : config.colorScheme} />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <Lock className="h-3.5 w-3.5 text-white drop-shadow" />
          </div>
        )}
      </div>
      <span className={cn(
        "text-[9px] font-medium transition-colors",
        locked
          ? "text-muted-foreground/60"
          : config.templateId === template.id ? "text-primary" : "text-muted-foreground"
      )}>
        {template.name}
      </span>
    </button>
  )

  return (
    <>
    <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    <div className="shrink-0 bg-white/95 backdrop-blur border-t border-border px-4 py-3">
      <div className="flex flex-col gap-3">

        {/* ── Plantillas por defecto ── */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {regularTemplates.map((t) => <TemplateThumb key={t.id} template={t} locked={!hasAccess} />)}
        </div>

        {/* ── Pro Diseños ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-border overflow-x-auto pb-1 scrollbar-hide">
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              Pro
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              Diseños
            </span>
          </div>
          {proTemplates.map((t) => <TemplateThumb key={t.id} template={t} locked={!hasAccess} />)}
        </div>
      </div>
    </div>
    </>
  )
}
