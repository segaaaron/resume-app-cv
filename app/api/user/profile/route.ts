import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name } = await req.json()
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  })

  return NextResponse.json({ success: true })
}
