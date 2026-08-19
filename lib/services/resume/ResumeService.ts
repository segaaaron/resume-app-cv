// lib/services/resume/ResumeService.ts
import { db } from "@/lib/db"
import { forgetResumeAnswers } from "@/lib/services/ai/shared/answer-cache"
import { createLogger } from "@/lib/logger"
import type { ILogger } from "@/lib/interfaces/ILogger"

const moduleLogger = createLogger("resume-service")
import { AppError } from "@/lib/services/auth/AppError"
import { DEFAULT_SECTIONS, ResumeSectionsSchema, DEFAULT_TEMPLATE_ID } from "@/types/resume"
import { isActive, effectivePlan, resolveResumeLimit } from "@/lib/plans"
import { nanoid } from "nanoid"
import { z } from "zod"

// ─── Shared helpers ──────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

async function enforceResumeLimit(tx: TxClient, userId: string, maxResumes: number, op = "create"): Promise<void> {
  if (maxResumes === -1) return
  const count = await tx.resume.count({ where: { userId } })
  if (count >= maxResumes) {
    db.auditLog.create({
      data: { userId, action: "FREE_RESUME_LIMIT_HIT", metadata: { limit: maxResumes, op } },
    }).catch((err) => {
      moduleLogger.error("enforceResumeLimit: auditLog FREE_RESUME_LIMIT_HIT failed", { userId, op }, err instanceof Error ? err : undefined)
    })
    throw new AppError("plan_limit_resume", 403, { limit: maxResumes })
  }
}

// A résumé's `sections` array carries LAYOUT descriptors — id, type, label, column,
// visibility — while the actual content lives in `sectionData` (capped at 500 KB below).
// A real CV has ~10-14 of them and serialises to a couple of KB. It was the one field in
// the body with no bound at all: `z.array(z.any())`, and App Router route handlers have
// no default body-size limit, so any signed-in user could PATCH megabytes into the row
// and keep doing it. These caps sit far above any genuine résumé and far below anything
// that hurts the database.
const MAX_SECTIONS = 60
const MAX_SECTIONS_BYTES = 100_000

const sectionsSchema = z
  .array(z.any())
  .max(MAX_SECTIONS, { message: "too many sections" })
  .refine((val) => JSON.stringify(val).length <= MAX_SECTIONS_BYTES, { message: "sections too large" })

// ─── Snapshot schema (mirrors autosave fields) ────────────────────────────────

export const snapshotConfigSchema = z.object({
  templateId:    z.string().max(100).optional(),
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
  sections:    sectionsSchema.optional(),
  sectionData: ResumeSectionsSchema.optional(),
  config:      snapshotConfigSchema,
})

export type ResumeSnapshot = z.infer<typeof snapshotSchema>

// ─── PATCH body shape ─────────────────────────────────────────────────────────

