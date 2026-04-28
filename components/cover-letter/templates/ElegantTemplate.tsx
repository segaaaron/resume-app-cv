import type { TemplateProps } from "./types"

export default function ElegantTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const contactParts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin, candidate.website].filter(Boolean)

  return (
    <div className="px-[18mm] pt-[14mm] pb-[12mm]" style={{ minHeight: "297mm", fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div className="text-center mb-2">
        {candidate.name && (
          <h1 className="font-light tracking-[0.15em] uppercase text-[28px]" style={{ color: colorScheme }}>
            {candidate.name}
          </h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[11px] tracking-[0.1em] uppercase text-gray-500 mt-1">{candidate.jobTitle}</p>
        )}
        {contactParts.length > 0 && (
          <p className="text-[9px] text-gray-400 mt-2">{contactParts.join("  ·  ")}</p>
        )}
      </div>

      {/* Decorative separator */}
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
        <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: colorScheme }} />
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
      </div>

      <p className="text-[10px] text-gray-500 mb-5 text-center">{today}</p>

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
        ? <div className="text-[11px] text-gray-800 leading-[1.9] mb-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
        : <p className="text-[11px] text-gray-300 italic mb-6">El cuerpo de la carta aparecerá aquí...</p>
      }

      {content.closing && <p className="text-[11px] mb-8">{content.closing},</p>}

      <div className="mt-10">
        <div className="h-px w-28" style={{ backgroundColor: colorScheme }} />
        {candidate.name && <p className="text-[11px] font-semibold mt-2">{candidate.name}</p>}
      </div>
    </div>
  )
}
