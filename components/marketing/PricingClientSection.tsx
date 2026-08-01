"use client"

import { TimelineContent } from "@/components/ui/timeline-animation"
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal"
import { BadgeCheck, Check, FileText, Zap, Crown } from "lucide-react"
import { motion } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import PricingButtons from "@/components/marketing/PricingButtons"
import { track } from "@/lib/analytics/track"
import { PRICING } from "@/lib/pricing"
import ManageBillingButton from "@/components/marketing/ManageBillingButton"

interface Props {
  features: string[]
  userIsPro: boolean
  proMemberTitle: string
  proMemberRenews: string
  proMemberActive: string
  planAnnual: string
  planMonthly: string
  cancelAnytime: string
  monthlyLabel: string
  annualLabel: string
  annualBadge: string
  annualEquiv: string
  titleText: string
  subtitleText: string
  accentLabel: string
  subscriptionEndsAt: string | null
  planInterval: string | null
  isEU: boolean
  isEs: boolean
  /** paypalEnabled() server-side. False → method selector absent, Stripe-only. */
  paypalAvailable: boolean
  /** Label for the manage-subscription action (pricing.pro_member_manage). */
  proMemberManage: string
  /** Current plan was provisioned by PayPal → manage in-app (PayPal has no portal). */
  isPayPalPayer: boolean
  /**
   * The Stripe portal can actually be opened: manageable status (ACTIVE · PAST_DUE ·
   * CANCELED) AND a `stripeCustomerId` on the row. Status alone is not enough —
   * `createPortalSession` 400s without a customer.
   */
  canManageBilling: boolean
  /**
   * Subscription cancelled but still inside the paid period. Derived from the STATUS
   * only, so the banner copy stays correct even when no Stripe customer exists.
   */
  subscriptionCancelled: boolean
  /**
   * PRO access with a purchase-blocking status but no gateway behind it. Nothing to
   * cancel, nothing to buy — the Pro card points at support instead of telling the
   * user to cancel a subscription that does not exist.
   */
  billingNeedsSupport: boolean
  /** A live subscription is billing → a recurring checkout would be rejected (ACTIVE · PAST_DUE). */
  blocksRecurringPurchase: boolean
  /**
   * Any subscription still exists → a one-time checkout would be rejected
   * (ACTIVE · PAST_DUE · CANCELED). Stricter on purpose: buying one-time clears
   * `subscriptionId`, and the later `subscription.deleted` event would wipe the
   * one-time window the user paid for.
   */
  blocksOneTimePurchase: boolean
  /** PRO access granted by SUPER_ADMIN role, with nothing purchased. */
  isStaffAccess: boolean
  /**
   * What KIND of access the banner describes. Subscription copy ("your plan renews
   * on X") is a lie for one-time BASIC/SPRINT buyers and for role-based staff access.
   */
  accessKind: "subscription" | "one_time" | "staff"
  /** "Basic" | "Sprint" for the one-time pill; null otherwise. */
  oneTimePlanLabel: string | null
  memberTitleOneTime: string
  memberTitleStaff: string
  /** Already interpolated with the end date (or the no-date variant). */
  memberOneTimeUntil: string
  memberStaffNote: string
  /** Already interpolated. Shown when the subscription is cancelled but still running. */
  memberCancelledUntil: string
}

