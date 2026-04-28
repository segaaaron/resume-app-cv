import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import type { TemplateProps } from "./types"

export default function TimelineTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div className="flex print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Left: timeline + contact */}
      <div className="w-[22%] shrink-0 flex flex-col items-center pt-8 pb-6 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 opacity-20" style={{ backgroundColor: colorScheme }} />

        {/* Avatar */}
        <div className="relative z-10 mb-4">
          {candidate.photo ? (
            <img src={candidate.photo} alt={candidate.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: colorScheme }}>
              {initials}
            </div>
          )}
        </div>

        {/* Contact vertical stack */}
        <div className="flex flex-col gap-2.5 items-start px-3 relative z-10">
          {candidate.email && (
            <div className="flex items-start gap-1.5">
              <Mail className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[7.5px] text-gray-500 break-all">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-start gap-1.5">
              <Phone className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[7.5px] text-gray-500">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[7.5px] text-gray-500">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-start gap-1.5">
              <Link2 className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[7.5px] text-gray-500 break-all">{candidate.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: content */}
      <div className="flex-1 px-7 py-8">
        {candidate.name && (
          <h1 className="text-[22px] font-bold text-gray-800 mb-0.5">{candidate.name}</h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[10px] font-medium mb-5" style={{ color: colorScheme }}>{candidate.jobTitle}</p>
        )}

        <p className="text-[10px] text-gray-400 mb-4 text-right">{today}</p>

        {/* Recipient — tinted box */}
        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4 px-3 py-2 rounded-md text-[10px]" style={{ backgroundColor: `${colorScheme}12` }}>
            {content.recipientName && <p className="font-semibold text-gray-700">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-gray-500">{content.recipientTitle}</p>}
            {content.company && <p className="text-gray-500">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-semibold mb-4" style={{ color: colorScheme }}>
            Asunto: <span className="font-normal text-gray-700">{content.subject}</span>
          </p>
        )}

        <p className="text-[11px] mb-3 text-gray-700">
          {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-200 italic mb-4">El cuerpo de la carta aparecerá aquí...</p>
        }

        {content.closing && <p className="text-[11px] mb-7 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && <p className="text-[11px] font-bold text-gray-800">{candidate.name}</p>}
          <div className="mt-1 h-0.5 w-16" style={{ backgroundColor: colorScheme }} />
        </div>
      </div>
    </div>
  )
}
