import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { REFERRAL_TIERS } from "@/lib/referral-rewards"
import { isActive } from "@/lib/plans"

// GET /api/referrals — get current user's referral code, stats, cycle count and reward tier
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, referralCode: true, referralRewardTier: true, referralCycleOffset: true },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Auto-generate referral code on first request if not set
  if (!user.referralCode) {
    user = await db.user.update({
      where: { id: session.user.id },
      data: { referralCode: nanoid(8) },
      select: { id: true, referralCode: true, referralRewardTier: true, referralCycleOffset: true },
    })
  }

  const referred = await db.user.findMany({
    where: { referredBy: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })

  const totalReferred = referred.length
  const totalPaid = referred.filter(
    (u) => isActive(u.plan, u.subscriptionEndsAt, u.subscriptionStatus)
  ).length

  // Cycle count = paid referrals since last reset
  const cycleCount = totalPaid - user.referralCycleOffset
  const rewardTier = user.referralRewardTier

  // Next tier to reach in this cycle
  const nextTier = REFERRAL_TIERS.find((t) => t.tier > rewardTier) ?? null

  return NextResponse.json({
    referralCode: user.referralCode,
    totalReferred,
    totalPaid,
    cycleCount,
    rewardTier,
    nextTier: nextTier
      ? { tier: nextTier.tier, threshold: nextTier.threshold, label: nextTier.label }
      : null,
  })
}
