import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { DEFAULT_SECTIONS } from "@/types/resume"
import { nanoid } from "nanoid"
import { resend, emailEnabled } from "@/lib/resend"
import { verifyEmailHtml, verifyEmailText } from "@/lib/emails/verifyEmail"
import { checkOrigin } from "@/lib/csrf"

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

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

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      // Generic message to prevent email enumeration
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Resolve referrer if a valid code was provided
    let referrerId: string | undefined
    if (referralCode) {
      const referrer = await db.user.findUnique({
        where: { referralCode },
        select: { id: true },
      })
      if (referrer) referrerId = referrer.id
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        marketingConsent: marketingConsent ?? false,
        ageVerified: ageConsent === true,
        referralCode: nanoid(8),
        ...(referrerId ? { referredBy: referrerId } : {}),
      },
    })

    // Generate email verification token (24h expiry)
    const verifyToken = randomBytes(32).toString("hex")
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: verifyToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    if (emailEnabled() && resend) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://readycvv.com"
      const verifyUrl = `${appUrl}/es/verify-email?token=${verifyToken}`
      await resend.emails.send({
        from: "READY CV <no-reply@readycvv.com>",
        to: email,
        subject: "Verifica tu email en READY CV",
        html: verifyEmailHtml({ userName: user.name ?? name, verifyUrl }),
        text: verifyEmailText({ userName: user.name ?? name, verifyUrl }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
