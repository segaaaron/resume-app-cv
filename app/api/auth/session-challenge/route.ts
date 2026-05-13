import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { sessionChallengeService, handleError } from "@/lib/controllers/auth-deps"

const bodySchema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  try {
    const result = await sessionChallengeService.issueChallenge(parsed.data.email)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
