import type { TemplateProps } from "./types"

export default function SplitTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="flex flex-col print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Full-width header */}
      <div className="w-full flex items-center gap-5 px-10 py-5" style={{ backgroundColor: colorScheme }}>
        {candidate.photo && (
          <img
            src={candidate.photo}
            alt={candidate.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          {candidate.name && (
            <p className="text-[17px] font-bold text-white">{candidate.name}</p>
          )}
          {candidate.jobTitle && (
            <p className="text-[10px] text-white/70 mt-0.5">{candidate.jobTitle}</p>
          )}
        </div>
        <div className="ml-auto text-right text-[9px] text-white/80 space-y-0.5 shrink-0">
          {candidate.email && <p>{candidate.email}</p>}
          {candidate.phone && <p>{candidate.phone}</p>}
          {candidate.address && <p>{candidate.address}</p>}
          {candidate.linkedin && <p>{candidate.linkedin}</p>}
        </div>
      </div>

      {/* Body — 2.5cm margins */}
      <div className="px-[25mm] py-[14mm]">
        <p className="text-[10px] text-gray-500 mb-3">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-3">
            {content.recipientName && <p className="text-[11px] font-semibold">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
            {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
          </div>
        )}

        <p className="text-[11px] mb-4">
          {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-800 leading-[1.6] mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-300 italic mb-4">El cuerpo de la carta aparecerá aquí...</p>
        }

        {content.closing && <p className="text-[11px] mb-5">{content.closing},</p>}

        <div className="mt-6">
          <div className="h-px w-24" style={{ backgroundColor: colorScheme }} />
          {candidate.name && <p className="text-[11px] font-semibold mt-1.5">{candidate.name}</p>}
        </div>
      </div>
    </div>
  )
}
