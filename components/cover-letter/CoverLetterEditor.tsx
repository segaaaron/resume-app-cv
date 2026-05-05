"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { compressImage } from "@/lib/compressImage"
import { ArrowLeft, Save, Loader2, Check, Sparkles, Lock, ChevronDown, ChevronUp, Camera, X, Download, FileText, FileDown } from "lucide-react"
import DownloadMenu from "@/components/shared/DownloadMenu"
import { useTranslations } from "next-intl"
import UpgradeModal from "@/components/editor/UpgradeModal"
import SidebarTemplate from "./templates/SidebarTemplate"
import ElegantTemplate from "./templates/ElegantTemplate"
import SplitTemplate from "./templates/SplitTemplate"
import ExecutiveBoldTemplate from "./templates/ExecutiveBoldTemplate"
import MaterialCardTemplate from "./templates/MaterialCardTemplate"
import GradientHorizonTemplate from "./templates/GradientHorizonTemplate"
import MinimalLineTemplate from "./templates/MinimalLineTemplate"
import TwoToneTemplate from "./templates/TwoToneTemplate"
import TimelineTemplate from "./templates/TimelineTemplate"
import MonogramTemplate from "./templates/MonogramTemplate"
import ArchitectTemplate from "./templates/ArchitectTemplate"
import DiagonalTemplate from "./templates/DiagonalTemplate"
import NewspaperTemplate from "./templates/NewspaperTemplate"
import RichTextEditor from "./RichTextEditor"
import type { CandidateData, CoverLetterContent } from "./templates/types"

type TemplateId = "classic" | "sidebar" | "elegant" | "split" | "executive" | "material" | "gradient" | "minimal" | "twotone" | "timeline" | "monogram" | "architect" | "diagonal" | "newspaper"

interface Props {
  id: string
  title: string
  colorScheme: string
  fontFamily: string
  templateId: string
  content: CoverLetterContent
  initialCandidate: CandidateData
  isPro?: boolean
  language?: string
  isNew?: boolean
}

const TEMPLATES: { id: TemplateId; labelKey: string; pro?: boolean }[] = [
  { id: "elegant", labelKey: "template_elegant" },
  { id: "sidebar", labelKey: "template_sidebar", pro: true },
  { id: "split", labelKey: "template_split", pro: true },
  { id: "executive", labelKey: "template_executive", pro: true },
  { id: "material", labelKey: "template_material", pro: true },
  { id: "gradient", labelKey: "template_gradient", pro: true },
  { id: "twotone", labelKey: "template_twotone", pro: true },
  { id: "timeline", labelKey: "template_timeline", pro: true },
  { id: "minimal", labelKey: "template_minimal", pro: true },
  { id: "monogram", labelKey: "template_monogram", pro: true },
  { id: "architect", labelKey: "template_architect", pro: true },
  { id: "diagonal", labelKey: "template_diagonal", pro: true },
  { id: "newspaper", labelKey: "template_newspaper", pro: true },
]

// SVG thumbnails schematically representing each template
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
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="32" fill="url(#grad)" rx="0" />
      <rect x="0" y="22" width="80" height="10" fill="url(#grad)" />
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

function TemplateThumbnail({ id, color }: { id: TemplateId; color: string }) {
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

export default function CoverLetterEditor({
  id,
  title: initialTitle,
  colorScheme,
  templateId: initialTemplateId,
  content: initialContent,
  initialCandidate,
  isPro = false,
  language = "es",
  isNew = false,
}: Props) {
  const t = useTranslations("cover_letter_editor")
  const [title, setTitle] = useState(initialTitle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent] = useState<CoverLetterContent>(initialContent)
  const [candidate, setCandidate] = useState<CandidateData>(initialCandidate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(
    (initialTemplateId as TemplateId) === "classic" ? "elegant" : (initialTemplateId as TemplateId) ?? "elegant"
  )
  const [candidateOpen, setCandidateOpen] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [photoPosition, setPhotoPosition] = useState<number>(
    typeof initialCandidate.photoPosition === "number" ? initialCandidate.photoPosition : 50
  )
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      updateCandidate("photo", compressed)
    } catch {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        updateCandidate("photo", result)
      }
      reader.readAsDataURL(file)
    }
  }

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [aiTone, setAiTone] = useState<"formal" | "balanced" | "creative">("balanced")


  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })))
      })
      .catch(() => {})
  }, [])

  const dirtyRef = useRef(dirty)
  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  async function handleGenerateAI() {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          recipientName: content.recipientName,
          recipientTitle: content.recipientTitle,
          company: content.company,
          jobTitle: title,
          tone: aiTone,
          language,
          userPrompt: content.body
            ? content.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
            : undefined,
        }),
      })
      if (res.status === 429) { toast.error(t("ai_rate_limit")); return }
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("ai_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateContent("body", data.body)
      toast.success(t("ai_success"))
    } catch {
      toast.error(t("ai_error"))
    } finally {
      setGenerating(false)
    }
  }

