import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLimits } from "@/lib/plans"

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

  // Plan limit check
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  const limits = getLimits(user?.plan ?? "FREE")
  if (limits.maxCoverLetters !== Infinity) {
    const count = await db.coverLetter.count({ where: { userId: session.user.id } })
    if (count >= limits.maxCoverLetters) {
      return NextResponse.json(
        { error: `Tu plan permite máximo ${limits.maxCoverLetters} carta(s). Actualiza a Pro para crear más.` },
        { status: 403 }
      )
    }
  }

  const letter = await db.coverLetter.create({
    data: {
      userId: session.user.id,
      title: "Mi Carta de Presentación",
      content: {
        recipientName: "",
        recipientTitle: "",
        company: "",
        body: "",
        closing: "",
      },
    },
  })

  return NextResponse.json(letter, { status: 201 })
}
