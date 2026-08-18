import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"
import { laterOf } from "@/lib/services/billing/revoke-access"
import { z } from "zod"

const logger = createLogger("admin-grant-access")

/**
 * Dar o extender acceso pagado a mano, con motivo.
 *
 * POR QUÉ EXISTE: sobre un usuario normal la única acción del panel era cortarle la
 * sesión. Si a alguien le fallaba el webhook después de pagar, o había que compensarlo por
 * una caída, la única salida era abrir Postgres por SSH — sin confirmación, sin registro y
 * con todo el peso de un UPDATE a mano sobre la fila equivocada.
 *
 * DOS REGLAS QUE NO SE NEGOCIAN, las mismas del resto del sistema:
 *
 *  · NUNCA ACORTAR. Si ya tiene acceso hasta una fecha posterior, se respeta (`laterOf`).
 *    Regalar treinta días no puede quitarle los sesenta que pagó.
 *  · NO TOCAR A UN MANAGED. Su plan lo decide su administrador desde la pantalla de
 *    usuarios gestionados; pisarlo desde acá crearía dos fuentes para el mismo dato.
 *
 * No inventa una suscripción: escribe una ventana de acceso como la de un plan de pago
 * único. No hay `subscriptionId`, así que ningún webhook posterior cree que hay algo que
 * cobrar o cancelar.
 */
const schema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["PRO", "BASIC", "SPRINT"]),
  days: z.number().int().min(1).max(3650),
  // Obligatorio: un acceso regalado sin motivo es indefendible tres meses después,
  // cuando nadie recuerda por qué esa cuenta no paga.
  reason: z.string().trim().min(3).max(300),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return apiError(422, "invalid_payload", { req, extra: { details: parsed.error.flatten() } })

  const { userId, plan, days, reason } = parsed.data

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deletedAt: true, isManaged: true, subscriptionEndsAt: true, plan: true },
  })
  if (!target || target.deletedAt) return apiError(404, "user_not_found", { req })
  if (target.isManaged) return apiError(400, "managed_account", { req })

  const until = laterOf(new Date(Date.now() + days * 24 * 60 * 60 * 1000), target.subscriptionEndsAt)

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionEndsAt: until,
      // "NONE" y no "ACTIVE": no hay suscripción detrás. Marcarla activa haría que la app
      // le ofrezca un portal de facturación que no existe y un "cancelá primero" imposible.
      subscriptionStatus: "NONE",
      sessionVersion: { increment: 1 },
    },
  })
  purgeUserCache(userId)

  await db.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_UPDATED",
      metadata: {
        source: "admin_grant_access",
        byAdmin: session.user.id,
        plan,
        days,
        reason,
        previousPlan: target.plan,
        until: until.toISOString(),
      },
    },
  })

  logger.info("admin: access granted by hand", { targetUserId: userId, plan, days, byAdmin: session.user.id })

  return NextResponse.json({ ok: true, userId, plan, until: until.toISOString() })
}
