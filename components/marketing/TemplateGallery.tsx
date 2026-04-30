import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

// ─── 1. Classic ──────────────────────────────────────────────────────────────
// Single-column, blue header, clean and formal
function ClassicPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="system-ui, sans-serif"
    >
      <rect width="200" height="280" fill="#ffffff" />
      {/* Header */}
      <rect width="200" height="52" fill="#2563EB" />
      <text x="100" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff" letterSpacing="0.5">
        Carlos Méndez
      </text>
      <text x="100" y="33" textAnchor="middle" fontSize="6.5" fill="#BFDBFE" letterSpacing="1">
        DIRECTOR DE OPERACIONES
      </text>
      <line x1="30" y1="39" x2="170" y2="39" stroke="#93C5FD" strokeWidth="0.5" />
      <text x="100" y="48" textAnchor="middle" fontSize="5.5" fill="#93C5FD">
        c.mendez@email.com  ·  +34 91 456 7890  ·  Madrid
      </text>
      {/* Accent bar */}
      <rect x="0" y="52" width="200" height="2" fill="#1D4ED8" />
      {/* Perfil */}
      <text x="12" y="64" fontSize="6.5" fontWeight="700" fill="#2563EB" letterSpacing="0.8">
        PERFIL
      </text>
      <rect x="12" y="67" width="176" height="2" rx="1" fill="#DBEAFE" />
      <rect x="12" y="71" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="75" width="152" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="79" width="164" height="2.5" rx="1" fill="#E5E7EB" />
      {/* Experiencia */}
      <text x="12" y="92" fontSize="6.5" fontWeight="700" fill="#2563EB" letterSpacing="0.8">
        EXPERIENCIA
      </text>
      <rect x="12" y="95" width="176" height="2" rx="1" fill="#DBEAFE" />
      <text x="12" y="105" fontSize="7" fontWeight="600" fill="#111827">
        Director de Ops · Inditex
      </text>
      <text x="168" y="105" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2020 – Hoy
      </text>
      <rect x="12" y="108" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="112" width="144" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="116" width="158" height="2.5" rx="1" fill="#E5E7EB" />
      <text x="12" y="127" fontSize="7" fontWeight="600" fill="#111827">
        Jefe de Proyecto · Mercadona
      </text>
      <text x="168" y="127" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2015 – 2020
      </text>
      <rect x="12" y="130" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="134" width="130" height="2.5" rx="1" fill="#E5E7EB" />
      <text x="12" y="145" fontSize="7" fontWeight="600" fill="#111827">
        Analista · Deloitte
      </text>
      <text x="168" y="145" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2012 – 2015
      </text>
      <rect x="12" y="148" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="152" width="148" height="2.5" rx="1" fill="#E5E7EB" />
      {/* Educación */}
      <text x="12" y="164" fontSize="6.5" fontWeight="700" fill="#2563EB" letterSpacing="0.8">
        EDUCACIÓN
      </text>
      <rect x="12" y="167" width="176" height="2" rx="1" fill="#DBEAFE" />
      <text x="12" y="177" fontSize="7" fontWeight="600" fill="#111827">
        MBA · IE Business School
      </text>
      <text x="168" y="177" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2012
      </text>
      <text x="12" y="186" fontSize="7" fontWeight="600" fill="#111827">
        Ing. Industrial · UPM
      </text>
      <text x="168" y="186" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2009
      </text>
      {/* Habilidades */}
      <text x="12" y="198" fontSize="6.5" fontWeight="700" fill="#2563EB" letterSpacing="0.8">
        HABILIDADES
      </text>
      <rect x="12" y="201" width="176" height="2" rx="1" fill="#DBEAFE" />
      <rect x="12" y="205" width="38" height="9" rx="4.5" fill="#EFF6FF" />
      <text x="31" y="211.5" textAnchor="middle" fontSize="5.5" fill="#2563EB" fontWeight="600">Lean Six Sigma</text>
      <rect x="54" y="205" width="30" height="9" rx="4.5" fill="#EFF6FF" />
      <text x="69" y="211.5" textAnchor="middle" fontSize="5.5" fill="#2563EB" fontWeight="600">SAP ERP</text>
      <rect x="88" y="205" width="28" height="9" rx="4.5" fill="#EFF6FF" />
      <text x="102" y="211.5" textAnchor="middle" fontSize="5.5" fill="#2563EB" fontWeight="600">Scrum</text>
      <rect x="120" y="205" width="36" height="9" rx="4.5" fill="#EFF6FF" />
      <text x="138" y="211.5" textAnchor="middle" fontSize="5.5" fill="#2563EB" fontWeight="600">Liderazgo</text>
      {/* Idiomas */}
      <text x="12" y="227" fontSize="6.5" fontWeight="700" fill="#2563EB" letterSpacing="0.8">
        IDIOMAS
      </text>
      <rect x="12" y="230" width="176" height="2" rx="1" fill="#DBEAFE" />
      <text x="12" y="242" fontSize="6" fill="#374151">
        Español{" · "}
        <tspan fill="#2563EB" fontWeight="600">Nativo</tspan>
        {"   Inglés · "}
        <tspan fill="#2563EB" fontWeight="600">C1</tspan>
        {"   Portugués · "}
        <tspan fill="#9CA3AF" fontWeight="600">B1</tspan>
      </text>
    </svg>
  )
}

