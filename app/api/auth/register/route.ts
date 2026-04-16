import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { DEFAULT_SECTIONS } from "@/types/resume"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await db.user.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
