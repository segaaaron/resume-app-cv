// Pro template thumbnails — batch C3 (Elite/Exec/Luxe/Tpl/Show)
// Lazy-loaded chunk split from thumbnails-pro-c.tsx
import React from "react"

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

export default function ProC3Thumb({ id, color }: { id: string; color: string }) {
  switch (id) {
    case "elite-atlas":     return <EliteAtlasThumb color={color} />
    case "exec-porcelain":  return <ExecPorcelainThumb color={color} />
    case "luxe-noir":       return <LuxeNoirThumb color={color} />
    case "elite-counsel":   return <EliteCounselThumb color={color} />
    case "elite-aura":      return <EliteAuraThumb color={color} />
    case "elite-pulse":     return <ElitePulseThumb color={color} />
    case "elite-cuvee":     return <EliteCuveeThumb color={color} />
    case "elite-cadence":   return <EliteCadenceThumb color={color} />
    case "elite-meridian":  return <EliteMeridianThumb color={color} />
    case "luxe-aurum":      return <LuxeAurumThumb color={color} />
    case "luxe-vellum":     return <LuxeVellumThumb color={color} />
    case "luxe-regent":     return <LuxeRegentThumb color={color} />
    case "luxe-apex":       return <LuxeApexThumb color={color} />
    case "exec-regency":    return <ExecRegencyThumb color={color} />
    case "exec-sovereign":  return <ExecSovereignThumb color={color} />
    case "exec-citadel":    return <ExecCitadelThumb color={color} />
    case "exec-dynasty":    return <ExecDynastyThumb color={color} />
    case "exec-oxblood":    return <ExecOxbloodThumb color={color} />
    case "exec-cobalt":     return <ExecCobaltThumb color={color} />
    case "exec-terra":      return <ExecTerraThumb color={color} />
    case "exec-nocturne":   return <ExecNocturneThumb color={color} />
    case "exec-platine":    return <ExecPlatineThumb color={color} />
    case "atelier":         return <TplAtelierThumb color={color} />
    case "bloom":           return <TplBloomThumb color={color} />
    case "velvet":          return <TplVelvetThumb color={color} />
    case "sahara":          return <TplSaharaThumb color={color} />
    case "pearl":           return <TplPearlThumb color={color} />
    case "editorial2":      return <TplGazetteThumb color={color} />
    case "confetti":        return <TplConfettiThumb color={color} />
    case "frame":           return <TplFrameThumb color={color} />
    case "show-cameo":      return <ShowCameoThumb color={color} />
    case "show-marquis":    return <ShowMarquisThumb color={color} />
    case "show-soiree":     return <ShowSoireeThumb color={color} />
    case "show-plume":      return <ShowPlumeThumb color={color} />
    case "chef":            return <TplChefThumb color={color} />
    case "teacher":         return <TplTeacherThumb color={color} />
    case "journalist":      return <TplJournalistThumb color={color} />
    case "communicator":    return <TplCommunicatorThumb color={color} />
    case "filmmaker":       return <TplFilmmakerThumb color={color} />
    case "photographer":    return <TplPhotographerThumb color={color} />
    case "architect":       return <TplArchitectThumb color={color} />
    case "doctor":          return <TplDoctorThumb color={color} />
    case "fashion":         return <TplFashionThumb color={color} />
    case "writer":          return <TplWriterThumb color={color} />
    default: return null
  }
}
