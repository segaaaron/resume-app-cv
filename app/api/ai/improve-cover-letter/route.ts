import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"

const schema = z.object({
  body: z.string().min(20).max(3000),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  recipientTitle: z.string().max(100).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = await aiService.improveCoverLetter(authResult.userId, parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
