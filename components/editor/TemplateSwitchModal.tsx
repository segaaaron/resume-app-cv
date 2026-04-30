"use client"

import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ResumePreview from "@/components/resume/ResumePreview"
import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES, TemplateId } from "@/types/resume"

interface Props {
  pendingTemplateId: TemplateId | null
  onConfirm: () => void
  onCancel: () => void
}

export default function TemplateSwitchModal({ pendingTemplateId, onConfirm, onCancel }: Props) {
  const t = useTranslations("editor.template_switch")
  const config = useResumeStore((s) => s.config)
  const sections = useResumeStore((s) => s.sections)

  if (!pendingTemplateId) return null

  const targetMeta = TEMPLATES.find((t) => t.id === pendingTemplateId)
  const currentMeta = TEMPLATES.find((t) => t.id === config.templateId)

  const singleToDouble = currentMeta?.columns === "single" && targetMeta?.columns === "double"
  const doubleToSingle = currentMeta?.columns === "double" && targetMeta?.columns === "single"
  const losingPhoto = config.photoUrl && currentMeta?.hasPhoto && !targetMeta?.hasPhoto

  const hasSideContent = sections.some(
    (s) => s.column === "side" && s.visible
  )
  const showColumnWarning = doubleToSingle && hasSideContent

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              {t("title", { name: targetMeta?.name ?? pendingTemplateId })}
            </DialogTitle>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </DialogHeader>

        {/* Preview — overrideTemplateId renders target template without mutating store */}
        <div className="bg-muted/30 p-4 flex justify-center overflow-hidden" style={{ height: 340 }}>
          <div className="pointer-events-none overflow-hidden" style={{ width: 302, height: 320 }}>
            <div style={{ transform: "scale(0.38)", transformOrigin: "top left", width: 794, height: 1123 }}>
              <ResumePreview overrideTemplateId={pendingTemplateId} />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(showColumnWarning || losingPhoto || singleToDouble) && (
          <div className="px-6 py-3 border-t bg-amber-50 space-y-1">
            {showColumnWarning && (
              <p className="text-xs text-amber-800">⚠ {t("warn_columns")}</p>
            )}
            {losingPhoto && (
              <p className="text-xs text-amber-800">⚠ {t("warn_photo")}</p>
            )}
            {singleToDouble && (
              <p className="text-xs text-amber-700">ℹ {t("info_double")}</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {t("confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

