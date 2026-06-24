"use client"

import { TimelineContent } from "@/components/ui/timeline-animation"
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal"
import { BadgeCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"
import PricingButtons from "@/components/marketing/PricingButtons"
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
}

const featureIcons = ["◆","◆","◆","◆","◆","◆","◆","◆","◆","◆","◆"]

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
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)

  // One-time entry plans (shown to non-PRO visitors). Copy inline (bilingual)
  // to avoid an i18n migration; these are secondary to the PRO hero cards.
  const oneTime = [
    {
      plan: "basic" as const,
      name: "Basic",
      price: "2.99",
      unit: isEs ? "pago único" : "one-time",
      validity: isEs ? "Acceso 1 mes" : "1-month access",
      accent: "#1a2e4a",
      perks: isEs
        ? ["Descarga tu CV (PDF)", "Descargas ilimitadas", "Sin asistente de IA"]
        : ["Download your CV (PDF)", "Unlimited downloads", "No AI assistant"],
    },
    {
      plan: "sprint" as const,
      name: "Job Sprint",
      price: "7.99",
      unit: isEs ? "pago único" : "one-time",
      validity: isEs ? "Acceso 7 días" : "7-day access",
      accent: "#00D4FF",
      perks: isEs
        ? ["IA de contenido", "Plantillas PRO", "Sin ATS ni Revisión IA"]
        : ["Content AI", "PRO templates", "No ATS / AI Review"],
    },
  ]

  const revealVariants = {
    visible: (i: number) => ({
      y: 0, opacity: 1, filter: "blur(0px)",
      transition: { delay: i * 0.18, duration: 0.45 },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  }

  // Split features into 2 columns for annual card
  const half = Math.ceil(features.length / 2)
  const col1 = features.slice(0, half)
  const col2 = features.slice(half)

  return (
    <>
      <div className="px-4 pt-8 pb-20 max-w-5xl mx-auto relative" ref={sectionRef}>

        {/* Header */}
        <article className="text-left mb-12 max-w-2xl relative z-10">
          {/* Accent line */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <div style={{ width: 28, height: 2, background: "#00D4FF", borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#00D4FF" }}>
              {accentLabel}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold" style={{ color: "#1a2e4a", letterSpacing: "-0.02em" }}>
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.12}
              staggerFrom="first"
              reverse={true}
              containerClassName="justify-start flex-wrap"
              transition={{ type: "spring", stiffness: 250, damping: 40, delay: 0 }}
            >
              {titleText}
            </VerticalCutReveal>
          </h1>

          <TimelineContent
            animationNum={0}
            timelineRef={sectionRef}
            customVariants={revealVariants}
            className="text-base mt-4 max-w-lg text-[#6B7A8C]"
          >
            {subtitleText}
          </TimelineContent>
        </article>

        {/* Pro member banner */}
        {userIsPro && (
          <TimelineContent animationNum={1} timelineRef={sectionRef} customVariants={revealVariants} className="mb-8 relative z-10">
            <div style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(26,46,74,0.04))",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: 16, padding: "18px 24px",
              display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <BadgeCheck style={{ width: 26, height: 26, color: "#00D4FF", flexShrink: 0 }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 700, color: "#1a2e4a", fontSize: 15 }}>{proMemberTitle}</p>
                    {planInterval && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "2px 8px", borderRadius: 999,
                        background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)",
                      }}>
                        {planInterval === "annual" ? planAnnual : planMonthly}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7A8C", marginTop: 2 }}>
                    {subscriptionEndsAt ? `${proMemberRenews} ${subscriptionEndsAt}` : proMemberActive}
                  </p>
                </div>
              </div>
              <ManageBillingButton />
            </div>
          </TimelineContent>
        )}

        {/* ── Cards grid ── */}
        <div className="grid sm:grid-cols-2 gap-6 relative z-10" style={{ alignItems: "start" }}>

          {/* ══════════ MONTHLY CARD ══════════ */}
          <TimelineContent animationNum={2} timelineRef={sectionRef} customVariants={revealVariants}>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{
                background: "white",
                border: "1.5px solid #E2E8F4",
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 2px 20px rgba(26,46,74,0.06)",
                transition: "border-color 0.22s, box-shadow 0.22s",
              }}
              onHoverStart={(e) => {
                const el = (e.target as HTMLElement).closest(".monthly-card-inner") as HTMLElement
                if (el) { el.style.borderColor = "#CBD5E1"; el.style.boxShadow = "0 8px 36px rgba(26,46,74,0.10)" }
              }}
            >
              <div className="monthly-card-inner" style={{ padding: "28px 28px 24px" }}>
                {/* Plan label */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "#A0AABE",
                  }}>
                    {monthlyLabel}
                  </span>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#CBD5E1",
                  }} />
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", marginBottom: 8, display: "block", alignSelf: "flex-start", marginTop: 8 }}>$</span>
                    <span style={{ fontSize: 52, fontWeight: 800, color: "#1a2e4a", letterSpacing: "-0.04em", lineHeight: 1 }}>15</span>
                    <span style={{ fontSize: 14, color: "#A0AABE", fontWeight: 500 }}>/mo</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "#F1F5F9", marginBottom: 20 }} />

                {/* Features single column */}
                <ul style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28 }}>
                  {features.map((f, i) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                        <circle cx="7" cy="7" r="7" fill="#F1F5F9" />
                        <path d="M4 7l2 2 4-4" stroke="#1a2e4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>{f}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <PricingButtons
                  plan="monthly"
                  isPro={userIsPro}
                  isEU={isEU}
                  buttonClassName="!bg-[#1a2e4a] !text-white !font-semibold !rounded-[14px] !border-0 !py-3.5"
                />
                <p style={{ fontSize: 11, color: "#CBD5E1", textAlign: "center", marginTop: 10 }}>{cancelAnytime}</p>
              </div>
            </motion.div>
          </TimelineContent>

          {/* ══════════ ANNUAL CARD ══════════ */}
          <TimelineContent animationNum={3} timelineRef={sectionRef} customVariants={revealVariants}>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{ position: "relative" }}
            >
              {/* Glow halo behind card */}
              <div style={{
                position: "absolute",
                inset: -1,
                borderRadius: 26,
                background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.3) 0%, rgba(0,102,255,0.15) 40%, transparent 70%)",
                filter: "blur(16px)",
                zIndex: -1,
              }} />

              {/* Gradient animated border wrapper */}
              <div className="annual-border-wrap">
                <div style={{
                  background: "linear-gradient(160deg, #071525 0%, #0a1e35 50%, #071525 100%)",
                  borderRadius: 22,
                  padding: "28px 28px 24px",
                  position: "relative",
                  overflow: "hidden",
                }}>

                  {/* Interior orbs */}
                  <div style={{
                    position: "absolute", top: -60, right: -40, width: 180, height: 180,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0,212,255,0.10) 0%, transparent 70%)",
                    animation: "floatOrb 6s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", bottom: 60, left: -50, width: 140, height: 140,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)",
                    animation: "floatOrb 8s ease-in-out infinite reverse",
                    pointerEvents: "none",
                  }} />

                  {/* Subtle tech grid */}
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
                    backgroundImage: "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }} />

                  {/* Plan label + badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(0,212,255,0.6)",
                    }}>
                      {annualLabel}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: "rgba(0,212,255,0.12)",
                      border: "1px solid rgba(0,212,255,0.3)",
                      color: "#00D4FF",
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "3px 10px", borderRadius: 999,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#00D4FF",
                        display: "inline-block",
                        animation: "pulse-dot 1.8s ease-in-out infinite",
                      }} />
                      {annualBadge}
                    </span>
                  </div>

                  {/* Price — gradient text */}
                  <div style={{ marginBottom: 24, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,212,255,0.5)", alignSelf: "flex-start", marginTop: 8 }}>$</span>
                      <span style={{
                        fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1,
                        background: "linear-gradient(135deg, #ffffff 30%, #00D4FF 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>144</span>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>/yr</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 12, color: "#00D4FF", fontWeight: 600,
                      }}>
                        {annualEquiv}
                      </span>
                      <div style={{ height: 1, flex: 1, background: "rgba(0,212,255,0.15)" }} />
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.25), transparent)",
                    marginBottom: 20, position: "relative",
                  }} />

                  {/* Features — 2 column grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 28, position: "relative" }}>
                    {col1.map((f, i) => (
                      <motion.div
                        key={f}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 7 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                          <circle cx="6.5" cy="6.5" r="6.5" fill="rgba(0,212,255,0.12)" />
                          <path d="M3.5 6.5l2 2 4-4" stroke="#00D4FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{f}</span>
                      </motion.div>
                    ))}
                    {col2.map((f, i) => (
                      <motion.div
                        key={f}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + i * 0.05 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 7 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                          <circle cx="6.5" cy="6.5" r="6.5" fill="rgba(0,212,255,0.12)" />
                          <path d="M3.5 6.5l2 2 4-4" stroke="#00D4FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{f}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA — shimmer button */}
                  <PricingButtons
                    plan="annual"
                    isPro={userIsPro}
                    isEU={isEU}
                    theme="dark"
                    buttonClassName="!bg-gradient-to-r !from-[#00D4FF] !to-[#0099CC] !text-[#071525] !font-bold !rounded-[14px] !border-0 !py-3.5 !shadow-[0_0_24px_rgba(0,212,255,0.35),_0_4px_12px_rgba(0,0,0,0.3)]"
                  />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10, position: "relative" }}>
                    {cancelAnytime}
                  </p>
                </div>
              </div>
            </motion.div>
          </TimelineContent>
        </div>

        {/* ══════════ ONE-TIME PLANS (Basic / Sprint) ══════════ */}
        {!userIsPro && (
          <div className="mt-14 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A0AABE] whitespace-nowrap">
                {isEs ? "¿Sin suscripción? Pago único" : "No subscription? One-time"}
              </span>
              <div className="h-px flex-1 bg-[#E2E8F4]" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {oneTime.map((o) => (
                <motion.div
                  key={o.plan}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="bg-white rounded-[18px] border border-[#E2E8F4] p-6 sm:p-7 shadow-[0_2px_16px_rgba(26,46,74,0.05)] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[15px] font-extrabold text-[#1a2e4a]">{o.name}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                      style={{ background: `${o.accent}14`, color: o.accent }}
                    >
                      {o.validity}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-[13px] font-semibold text-[#94A3B8] self-start mt-1.5">$</span>
                    <span className="text-[40px] font-extrabold text-[#1a2e4a] tracking-[-0.04em] leading-none">{o.price}</span>
                    <span className="text-[13px] text-[#A0AABE] font-medium">{o.unit}</span>
                  </div>

                  <div className="h-px bg-[#F1F5F9] my-5" />

                  <ul className="flex flex-col gap-2.5 mb-6">
                    {o.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                          <circle cx="7" cy="7" r="7" fill={`${o.accent}1A`} />
                          <path d="M4 7l2 2 4-4" stroke={o.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[13px] text-[#475569] leading-[1.5]">{p}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <PricingButtons
                      plan={o.plan}
                      isEU={isEU}
                      buttonClassName={
                        o.plan === "sprint"
                          ? "!bg-[#00D4FF] !text-[#071525] !font-bold !rounded-[12px] !border-0 !py-3"
                          : "!bg-white !text-[#1a2e4a] !font-semibold !rounded-[12px] !border !border-[#1a2e4a]/20 hover:!bg-[#1a2e4a]/[0.03] !py-3"
                      }
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
