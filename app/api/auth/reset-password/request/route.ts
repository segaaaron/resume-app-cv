import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { passwordResetService, handleError } from "@/lib/controllers/auth-deps"
import { localeFromRequest } from "@/lib/locale"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const ip   = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError(400, "invalid_email", { req })

  try {
    const result = await passwordResetService.requestReset(ip, parsed.data.email, localeFromRequest(req))
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
