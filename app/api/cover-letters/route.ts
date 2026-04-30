import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLimits } from "@/lib/plans"
import { checkOrigin } from "@/lib/csrf"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
  const cursor = searchParams.get("cursor") ?? undefined

  const letters = await db.coverLetter.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: { id: true, title: true, colorScheme: true, updatedAt: true, createdAt: true },
  })

  const nextCursor = letters.length === limit ? letters[letters.length - 1].id : null
  return NextResponse.json({ data: letters, nextCursor })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Plan limit check
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  const limits = getLimits(user?.plan ?? "FREE")
  if (limits.maxCoverLetters !== Infinity) {
    const count = await db.coverLetter.count({ where: { userId: session.user.id } })
    if (count >= limits.maxCoverLetters) {
      return NextResponse.json(
        { error: "cover_letter_limit_exceeded", limit: limits.maxCoverLetters },
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
