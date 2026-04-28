import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"

/**
 * Referral reward tiers — based on paid referrals in the CURRENT cycle.
 *
 * Cycle resets to 0 after tier 3 is reached and the reward applied,
 * so users can earn rewards repeatedly.
 *
 * Tier thresholds (cycleCount needed to enter tier):
 *   3–4  → 30% discount ($4.50 credit)
 *   5–8  → 50% discount (+$3.00, total $7.50)
 *   9–10 → 100% discount (+$7.50, total $15 = 1 free month)
 *
 * Credits are incremental — each new tier adds only the DIFFERENCE,
 * so the total accumulated equals the value of the highest tier reached.
 * When tier 3 reward is applied, cycle resets.
 */
export const REFERRAL_TIERS = [
  { tier: 1, threshold: 3,  label: "30% descuento", creditCents: 450 }, // 30% of $15
  { tier: 2, threshold: 5,  label: "50% descuento", creditCents: 300 }, // +20% → 50% total
  { tier: 3, threshold: 9,  label: "1 mes gratis",  creditCents: 750 }, // +50% → 100% total ($15)
] as const

export type RewardTier = 0 | 1 | 2 | 3

/**
 * Called after a new user converts to Pro.
 * Checks if their referrer has crossed a new tier in the current cycle
 * and applies the incremental Stripe credit. Resets cycle after tier 3.
 */
export async function checkAndApplyReferralReward(newProUserId: string): Promise<void> {
  try {
    const newUser = await db.user.findUnique({
      where: { id: newProUserId },
      select: { referredBy: true },
    })
    if (!newUser?.referredBy) return

    const referrer = await db.user.findUnique({
      where: { id: newUser.referredBy },
      select: {
        id: true,
        referralRewardTier: true,
        referralCycleOffset: true,
        stripeCustomerId: true,
      },
    })
    if (!referrer) return

    // Total paid referrals ever
    const totalPaid = await db.user.count({
      where: {
        referredBy: referrer.id,
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
      },
    })

    // Current cycle count
    const cycleCount = totalPaid - referrer.referralCycleOffset
    const currentTier = referrer.referralRewardTier as RewardTier

    // Determine new tier based on cycle count
    let newTier = currentTier
    for (const { tier, threshold } of REFERRAL_TIERS) {
      if (cycleCount >= threshold && tier > currentTier) {
        newTier = tier as RewardTier
      }
    }

    if (newTier === currentTier) return // no change

    // Apply incremental credits for each tier crossed in this event
    for (const tierDef of REFERRAL_TIERS) {
      if (tierDef.tier > currentTier && tierDef.tier <= newTier) {
        await applyStripeCredit(
          referrer.stripeCustomerId,
          tierDef.creditCents,
          tierDef.tier,
          tierDef.label,
        )
      }
    }

    if (newTier === 3) {
      // Cycle complete — reset for next round
      await db.user.update({
        where: { id: referrer.id },
        data: {
          referralRewardTier: 0,
          referralCycleOffset: totalPaid, // next cycle starts from here
        },
      })
      console.log(`[referral-rewards] Referrer ${referrer.id} completed cycle (${cycleCount} refs) — reset to 0`)
    } else {
      await db.user.update({
        where: { id: referrer.id },
        data: { referralRewardTier: newTier },
      })
      console.log(`[referral-rewards] Referrer ${referrer.id} reached tier ${newTier} (cycle count: ${cycleCount})`)
    }
  } catch (err) {
    console.error("[referral-rewards] error applying reward:", err)
  }
}

async function applyStripeCredit(
  stripeCustomerId: string | null,
  amountCents: number,
  tier: number,
  label: string,
): Promise<void> {
  if (!stripeEnabled() || !stripe || !stripeCustomerId) return
  try {
    await stripe.customers.createBalanceTransaction(stripeCustomerId, {
      amount: -amountCents,
      currency: "usd",
      description: `Recompensa por referidos — Tier ${tier} (${label})`,
    })
    console.log(`[referral-rewards] $${amountCents / 100} credit → ${stripeCustomerId} (tier ${tier})`)
  } catch (err) {
    console.error(`[referral-rewards] Stripe credit failed for ${stripeCustomerId}:`, err)
  }
}

/** UI helper — next tier info for progress display */
export function getNextTierInfo(currentTier: RewardTier) {
  return REFERRAL_TIERS.find((t) => t.tier > currentTier) ?? null
}
