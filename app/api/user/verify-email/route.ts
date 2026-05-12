import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token || typeof token !== "string" || token.length !== 64) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 })
  }

  const record = await db.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 })
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: "token_expired" }, { status: 400 })
  }

  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })

  await db.verificationToken.delete({ where: { token } })

  return NextResponse.json({ success: true })
}
