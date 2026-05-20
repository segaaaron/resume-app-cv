// lib/services/application/ApplicationService.ts
import { db } from "@/lib/db"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { AppError } from "@/lib/services/auth/AppError"
import { z } from "zod"

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const applicationCreateSchema = z.object({
  jobTitle:  z.string().min(1).max(255),
  company:   z.string().min(1).max(255),
  status:    z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).default("APPLIED"),
  modalidad: z.string().max(50).optional(),
  notes:     z.string().max(5000).optional(),
  url:       z.string().url().optional().or(z.literal("")),
  salary:    z.string().max(100).optional(),
})

export const applicationPatchSchema = z.object({
  status:     z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  modalidad:  z.string().max(50).optional(),
  notes:      z.string().max(5000).optional(),
  url:        z.string().url().optional().or(z.literal("")),
  salary:     z.string().max(100).optional(),
  appliedAt:  z.string().datetime().optional(),
  followUpAt: z.string().datetime().optional().nullable(),
})

export type ApplicationCreate = z.infer<typeof applicationCreateSchema>
export type ApplicationPatch  = z.infer<typeof applicationPatchSchema>

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ApplicationListResult {
  data: Awaited<ReturnType<typeof db.application.findMany>>
  nextCursor: string | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ApplicationService {
  constructor(private readonly logger: ILogger) {}

  async list(userId: string, limit = 100, cursor?: string): Promise<ApplicationListResult> {
    const take = Math.min(limit, 200)
    const applications = await db.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    const nextCursor = applications.length === take ? applications[applications.length - 1].id : null
    this.logger.info("application.list", { userId, count: applications.length })
    return { data: applications, nextCursor }
  }

  async create(userId: string, data: ApplicationCreate) {
    const app = await db.application.create({
      data: { ...data, userId },
    })
    this.logger.info("application.create", { userId, appId: app.id })
    return app
  }

  async update(userId: string, id: string, patch: ApplicationPatch) {
    const existing = await db.application.findFirst({ where: { id, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.application.update({
      where: { id },
      data: {
        status:     patch.status     ?? undefined,
        modalidad:  patch.modalidad  ?? undefined,
        notes:      patch.notes      ?? undefined,
        url:        patch.url        ?? undefined,
        salary:     patch.salary     ?? undefined,
        appliedAt:  patch.appliedAt  ? new Date(patch.appliedAt)  : undefined,
        followUpAt: patch.followUpAt === null ? null
                  : patch.followUpAt ? new Date(patch.followUpAt)
                  : undefined,
        ...(patch.followUpAt !== undefined ? { reminderSentAt: null } : {}),
      },
    })
    this.logger.info("application.update", { userId, appId: id })
  }

  async deleteAll(userId: string) {
    await db.application.deleteMany({ where: { userId } })
    this.logger.info("application.deleteAll", { userId })
  }

  async updateStatus(userId: string, id: string, status: ApplicationPatch["status"]) {
    return this.update(userId, id, { status })
  }

  async delete(userId: string, id: string) {
    const existing = await db.application.findFirst({ where: { id, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.application.delete({ where: { id } })
    this.logger.info("application.delete", { userId, appId: id })
  }
}
