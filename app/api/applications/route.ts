import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).default("WISHLIST"),
  notes: z.string().optional(),
  url: z.string().optional(),
  salary: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(applications)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = createSchema.parse(body)

  const app = await db.application.create({
    data: { ...data, userId: session.user.id },
  })

  return NextResponse.json(app, { status: 201 })
}
