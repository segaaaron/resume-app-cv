import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, Building2 } from "lucide-react"
import type { TemplateProps } from "./types"

export default function ExecutiveBoldTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const contacts = [
    { icon: Mail, value: candidate.email },
    { icon: Phone, value: candidate.phone },
    { icon: MapPin, value: candidate.address },
    { icon: Linkedin, value: candidate.linkedin },
    { icon: Globe, value: candidate.website },
  ].filter((c) => c.value)

  return (
    <div className="print:min-h-[297mm]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Top accent bar */}
      <div className="h-2 w-full" style={{ backgroundColor: colorScheme }} />

      {/* Header */}
      <div className="px-[20mm] pt-8 pb-6 border-b border-gray-200">
        <div className="flex items-start gap-5">
          {candidate.photo && (
            <img src={candidate.photo} alt={candidate.name}
              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200" />
          )}
          <div className="flex-1">
            {candidate.name && (
              <h1 className="text-[36px] font-bold tracking-tight text-gray-900 leading-none">{candidate.name}</h1>
            )}
            {candidate.jobTitle && (
              <p className="text-[14px] font-medium mt-1.5" style={{ color: colorScheme }}>{candidate.jobTitle}</p>
            )}
          </div>
        </div>

        {/* Contact row with icons */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
            {contacts.map(({ icon: Icon, value }, i) => (
              <span key={i} className="flex items-center gap-1">
                <Icon className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                <span className="text-[9px] text-gray-500 tracking-wide">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-[20mm] pt-8 pb-10">
        <div className="flex items-center justify-end gap-1.5 mb-5">
          <Calendar className="h-3 w-3 text-gray-300" />
          <p className="text-[10px] text-gray-400 italic">{today}</p>
        </div>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-5">
            {content.recipientName && <p className="text-[12px] font-semibold text-gray-800">{content.recipientName}</p>}
            {content.recipientTitle && (
              <div className="flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5 text-gray-300" />
                <p className="text-[11px] text-gray-500">{content.recipientTitle}</p>
              </div>
            )}
            {content.company && <p className="text-[11px] text-gray-500 pl-3.5">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-bold mb-5 text-gray-800">
            RE: <span className="font-normal">{content.subject}</span>
          </p>
        )}

        <p className="text-[12px] mb-4 font-medium text-gray-700">
          {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
        </p>

        {content.body
          ? <div className="text-[11.5px] text-gray-700 leading-[1.7] mb-5 [&>p]:mb-4 [&>p]:text-justify [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11.5px] text-gray-200 italic mb-5">El cuerpo de la carta aparecerá aquí...</p>
        }

        {content.closing && <p className="text-[12px] mb-10 text-gray-700">{content.closing},</p>}

        <div className="flex justify-end">
          <div className="text-right">
            <div className="h-px w-36 mb-2 ml-auto" style={{ backgroundColor: colorScheme }} />
            {candidate.name && <p className="text-[12px] font-bold text-gray-800">{candidate.name}</p>}
            {candidate.jobTitle && <p className="text-[10px] text-gray-400">{candidate.jobTitle}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
