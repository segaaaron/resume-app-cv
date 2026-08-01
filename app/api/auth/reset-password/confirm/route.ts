import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { passwordResetService, handleError } from "@/lib/controllers/auth-deps"
import { AppError } from "@/lib/services/auth/AppError"

const schema = z.object({
  email:    z.string().email(),
  code:     z.string().length(6).regex(/^\d{6}$/),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError(400, "invalid_input", { req })

  try {
    const result = await passwordResetService.confirmReset(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AppError && err.code === "invalid_code" && err.extra?.attemptsLeft !== undefined) {
      return apiError(400, "invalid_code", { req, extra: { attemptsLeft: err.extra.attemptsLeft } })
    }
    return handleError(err, { req })
  }
}
