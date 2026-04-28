import type { TemplateProps } from "./types"

export default function MonogramTemplate({ content, candidate, colorScheme }: TemplateProps) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"
  const contactParts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div className="px-[20mm] pt-[14mm] pb-[14mm] print:min-h-[297mm]"
      style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Header row: Monogram stamp + name */}
      <div className="flex items-center gap-5 mb-2">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm"
          style={{ backgroundColor: colorScheme }}
        >
          {initials}
        </div>
        <div>
          {candidate.name && <h1 className="text-[22px] font-bold text-gray-800 leading-tight">{candidate.name}</h1>}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400 mt-0.5">{candidate.jobTitle}</p>}
        </div>
      </div>

      {/* Contact line */}
      {contactParts.length > 0 && (
        <p className="text-[9px] text-gray-400 mb-1">{contactParts.join("  ·  ")}</p>
      )}

      {/* Separator */}
      <div className="h-px bg-gray-200 my-4" />

      <p className="text-[10px] text-gray-400 mb-5 text-right">{today}</p>

      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-4">
          {content.recipientName && <p className="text-[11px] font-semibold text-gray-800">{content.recipientName}</p>}
          {content.recipientTitle && <p className="text-[11px] text-gray-500">{content.recipientTitle}</p>}
          {content.company && <p className="text-[11px] text-gray-500">{content.company}</p>}
        </div>
      )}

      {content.subject && (
        <p className="text-[11px] font-semibold mb-4 text-gray-700">
          Asunto: <span className="font-normal">{content.subject}</span>
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

      {/* Signature + corner bracket decoration */}
      <div className="flex justify-between items-end">
        <div>
          {candidate.name && <p className="text-[11px] font-semibold text-gray-800">{candidate.name}</p>}
          <div className="mt-1 h-0.5 w-24" style={{ backgroundColor: colorScheme }} />
        </div>
        {/* Decorative corner bracket */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0 L24 8 M24 24 L16 24" stroke={colorScheme} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
