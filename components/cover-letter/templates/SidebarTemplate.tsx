import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import type { TemplateProps } from "./types"

export default function SidebarTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="flex" style={{ minHeight: "297mm", fontFamily: "Georgia, serif" }}>
      {/* Sidebar */}
      <div
        className="w-[58mm] shrink-0 px-6 pt-10 pb-8 flex flex-col gap-4"
        style={{ backgroundColor: colorScheme }}
      >
        {candidate.photo && (
          <img
            src={candidate.photo}
            alt={candidate.name}
            className="w-20 h-20 rounded-full object-cover border-[3px] border-white/30 mx-auto"
          />
        )}
        {candidate.name && (
          <p className="text-[13px] font-bold text-white text-center mt-3">{candidate.name}</p>
        )}
        {candidate.jobTitle && (
          <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] text-center">{candidate.jobTitle}</p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {candidate.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-2.5 w-2.5 text-white/75 shrink-0" />
              <span className="text-[9px] text-white/75 break-all">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-2.5 w-2.5 text-white/75 shrink-0" />
              <span className="text-[9px] text-white/75">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-2.5 w-2.5 text-white/75 shrink-0" />
              <span className="text-[9px] text-white/75">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center gap-1.5">
              <Link2 className="h-2.5 w-2.5 text-white/75 shrink-0" />
              <span className="text-[9px] text-white/75 break-all">{candidate.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-10 pt-10 pb-10">
        <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-6" style={{ color: colorScheme }}>
          Carta de Presentación
        </p>

        <p className="text-[10px] text-gray-500 mb-5">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-5">
            {content.recipientName && <p className="text-[11px] font-semibold">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
            {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
          </div>
        )}

        <p className="text-[11px] mb-5">
          {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-800 leading-[1.85] mb-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-300 italic mb-6">El cuerpo de la carta aparecerá aquí...</p>
        }

        {content.closing && <p className="text-[11px] mb-8">{content.closing},</p>}

        <div className="mt-10">
          <div className="h-px w-28" style={{ backgroundColor: colorScheme }} />
          {candidate.name && <p className="text-[11px] font-semibold mt-2">{candidate.name}</p>}
        </div>
      </div>
    </div>
  )
}
