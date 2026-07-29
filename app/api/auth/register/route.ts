import { NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { registrationService, handleError } from "@/lib/controllers/auth-deps"
import { localeFromRequest } from "@/lib/locale"

const schema = z.object({
  name:             z.string().min(2).max(255),
  email:            z.string().email(),
  password:         z.string().min(8).max(128)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  marketingConsent: z.boolean().optional(),
  ageConsent:       z.boolean().refine((v) => v === true, { message: "Debes confirmar que tienes 16 años o más" }),
  referralCode:     z.string().max(20).optional(),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  try {
    const result = await registrationService.requestOtp({ ...parsed.data, ageConsent: parsed.data.ageConsent as true, ipAddress: ip, locale: localeFromRequest(req) })
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
