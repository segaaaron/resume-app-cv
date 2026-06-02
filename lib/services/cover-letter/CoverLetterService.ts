// lib/services/cover-letter/CoverLetterService.ts
import { db } from "@/lib/db"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { AppError } from "@/lib/services/auth/AppError"
import { getLimits } from "@/lib/plans"
import { z } from "zod"

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const coverLetterPatchSchema = z.object({
  title:       z.string().max(200).optional(),
  content:     z.object({
    body:                   z.string().max(50_000).optional(),
    subject:                z.string().max(500).optional(),
    closing:                z.string().max(500).optional(),
    recipientName:          z.string().max(200).optional(),
    recipientTitle:         z.string().max(200).optional(),
    company:                z.string().max(200).optional(),
    candidateName:          z.string().max(200).optional(),
    candidateJobTitle:      z.string().max(200).optional(),
    candidateEmail:         z.string().max(200).optional(),
    candidatePhone:         z.string().max(100).optional(),
    candidateAddress:       z.string().max(300).optional(),
    candidatePhoto:         z.string().max(5_000_000).optional(),
    candidatePhotoPosition: z.number().min(0).max(100).optional(),
    candidateLinkedin:      z.string().max(300).optional(),
    candidateWebsite:       z.string().max(300).optional(),
  }).optional(),
  colorScheme: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily:  z.string().max(100).optional(),
  templateId:  z.string().max(50).optional(),
})

export type CoverLetterPatch = z.infer<typeof coverLetterPatchSchema>

// ─── Result types ─────────────────────────────────────────────────────────────

export interface CoverLetterListItem {
  id: string
  title: string | null
  colorScheme: string | null
  updatedAt: Date
  createdAt: Date
}

export interface CoverLetterListResult {
  data: CoverLetterListItem[]
  nextCursor: string | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CoverLetterService {
  constructor(private readonly logger: ILogger) {}

  async list(userId: string, limit = 50, cursor?: string): Promise<CoverLetterListResult> {
    const take = Math.min(limit, 100)
    const letters = await db.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, title: true, colorScheme: true, updatedAt: true, createdAt: true },
    })

    const nextCursor = letters.length === take ? letters[letters.length - 1].id : null
    this.logger.info("cover-letter.list", { userId, count: letters.length })
    return { data: letters, nextCursor }
  }

  async get(userId: string, id: string) {
    const letter = await db.coverLetter.findFirst({
      where: { id, userId },
    })
    if (!letter) throw new AppError("not_found", 404)
    return letter
  }

  async create(userId: string, title?: string, plan: string = "UNSUBSCRIBED") {
    const limits = getLimits(plan)

    // Atomic count-then-create. Mirrors ResumeService.create.
    let limitHit = false
    const letter = await db.$transaction(async (tx) => {
      if (limits.maxCoverLetters !== -1) {
        const count = await tx.coverLetter.count({ where: { userId } })
        if (count >= limits.maxCoverLetters) {
          limitHit = true
          throw new AppError("plan_limit_cover_letter", 403, { limit: limits.maxCoverLetters })
        }
      }
      return tx.coverLetter.create({
        data: {
          userId,
          title: title ?? "Mi Carta de Presentación",
          content: {
            recipientName: "",
            recipientTitle: "",
            company: "",
            body: "",
            closing: "",
          },
        },
      })
    }).catch((err) => {
      if (limitHit) {
        db.auditLog
          .create({ data: { userId, action: "FREE_COVER_LETTER_LIMIT_HIT", metadata: { limit: limits.maxCoverLetters } } })
          .catch(() => { /* fire-and-forget */ })
      }
      throw err
    })

    this.logger.info("cover-letter.create", { userId, letterId: letter.id })
    return letter
  }

  async update(userId: string, id: string, patch: CoverLetterPatch) {
    const existing = await db.coverLetter.findFirst({ where: { id, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.coverLetter.update({
      where: { id },
      data: {
        title:       patch.title       ?? undefined,
        content:     patch.content     ? (patch.content as object) : undefined,
        colorScheme: patch.colorScheme ?? undefined,
        fontFamily:  patch.fontFamily  ?? undefined,
        templateId:  patch.templateId  ?? undefined,
      },
    })
    this.logger.info("cover-letter.update", { userId, letterId: id })
  }

  async delete(userId: string, id: string) {
    const existing = await db.coverLetter.findFirst({ where: { id, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.coverLetter.delete({ where: { id } })
    this.logger.info("cover-letter.delete", { userId, letterId: id })
  }

  async getPdfMeta(userId: string, id: string): Promise<{ id: string; title: string | null }> {
    const letter = await db.coverLetter.findFirst({
      where: { id, userId },
      select: { id: true, title: true },
    })
    if (!letter) throw new AppError("not_found", 404)
    return letter
  }
}
