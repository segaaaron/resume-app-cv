// lib/free-quota-status.ts
//
// Aggregates UNSUBSCRIBED / PRO quota usage into a single payload the UI can consume
// to render counters, badges and disabled states on AI buttons / download CTAs.

import { db } from "@/lib/db"
import {
  AI_ENDPOINT_NAMES,
  getLimits,
  type AiEndpointName,
} from "@/lib/plans"

export type AiEndpointStatus = {
  used: number
  /** -1 = unlimited */
  limit: number
  /** Infinity when unlimited, otherwise max(limit - used, 0) */
  remaining: number
  /** True when the endpoint is hard-blocked for this plan (limit = 0). */
  blocked: boolean
}

export type AiQuotaStatus = Record<AiEndpointName, AiEndpointStatus>

export type PlanQuotaInfo = {
  plan: string
  resumes: { used: number; limit: number; remaining: number }
  coverLetters: { used: number; limit: number; remaining: number }
  canExportPdf: boolean
  canImport: boolean
}

export type QuotaStatusPayload = {
  ai: AiQuotaStatus
  plan: PlanQuotaInfo
}

function describe(used: number, limit: number) {
  if (limit === -1) {
    return { used, limit: -1, remaining: Number.POSITIVE_INFINITY }
  }
  return { used, limit, remaining: Math.max(limit - used, 0) }
}

/** Returns per-endpoint AI quota status for the given user/plan. */
export async function getAiQuotaStatus(userId: string, plan: string): Promise<AiQuotaStatus> {
  const limits = getLimits(plan)

  const rows = await db.aIRateLimit.findMany({
    where: { userId, endpoint: { in: AI_ENDPOINT_NAMES as unknown as string[] } },
    select: { endpoint: true, count: true },
  })
  const used = new Map<string, number>(rows.map((r) => [r.endpoint, r.count]))

  const status = {} as AiQuotaStatus
  for (const endpoint of AI_ENDPOINT_NAMES) {
    const limit = limits.aiLimitsByEndpoint[endpoint]
    const u = used.get(endpoint) ?? 0
    const { remaining } = describe(u, limit)
    status[endpoint] = {
      used: u,
      limit,
      remaining,
      blocked: limit === 0,
    }
  }
  return status
}

/** Returns the full quota payload (AI + plan counters) for a user. */
export async function getQuotaStatusPayload(userId: string, plan: string): Promise<QuotaStatusPayload> {
  const limits = getLimits(plan)

  const [ai, resumesUsed, coverLettersUsed] = await Promise.all([
    getAiQuotaStatus(userId, plan),
    db.resume.count({ where: { userId } }),
    db.coverLetter.count({ where: { userId } }),
  ])

  return {
    ai,
    plan: {
      plan,
      resumes: describe(resumesUsed, limits.maxResumes),
      coverLetters: describe(coverLettersUsed, limits.maxCoverLetters),
      canExportPdf: limits.canExportPdf,
      canImport: limits.canImport,
    },
  }
}
