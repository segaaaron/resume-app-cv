import { NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { registrationService, handleError } from "@/lib/controllers/auth-deps"
import { AppError } from "@/lib/services/auth/AppError"
import { localeFromRequest } from "@/lib/locale"

const schema = z.object({
  email: z.string().email(),
  code:  z.string().length(6).regex(/^\d{6}$/),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  try {
    const result = await registrationService.confirmOtp({ ...parsed.data, locale: localeFromRequest(req) })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AppError && err.code === "invalid" && err.extra?.attemptsLeft !== undefined) {
      return NextResponse.json({ error: "invalid", attemptsLeft: err.extra.attemptsLeft }, { status: 400 })
    }
    return handleError(err)
  }
}
