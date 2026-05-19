"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TimelineContent } from "@/components/ui/timeline-animation"
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal"
import { Check, BadgeCheck } from "lucide-react"
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
  subscriptionEndsAt: string | null
  planInterval: string | null
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
  subscriptionEndsAt,
  planInterval,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.18, duration: 0.45 },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  }

  return (
    <div className="px-4 pt-8 pb-16 max-w-5xl mx-auto relative" ref={sectionRef}>
      {/* Header */}
      <article className="text-left mb-8 space-y-4 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900">
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
          className="text-base text-gray-500 max-w-lg"
        >
          {subtitleText}
        </TimelineContent>
      </article>

      {/* Pro member banner */}
      {userIsPro && (
        <TimelineContent animationNum={1} timelineRef={sectionRef} customVariants={revealVariants} className="mb-8">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <BadgeCheck className="h-8 w-8 text-primary shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground">{proMemberTitle}</p>
                  {planInterval && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {planInterval === "annual" ? planAnnual : planMonthly}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscriptionEndsAt ? `${proMemberRenews} ${subscriptionEndsAt}` : proMemberActive}
                </p>
              </div>
            </div>
            <ManageBillingButton />
          </div>
        </TimelineContent>
      )}

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
        {/* Monthly card */}
        <TimelineContent animationNum={2} timelineRef={sectionRef} customVariants={revealVariants}>
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="h-full"
          >
            <Card
              className="border-2 border-border bg-white h-full flex flex-col transition-all duration-300 hover:border-primary/40"
              style={{ boxShadow: "0 6px 20px -4px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.06)" }}
            >
              <CardHeader className="text-center pb-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">{monthlyLabel}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">$15</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="[&>button]:bg-[#605eff] [&>button]:text-white [&>button]:hover:bg-[#4f4de0] [&>button]:border-0">
                  <PricingButtons plan="monthly" isPro={userIsPro} />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">{cancelAnytime}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TimelineContent>

        {/* Annual card */}
        <TimelineContent animationNum={3} timelineRef={sectionRef} customVariants={revealVariants}>
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="h-full relative"
          >
            {/* Badge flotante */}
            <div className="absolute -top-3 left-5 z-10">
              <span className="text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md" style={{ backgroundColor: "#888aff" }}>
                {annualBadge}
              </span>
            </div>
            <Card
              className="text-white h-full flex flex-col transition-shadow duration-300"
              style={{ backgroundColor: "#605eff", boxShadow: "0 8px 24px -4px rgba(96,94,255,0.4), 0 3px 8px -2px rgba(96,94,255,0.25)" }}
            >
              <CardHeader className="text-center pb-4">
                <p className="text-sm font-medium text-white/70 mb-1">{annualLabel}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">$144</span>
                  <span className="text-white/70">/yr</span>
                </div>
                <p className="text-xs text-white/60 mt-1">{annualEquiv}</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                      <Check className="h-4 w-4 shrink-0 text-white mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="[&>button]:bg-white [&>button]:text-[#605eff] [&>button]:hover:bg-white/90 [&>button]:border-0">
                  <PricingButtons plan="annual" isPro={userIsPro} />
                </div>
                <p className="text-xs text-white/60 text-center mt-2">{cancelAnytime}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TimelineContent>
      </div>
    </div>
  )
}
