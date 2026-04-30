import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage } from "@/lib/ai-client"
import { checkOrigin } from "@/lib/csrf"
import { z } from "zod"

const schema = z.object({
  jobTitle: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
  existingSkills: z.array(z.string()).max(50).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [allowed, user] = await Promise.all([
    checkRateLimit(session.user.id, "suggest-skills"),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true } }),
  ])
  if (!allowed) return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { jobTitle, industry, existingSkills = [], language: rawLanguage } = parsed.data
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  const validation = validateAIInput(jobTitle)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const existingList = existingSkills.length > 0
    ? `The candidate already has these skills: ${existingSkills.join(", ")}. Do not repeat them.`
    : ""

  const prompt = `You are a professional career coach. Suggest relevant skills for a "${jobTitle}"${industry ? ` in the ${industry} industry` : ""}.
${existingList}

Return a JSON object with this exact structure:
{
  "skills": [
    { "name": "skill name", "level": "beginner|intermediate|advanced|expert" },
    ...
  ]
}

Rules:
- Return exactly 8-10 skills
- Mix technical and soft skills appropriate for the role
- Assign realistic levels for a typical professional in this role
- Only return the JSON object, no other text
- If the job title is not a real profession or is off-topic, return { "skills": [] }`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMPERATURE,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a career coach. Only suggest skills relevant to professional CV/resume contexts. If the input is off-topic or nonsensical, return { \"skills\": [] }. " + langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const result = JSON.parse(content) as { skills?: { name: string; level: string }[] }

    if (!Array.isArray(result.skills)) {
      return NextResponse.json({ skills: [] }, { status: 422 })
    }

    const validLevels = new Set(["beginner", "intermediate", "advanced", "expert"])
    const skills = result.skills
      .filter((s) => s.name && typeof s.name === "string")
      .map((s) => ({
        name: s.name.trim(),
        level: validLevels.has(s.level) ? s.level : "intermediate",
      }))

    logAIUsage(session.user.id, "suggest-skills")
    return NextResponse.json({ skills })
  } catch {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 })
  }
}
