import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { isActive } from "@/lib/plans"

const createSchema = z.object({
  jobTitle: z.string().min(1).max(255),
  company:  z.string().min(1).max(255),
  status:   z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).default("WISHLIST"),
  notes:    z.string().max(5000).optional(),
  url:      z.string().url().optional().or(z.literal("")),
  salary:   z.string().max(100).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)
  const cursor = searchParams.get("cursor") ?? undefined

  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  })

  const nextCursor = applications.length === limit ? applications[applications.length - 1].id : null
  return NextResponse.json({ data: applications, nextCursor })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })
  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  }

  const app = await db.application.create({
    data: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json(app, { status: 201 })
}