// ─── 2. Modern ───────────────────────────────────────────────────────────────
// Dark header with photo circle, contemporary indigo feel
function ModernPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="system-ui, sans-serif"
    >
      <rect width="200" height="280" fill="#F9FAFB" />
      {/* Header dark */}
      <rect width="200" height="68" fill="#111827" />
      {/* Photo */}
      <circle cx="34" cy="34" r="22" fill="#374151" />
      <circle cx="34" cy="34" r="20" fill="#4B5563" />
      <text x="34" y="39" textAnchor="middle" fontSize="12" fill="#F9FAFB" fontWeight="700">
        LR
      </text>
      {/* Name + title */}
      <text x="62" y="24" fontSize="11" fontWeight="700" fill="#F9FAFB">
        Lucía Romero
      </text>
      <text x="62" y="35" fontSize="6.5" fill="#9CA3AF" letterSpacing="0.8">
        PRODUCT MANAGER
      </text>
      <text x="62" y="46" fontSize="5.5" fill="#6B7280">
        lucia.romero@pm.io
      </text>
      <text x="62" y="55" fontSize="5.5" fill="#6B7280">
        linkedin.com/in/luciaromero
      </text>
      {/* Accent bar */}
      <rect x="0" y="68" width="200" height="3" fill="#4F46E5" />
      {/* Summary lines */}
      <rect x="12" y="79" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="83" width="158" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="87" width="166" height="2.5" rx="1" fill="#E5E7EB" />
      {/* Experiencia */}
      <rect x="12" y="96" width="3" height="3" rx="1.5" fill="#4F46E5" />
      <text x="18" y="100" fontSize="6.5" fontWeight="700" fill="#111827" letterSpacing="0.6">
        EXPERIENCIA
      </text>
      <rect x="18" y="103" width="170" height="1" fill="#E5E7EB" />
      <text x="12" y="113" fontSize="7" fontWeight="600" fill="#111827">
        Head of Product · Factorial HR
      </text>
      <text x="168" y="113" textAnchor="end" fontSize="5.5" fill="#4F46E5">
        2021–Hoy
      </text>
      <rect x="12" y="116" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="120" width="140" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="124" width="152" height="2.5" rx="1" fill="#E5E7EB" />
      <text x="12" y="135" fontSize="7" fontWeight="600" fill="#111827">
        Senior PM · Glovo
      </text>
      <text x="168" y="135" textAnchor="end" fontSize="5.5" fill="#4F46E5">
        2018–2021
      </text>
      <rect x="12" y="138" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="142" width="128" height="2.5" rx="1" fill="#E5E7EB" />
      <text x="12" y="153" fontSize="7" fontWeight="600" fill="#111827">
        PM · Idealista
      </text>
      <text x="168" y="153" textAnchor="end" fontSize="5.5" fill="#4F46E5">
        2015–2018
      </text>
      <rect x="12" y="156" width="176" height="2.5" rx="1" fill="#E5E7EB" />
      <rect x="12" y="160" width="144" height="2.5" rx="1" fill="#E5E7EB" />
      {/* Habilidades */}
      <rect x="12" y="170" width="3" height="3" rx="1.5" fill="#4F46E5" />
      <text x="18" y="174" fontSize="6.5" fontWeight="700" fill="#111827" letterSpacing="0.6">
        HABILIDADES
      </text>
      <rect x="18" y="177" width="170" height="1" fill="#E5E7EB" />
      <rect x="12" y="181" width="34" height="9" rx="2" fill="#EEF2FF" />
      <text x="29" y="187.5" textAnchor="middle" fontSize="5.5" fill="#4F46E5" fontWeight="600">Roadmapping</text>
      <rect x="50" y="181" width="26" height="9" rx="2" fill="#EEF2FF" />
      <text x="63" y="187.5" textAnchor="middle" fontSize="5.5" fill="#4F46E5" fontWeight="600">OKRs</text>
      <rect x="80" y="181" width="30" height="9" rx="2" fill="#EEF2FF" />
      <text x="95" y="187.5" textAnchor="middle" fontSize="5.5" fill="#4F46E5" fontWeight="600">Analytics</text>
      <rect x="114" y="181" width="24" height="9" rx="2" fill="#EEF2FF" />
      <text x="126" y="187.5" textAnchor="middle" fontSize="5.5" fill="#4F46E5" fontWeight="600">Figma</text>
      <rect x="142" y="181" width="26" height="9" rx="2" fill="#EEF2FF" />
      <text x="155" y="187.5" textAnchor="middle" fontSize="5.5" fill="#4F46E5" fontWeight="600">Agile</text>
      {/* Educación */}
      <rect x="12" y="196" width="3" height="3" rx="1.5" fill="#4F46E5" />
      <text x="18" y="200" fontSize="6.5" fontWeight="700" fill="#111827" letterSpacing="0.6">
        EDUCACIÓN
      </text>
      <rect x="18" y="203" width="170" height="1" fill="#E5E7EB" />
      <text x="12" y="213" fontSize="7" fontWeight="600" fill="#111827">
        Máster en Dirección Digital · ESADE
      </text>
      <text x="168" y="213" textAnchor="end" fontSize="5.5" fill="#4F46E5">
        2015
      </text>
      <text x="12" y="222" fontSize="7" fontWeight="600" fill="#111827">
        ADE · Universidad Carlos III
      </text>
      <text x="168" y="222" textAnchor="end" fontSize="5.5" fill="#4F46E5">
        2013
      </text>
      {/* Idiomas */}
      <rect x="12" y="232" width="3" height="3" rx="1.5" fill="#4F46E5" />
      <text x="18" y="236" fontSize="6.5" fontWeight="700" fill="#111827" letterSpacing="0.6">
        IDIOMAS
      </text>
      <rect x="18" y="239" width="170" height="1" fill="#E5E7EB" />
      <text x="12" y="249" fontSize="6" fill="#374151">
        Español{" · "}
        <tspan fill="#4F46E5" fontWeight="600">Nativo</tspan>
        {"   Inglés · "}
        <tspan fill="#4F46E5" fontWeight="600">C2</tspan>
        {"   Alemán · "}
        <tspan fill="#9CA3AF" fontWeight="600">B2</tspan>
      </text>
    </svg>
  )
}

