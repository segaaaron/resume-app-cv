// lib/services/downloads/managed-quota.ts
// Single source of truth for managed-user download accounting. Every export
// route (resume PDF, cover letter PDF, DOCX) must claim through here so the
// reservation, limit check, refund and audit logic can never drift apart.
import { db } from "@/lib/db"
import { isManagedUnlimited } from "@/lib/plans"
import { createLogger } from "@/lib/logger"

const logger = createLogger("managed-quota")

export type ManagedQuotaUser = {
  isManaged: boolean
  managedDownloadLimit: number | null
}

export type ManagedClaim =
  | { ok: true; claimed: boolean }
  | { ok: false; status: 403 | 409; error: string }

/**
 * Atomically reserves one managed download. Unlimited users (limit === null)
 * still increment the counter for admin accounting. Non-managed users pass
 * through without touching the counter.
 */
export async function claimManagedDownload(userId: string, user: ManagedQuotaUser): Promise<ManagedClaim> {
  if (!user.isManaged) return { ok: true, claimed: false }

  // Sin tope = el admin lo dejo en blanco (NULL) o lo marco "sin limite" (-1).
  // Las dos formas tienen que entrar por la misma puerta: con -1 y el filtro de
  // abajo, `managedDownloadsUsed < -1` no se cumple NUNCA y la marca de "sin
  // limite" habria bloqueado todas las descargas — el reverso exacto de lo que
  // el administrador pidio.
  const cap = user.managedDownloadLimit
  const r = await db.user.updateMany({
    where: cap === null || isManagedUnlimited(cap)
      ? { id: userId, isManaged: true }
      : {
          id: userId,
          isManaged: true,
          managedDownloadLimit: { not: null },
          managedDownloadsUsed: { lt: cap },
        },
    data: { managedDownloadsUsed: { increment: 1 } },
  })

  if (r.count === 0) {
    // Distinguish "access changed" (409) from genuine limit-reached (403).
    const fresh = await db.user.findUnique({
      where: { id: userId },
      select: { isManaged: true },
    })
    if (!fresh?.isManaged) {
      return { ok: false, status: 409, error: "El acceso de descarga ha cambiado. Refresca la página." }
    }
    return { ok: false, status: 403, error: "Has alcanzado el límite de descargas de tu plan." }
  }

  return { ok: true, claimed: true }
}

/**
 * Returns a previously claimed download after a failed export. Retries with
 * backoff; if every retry fails, writes an AuditLog so the lost slot is
 * traceable instead of silently swallowed.
 */
export async function refundManagedDownload(userId: string, context: Record<string, string>): Promise<void> {
  const delays = [100, 300, 900]
  let lastErr: unknown
  for (const delay of delays) {
    try {
      await db.user.update({
        where: { id: userId },
        data: { managedDownloadsUsed: { decrement: 1 } },
      })
      return
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  logger.error("managed download refund failed after retries — writing AuditLog", { userId, ...context }, lastErr instanceof Error ? lastErr : undefined)
  await db.auditLog.create({
    data: {
      userId,
      action: "MANAGED_DOWNLOAD_REFUND_FAILED",
      metadata: { ...context, error: lastErr instanceof Error ? lastErr.message : String(lastErr) },
    },
  }).catch((auditErr) => {
    logger.error("AuditLog write for MANAGED_DOWNLOAD_REFUND_FAILED also failed", { userId, ...context }, auditErr instanceof Error ? auditErr : undefined)
  })
}
