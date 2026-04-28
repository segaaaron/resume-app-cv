import type { TemplateProps } from "./types"

export default function ExecutiveBoldTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const contactParts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div className="print:min-h-[297mm]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Top accent bar */}
      <div className="h-2 w-full" style={{ backgroundColor: colorScheme }} />

      {/* Header */}
      <div className="px-[20mm] pt-8 pb-6 border-b border-gray-200">
        {candidate.name && (
          <h1 className="text-[36px] font-bold tracking-tight text-gray-900 leading-none">{candidate.name}</h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[14px] font-medium mt-1.5" style={{ color: colorScheme }}>{candidate.jobTitle}</p>
        )}
        {contactParts.length > 0 && (
          <p className="text-[9px] text-gray-400 mt-3 tracking-wide">{contactParts.join("  ·  ")}</p>
        )}
      </div>

      {/* Body */}
      <div className="px-[20mm] pt-8 pb-10">
        <p className="text-[10px] text-gray-400 mb-5 text-right italic">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-5">
            {content.recipientName && <p className="text-[12px] font-semibold text-gray-800">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[11px] text-gray-500">{content.recipientTitle}</p>}
            {content.company && <p className="text-[11px] text-gray-500">{content.company}</p>}
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
