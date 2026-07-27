import { NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { passwordResetService, handleError } from "@/lib/controllers/auth-deps"
import { localeFromRequest } from "@/lib/locale"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ip   = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_email" }, { status: 400 })

  try {
    const result = await passwordResetService.requestReset(ip, parsed.data.email, localeFromRequest(req))
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
