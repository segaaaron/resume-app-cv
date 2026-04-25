import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import OpenAI from "openai"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only Pro users
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { text, jobTitle } = await req.json()

  if (!text || typeof text !== "string" || text.trim().length < 5) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 })
  }

  const prompt = `Eres un experto en redacción de CVs profesionales.
Tu tarea es mejorar la siguiente descripción de experiencia laboral para que sea más impactante, concisa y orientada a logros.

Puesto: ${jobTitle || "No especificado"}
Descripción actual:
${text}

Genera 3 versiones mejoradas. Cada versión debe:
- Comenzar con verbos de acción fuertes (Lideré, Desarrollé, Optimicé, Implementé, etc.)
- Incluir métricas o resultados cuando sea posible (inferidos del contexto)
- Ser concisa y directa
- Estar en el mismo idioma que el texto original
- Mantener la esencia de lo que el usuario hizo

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed.versions)) {
      throw new Error("Invalid response format")
    }

    return NextResponse.json({ versions: parsed.versions.slice(0, 3) })
  } catch (err) {
    console.error("[ai/improve-bullet] error:", err)
    return NextResponse.json({ error: "Error al mejorar el texto" }, { status: 500 })
  }
}
