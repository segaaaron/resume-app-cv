import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"

export async function POST(req: Request) {
  if (!checkOrigin(req)) {
    return apiError(403, "Forbidden", { req })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }

  const userId = session.user.id

  if (session.user.termsAcceptedAt) {
    return NextResponse.json({ ok: true })
  }

  await db.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date() },
  })

  purgeUserCache(userId)

  return NextResponse.json({ ok: true })
}
