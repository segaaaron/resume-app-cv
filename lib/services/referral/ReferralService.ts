// lib/services/referral/ReferralService.ts
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { AppError } from "@/lib/services/auth/AppError"
import { REFERRAL_TIERS } from "@/lib/referral-rewards"
import { isActive } from "@/lib/plans"

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ReferralTierInfo {
  tier: number
  threshold: number
  label: string
}

export interface ReferralStatusResult {
  referralCode: string
  totalReferred: number
  totalPaid: number
  cycleCount: number
  rewardTier: number
  nextTier: ReferralTierInfo | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ReferralService {
  constructor(private readonly logger: ILogger) {}

  /**
   * Get the current user's referral code and stats.
   * Auto-generates a referral code on first request if the user doesn't have one.
   */
  async getStatus(userId: string): Promise<ReferralStatusResult> {
    let user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, referralRewardTier: true, referralCycleOffset: true },
    })

    if (!user) {
      throw new AppError("not_found", 404)
    }

    // Auto-generate referral code on first request if not set
    if (!user.referralCode) {
      user = await db.user.update({
        where: { id: userId },
        data: { referralCode: nanoid(8) },
        select: { id: true, referralCode: true, referralRewardTier: true, referralCycleOffset: true },
      })
      this.logger.info("ReferralService.getStatus: generated referral code", { userId })
    }

    const referred = await db.user.findMany({
      where: { referredBy: userId },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
    })

    const totalReferred = referred.length
    const totalPaid = referred.filter(
      (u) => isActive(u.plan, u.subscriptionEndsAt, u.subscriptionStatus)
    ).length

    // Cycle count = paid referrals since last tier reset
    const cycleCount = totalPaid - (user.referralCycleOffset ?? 0)
    const rewardTier = user.referralRewardTier ?? 0

    // Next tier to reach in this cycle
    const nextTier = REFERRAL_TIERS.find((t) => t.tier > rewardTier) ?? null

    return {
      referralCode: user.referralCode!,
      totalReferred,
      totalPaid,
      cycleCount,
      rewardTier,
      nextTier: nextTier
        ? { tier: nextTier.tier, threshold: nextTier.threshold, label: nextTier.label }
        : null,
    }
  }
}
