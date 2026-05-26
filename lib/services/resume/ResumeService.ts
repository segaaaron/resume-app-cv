// lib/services/resume/ResumeService.ts
import { db } from "@/lib/db"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { AppError } from "@/lib/services/auth/AppError"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import { getLimits, isActive } from "@/lib/plans"
import { nanoid } from "nanoid"
import { z } from "zod"

// ─── Snapshot schema (mirrors autosave fields) ────────────────────────────────

export const snapshotConfigSchema = z.object({
  templateId:    z.string().optional(),
  colorScheme:   z.string().optional(),
  fontFamily:    z.string().optional(),
  fontSize:      z.number().optional(),
  spacing:       z.number().optional(),
  photoUrl:      z.string().optional().nullable(),
  photoPosition: z.number().optional(),
  language:      z.string().optional(),
}).optional()

export const snapshotSchema = z.object({
  title:       z.string().optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: ResumeSectionsSchema.optional(),
  config:      snapshotConfigSchema,
})

export type ResumeSnapshot = z.infer<typeof snapshotSchema>

// ─── PATCH body shape ─────────────────────────────────────────────────────────

export const resumePatchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: z.record(z.string(), z.unknown()).optional().refine(
    (val) => !val || JSON.stringify(val).length <= 500_000,
    { message: "sectionData too large" }
  ),
  config: z.object({
    templateId:    z.string().optional(),
    colorScheme:   z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    fontFamily:    z.string().max(100).optional(),
    fontSize:      z.number().int().min(8).max(24).optional(),
    spacing:       z.number().min(0.5).max(3).optional(),
    photoUrl:      z.string().regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/).max(500000).optional().nullable(),
    photoPosition: z.number().int().min(0).max(100).optional(),
    language:      z.enum(["es", "en"]).optional(),
  }).optional(),
})

export type ResumePatch = z.infer<typeof resumePatchSchema>

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ResumeListItem {
  id: string
  title: string
  templateId: string | null
  colorScheme: string | null
  thumbnailUrl: string | null
  updatedAt: Date
  createdAt: Date
}

export interface ResumeListResult {
  data: ResumeListItem[]
  nextCursor: string | null
}

export interface ShareToggleResult {
  isPublic: boolean
  publicSlug: string | null
}

export interface ViewStatsResult {
  total: number
  last7d: number
  last30d: number
  isPublic: boolean
  publicSlug: string | null
}

export interface VersionListItem {
  id: string
  label: string | null
  createdAt: Date
}

const MAX_VERSIONS = 10

// ─── Service ──────────────────────────────────────────────────────────────────

export class ResumeService {
  constructor(private readonly logger: ILogger) {}

  // ── LIST ──────────────────────────────────────────────────────────────────

  async list(userId: string, limit: number, cursor?: string): Promise<ResumeListResult> {
    const safeLimit = Math.min(limit, 100)
    const resumes = await db.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: safeLimit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        title: true,
        templateId: true,
        colorScheme: true,
        thumbnailUrl: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    const nextCursor = resumes.length === safeLimit ? resumes[resumes.length - 1].id : null
    return { data: resumes, nextCursor }
  }

  // ── GET ───────────────────────────────────────────────────────────────────

