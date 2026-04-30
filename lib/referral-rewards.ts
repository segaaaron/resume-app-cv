import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { referralRewardHtml, referralRewardText } from "@/lib/emails/referralReward"

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
      select: { referredBy: true, emailVerified: true },
    })
    if (!newUser?.referredBy) return

    // H2: only count email-verified users
    if (newUser.emailVerified === null) return

    const referrerId = newUser.referredBy

    // H1: idempotent — only count each referred user once per referrer
    try {
      await db.referralConversion.create({ data: { referrerId, referredId: newProUserId } })
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") return // already counted
      throw e
    }

    const referrer = await db.user.findUnique({
      where: { id: referrerId },
      select: {
        id: true,
        name: true,
        email: true,
        referralRewardTier: true,
        referralCycleOffset: true,
        stripeCustomerId: true,
      },
    })
    if (!referrer) return

    // Total paid referrals ever — counted via ReferralConversion for dedup
    const totalPaid = await db.referralConversion.count({
      where: { referrerId: referrer.id },
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

    const isCycleComplete = newTier === 3

    if (isCycleComplete) {
      // Cycle complete — reset for next round
      await db.user.update({
        where: { id: referrer.id },
        data: {
          referralRewardTier: 0,
          referralCycleOffset: totalPaid, // next cycle starts from here
        },
      })
    } else {
      await db.user.update({
        where: { id: referrer.id },
        data: { referralRewardTier: newTier },
      })
    }

    // Send reward notification email
    await sendReferralRewardEmail({
      referrer,
      newTier,
      currentTier,
      cycleCount,
      isCycleComplete,
    })
  } catch {
    // silently ignore
  }
}

interface ReferrerSnapshot {
  id: string
  name: string | null
  email: string | null
  stripeCustomerId: string | null
  referralRewardTier: number
  referralCycleOffset: number
}

async function sendReferralRewardEmail({
  referrer,
  newTier,
  currentTier,
  cycleCount,
  isCycleComplete,
}: {
  referrer: ReferrerSnapshot
  newTier: number
  currentTier: number
  cycleCount: number
  isCycleComplete: boolean
}): Promise<void> {
  if (!emailEnabled() || !resend || !referrer.email) return

  // Calculate credit amounts for the email
  const tiersApplied = REFERRAL_TIERS.filter(
    (t) => t.tier > currentTier && t.tier <= newTier
  )
  const newCreditCents = tiersApplied.reduce((sum, t) => sum + t.creditCents, 0)
  const totalCreditCents = REFERRAL_TIERS.filter((t) => t.tier <= newTier).reduce(
    (sum, t) => sum + t.creditCents,
    0
  )

  const highestTier = REFERRAL_TIERS.find((t) => t.tier === newTier)
  if (!highestTier) return

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  try {
    await resend.emails.send({
      from: "READY CV <no-reply@readycvv.com>",
      to: referrer.email,
      subject: isCycleComplete
        ? "🏆 ¡1 mes gratis! Completaste tu ciclo de referidos"
        : `🎉 Nivel ${newTier} de referidos alcanzado — ${highestTier.label}`,
      html: referralRewardHtml({
        userName: referrer.name ?? referrer.email,
        userEmail: referrer.email,
        tier: newTier,
        tierLabel: highestTier.label,
        creditAmount: fmt(newCreditCents),
        totalCredit: fmt(totalCreditCents),
        cycleCount,
        isCycleComplete,
      }),
      text: referralRewardText({
        userName: referrer.name ?? referrer.email,
        userEmail: referrer.email,
        tier: newTier,
        tierLabel: highestTier.label,
        creditAmount: fmt(newCreditCents),
        totalCredit: fmt(totalCreditCents),
        cycleCount,
        isCycleComplete,
      }),
    })
  } catch {
    // silently ignore
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
  } catch {
    // silently ignore
  }
}

/** UI helper — next tier info for progress display */
export function getNextTierInfo(currentTier: RewardTier) {
  return REFERRAL_TIERS.find((t) => t.tier > currentTier) ?? null
}