// ─── 3. Aurora ───────────────────────────────────────────────────────────────
// Gradient header purple→blue, elegant, Pro
function AuroraPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="system-ui, sans-serif"
    >
      <defs>
        <linearGradient id="auroraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="200" height="280" fill="#ffffff" />
      {/* Gradient header */}
      <rect width="200" height="72" fill="url(#auroraGrad)" />
      {/* Decorative circles */}
      <circle cx="172" cy="12" r="30" fill="#6D28D9" fillOpacity="0.3" />
      <circle cx="185" cy="60" r="18" fill="#1D4ED8" fillOpacity="0.25" />
      {/* Photo */}
      <circle cx="32" cy="36" r="22" fill="rgba(255,255,255,0.15)" />
      <circle cx="32" cy="36" r="20" fill="rgba(255,255,255,0.2)" />
      <text x="32" y="41" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="700">
        VN
      </text>
      {/* Name + title */}
      <text x="60" y="27" fontSize="11" fontWeight="700" fill="#ffffff">
        Valentina Núñez
      </text>
      <text x="60" y="38" fontSize="6.5" fill="#DDD6FE" letterSpacing="0.8">
        DISEÑADORA UX/UI
      </text>
      <text x="60" y="49" fontSize="5.5" fill="#C4B5FD">
        valentina@studio.com
      </text>
      <text x="60" y="58" fontSize="5.5" fill="#C4B5FD">
        Buenos Aires · behance.net/vnunez
      </text>
      {/* Body separator */}
      <rect x="0" y="72" width="200" height="2.5" fill="#7C3AED" fillOpacity="0.4" />
      {/* Summary */}
      <rect x="12" y="82" width="176" height="2.5" rx="1" fill="#EDE9FE" />
      <rect x="12" y="86" width="156" height="2.5" rx="1" fill="#EDE9FE" />
      <rect x="12" y="90" width="166" height="2.5" rx="1" fill="#EDE9FE" />
      {/* Separator rule */}
      <rect x="12" y="98" width="176" height="1.5" fill="url(#auroraGrad)" rx="0.75" />
      <text x="12" y="108" fontSize="6.5" fontWeight="700" fill="#7C3AED" letterSpacing="0.8">
        EXPERIENCIA
      </text>
      <text x="12" y="119" fontSize="7" fontWeight="600" fill="#111827">
        Lead Designer · Miro
      </text>
      <text x="168" y="119" textAnchor="end" fontSize="5.5" fill="#7C3AED">
        2022–Hoy
      </text>
      <rect x="12" y="122" width="176" height="2.5" rx="1" fill="#EDE9FE" />
      <rect x="12" y="126" width="138" height="2.5" rx="1" fill="#EDE9FE" />
      <rect x="12" y="130" width="150" height="2.5" rx="1" fill="#EDE9FE" />
      <text x="12" y="141" fontSize="7" fontWeight="600" fill="#111827">
        UX Designer · Mercado Libre
      </text>
      <text x="168" y="141" textAnchor="end" fontSize="5.5" fill="#7C3AED">
        2019–2022
      </text>
      <rect x="12" y="144" width="176" height="2.5" rx="1" fill="#EDE9FE" />
      <rect x="12" y="148" width="122" height="2.5" rx="1" fill="#EDE9FE" />
      {/* Herramientas */}
      <rect x="12" y="157" width="176" height="1.5" fill="url(#auroraGrad)" rx="0.75" />
      <text x="12" y="167" fontSize="6.5" fontWeight="700" fill="#7C3AED" letterSpacing="0.8">
        HERRAMIENTAS
      </text>
      <rect x="12" y="171" width="36" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="30" y="177.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">Figma</text>
      <rect x="52" y="171" width="40" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="72" y="177.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">Framer</text>
      <rect x="96" y="171" width="30" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="111" y="177.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">Sketch</text>
      <rect x="130" y="171" width="36" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="148" y="177.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">Protopie</text>
      <rect x="12" y="183" width="32" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="28" y="189.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">Maze</text>
      <rect x="48" y="183" width="44" height="9" rx="4.5" fill="#EDE9FE" />
      <text x="70" y="189.5" textAnchor="middle" fontSize="5.5" fill="#7C3AED" fontWeight="600">UserTesting</text>
      {/* Educación */}
      <rect x="12" y="197" width="176" height="1.5" fill="url(#auroraGrad)" rx="0.75" />
      <text x="12" y="207" fontSize="6.5" fontWeight="700" fill="#7C3AED" letterSpacing="0.8">
        EDUCACIÓN
      </text>
      <text x="12" y="217" fontSize="7" fontWeight="600" fill="#111827">
        Diseño de Interacción · UBA
      </text>
      <text x="168" y="217" textAnchor="end" fontSize="5.5" fill="#7C3AED">
        2018
      </text>
      <text x="12" y="226" fontSize="7" fontWeight="600" fill="#111827">
        Curso Avanzado UX · Google
      </text>
      <text x="168" y="226" textAnchor="end" fontSize="5.5" fill="#7C3AED">
        2020
      </text>
      {/* Idiomas */}
      <rect x="12" y="235" width="176" height="1.5" fill="url(#auroraGrad)" rx="0.75" />
      <text x="12" y="245" fontSize="6.5" fontWeight="700" fill="#7C3AED" letterSpacing="0.8">
        IDIOMAS
      </text>
      <text x="12" y="255" fontSize="6" fill="#374151">
        Español{" · "}
        <tspan fill="#7C3AED" fontWeight="600">Nativo</tspan>
        {"   Inglés · "}
        <tspan fill="#7C3AED" fontWeight="600">C1</tspan>
        {"   Italiano · "}
        <tspan fill="#9CA3AF" fontWeight="600">B1</tspan>
      </text>
    </svg>
  )
}