export default function PricingClientSection({
  features,
  userIsPro,
  proMemberTitle,
  proMemberRenews,
  proMemberActive,
  planAnnual,
  planMonthly,
  cancelAnytime,
  monthlyLabel,
  annualLabel,
  annualBadge,
  annualEquiv,
  titleText,
  subtitleText,
  accentLabel,
  subscriptionEndsAt,
  planInterval,
  isEU,
  isEs,
  paypalAvailable,
  proMemberManage,
  isPayPalPayer,
  canManageBilling,
  subscriptionCancelled,
  billingNeedsSupport,
  blocksRecurringPurchase,
  blocksOneTimePurchase,
  isStaffAccess,
  accessKind,
  oneTimePlanLabel,
  memberTitleOneTime,
  memberTitleStaff,
  memberOneTimeUntil,
  memberStaffNote,
  memberCancelledUntil,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [billing, setBilling] = useState<"annual" | "monthly">("monthly")

  // Fires once when the pricing section mounts. Complements Umami's automatic
  // pageview by marking it as an explicit funnel step for funnel reports.
  // Also detects a return from an abandoned Stripe checkout (cancel_url carries
  // ?checkout=cancelled) → emits checkout_abandoned, then strips the marker so a
  // reload/bookmark can't refire it.
  useEffect(() => {
    track("pricing_viewed")
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    if (url.searchParams.get("checkout") === "cancelled") {
      track("checkout_abandoned", {})
      url.searchParams.delete("checkout")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const t = (es: string, en: string) => (isEs ? es : en)

  // Cancelled but still inside the paid period — the only status that can manage
  // billing while a recurring upgrade stays allowed (see blocksNewPurchase).
  // Its note must NOT say "renews on X": the user cancelled, nothing will renew.
  // Comes from the server as a STATUS fact: it used to be derived from
  // `canManageBilling`, which now also requires a Stripe customer, and that would
  // have silently flipped the copy back to "renews on X" for a cancelled user
  // without one.
  const isCancelledButActive = subscriptionCancelled

  // Banner copy by kind of access, not by a single "is pro" boolean — a lookup instead
  // of nested ternaries so a new access kind can't silently fall through to subscription
  // wording (that fallthrough is exactly what told one-time buyers their plan renews).
  const BANNER_COPY: Record<Props["accessKind"], { title: string; note: string; pill: string | null }> = {
    subscription: {
      title: proMemberTitle,
      note: isCancelledButActive
        ? memberCancelledUntil
        : subscriptionEndsAt
          ? `${proMemberRenews} ${subscriptionEndsAt}`
          : proMemberActive,
      pill: planInterval ? (planInterval === "annual" ? planAnnual : planMonthly) : null,
    },
    one_time: { title: memberTitleOneTime, note: memberOneTimeUntil, pill: oneTimePlanLabel },
    staff: { title: memberTitleStaff, note: memberStaffNote, pill: null },
  }
  const banner = BANNER_COPY[accessKind]

  const revealVariants = {
    visible: (i: number) => ({
      y: 0, opacity: 1, filter: "blur(0px)",
      transition: { delay: i * 0.12, duration: 0.45 },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  }

  // One-time entry tiers
  const basicPerks = isEs
    ? ["Descarga tu CV en PDF", "Descargas ilimitadas", "Sin asistente de IA"]
    : ["Download your CV as PDF", "Unlimited downloads", "No AI assistant"]
  const sprintPerks = isEs
    ? ["IA de contenido para redactar", "Acceso a plantillas PRO", "Sin ATS ni Revisión IA"]
    : ["Content AI to write faster", "Access to PRO templates", "No ATS / AI Review"]

  // CheckRow — shared feature row
  const CheckRow = ({ text, accent }: { text: string; accent: string }) => (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
        style={{ background: `${accent}1A` }}
      >
        <Check className="h-3 w-3" strokeWidth={3} style={{ color: accent }} />
      </span>
      <span className="text-[13px] leading-snug text-slate-600">{text}</span>
    </li>
  )

  const proPlan = billing === "annual" ? "annual" : "monthly"

  return (
    <div className="px-4 pt-8 pb-24 max-w-6xl mx-auto relative" ref={sectionRef}>

      {/* Header */}
      <article className="text-center mb-12 max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <span className="h-px w-7 rounded bg-[#00D4FF]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00D4FF]">{accentLabel}</span>
          <span className="h-px w-7 rounded bg-[#00D4FF]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#1a2e4a]">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.1}
            staggerFrom="first"
            reverse
            containerClassName="justify-center flex-wrap"
            transition={{ type: "spring", stiffness: 250, damping: 40, delay: 0 }}
          >
            {titleText}
          </VerticalCutReveal>
        </h1>
        <TimelineContent
          animationNum={0}
          timelineRef={sectionRef}
          customVariants={revealVariants}
          className="text-base mt-4 mx-auto max-w-lg text-[#6B7A8C]"
        >
          {subtitleText}
        </TimelineContent>
      </article>

      {/* Pro member banner */}
      {userIsPro && (
        <TimelineContent animationNum={1} timelineRef={sectionRef} customVariants={revealVariants} className="mb-8 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#00D4FF]/25 bg-gradient-to-br from-[#00D4FF]/[0.07] to-[#1a2e4a]/[0.04] px-6 py-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-6 w-6 shrink-0 text-[#00D4FF]" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-bold text-[#1a2e4a]">{banner.title}</p>
                  {banner.pill && (
                    <span className="rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#00D4FF]">
                      {banner.pill}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] text-[#6B7A8C]">{banner.note}</p>
              </div>
            </div>
            {/* Only users with a real recurring subscription get a manage action:
                staff access and one-time BASIC/SPRINT have no billing to manage,
                and the Stripe portal 400s for them.
                PayPal payers have no hosted portal — send them to Settings, where
                the provider-aware cancel lives. Stripe payers get the portal. */}
            {!canManageBilling ? null : isPayPalPayer ? (
              <a
                href={`/${isEs ? "es" : "en"}/dashboard/settings`}
                className="shrink-0 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2"
              >
                {proMemberManage}
              </a>
            ) : (
              <ManageBillingButton />
            )}
          </div>
        </TimelineContent>
      )}

      {/* ── Unified 3-tier grid ── */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch relative z-10">

        {/* ───────── BASIC ───────── */}
        <TimelineContent animationNum={2} timelineRef={sectionRef} customVariants={revealVariants} className="h-full">
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 p-7 shadow-[0_14px_36px_-14px_rgba(26,46,74,0.20),0_4px_10px_-6px_rgba(26,46,74,0.10)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-20px_rgba(26,46,74,0.32)]"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />

            <div className="relative mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#1a2e4a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_2px_6px_-2px_rgba(26,46,74,0.2)]">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-bold text-[#1a2e4a]">Basic</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t("1 mes · sin suscripción", "1 month · no subscription")}</p>
              </div>
            </div>
            <div className="relative mb-1 flex items-baseline gap-1">
              <span className="self-start mt-1 text-sm font-semibold text-slate-400">$</span>
              <span className="text-5xl font-extrabold tabular-nums tracking-[-0.04em] text-[#1a2e4a]">{PRICING.basic}</span>
              <span className="text-sm font-medium text-slate-400">{t("pago único", "one-time")}</span>
            </div>
            <p className="relative mb-5 text-[13px] text-slate-400">{t("Empieza sin atarte a nada: pagas una vez y ya.", "Start without committing to anything: pay once, done.")}</p>
            <div className="relative mb-5 h-px bg-slate-100" />
            <ul className="relative mb-6 flex flex-col gap-3">
              {basicPerks.map((p) => <CheckRow key={p} text={p} accent="#1a2e4a" />)}
            </ul>
            <div className="relative mb-6 flex flex-1 items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-[12px] leading-snug text-slate-500">{t("¿Necesitas IA, ATS y plantillas PRO? Está todo en el plan Pro.", "Need AI, ATS and PRO templates? It's all in the Pro plan.")}</p>
            </div>
            <div className="relative mt-auto">
              <PricingButtons
                plan="basic"
                isStaffAccess={isStaffAccess}
                blocksPurchase={blocksOneTimePurchase}
                billingNeedsSupport={billingNeedsSupport}
                alreadyCancelled={isCancelledButActive}
                currentPlanEndsAt={subscriptionEndsAt}
                isEU={isEU}
                paypalAvailable={paypalAvailable}
                buttonClassName="!bg-white !text-[#1a2e4a] !font-semibold !rounded-[14px] !border !border-[#1a2e4a]/20 hover:!bg-[#1a2e4a]/[0.03] !py-3.5 w-full"
              />
              <p className="mt-2.5 text-center text-[11px] text-slate-300">{t("Pago único, sin renovación", "One-time, no renewal")}</p>
            </div>
          </motion.div>
        </TimelineContent>

        {/* ───────── JOB SPRINT ───────── */}
        <TimelineContent animationNum={3} timelineRef={sectionRef} customVariants={revealVariants} className="h-full">
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#00D4FF]/30 bg-gradient-to-b from-white to-[#00D4FF]/[0.05] p-7 shadow-[0_14px_36px_-14px_rgba(0,150,200,0.20),0_4px_10px_-6px_rgba(0,150,200,0.12)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-20px_rgba(0,180,220,0.42)]"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#00D4FF]/60 to-transparent" />

            <div className="relative mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00D4FF]/12 text-[#00B4DB] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_2px_8px_-2px_rgba(0,180,220,0.35)]">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-bold text-[#1a2e4a]">Job Sprint</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00B4DB]">{t("7 días · sin suscripción", "7 days · no subscription")}</p>
              </div>
            </div>
            <div className="relative mb-1 flex items-baseline gap-1">
              <span className="self-start mt-1 text-sm font-semibold text-slate-400">$</span>
              <span className="text-5xl font-extrabold tabular-nums tracking-[-0.04em] text-[#1a2e4a]">{PRICING.sprint}</span>
              <span className="text-sm font-medium text-slate-400">{t("pago único", "one-time")}</span>
            </div>
            <p className="relative mb-5 text-[13px] text-slate-400">{t("Una semana con IA para redactar. Pagas una vez.", "A week with AI to write. Pay once.")}</p>
            <div className="relative mb-5 h-px bg-slate-100" />
            <ul className="relative mb-6 flex flex-col gap-3">
              {sprintPerks.map((p) => <CheckRow key={p} text={p} accent="#00B4DB" />)}
            </ul>
            <div className="relative mb-6 flex flex-1 items-center rounded-2xl border border-dashed border-[#00D4FF]/30 bg-[#00D4FF]/[0.04] px-4 py-3">
              <p className="text-[12px] leading-snug text-slate-500">{t("¿Buscas ATS Score y Revisión IA? Los desbloqueas en el plan Pro.", "Want ATS Score and AI Review? Unlock them in the Pro plan.")}</p>
            </div>
            <div className="relative mt-auto">
              <PricingButtons
                plan="sprint"
                isStaffAccess={isStaffAccess}
                blocksPurchase={blocksOneTimePurchase}
                billingNeedsSupport={billingNeedsSupport}
                alreadyCancelled={isCancelledButActive}
                currentPlanEndsAt={subscriptionEndsAt}
                isEU={isEU}
                paypalAvailable={paypalAvailable}
                buttonClassName="!bg-[#00D4FF] !text-[#06283D] !font-bold !rounded-[14px] !border-0 !py-3.5 hover:!brightness-105 w-full"
              />
              <p className="mt-2.5 text-center text-[11px] text-slate-300">{t("Pago único, sin renovación", "One-time, no renewal")}</p>
            </div>
          </motion.div>
        </TimelineContent>

        {/* ───────── PRO (featured) ───────── */}
        <TimelineContent animationNum={4} timelineRef={sectionRef} customVariants={revealVariants} className="h-full">
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="group relative h-full lg:scale-[1.03]"
          >
            {/* glow */}
            <div className="pointer-events-none absolute -inset-1.5 rounded-[30px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,255,0.45),transparent_70%)] blur-2xl transition-opacity duration-300 group-hover:opacity-90" />
            {/* gradient ring */}
            <div className="relative h-full rounded-[26px] bg-gradient-to-b from-[#00D4FF] via-[#0099CC] to-[#1a2e4a] p-[1.5px] shadow-[0_24px_60px_-18px_rgba(0,150,200,0.5),0_8px_20px_-10px_rgba(26,46,74,0.3)]">
              <div className="flex h-full flex-col rounded-[24px] bg-white p-7">
                {/* badge */}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#0066FF] px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-lg">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  {t("Más popular", "Most popular")}
                </span>

                <div className="mb-5 mt-1 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0a1e35] text-[#00D4FF]">
                    <Crown className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1a2e4a]">Pro</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t("Todo incluido", "Everything included")}</p>
                  </div>
                </div>

                {/* Billing options — both prices always visible, monthly separated */}
                <div className="mb-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBilling("annual")}
                    aria-pressed={billing === "annual"}
                    className={`relative flex items-center justify-between rounded-2xl border px-4 py-3 pr-9 text-left transition-all ${
                      billing === "annual"
                        ? "border-[#00D4FF] bg-[#00D4FF]/[0.06] shadow-[0_6px_18px_-8px_rgba(0,212,255,0.5)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span aria-hidden className={`absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border-2 ${billing === "annual" ? "border-[#00D4FF]" : "border-slate-300"}`}>
                      {billing === "annual" && <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#1a2e4a]">{annualLabel}</span>
                        <span className="rounded bg-[#00D4FF]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#00B4DB]">{annualBadge}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#00B4DB]">{annualEquiv}</p>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-0.5">
                      <span className="text-xs font-semibold text-slate-400">$</span>
                      <span className="text-[26px] font-extrabold tabular-nums tracking-[-0.03em] text-[#1a2e4a]">{PRICING.proAnnual}</span>
                      <span className="text-[11px] font-medium text-slate-400">{t("/año", "/yr")}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBilling("monthly")}
                    aria-pressed={billing === "monthly"}
                    className={`relative flex items-center justify-between rounded-2xl border px-4 py-3 pr-9 text-left transition-all ${
                      billing === "monthly"
                        ? "border-[#00D4FF] bg-[#00D4FF]/[0.06] shadow-[0_6px_18px_-8px_rgba(0,212,255,0.5)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span aria-hidden className={`absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border-2 ${billing === "monthly" ? "border-[#00D4FF]" : "border-slate-300"}`}>
                      {billing === "monthly" && <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#1a2e4a]">{monthlyLabel}</span>
                        <span className="rounded bg-[#00D4FF]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#00B4DB]">{t("Más popular", "Most popular")}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">{t("Facturado cada mes", "Billed monthly")}</p>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-0.5">
                      <span className="text-xs font-semibold text-slate-400">$</span>
                      <span className="text-[26px] font-extrabold tabular-nums tracking-[-0.03em] text-[#1a2e4a]">{PRICING.proMonthly}</span>
                      <span className="text-[11px] font-medium text-slate-400">{t("/mes", "/mo")}</span>
                    </div>
                  </button>
                </div>


                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <ul className="mb-7 grid grid-cols-1 gap-2.5">
                  {features.map((f) => <CheckRow key={f} text={f} accent="#00B4DB" />)}
                </ul>

                <div className="mt-auto">
                  <PricingButtons
                    plan={proPlan}
                    isStaffAccess={isStaffAccess}
                    blocksPurchase={blocksRecurringPurchase}
                    billingNeedsSupport={billingNeedsSupport}
                    alreadyCancelled={isCancelledButActive}
                    currentPlanEndsAt={subscriptionEndsAt}
                    isEU={isEU}
                    paypalAvailable={paypalAvailable}
                    buttonClassName="!bg-gradient-to-r !from-[#00D4FF] !to-[#0099CC] !text-[#06283D] !font-bold !rounded-[14px] !border-0 !py-3.5 !shadow-[0_8px_24px_rgba(0,212,255,0.35)] hover:!brightness-105 w-full"
                  />
                  <p className="mt-2.5 text-center text-[11px] text-slate-300">{cancelAnytime}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </TimelineContent>
      </div>
    </div>
  )
}
