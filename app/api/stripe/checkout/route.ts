export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { stripeCheckoutService } from "@/lib/controllers/stripe-deps"
import { isEUUser, getClientIp } from "@/lib/geoip"
import { db } from "@/lib/db"
import { createHash } from "crypto"

// Bump this version whenever the consent text wording changes
const CONSENT_VERSION = "v1_2026"

const schema = z.object({
  plan:         z.enum(["monthly", "annual", "basic", "sprint"]),
  locale:       z.enum(["es", "en"]).optional(),
  consent:      z.literal(true).optional(),
  consentText:  z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const userPlan = await db.user.findUnique({ where: { id: authResult.userId }, select: { plan: true } })
  if (userPlan?.plan === "LIMITED") return NextResponse.json({ error: "Not available", code: "LIMITED_NO_CHECKOUT" }, { status: 403 })

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  const [isEU, ip] = await Promise.all([isEUUser(), getClientIp()])
  if (isEU && !parsed.data.consent) {
    return NextResponse.json({ error: "eu_consent_required" }, { status: 422 })
  }

  try {
    if (isEU && parsed.data.consent) {
      const ipHash = ip
        ? createHash("sha256").update(ip).digest("hex")
        : "unknown"
      const userAgent = (req as Request & { headers: Headers }).headers.get("user-agent") ?? undefined
      const locale = parsed.data.locale ?? "es"
      const consentText = parsed.data.consentText ?? ""

      await db.consentLog.create({
        data: {
          userId:         authResult.userId,
          plan:           parsed.data.plan,
          ipHash,
          userAgent,
          locale,
          consentVersion: CONSENT_VERSION,
          consentText,
          acceptedAt:     new Date(),
        },
      })

      // Keep euConsentAcceptedAt as a quick "has ever consented" flag — only set once
      await db.user.updateMany({
        where: { id: authResult.userId, euConsentAcceptedAt: null },
        data:  { euConsentAcceptedAt: new Date() },
      })
    }

    const result = await stripeCheckoutService.createSession(authResult.userId, parsed.data.plan, parsed.data.locale ?? "es")
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