// ─── 4. Consul ───────────────────────────────────────────────────────────────
// Deep navy, formal corporate, centered header
function ConsulPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="Georgia, serif"
    >
      <rect width="200" height="280" fill="#F8F7F5" />
      {/* Header */}
      <rect width="200" height="58" fill="#1E3A5F" />
      <text x="100" y="22" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#ffffff" letterSpacing="1.5">
        ROBERTO CASTELLANO
      </text>
      <text x="100" y="33" textAnchor="middle" fontSize="6.5" fill="#93C5FD" letterSpacing="2.5">
        SOCIO · DERECHO MERCANTIL
      </text>
      <line x1="30" y1="40" x2="170" y2="40" stroke="#2563EB" strokeWidth="0.5" />
      <text x="100" y="50" textAnchor="middle" fontSize="5.5" fill="#BFDBFE">
        r.castellano@bufete.es  ·  +34 91 500 0001  ·  Madrid
      </text>
      {/* Accent bar */}
      <rect x="0" y="58" width="200" height="2" fill="#2563EB" />
      {/* Perfil */}
      <text x="100" y="71" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1E3A5F" letterSpacing="1.2">
        PERFIL PROFESIONAL
      </text>
      <line x1="12" y1="74" x2="188" y2="74" stroke="#1E3A5F" strokeWidth="0.4" />
      <rect x="12" y="78" width="176" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="83" width="158" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="88" width="168" height="2.5" rx="1" fill="#DDE3EC" />
      {/* Trayectoria */}
      <text x="100" y="101" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1E3A5F" letterSpacing="1.2">
        TRAYECTORIA PROFESIONAL
      </text>
      <line x1="12" y1="104" x2="188" y2="104" stroke="#1E3A5F" strokeWidth="0.4" />
      <text x="12" y="114" fontSize="7" fontWeight="600" fill="#111827">
        Socio · Baker McKenzie Madrid
      </text>
      <text x="168" y="114" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2019 – Presente
      </text>
      <rect x="12" y="117" width="176" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="121" width="148" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="125" width="160" height="2.5" rx="1" fill="#DDE3EC" />
      <text x="12" y="136" fontSize="7" fontWeight="600" fill="#111827">
        Of Counsel · Uría Menéndez
      </text>
      <text x="168" y="136" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2014 – 2019
      </text>
      <rect x="12" y="139" width="176" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="143" width="132" height="2.5" rx="1" fill="#DDE3EC" />
      <text x="12" y="154" fontSize="7" fontWeight="600" fill="#111827">
        Asociado · Clifford Chance
      </text>
      <text x="168" y="154" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2009 – 2014
      </text>
      <rect x="12" y="157" width="176" height="2.5" rx="1" fill="#DDE3EC" />
      <rect x="12" y="161" width="150" height="2.5" rx="1" fill="#DDE3EC" />
      {/* Formación */}
      <text x="100" y="174" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1E3A5F" letterSpacing="1.2">
        FORMACIÓN ACADÉMICA
      </text>
      <line x1="12" y1="177" x2="188" y2="177" stroke="#1E3A5F" strokeWidth="0.4" />
      <text x="12" y="187" fontSize="7" fontWeight="600" fill="#111827">
        LLM Corporate Law · NYU School of Law
      </text>
      <text x="168" y="187" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2009
      </text>
      <text x="12" y="196" fontSize="7" fontWeight="600" fill="#111827">
        Licenciado en Derecho · Comillas ICADE
      </text>
      <text x="168" y="196" textAnchor="end" fontSize="5.5" fill="#6B7280">
        2004–2009
      </text>
      {/* Áreas */}
      <text x="100" y="209" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1E3A5F" letterSpacing="1.2">
        ÁREAS DE ESPECIALIZACIÓN
      </text>
      <line x1="12" y1="212" x2="188" y2="212" stroke="#1E3A5F" strokeWidth="0.4" />
      <text x="12" y="222" fontSize="6" fill="#374151">
        M&amp;A · Private Equity · Derecho Concursal
      </text>
      <text x="12" y="231" fontSize="6" fill="#374151">
        Mercados de Capitales · Compliance · Fusiones
      </text>
      {/* Idiomas */}
      <text x="100" y="244" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1E3A5F" letterSpacing="1.2">
        IDIOMAS
      </text>
      <line x1="12" y1="247" x2="188" y2="247" stroke="#1E3A5F" strokeWidth="0.4" />
      <text x="12" y="258" fontSize="6" fill="#374151">
        Español (Nativo)  ·  Inglés (C2)  ·  Francés (C1)  ·  Italiano (B2)
      </text>
    </svg>
  )
}

