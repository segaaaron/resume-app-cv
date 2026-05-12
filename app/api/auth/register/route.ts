import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { registrationOtpHtml, registrationOtpText } from "@/lib/emails/registrationOtp"
import { checkOrigin } from "@/lib/csrf"

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
setInterval(() => { const now = Date.now(); attempts.forEach((v, k) => { if (now > v.resetAt) attempts.delete(k) }) }, 10 * 60 * 1000)

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

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
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { name, email, password, marketingConsent, ageConsent, referralCode } = schema.parse(body)

    // Anti-enumeration: return pending:true even if email already registered
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ pending: true })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Generate 6-digit OTP using cryptographically secure source
    const otpInt = crypto.getRandomValues(new Uint32Array(1))[0]
    const code = String((otpInt % 900000) + 100000)
    const otpHash = await bcrypt.hash(code, 10)
    const otpExp = new Date(Date.now() + 10 * 60 * 1000)

    // Upsert: reset OTP and attempts if email was already pending
    await db.pendingRegistration.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        marketingConsent: marketingConsent ?? false,
        ageConsent,
        referralCode: referralCode ?? null,
        otpHash,
        otpExp,
      },
      update: {
        name,
        passwordHash,
        marketingConsent: marketingConsent ?? false,
        ageConsent,
        referralCode: referralCode ?? null,
        otpHash,
        otpExp,
        attempts: 0,
      },
    })

    if (emailEnabled() && resend) {
      await resend.emails.send({
        from: "READY CV <no-reply@readycvv.com>",
        to: email,
        subject: "Tu código de verificación — READY CV",
        html: registrationOtpHtml({ userName: name, code }),
        text: registrationOtpText({ userName: name, code }),
      }).catch(() => {})
    }

    return NextResponse.json({ pending: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
