"use server"
import { auth, signOut, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("logoutAction")

export async function clearSessionToken(): Promise<{ ok: true } | { ok: false }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: true }
  try {
    await db.user.update({
      where: { id: userId },
      data: { activeSessionToken: null },
    })
    purgeUserCache(userId)
    return { ok: true }
  } catch (e) {
    logger.error(
      "clearSessionToken: DB update failed — activeSessionToken may persist, user could be blocked on next login",
      { userId },
      e instanceof Error ? e : undefined,
    )
    return { ok: false }
  }
}

// Used by SessionProvider (auto-redirect, no toast possible)
export async function logoutAction(redirectTo: string = "/") {
  await clearSessionToken()
  await signOut({ redirectTo })
}
