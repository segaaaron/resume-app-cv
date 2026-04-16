import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const letters = await db.coverLetter.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, colorScheme: true, updatedAt: true, createdAt: true },
  })

  return NextResponse.json(letters)
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const letter = await db.coverLetter.create({
    data: {
      userId: session.user.id,
      title: "Mi Carta de Presentación",
      content: {
        recipientName: "",
        recipientTitle: "",
        company: "",
        body: "",
        closing: "Atentamente",
      },
    },
  })

  return NextResponse.json(letter, { status: 201 })
}
