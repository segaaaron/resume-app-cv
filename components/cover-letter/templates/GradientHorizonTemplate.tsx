import { Mail, Phone, MapPin, Link2, Globe } from "lucide-react"
import type { TemplateProps } from "./types"

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function GradientHorizonTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const rgb = hexToRgb(colorScheme.startsWith("#") ? colorScheme : "#2a72d7")

  return (
    <div className="print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Gradient header */}
      <div
        className="px-10 py-8 rounded-b-3xl"
        style={{ background: `linear-gradient(135deg, ${colorScheme} 0%, rgba(${rgb},0.6) 100%)` }}
      >
        <div className="flex items-center gap-5">
          {candidate.photo && (
            <img src={candidate.photo} alt={candidate.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/50 shrink-0" />
          )}
          <div className="flex-1">
            {candidate.name && <h1 className="text-[24px] font-bold text-white leading-tight">{candidate.name}</h1>}
            {candidate.jobTitle && <p className="text-[10px] text-white/75 mt-0.5 tracking-wider uppercase">{candidate.jobTitle}</p>}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4 mt-5">
          {candidate.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.linkedin}</span>
            </div>
          )}
          {candidate.website && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-[20mm] pt-7 pb-10">
        <p className="text-[10px] text-gray-400 mb-5 text-right">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4 text-gray-600">
            {content.recipientName && <p className="text-[11px]">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[10px]">{content.recipientTitle}</p>}
            {content.company && <p className="text-[10px]">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] mb-4 text-gray-700">
            <span className="font-semibold">Asunto:</span> {content.subject}
          </p>
        )}

        <p className="text-[11px] mb-3 text-gray-700">
          {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-200 italic mb-4">El cuerpo de la carta aparecerá aquí...</p>
        }

        {content.closing && <p className="text-[11px] mb-8 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && (
            <p className="text-[13px] font-bold" style={{ color: colorScheme }}>{candidate.name}</p>
          )}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400 mt-0.5">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