export const resumePatchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  sections:    sectionsSchema.optional(),
  sectionData: z.record(z.string(), z.unknown()).optional().refine(
    (val) => !val || JSON.stringify(val).length <= 500_000,
    { message: "sectionData too large" }
  ),
  config: z.object({
    templateId:    z.string().max(100).optional(),
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
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, name: true, subscriptionEndsAt: true, managedResumeLimit: true } })
    const maxResumes = resolveResumeLimit(user ? effectivePlan(user) : "UNSUBSCRIBED", user?.managedResumeLimit)

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
      await enforceResumeLimit(tx, userId, maxResumes)
      return tx.resume.create({
        data: {
          userId,
          title: "Mi CV",
          sections: DEFAULT_SECTIONS as object[],
          personalDetails: defaultData as object,
          templateId: templateId ?? DEFAULT_TEMPLATE_ID,
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
    const { title, sections, sectionData, config } = patch

    const r = await db.resume.updateMany({
      where: { id: resumeId, userId },
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
    if (r.count === 0) throw new AppError("not_found", 404)

    this.logger.info("[ResumeService] update", { userId, resumeId })
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  async delete(userId: string, resumeId: string): Promise<void> {
    const r = await db.resume.deleteMany({ where: { id: resumeId, userId } })
    if (r.count === 0) throw new AppError("not_found", 404)
    // Everything we cached FROM this CV goes with it. Those payloads quote the
    // candidate's own bullets, and the rows are addressed by content — after the
    // résumé is gone nothing else could ever find them to clean up.
    const forgotten = await forgetResumeAnswers(resumeId)
    this.logger.info("[ResumeService] delete", { userId, resumeId, cachedAnswersCleared: forgotten })

    // NOTE — the audit trail is asymmetric, and this is where it shows.
    //
    // Creating a CV writes CREATE_RESUME to AuditLog; deleting one writes
    // nothing. Measured on 2026-08-19: the trail held 11 CREATE_RESUME entries
    // and zero deletions for a day in which all 11 of those CVs were gone. That
    // is not evidence that nothing deleted them — it is no evidence either way,
    // and it makes "I lost my CV" impossible to investigate, because a user's
    // own click and a bug that ate their work look identical from here.
    //
    // Closing it needs one value in the AuditAction enum plus its migration,
    // which is infrastructure and not a call this file gets to make on its own.
    // Until then the line above is the only trace, and it lives in the app log
    // rather than the audit trail.
  }

  // ── DUPLICATE ─────────────────────────────────────────────────────────────

  async duplicate(userId: string, resumeId: string) {
    const [original, user] = await Promise.all([
      db.resume.findFirst({ where: { id: resumeId, userId } }),
      db.user.findUnique({ where: { id: userId }, select: { plan: true, subscriptionEndsAt: true, managedResumeLimit: true } }),
    ])

    if (!original) throw new AppError("not_found", 404)

    const maxResumes = resolveResumeLimit(user ? effectivePlan(user) : "UNSUBSCRIBED", user?.managedResumeLimit)

    const copy = await db.$transaction(async (tx) => {
      await enforceResumeLimit(tx, userId, maxResumes, "duplicate")
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

  /**
   * Creates a NEW resume that is a translated copy of `sourceId`. The original is
   * left untouched. Style/layout columns are copied from the source; the caller
   * supplies the already-translated content (`personalDetails`), the layout with
   * translated section labels (`sections`), the new title and the target language.
   * Counts against the plan's resume limit like any other new resume.
   */
  async createTranslatedCopy(
    userId: string,
    sourceId: string,
    translated: { personalDetails: object; sections: object[]; title: string; language: "es" | "en" },
  ) {
    const [original, user] = await Promise.all([
      db.resume.findFirst({ where: { id: sourceId, userId } }),
      db.user.findUnique({ where: { id: userId }, select: { plan: true, subscriptionEndsAt: true, managedResumeLimit: true } }),
    ])

    if (!original) throw new AppError("not_found", 404)

    const maxResumes = resolveResumeLimit(user ? effectivePlan(user) : "UNSUBSCRIBED", user?.managedResumeLimit)

    const copy = await db.$transaction(async (tx) => {
      await enforceResumeLimit(tx, userId, maxResumes, "translate")
      return tx.resume.create({
        data: {
          userId,
          title:           translated.title,
          templateId:      original.templateId,
          colorScheme:     original.colorScheme,
          fontFamily:      original.fontFamily,
          fontSize:        original.fontSize,
          spacing:         original.spacing,
          sections:        translated.sections as object[],
          personalDetails: translated.personalDetails as object,
          photoUrl:        original.photoUrl,
          photoPosition:   original.photoPosition,
          language:        translated.language,
          translatedFromId: sourceId,
        },
      })
    })

    this.logger.info("[ResumeService] translate copy", { userId, sourceId, copyId: copy.id, language: translated.language })
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
        select: {
          plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true,
          isManaged: true, managedBlocked: true, managedExpiresAt: true,
        },
      }),
      db.resume.findFirst({ where: { id: resumeId, userId } }),
    ])
    if (!isActive(
      user?.plan ?? "UNSUBSCRIBED",
      user?.subscriptionEndsAt,
      user?.subscriptionStatus,
      user?.role,
      user?.isManaged,
      user?.managedBlocked,
      user?.managedExpiresAt,
    )) {
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
    const r = await db.resume.updateMany({
      where: { id: resumeId, userId },
      data: { photoUrl: base64 },
    })
    if (r.count === 0) throw new AppError("not_found", 404)
    this.logger.info("[ResumeService] updatePhoto", { userId, resumeId })
    return { photoUrl: base64 }
  }

  // ── PHOTO — DELETE ────────────────────────────────────────────────────────

  async deletePhoto(userId: string, resumeId: string): Promise<void> {
    const r = await db.resume.updateMany({
      where: { id: resumeId, userId },
      data: { photoUrl: null },
    })
    if (r.count === 0) throw new AppError("not_found", 404)
    this.logger.info("[ResumeService] deletePhoto", { userId, resumeId })
  }
}
