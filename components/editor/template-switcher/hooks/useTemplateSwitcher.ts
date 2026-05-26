"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES, TemplateId } from "@/types/resume"
import { isProTemplate } from "../template-data"
import { isActive, isSuperAdmin } from "@/lib/plans"

interface Options {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
}

function computeHasWarning(
  currentId: TemplateId,
  targetId: TemplateId,
  photoUrl: string | undefined,
  sections: { column?: string; visible?: boolean }[]
): boolean {
  const currentMeta = TEMPLATES.find((t) => t.id === currentId)
  const targetMeta = TEMPLATES.find((t) => t.id === targetId)
  const singleToDouble = currentMeta?.columns === "single" && targetMeta?.columns === "double"
  const doubleToSingle = currentMeta?.columns === "double" && targetMeta?.columns === "single"
  const losingPhoto = !!(photoUrl && currentMeta?.hasPhoto && !targetMeta?.hasPhoto)
  const hasSideContent = sections.some((s) => s.column === "side" && s.visible)
  return singleToDouble || losingPhoto || (doubleToSingle && hasSideContent)
}

export function useTemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role }: Options) {
  const { config, sections, setTemplateWithAdapt, save, triggerThumbnail } = useResumeStore()
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
    if (locked) { setUpgradeOpen(true); return }
    if (templateId === config.templateId) return

    const needsWarning = computeHasWarning(config.templateId, templateId, config.photoUrl ?? undefined, sections)
    if (needsWarning) {
      setPendingTemplate(templateId)
      return
    }

    // Silent switch: no structural changes to warn about
    setTemplateWithAdapt(templateId)
    setTimeout(() => { save().then(() => { triggerThumbnail(true) }).catch(() => {}) }, 0)
  }

  function confirmSwitch() {
    if (!pendingTemplate) return
    setTemplateWithAdapt(pendingTemplate)
    setPendingTemplate(null)
    setTimeout(() => { save().then(() => { triggerThumbnail(true) }).catch(() => {}) }, 0)
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
