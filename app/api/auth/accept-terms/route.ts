import { NextResponse } from "next/server"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"

export async function POST(req: Request) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
