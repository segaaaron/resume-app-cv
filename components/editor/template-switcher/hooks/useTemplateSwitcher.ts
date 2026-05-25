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
}

export function useTemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role }: Options) {
  const { config, setTemplateWithAdapt, save } = useResumeStore()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null)

  const hasAccess =
    isSuperAdmin(role) ||
    isActive(
      plan,
      subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
      subscriptionStatus
    )

  function handleSelectTemplate(templateId: TemplateId, locked: boolean) {
    if (locked) {
      setUpgradeOpen(true)
    } else if (templateId !== config.templateId) {
      setPendingTemplate(templateId)
    }
  }

  function confirmSwitch() {
    if (!pendingTemplate) return
    setTemplateWithAdapt(pendingTemplate)
    setPendingTemplate(null)
    setTimeout(() => {
      save().catch(() => {})
    }, 0)
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
