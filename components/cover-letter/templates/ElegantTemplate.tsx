import type { TemplateProps } from "./types"

export default function ElegantTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const contactParts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin, candidate.website].filter(Boolean)

  return (
    <div className="px-[25mm] pt-[14mm] pb-[14mm] print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-2">
        {candidate.name && (
          <h1 className="font-light tracking-[0.15em] uppercase text-[26px]" style={{ color: colorScheme }}>
            {candidate.name}
          </h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[10px] tracking-[0.1em] uppercase text-gray-500 mt-0.5">{candidate.jobTitle}</p>
        )}
        {contactParts.length > 0 && (
          <p className="text-[9px] text-gray-400 mt-1.5">{contactParts.join("  ·  ")}</p>
        )}
      </div>

      {/* Decorative separator */}
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
        <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: colorScheme }} />
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
      </div>

      {/* Date right-aligned */}
      <p className="text-[10px] text-gray-500 mb-4 text-right">{today}</p>

      {/* Recipient block */}
      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-4">
          {content.recipientName && <p className="text-[11px] font-semibold">{content.recipientName}</p>}
          {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
          {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
        </div>
      )}

      {/* Subject */}
      {content.subject && (
        <p className="text-[11px] font-semibold mb-4">
          <span className="text-gray-500 font-normal">Asunto: </span>{content.subject}
        </p>
      )}

      {/* Salutation */}
      <p className="text-[11px] mb-3">
        {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
      </p>

      {/* Body */}
      {content.body
        ? <div className="text-[11px] text-gray-800 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-6 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
        : <p className="text-[11px] text-gray-300 italic mb-4">El cuerpo de la carta aparecerá aquí...</p>
      }

      {/* Closing */}
      {content.closing && <p className="text-[11px] mb-8">{content.closing},</p>}

      <div className="mt-2">
        <div className="h-px w-28" style={{ backgroundColor: colorScheme }} />
        {candidate.name && <p className="text-[11px] font-semibold mt-1.5">{candidate.name}</p>}
        {candidate.jobTitle && <p className="text-[10px] text-gray-500">{candidate.jobTitle}</p>}
      </div>
    </div>
  )
}
