import { notFound } from "next/navigation"
import { TEMPLATES } from "@/types/resume"
import TemplateThumbPrint from "@/components/templates-detail/TemplateThumbPrint"

// Public, chrome-less A4 render of a single template with mock data. The
// screenshot service captures this → /api/thumbnails/[id] caches it as WebP.
export const dynamic = "force-dynamic"

export default async function TemplateThumbPrintPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  if (!TEMPLATES.some((t) => t.id === templateId)) notFound()
  return <TemplateThumbPrint templateId={templateId} />
}