// ─── 5. Minimal ──────────────────────────────────────────────────────────────
// White background, thin blue accent line, generous whitespace
function MinimalPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="system-ui, sans-serif"
    >
      <rect width="200" height="280" fill="#ffffff" />
      {/* Left accent bar */}
      <rect x="12" y="12" width="2.5" height="48" rx="1.25" fill="#2563EB" />
      {/* Name + title */}
      <text x="20" y="28" fontSize="13" fontWeight="300" fill="#111827" letterSpacing="0.5">
        Isabel Torres
      </text>
      <text x="20" y="40" fontSize="7" fill="#2563EB" letterSpacing="1.5">
        ARQUITECTA SENIOR
      </text>
      <text x="20" y="51" fontSize="5.5" fill="#9CA3AF">
        i.torres@arch.es  ·  Barcelona, España
      </text>
      <text x="20" y="59" fontSize="5.5" fill="#9CA3AF">
        +34 93 123 4567  ·  itarres.arch
      </text>
      {/* Rule */}
      <line x1="12" y1="68" x2="188" y2="68" stroke="#E5E7EB" strokeWidth="1" />
      {/* Summary */}
      <text x="12" y="79" fontSize="6" fill="#374151">
        Arquitecta con 10 años en proyectos residenciales y
      </text>
      <text x="12" y="87" fontSize="6" fill="#374151">
        comerciales. Especializada en diseño sostenible y BIM.
      </text>
      {/* Rule */}
      <line x1="12" y1="95" x2="188" y2="95" stroke="#E5E7EB" strokeWidth="1" />
      <text x="12" y="106" fontSize="6" fontWeight="700" fill="#2563EB" letterSpacing="2">
        EXPERIENCIA
      </text>
      <text x="12" y="118" fontSize="7" fontWeight="500" fill="#111827">
        Arquitecta Jefa de Proyecto
      </text>
      <text x="168" y="118" textAnchor="end" fontSize="5.5" fill="#9CA3AF">
        2019–Hoy
      </text>
      <text x="12" y="126" fontSize="6" fill="#6B7280">
        Foster + Partners  ·  Barcelona
      </text>
      <rect x="12" y="129" width="176" height="2" rx="1" fill="#F3F4F6" />
      <rect x="12" y="133" width="148" height="2" rx="1" fill="#F3F4F6" />
      <text x="12" y="145" fontSize="7" fontWeight="500" fill="#111827">
        Arquitecta de Proyecto
      </text>
      <text x="168" y="145" textAnchor="end" fontSize="5.5" fill="#9CA3AF">
        2015–2019
      </text>
      <text x="12" y="153" fontSize="6" fill="#6B7280">
        Zaha Hadid Architects  ·  Londres
      </text>
      <rect x="12" y="156" width="176" height="2" rx="1" fill="#F3F4F6" />
      <rect x="12" y="160" width="132" height="2" rx="1" fill="#F3F4F6" />
      {/* Rule */}
      <line x1="12" y1="168" x2="188" y2="168" stroke="#E5E7EB" strokeWidth="1" />
      <text x="12" y="179" fontSize="6" fontWeight="700" fill="#2563EB" letterSpacing="2">
        EDUCACIÓN
      </text>
      <text x="12" y="191" fontSize="7" fontWeight="500" fill="#111827">
        Máster Arquitectura · ETSAB
      </text>
      <text x="168" y="191" textAnchor="end" fontSize="5.5" fill="#9CA3AF">
        2015
      </text>
      <text x="12" y="201" fontSize="7" fontWeight="500" fill="#111827">
        Grado en Arquitectura · Politécnica Madrid
      </text>
      <text x="168" y="201" textAnchor="end" fontSize="5.5" fill="#9CA3AF">
        2013
      </text>
      {/* Rule */}
      <line x1="12" y1="209" x2="188" y2="209" stroke="#E5E7EB" strokeWidth="1" />
      <text x="12" y="220" fontSize="6" fontWeight="700" fill="#2563EB" letterSpacing="2">
        HABILIDADES
      </text>
      <text x="12" y="231" fontSize="6" fill="#374151">
        AutoCAD  ·  Revit  ·  BIM  ·  SketchUp  ·  Rhino
      </text>
      <text x="12" y="239" fontSize="6" fill="#374151">
        Diseño sostenible  ·  Gestión de obra  ·  LEED AP
      </text>
      {/* Rule */}
      <line x1="12" y1="247" x2="188" y2="247" stroke="#E5E7EB" strokeWidth="1" />
      <text x="12" y="258" fontSize="6" fontWeight="700" fill="#2563EB" letterSpacing="2">
        IDIOMAS
      </text>
      <text x="12" y="268" fontSize="6" fill="#374151">
        Español (Nativo)  ·  Inglés (C2)  ·  Catalán (Nativo)
      </text>
    </svg>
  )
}

