"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { TemplateId } from "@/types/resume"
import { isProTemplate } from "../template-data"
import { isSuperAdmin, effectivePlan, canUsePremiumTemplates } from "@/lib/plans"
import { track } from "@/lib/analytics/track"

interface Options {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
  onAfterSwitch?: () => void
}

export function useTemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role, onAfterSwitch }: Options) {
  const { config, setTemplateWithAdapt, save, triggerThumbnail } = useResumeStore(
    useShallow((s) => ({
      config: s.config,
      setTemplateWithAdapt: s.setTemplateWithAdapt,
      save: s.save,
      triggerThumbnail: s.triggerThumbnail,
    }))
  )
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null)

  // Premium (PRO) templates are unlocked for SPRINT/PRO/LIMITED (and admin).
  // BASIC/UNSUBSCRIBED can preview but selecting a PRO template opens the upgrade modal.
  void subscriptionStatus // no longer used for gating (kept in Options for caller compatibility)
  const hasAccess =
    isSuperAdmin(role) ||
    canUsePremiumTemplates(effectivePlan({ plan, subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null }))

  function handleSelectTemplate(templateId: TemplateId, locked: boolean) {
    if (locked) {
      track("paywall_hit", { feature: "pro_template", current_plan: plan })
      setUpgradeOpen(true)
      return
    }
    if (templateId === config.templateId) return
    // Always open preview modal so user sees the template before committing
    track("template_previewed", { template_id: templateId, is_pro: isProTemplate(templateId) })
    setPendingTemplate(templateId)
  }

  function confirmSwitch() {
    if (!pendingTemplate) return
    track("template_switched", { to_pro: isProTemplate(pendingTemplate) })
    setTemplateWithAdapt(pendingTemplate)
    setPendingTemplate(null)
    setTimeout(() => { save().then(() => { triggerThumbnail(true) }).catch(() => {}) }, 0)
    onAfterSwitch?.()
  }

  function cancelSwitch() {
    setPendingTemplate(null)
  }

  return {
    config,
    hasAccess,
    upgradeOpen,
    setUpgradeOpen,
    pendingTemplate,
    handleSelectTemplate,
    confirmSwitch,
    cancelSwitch,
    isProTemplate,
  }
}