function updateContent(field: keyof CoverLetterContent, value: string) {
    setContent((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  function updateCandidate(field: keyof CandidateData, value: string) {
    setCandidate((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  function selectTemplate(tpl: TemplateId) {
    setActiveTemplate(tpl)
    setDirty(true)
    setSaved(false)
  }

  // Build full content payload including candidate fields
  function buildContentPayload(): Record<string, unknown> {
    return {
      ...content,
      candidateName: candidate.name,
      candidateJobTitle: candidate.jobTitle,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      candidateAddress: candidate.address,
      candidatePhoto: candidate.photo,
      candidatePhotoPosition: photoPosition,
      candidateLinkedin: candidate.linkedin,
      candidateWebsite: candidate.website,
    }
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: buildContentPayload(), templateId: activeTemplate }),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        toast.success(t("save_success"))
      } else if (res.status === 404 || res.status === 403) {
        // Cover letter deleted or no longer accessible — stop silently
        setDirty(false)
      } else {
        toast.error(t("save_error"))
      }
    } catch {
      toast.error(t("save_error"))
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title, content, candidate, activeTemplate, photoPosition])

  const templateRef = useRef<HTMLDivElement>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const downloadPDF = useCallback(async () => {
    setDownloadingPdf(true)
    try {
      if (dirty) await save()
      const res = await fetch(`/api/cover-letters/${id}/pdf?locale=${language}`)
      if (!res.ok) { toast.error(t("pdf_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, "_") || "carta"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("pdf_error"))
    } finally {
      setDownloadingPdf(false)
    }
  }, [id, title, language, dirty, save])

  const downloadWord = useCallback(async () => {
    setDownloadingWord(true)
    try {
      const res = await fetch(`/api/export/cover-letter-docx?id=${id}`)
      if (!res.ok) { toast.error(t("word_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, "_") || "carta"}.docx`
      a.click()
    } catch {
      toast.error(t("word_download_error"))
    } finally {
      setDownloadingWord(false)
    }
  }, [id, title])

  const toneOptions = [
    ["formal", t("ai_tone_formal")],
    ["balanced", t("ai_tone_balanced")],
    ["creative", t("ai_tone_creative")],
  ] as const

  const templateLabels: Record<TemplateId, string> = {
    classic: t("template_elegant"),
    elegant: t("template_elegant"),
    sidebar: t("template_sidebar"),
    split: t("template_split"),
    executive: t("template_executive"),
    material: t("template_material"),
    gradient: t("template_gradient"),
    twotone: t("template_twotone"),
    timeline: t("template_timeline"),
    minimal: t("template_minimal"),
    monogram: t("template_monogram"),
    architect: t("template_architect"),
    diagonal: t("template_diagonal"),
    newspaper: t("template_newspaper"),
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/dashboard/cover-letters">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="h-7 text-sm font-medium max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium truncate hover:text-primary transition-colors max-w-[200px]"
            >
              {title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t("saving")}</span>
            ) : saved ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> {t("saved")}</span>
            ) : dirty ? t("unsaved") : null}
          </span>
          <Button variant="outline" size="sm" onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {t("save")}
          </Button>
          <DownloadMenu
            filename={`${(title.replace(/[^a-z0-9]/gi, "_") || "carta")}`}
            triggerLabel={t("download")}
            generatingPdfLabel={t("download_generating_pdf")}
            generatingWordLabel={t("download_generating_word")}
            successLabel={(f) => t("download_success", { filename: f })}
            phaseLabels={{
              preparing: t("download_preparing"),
              applyingStyles: t("download_applying_styles"),
              almostDone: t("download_almost_done"),
            }}
            options={[
              {
                format: "pdf",
                label: "PDF",
                sublabel: t("export_with_design"),
                isLoading: downloadingPdf,
                onDownload: downloadPDF,
              },
              {
                format: "docx",
                label: t("word_label"),
                sublabel: t("export_plain"),
                isLoading: downloadingWord,
                onDownload: downloadWord,
              },
            ]}
          />

        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-5 space-y-4">

          {/* Template selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">{t("template_label")}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {TEMPLATES.map((tpl) => {
                const locked = tpl.pro && !isPro
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => locked ? setUpgradeOpen(true) : selectTemplate(tpl.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition-all ${
                      activeTemplate === tpl.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-full aspect-[0.73] rounded overflow-hidden bg-gray-50 relative">
                      <TemplateThumbnail id={tpl.id} color={colorScheme} />
                      {locked && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-center leading-tight text-muted-foreground font-medium truncate w-full">
                      {templateLabels[tpl.id]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Candidate data section */}
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setCandidateOpen((v) => !v)}
            >
              <span className="text-xs font-semibold">{t("candidate_section")}</span>
              {candidateOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {candidateOpen && (
              <div className="space-y-2.5 pt-1">
                {/* Photo upload */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">{t("candidate_photo")}</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {candidate.photo ? (
                        <img
                          src={candidate.photo}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ objectPosition: `center ${photoPosition}%` }}
                        />
                      ) : candidate.name ? (
                        <span className="text-lg font-bold text-muted-foreground select-none">
                          {candidate.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}
                        </span>
                      ) : (
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {candidate.photo ? t("candidate_photo_change") : t("candidate_photo_add")}
                      </button>
                      {candidate.photo && (
                        <button
                          type="button"
                          onClick={() => { updateCandidate("photo", ""); if (photoInputRef.current) photoInputRef.current.value = "" }}
                          className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> {t("candidate_photo_remove")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Position slider — only when photo is loaded */}
                  {candidate.photo && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {t("candidate_photo_position")}
                        </Label>
                        <span className="text-[10px] font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-md">
                          {photoPosition}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={photoPosition}
                        onValueChange={(v) => {
                          const val = Array.isArray(v) ? v[0] : v
                          setPhotoPosition(val)
                          setDirty(true)
                          setSaved(false)
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>{t("candidate_photo_top")}</span>
                        <span>{t("candidate_photo_bottom")}</span>
                      </div>
                    </div>
                  )}

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {(
                  [
                    ["name", "candidate_name", "text"],
                    ["jobTitle", "candidate_job_title", "text"],
                    ["email", "candidate_email", "email"],
                    ["phone", "candidate_phone", "tel"],
                    ["address", "candidate_address", "text"],
                    ["linkedin", "candidate_linkedin", "url"],
                    ["website", "candidate_website", "url"],
                  ] as [keyof CandidateData, keyof typeof t extends string ? string : string, string][]
                ).map(([field, labelKey, inputType]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t(labelKey as Parameters<typeof t>[0])}</Label>
                    <Input
                      type={inputType}
                      value={candidate[field]}
                      onChange={(e) => updateCandidate(field, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <h2 className="font-semibold text-sm">{t("content_section")}</h2>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("recipient_label")}</Label>
            <Input
              placeholder={t("recipient_placeholder")}
              value={content.recipientName}
              onChange={(e) => updateContent("recipientName", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("recipient_title_label")}</Label>
            <Input
              placeholder={t("recipient_title_placeholder")}
              value={content.recipientTitle}
              onChange={(e) => updateContent("recipientTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("company_label")}</Label>
            <Input
              placeholder={t("company_placeholder")}
              value={content.company}
              onChange={(e) => updateContent("company", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("subject_label")}</Label>
            <Input
              placeholder={t("subject_placeholder")}
              value={content.subject ?? ""}
              onChange={(e) => updateContent("subject", e.target.value)}
            />
          </div>

          <Separator />

          {/* Body + AI unified */}
          <div className="space-y-2">
            <Label className="text-xs">{t("body_label")}</Label>

            {isPro ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2.5">
                {resumes.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("ai_resume_label")}</Label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5"
                    >
                      <option value="">{t("ai_resume_none")}</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("ai_tone_label")}</Label>
                  <div className="flex gap-1.5">
                    {toneOptions.map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAiTone(v)}
                        className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                          aiTone === v
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-muted-foreground border-input hover:border-indigo-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 flex flex-col items-center gap-2 text-center">
                <Lock className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">{t("pro_upgrade_title")}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t("pro_upgrade_desc")}</p>
                <Button size="sm" className="gap-1.5 mt-1" onClick={() => setUpgradeOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> {t("pro_upgrade_cta")}
                </Button>
              </div>
            )}

            <RichTextEditor
              value={content.body}
              onChange={(html) => updateContent("body", html)}
              placeholder={t("body_placeholder")}
            />

            {isPro && (
              <Button
                size="sm"
                className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleGenerateAI}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? t("ai_generating") : t("ai_generate")}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("closing_label")}</Label>
            <Input
              placeholder={t("closing_placeholder")}
              value={content.closing}
              onChange={(e) => updateContent("closing", e.target.value)}
            />
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex-1 overflow-auto bg-[#e8e8e8] flex justify-center items-start py-8 px-4 print:py-0 print:bg-white print:px-0">
          <div
            ref={templateRef}
            className="bg-white shadow-2xl print:shadow-none overflow-hidden print:min-h-[297mm] shrink-0"
            style={{ width: "210mm", minHeight: "297mm" }}
          >
            {(() => {
              const candidateWithPosition = { ...candidate, photoPosition }
              return <>
                {(activeTemplate === "elegant" || activeTemplate === "classic") && <ElegantTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "sidebar" && <SidebarTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "split" && <SplitTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "executive" && <ExecutiveBoldTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "material" && <MaterialCardTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "gradient" && <GradientHorizonTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "twotone" && <TwoToneTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "timeline" && <TimelineTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "minimal" && <MinimalLineTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "monogram" && <MonogramTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "architect" && <ArchitectTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "diagonal" && <DiagonalTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
                {activeTemplate === "newspaper" && <NewspaperTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />}
              </>
            })()}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          header, .w-80 { display: none !important; }
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          svg { overflow: visible !important; }
        }
      `}</style>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
