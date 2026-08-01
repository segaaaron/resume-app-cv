import { apiError } from "@/lib/controllers/shared"

// Stub: PDF export is handled by /api/resumes/[id]/pdf
export async function POST(req: Request) {
  return apiError(501, "Use /resume/[id]/pdf for PDF export", { req })
}
