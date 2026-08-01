import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { referralRewardHtml, referralRewardText, referralRewardSubject } from "@/lib/emails/referralReward"
import { createLogger } from "@/lib/logger"

const logger = createLogger("referral-rewards")

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
  { tier: 3, threshold: 10, label: "1 mes gratis",  creditCents: 750 }, // +50% → 100% total ($15)
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

    // H1: idempotent — only count each referred user once per referrer.
    // The ReferralConversion model has a DB-level @@unique([referrerId, referredId]) constraint.
    // A P2002 (unique violation) on create means this conversion was already recorded — safe to exit.
    // Webhook replays and concurrent calls are both handled: the second call hits the constraint and returns early.
    // No stripeEventId guard is needed because the unique key on the conversion row is sufficient.
    try {
      await db.referralConversion.create({ data: { referrerId, referredId: newProUserId } })
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") return // already counted — idempotent exit
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
        // Their own language: this webhook has no request, and the buyer's locale
        // belongs to a different person.
        preferredLocale: true,
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

    const isCycleComplete = newTier === 3

    // Atomic compare-and-swap: claim the tier update before touching Stripe.
    // If another concurrent call already updated the tier, count = 0 and we bail.
    // This prevents double Stripe credits when two referrals convert simultaneously.
    const claimed = isCycleComplete
      ? await db.user.updateMany({
          where: { id: referrer.id, referralRewardTier: currentTier },
          data: { referralRewardTier: 0, referralCycleOffset: totalPaid },
        })
      : await db.user.updateMany({
          where: { id: referrer.id, referralRewardTier: currentTier },
          data: { referralRewardTier: newTier },
        })

    if (claimed.count === 0) return // concurrent call already claimed this tier update

    // Apply incremental credits only after successfully claiming the update
    for (const tierDef of REFERRAL_TIERS) {
      if (tierDef.tier > currentTier && tierDef.tier <= newTier) {
        await applyStripeCredit(
          referrer.stripeCustomerId,
          tierDef.creditCents,
          tierDef.tier,
          tierDef.label,
          referrer.id,
        )
      }
    }

    // Send reward notification email
    await sendReferralRewardEmail({
      referrer,
      newTier,
      currentTier,
      cycleCount,
      isCycleComplete,
    })
  } catch (e) {
    logger.error("checkAndApplyReferralReward failed — manual credit review required", { newProUserId }, e instanceof Error ? e : undefined)
  }
}

interface ReferrerSnapshot {
  id: string
  name: string | null
  email: string | null
  stripeCustomerId: string | null
  referralRewardTier: number
  referralCycleOffset: number
  /** Their own language. The buyer's locale belongs to a different person. */
  preferredLocale: string | null
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
      from: process.env.EMAIL_FROM ?? "Valhalla Resume <no-reply@valhallaresume.com>",
      to: referrer.email,
      // Language: this email goes to the REFERRER, not to the buyer whose payment
      // triggered it, so the checkout locale would be someone else's language. Their own
      // preference is the only correct source.
      subject: referralRewardSubject(referrer.preferredLocale),
      html: referralRewardHtml({
        userName: referrer.name ?? referrer.email,
        userId: referrer.id,
        tier: newTier,
        tierLabel: highestTier.label,
        creditAmount: fmt(newCreditCents),
        totalCredit: fmt(totalCreditCents),
        cycleCount,
        isCycleComplete,
        locale: referrer.preferredLocale,
      }),
      text: referralRewardText({
        userName: referrer.name ?? referrer.email,
        userId: referrer.id,
        tier: newTier,
        tierLabel: highestTier.label,
        creditAmount: fmt(newCreditCents),
        totalCredit: fmt(totalCreditCents),
        cycleCount,
        isCycleComplete,
        locale: referrer.preferredLocale,
      }),
    })
  } catch (e) {
    logger.error("sendReferralRewardEmail failed", { referrerId: referrer.id }, e instanceof Error ? e : undefined)
  }
}

async function applyStripeCredit(
  stripeCustomerId: string | null,
  amountCents: number,
  tier: number,
  label: string,
  referrerId: string,
): Promise<void> {
  if (!stripeEnabled() || !stripe || !stripeCustomerId) return
  try {
    await stripe.customers.createBalanceTransaction(stripeCustomerId, {
      amount: -amountCents,
      currency: "usd",
      description: `Recompensa por referidos — Tier ${tier} (${label})`,
    })
  } catch (err) {
    logger.error("Stripe credit failed — tier NOT updated, manual credit required", { referrerId, tier, amountCents }, err instanceof Error ? err : undefined)
    throw err
  }
}

/** UI helper — next tier info for progress display */
export function getNextTierInfo(currentTier: RewardTier) {
  return REFERRAL_TIERS.find((t) => t.tier > currentTier) ?? null
}