  async get(userId: string, resumeId: string) {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
    })
    if (!resume) throw new AppError("not_found", 404)
    return resume
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  async create(userId: string, templateId?: string) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, name: true } })
    const limits = getLimits(user?.plan ?? "UNSUBSCRIBED")

    const defaultData = ResumeSectionsSchema.parse({})

    // Pre-populate name from account profile so first CV always reflects the account owner.
    if (user?.name?.trim()) {
      const parts = user.name.trim().split(/\s+/)
      const pd = defaultData.personalDetails as Record<string, unknown>
      pd.firstName = parts[0] ?? ""
      pd.lastName  = parts.slice(1).join(" ")
    }

    // Transaction ensures count-check and create are atomic — prevents two concurrent
    // requests from both passing the limit check and creating two resumes.
    const resume = await db.$transaction(async (tx) => {
      if (limits.maxResumes !== Infinity) {
        const count = await tx.resume.count({ where: { userId } })
        if (count >= limits.maxResumes) {
          throw new AppError(
            `Tu plan permite máximo ${limits.maxResumes} CV(s). Actualiza a Pro para crear más.`,
            403,
          )
        }
      }
      return tx.resume.create({
        data: {
          userId,
          title: "Mi CV",
          sections: DEFAULT_SECTIONS as object[],
          personalDetails: defaultData as object,
          ...(templateId ? { templateId } : {}),
        },
      })
    })

    this.logger.info("[ResumeService] create", { userId, resumeId: resume.id })

    db.auditLog.create({
      data: { userId, action: "CREATE_RESUME", metadata: { resumeId: resume.id } },
    }).catch((err) => { this.logger.error("[ResumeService] auditLog CREATE_RESUME failed", { userId, resumeId: resume.id }, err) })

    return resume
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async update(userId: string, resumeId: string, patch: ResumePatch): Promise<void> {
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    })
    if (!existing) throw new AppError("not_found", 404)

    const { title, sections, sectionData, config } = patch

    await db.resume.update({
      where: { id: resumeId },
      data: {
        title:           title ?? undefined,
        sections:        sections ? (sections as object[]) : undefined,
        personalDetails: sectionData ? (sectionData as object) : undefined,
        templateId:      config?.templateId ?? undefined,
        colorScheme:     config?.colorScheme ?? undefined,
        fontFamily:      config?.fontFamily ?? undefined,
        fontSize:        config?.fontSize ?? undefined,
        spacing:         config?.spacing ?? undefined,
        photoUrl:        config?.photoUrl !== undefined ? config.photoUrl : undefined,
        photoPosition:   config?.photoPosition ?? undefined,
        language:        config?.language ?? undefined,
      },
    })

    this.logger.info("[ResumeService] update", { userId, resumeId })
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  async delete(userId: string, resumeId: string): Promise<void> {
    const existing = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    })
    if (!existing) throw new AppError("not_found", 404)

    await db.resume.delete({ where: { id: resumeId } })
    this.logger.info("[ResumeService] delete", { userId, resumeId })
  }

  // ── DUPLICATE ─────────────────────────────────────────────────────────────

  async duplicate(userId: string, resumeId: string) {
    const [original, user] = await Promise.all([
      db.resume.findFirst({ where: { id: resumeId, userId } }),
      db.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    ])

    if (!original) throw new AppError("not_found", 404)

    const limits = getLimits(user?.plan ?? "UNSUBSCRIBED")

    const copy = await db.$transaction(async (tx) => {
      if (limits.maxResumes !== Infinity) {
        const count = await tx.resume.count({ where: { userId } })
        if (count >= limits.maxResumes) {
          throw new AppError(
            `Tu plan permite máximo ${limits.maxResumes} CV(s). Actualiza a Pro para crear más.`,
            403,
          )
        }
      }
      return tx.resume.create({
        data: {
          userId,
          title:           `${original.title} (copia)`,
          templateId:      original.templateId,
          colorScheme:     original.colorScheme,
          fontFamily:      original.fontFamily,
          fontSize:        original.fontSize,
          spacing:         original.spacing,
          sections:        original.sections ?? undefined,
          personalDetails: original.personalDetails ?? undefined,
          photoUrl:        original.photoUrl,
          language:        original.language,
        },
      })
    })

    this.logger.info("[ResumeService] duplicate", { userId, originalId: resumeId, copyId: copy.id })
    return copy
  }

  // ── SHARE (toggle public) ─────────────────────────────────────────────────

  async toggleShare(userId: string, resumeId: string): Promise<ShareToggleResult> {
    return db.$transaction(async (tx) => {
      const resume = await tx.resume.findFirst({
        where: { id: resumeId, userId },
        select: { id: true, isPublic: true, publicSlug: true },
      })
      if (!resume) throw new AppError("not_found", 404)

      if (resume.isPublic) {
        await tx.resume.update({ where: { id: resumeId }, data: { isPublic: false } })
        await tx.auditLog.create({
          data: { userId, action: "TOGGLE_PUBLIC_CV", metadata: { resumeId, isPublic: false } },
        })
        return { isPublic: false, publicSlug: resume.publicSlug }
      } else {
        const slug = resume.publicSlug ?? nanoid(10)
        await tx.resume.update({ where: { id: resumeId }, data: { isPublic: true, publicSlug: slug } })
        await tx.auditLog.create({
          data: { userId, action: "TOGGLE_PUBLIC_CV", metadata: { resumeId, isPublic: true, slug } },
        })
        return { isPublic: true, publicSlug: slug }
      }
    })
  }

  // ── VIEW STATS ────────────────────────────────────────────────────────────

  async getViewStats(userId: string, resumeId: string): Promise<ViewStatsResult> {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true, isPublic: true, publicSlug: true },
    })
    if (!resume) throw new AppError("not_found", 404)

    const now = Date.now()
    const [total, last7d, last30d] = await Promise.all([
      db.cVView.count({ where: { resumeId } }),
      db.cVView.count({ where: { resumeId, viewedAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
      db.cVView.count({ where: { resumeId, viewedAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } } }),
    ])

    return { total, last7d, last30d, isPublic: resume.isPublic, publicSlug: resume.publicSlug }
  }

  // ── VERSIONS — LIST ───────────────────────────────────────────────────────

  async getVersions(userId: string, resumeId: string): Promise<VersionListItem[]> {
    const resume = await db.resume.findFirst({ where: { id: resumeId, userId } })
    if (!resume) throw new AppError("not_found", 404)

    const versions = await db.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, createdAt: true },
    })

    return versions
  }

  // ── VERSIONS — CREATE ─────────────────────────────────────────────────────

  async createVersion(
    userId: string,
    resumeId: string,
    snapshot: ResumeSnapshot,
    label?: string,
  ) {
    // Pro check — run both queries in parallel (no data dependency between them)
    const [user, resume] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true },
      }),
      db.resume.findFirst({ where: { id: resumeId, userId } }),
    ])
    if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus, user?.role)) {
      throw new AppError("pro_required", 403)
    }
    if (!resume) throw new AppError("not_found", 404)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let version: any
    await db.$transaction(async (tx) => {
      version = await tx.resumeVersion.create({
        data: {
          resumeId,
          label: typeof label === "string" ? label : null,
          snapshot: snapshot as object,
        },
      })
      const all = await tx.resumeVersion.findMany({
        where: { resumeId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
      if (all.length > MAX_VERSIONS) {
        const toDelete = all.slice(MAX_VERSIONS).map((v: { id: string }) => v.id)
        await tx.resumeVersion.deleteMany({ where: { id: { in: toDelete } } })
      }
    })

    this.logger.info("[ResumeService] createVersion", { userId, resumeId, versionId: version.id })
    return version
  }

  // ── VERSIONS — DELETE ─────────────────────────────────────────────────────

  async deleteVersion(userId: string, versionId: string): Promise<void> {
    const version = await db.resumeVersion.findFirst({
      where: { id: versionId },
      include: { resume: { select: { userId: true } } },
    })

    if (!version || version.resume.userId !== userId) {
      throw new AppError("not_found", 404)
    }

    await db.resumeVersion.delete({ where: { id: versionId } })
    this.logger.info("[ResumeService] deleteVersion", { userId, versionId })
  }

  // ── VERSIONS — RESTORE ────────────────────────────────────────────────────

  async restoreVersion(userId: string, versionId: string): Promise<{ resumeId: string }> {
    const version = await db.resumeVersion.findFirst({
      where: { id: versionId },
      include: { resume: { select: { userId: true } } },
    })

    if (!version || version.resume.userId !== userId) {
      throw new AppError("not_found", 404)
    }

    const parsed = snapshotSchema.safeParse(version.snapshot)
    if (!parsed.success) {
      throw new AppError("snapshot_corrupted", 422)
    }

    const snap = parsed.data

    await db.resume.update({
      where: { id: version.resumeId },
      data: {
        ...(snap.title       !== undefined ? { title: snap.title }                                  : {}),
        ...(snap.sections    !== undefined ? { sections: snap.sections as object[] }                : {}),
        ...(snap.sectionData !== undefined ? { personalDetails: snap.sectionData as object }        : {}),
        ...(snap.config?.templateId    !== undefined ? { templateId: snap.config.templateId }       : {}),
        ...(snap.config?.colorScheme   !== undefined ? { colorScheme: snap.config.colorScheme }     : {}),
        ...(snap.config?.fontFamily    !== undefined ? { fontFamily: snap.config.fontFamily }       : {}),
        ...(snap.config?.fontSize      !== undefined ? { fontSize: snap.config.fontSize }           : {}),
        ...(snap.config?.spacing       !== undefined ? { spacing: snap.config.spacing }             : {}),
        ...(snap.config?.photoUrl      !== undefined ? { photoUrl: snap.config.photoUrl ?? null }   : {}),
        ...(snap.config?.photoPosition !== undefined ? { photoPosition: snap.config.photoPosition } : {}),
        ...(snap.config?.language      !== undefined ? { language: snap.config.language }           : {}),
      },
    })

    this.logger.info("[ResumeService] restoreVersion", { userId, versionId, resumeId: version.resumeId })
    return { resumeId: version.resumeId }
  }

  // ── PHOTO — UPDATE ────────────────────────────────────────────────────────

  async updatePhoto(userId: string, resumeId: string, base64: string): Promise<{ photoUrl: string }> {
    const existing = await db.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.resume.update({ where: { id: resumeId }, data: { photoUrl: base64 } })
    this.logger.info("[ResumeService] updatePhoto", { userId, resumeId })
    return { photoUrl: base64 }
  }

  // ── PHOTO — DELETE ────────────────────────────────────────────────────────

  async deletePhoto(userId: string, resumeId: string): Promise<void> {
    const existing = await db.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } })
    if (!existing) throw new AppError("not_found", 404)

    await db.resume.update({ where: { id: resumeId }, data: { photoUrl: null } })
    this.logger.info("[ResumeService] deletePhoto", { userId, resumeId })
  }
}
