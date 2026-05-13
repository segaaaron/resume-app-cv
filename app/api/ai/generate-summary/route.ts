import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, handleError, requireProUser } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"

const schema = z.object({
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const proCheck = await requireProUser(authResult.userId)
  if (proCheck) return proCheck

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = await aiService.generateSummary(authResult.userId, parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
