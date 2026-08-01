"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { TemplateId, TEMPLATES } from "@/types/resume"
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
  const { config, sections, setTemplateWithAdapt, save, triggerThumbnail } = useResumeStore(
    useShallow((s) => ({
      config: s.config,
      sections: s.sections,
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

  // A switch only needs confirmation when it would DESTROY content the user
  // can't get back by switching again: a two-column → single-column move that
  // drops populated side sections, or losing a photo. Everything else applies
  // instantly — selecting a template changes the CV, which is what users expect.
  function isDestructiveSwitch(templateId: TemplateId): boolean {
    const current = TEMPLATES.find((tpl) => tpl.id === config.templateId)
    const target = TEMPLATES.find((tpl) => tpl.id === templateId)
    const doubleToSingle = current?.columns === "double" && target?.columns === "single"
    const hasSideContent = sections.some((s) => s.column === "side" && s.visible)
    const losingPhoto = !!config.photoUrl && !!current?.hasPhoto && !target?.hasPhoto
    return (doubleToSingle && hasSideContent) || losingPhoto
  }

  function applyTemplate(templateId: TemplateId) {
    track("template_switched", { to_pro: isProTemplate(templateId) })
    setTemplateWithAdapt(templateId)
    setTimeout(() => { save().then(() => { triggerThumbnail(true) }).catch(() => {}) }, 0)
    onAfterSwitch?.()
  }

  function handleSelectTemplate(templateId: TemplateId, locked: boolean) {
    if (locked) {
      track("paywall_hit", { feature: "pro_template", current_plan: plan })
      setUpgradeOpen(true)
      return
    }
    if (templateId === config.templateId) return
    // Destructive switch → confirm in the modal first; otherwise apply instantly.
    if (isDestructiveSwitch(templateId)) {
      track("template_previewed", { template_id: templateId, is_pro: isProTemplate(templateId) })
      setPendingTemplate(templateId)
      return
    }
    applyTemplate(templateId)
  }

  function confirmSwitch() {
    if (!pendingTemplate) return
    applyTemplate(pendingTemplate)
    setPendingTemplate(null)
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
