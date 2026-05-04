import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getLimits } from "@/lib/plans"
import { checkOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(_req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const [original, user] = await Promise.all([
    db.resume.findFirst({ where: { id, userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ])

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Enforce plan limit before duplicating
  const limits = getLimits(user?.plan ?? "UNSUBSCRIBED")
  if (limits.maxResumes !== Infinity) {
    const count = await db.resume.count({ where: { userId: session.user.id } })
    if (count >= limits.maxResumes) {
      return NextResponse.json(
        { error: `Tu plan permite máximo ${limits.maxResumes} CV(s). Actualiza a Pro para crear más.` },
        { status: 403 }
      )
    }
  }

  const copy = await db.resume.create({
    data: {
      userId: session.user.id,
      title: `${original.title} (copia)`,
      templateId: original.templateId,
      colorScheme: original.colorScheme,
      fontFamily: original.fontFamily,
      fontSize: original.fontSize,
      spacing: original.spacing,
      sections: original.sections ?? undefined,
      personalDetails: original.personalDetails ?? undefined,
      photoUrl: original.photoUrl,
      language: original.language,
    },
  })

  return NextResponse.json(copy, { status: 201 })
}
