import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { resumeService } from "@/lib/controllers/resume-deps"
import { db } from "@/lib/db"
import { ResumeSectionsSchema, type ResumeSection } from "@/types/resume"
import { collectResumeSegments, detectLanguage } from "@/lib/services/ai/shared/translate-fields"

type Params = { params: Promise<{ id: string }> }

/**
 * Translates a resume between Spanish and English and saves the result as a NEW
 * resume (the original is never modified). Direction is auto-detected from the
 * resume's own prose. Plan gating is enforced by the AI quota layer inside
 * aiService.translateCV ("translate-cv" is PRO/LIMITED only).
 */
export async function POST(req: Request, { params }: Params) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const resume = await db.resume.findFirst({ where: { id, userId: authResult.userId } })
    if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 })

    // Content lives in the `personalDetails` JSON column; `sections` is layout.
    const sectionData = ResumeSectionsSchema.parse(
      typeof resume.personalDetails === "object" && resume.personalDetails !== null ? resume.personalDetails : {},
    )

    const layout: ResumeSection[] = Array.isArray(resume.sections)
      ? (resume.sections as unknown as ResumeSection[])
      : []
    const sectionLabels = layout.map((s) => (typeof s?.label === "string" ? s.label : ""))

    // Auto-detect the source language from the resume's prose → translate INTO
    // the opposite one.
    const proseTexts = collectResumeSegments(sectionData).map((s) => s.text)
    if (proseTexts.length === 0 && sectionLabels.every((l) => !l.trim())) {
      return NextResponse.json({ error: "nothing_to_translate" }, { status: 422 })
    }
    const sourceLang = detectLanguage([...proseTexts, ...sectionLabels])
    const targetLang: "es" | "en" = sourceLang === "es" ? "en" : "es"

    // Idempotency: a CV is translated ONCE per target language. If a translation
    // already exists, return it instead of spending another LLM call / daily-cap
    // slot — the UI disables the action, this is the server-side guarantee.
    const existing = await db.resume.findFirst({
      where: { translatedFromId: id, language: targetLang, userId: authResult.userId },
    })
    if (existing) {
      return NextResponse.json({ ...existing, alreadyTranslated: true }, { status: 200 })
    }

    const result = await aiService.translateCV(
      authResult.userId,
      { sectionData: resume.personalDetails as Record<string, unknown>, sectionLabels, targetLang },
      authResult.user.plan,
    )

    // Reapply translated labels onto the layout, preserving everything else.
    const translatedSections: ResumeSection[] = layout.map((s, i) => ({
      ...s,
      label: result.sectionLabels[i] ?? s.label,
    }))

    const baseTitle = resume.title.replace(/\s*\((ES|EN)\)\s*$/i, "").trim() || resume.title
    const newTitle = `${baseTitle} (${targetLang.toUpperCase()})`

    let copy
    try {
      copy = await resumeService.createTranslatedCopy(authResult.userId, id, {
        personalDetails: result.sectionData as object,
        sections: translatedSections as unknown as object[],
        title: newTitle,
        language: targetLang,
      })
    } catch (e) {
      // Concurrent request won the race and created the translation first: the
      // unique (translatedFromId, language) index rejected this insert. Resolve
      // idempotently — return the copy that now exists.
      if ((e as { code?: string })?.code === "P2002") {
        const raced = await db.resume.findFirst({
          where: { translatedFromId: id, language: targetLang, userId: authResult.userId },
        })
        if (raced) return NextResponse.json({ ...raced, alreadyTranslated: true }, { status: 200 })
      }
      throw e
    }

    return NextResponse.json(copy, { status: 201 })
  } catch (err) {
    return handleError(err, { req })
  }
}