// ─── 6. Nova ─────────────────────────────────────────────────────────────────
// Teal sidebar layout with skill bars
function NovaPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid meet"
      font-family="system-ui, sans-serif"
    >
      <rect width="200" height="280" fill="#ffffff" />
      {/* Sidebar */}
      <rect width="68" height="280" fill="#0F766E" />
      {/* Photo */}
      <circle cx="34" cy="36" r="22" fill="#0D9488" />
      <circle cx="34" cy="36" r="20" fill="#14B8A6" />
      <text x="34" y="41" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="700">
        DM
      </text>
      {/* Name in sidebar */}
      <text x="34" y="65" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
        Daniel
      </text>
      <text x="34" y="74" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
        Morales
      </text>
      <text x="34" y="84" textAnchor="middle" fontSize="5" fill="#99F6E4" letterSpacing="0.5">
        DATA SCIENTIST
      </text>
      <rect x="8" y="90" width="52" height="1" fill="#0D9488" />
      {/* Contact */}
      <text x="34" y="100" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#CCFBF1" letterSpacing="0.8">
        CONTACTO
      </text>
      <text x="10" y="110" fontSize="4.8" fill="#99F6E4">d.morales@data.io</text>
      <text x="10" y="118" fontSize="4.8" fill="#99F6E4">+52 55 9876 5432</text>
      <text x="10" y="126" fontSize="4.8" fill="#99F6E4">Ciudad de México</text>
      <text x="10" y="134" fontSize="4.8" fill="#99F6E4">github.com/dmorales</text>
      <rect x="8" y="140" width="52" height="1" fill="#0D9488" />
      {/* Skills */}
      <text x="34" y="150" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#CCFBF1" letterSpacing="0.8">
        SKILLS
      </text>
      <text x="10" y="161" fontSize="5" fill="#E6FFFA">Python</text>
      <rect x="10" y="163" width="48" height="2.5" rx="1.25" fill="#0D9488" />
      <rect x="10" y="163" width="44" height="2.5" rx="1.25" fill="#2DD4BF" />
      <text x="10" y="172" fontSize="5" fill="#E6FFFA">SQL</text>
      <rect x="10" y="174" width="48" height="2.5" rx="1.25" fill="#0D9488" />
      <rect x="10" y="174" width="40" height="2.5" rx="1.25" fill="#2DD4BF" />
      <text x="10" y="183" fontSize="5" fill="#E6FFFA">TensorFlow</text>
      <rect x="10" y="185" width="48" height="2.5" rx="1.25" fill="#0D9488" />
      <rect x="10" y="185" width="34" height="2.5" rx="1.25" fill="#2DD4BF" />
      <text x="10" y="194" fontSize="5" fill="#E6FFFA">Spark</text>
      <rect x="10" y="196" width="48" height="2.5" rx="1.25" fill="#0D9488" />
      <rect x="10" y="196" width="38" height="2.5" rx="1.25" fill="#2DD4BF" />
      <text x="10" y="205" fontSize="5" fill="#E6FFFA">Tableau</text>
      <rect x="10" y="207" width="48" height="2.5" rx="1.25" fill="#0D9488" />
      <rect x="10" y="207" width="30" height="2.5" rx="1.25" fill="#2DD4BF" />
      <rect x="8" y="215" width="52" height="1" fill="#0D9488" />
      {/* Idiomas sidebar */}
      <text x="34" y="225" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#CCFBF1" letterSpacing="0.8">
        IDIOMAS
      </text>
      <text x="10" y="235" fontSize="4.8" fill="#99F6E4">Español · Nativo</text>
      <text x="10" y="243" fontSize="4.8" fill="#99F6E4">Inglés · C1</text>
      <text x="10" y="251" fontSize="4.8" fill="#99F6E4">Francés · B1</text>
      {/* Main column */}
      <text x="78" y="18" fontSize="6.5" fontWeight="700" fill="#0F766E" letterSpacing="0.8">
        PERFIL
      </text>
      <rect x="78" y="21" width="110" height="1.5" fill="#0D9488" />
      <rect x="78" y="25" width="110" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="29" width="94" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="33" width="102" height="2.5" rx="1" fill="#F0FDFA" />
      {/* Experiencia */}
      <text x="78" y="46" fontSize="6.5" fontWeight="700" fill="#0F766E" letterSpacing="0.8">
        EXPERIENCIA
      </text>
      <rect x="78" y="49" width="110" height="1.5" fill="#0D9488" />
      <text x="78" y="59" fontSize="6.5" fontWeight="600" fill="#111827">
        Sr. Data Scientist · Spotify
      </text>
      <text x="183" y="59" textAnchor="end" fontSize="5" fill="#0F766E">
        2022–Hoy
      </text>
      <rect x="78" y="62" width="110" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="66" width="90" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="70" width="98" height="2.5" rx="1" fill="#F0FDFA" />
      <text x="78" y="81" fontSize="6.5" fontWeight="600" fill="#111827">
        Data Analyst · Nubank
      </text>
      <text x="183" y="81" textAnchor="end" fontSize="5" fill="#0F766E">
        2019–2022
      </text>
      <rect x="78" y="84" width="110" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="88" width="82" height="2.5" rx="1" fill="#F0FDFA" />
      <text x="78" y="99" fontSize="6.5" fontWeight="600" fill="#111827">
        Jr. Analyst · BBVA México
      </text>
      <text x="183" y="99" textAnchor="end" fontSize="5" fill="#0F766E">
        2017–2019
      </text>
      <rect x="78" y="102" width="110" height="2.5" rx="1" fill="#F0FDFA" />
      <rect x="78" y="106" width="88" height="2.5" rx="1" fill="#F0FDFA" />
      {/* Educación */}
      <text x="78" y="118" fontSize="6.5" fontWeight="700" fill="#0F766E" letterSpacing="0.8">
        EDUCACIÓN
      </text>
      <rect x="78" y="121" width="110" height="1.5" fill="#0D9488" />
      <text x="78" y="131" fontSize="6.5" fontWeight="600" fill="#111827">
        M.Sc. Data Science · ITAM
      </text>
      <text x="183" y="131" textAnchor="end" fontSize="5" fill="#0F766E">
        2017
      </text>
      <text x="78" y="140" fontSize="6.5" fontWeight="600" fill="#111827">
        Ing. en Sistemas · UNAM
      </text>
      <text x="183" y="140" textAnchor="end" fontSize="5" fill="#0F766E">
        2015
      </text>
      {/* Certificaciones */}
      <text x="78" y="152" fontSize="6.5" fontWeight="700" fill="#0F766E" letterSpacing="0.8">
        CERTIFICACIONES
      </text>
      <rect x="78" y="155" width="110" height="1.5" fill="#0D9488" />
      <rect x="78" y="159" width="110" height="11" rx="2" fill="#F0FDFA" />
      <rect x="81" y="162" width="3" height="5" rx="1" fill="#0F766E" />
      <text x="88" y="166.5" fontSize="5.5" fill="#374151">Google Professional Data Engineer · 2023</text>
      <rect x="78" y="173" width="110" height="11" rx="2" fill="#F0FDFA" />
      <rect x="81" y="176" width="3" height="5" rx="1" fill="#0F766E" />
      <text x="88" y="180.5" fontSize="5.5" fill="#374151">AWS Certified ML Specialty · 2022</text>
      <rect x="78" y="187" width="110" height="11" rx="2" fill="#F0FDFA" />
      <rect x="81" y="190" width="3" height="5" rx="1" fill="#0F766E" />
      <text x="88" y="194.5" fontSize="5.5" fill="#374151">Databricks Certified Associate · 2021</text>
    </svg>
  )
}

// ─── Static showcase data ─────────────────────────────────────────────────────

const SHOWCASE = [
  { id: "classic", name: "Clásico", Preview: ClassicPreview },
  { id: "modern", name: "Moderno", Preview: ModernPreview },
  { id: "aurora", name: "Aurora", Preview: AuroraPreview },
  { id: "consul", name: "Consul", Preview: ConsulPreview },
  { id: "minimal", name: "Minimal", Preview: MinimalPreview },
  { id: "nova", name: "Nova", Preview: NovaPreview },
]

export default async function TemplateGallery() {
  const t = await getTranslations("template_gallery")

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
        <p className="text-center text-muted-foreground mb-12">{t("subtitle")}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {SHOWCASE.map(({ id, name, Preview }) => (
            <Link key={id} href={`/templates#${id}`} className="group cursor-pointer">
              <div className="aspect-[3/4] rounded-xl border-2 border-border group-hover:border-primary/60 transition-all overflow-hidden shadow-sm">
                <Preview />
              </div>
              <p className="text-xs font-medium text-center mt-2 group-hover:text-primary transition-colors">
                {name}
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/templates">{t("see_all")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
