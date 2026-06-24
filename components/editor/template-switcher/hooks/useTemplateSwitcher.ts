"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { TemplateId } from "@/types/resume"
import { isProTemplate } from "../template-data"
import { isSuperAdmin, effectivePlan, canUsePremiumTemplates } from "@/lib/plans"

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
  const hasAccess =
    isSuperAdmin(role) ||
    canUsePremiumTemplates(effectivePlan({ plan, subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null }))

  function handleSelectTemplate(templateId: TemplateId, locked: boolean) {
    if (locked) { setUpgradeOpen(true); return }
    if (templateId === config.templateId) return
    // Always open preview modal so user sees the template before committing
    setPendingTemplate(templateId)
  }

  function confirmSwitch() {
    if (!pendingTemplate) return
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
