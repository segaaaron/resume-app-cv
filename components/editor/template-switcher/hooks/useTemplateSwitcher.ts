"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { TemplateId } from "@/types/resume"
import { isProTemplate } from "../template-data"
import { isActive, isSuperAdmin } from "@/lib/plans"

interface Options {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
  onAfterSwitch?: () => void
}

export function useTemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role, onAfterSwitch }: Options) {
  const { config, setTemplateWithAdapt, save, triggerThumbnail } = useResumeStore()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null)

  const hasAccess =
    isSuperAdmin(role) ||
    isActive(
      plan,
      subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
      subscriptionStatus,
      role,
    )

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
