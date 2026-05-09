"use client"

import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface Props {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onClose: () => void
}

export default function UnsavedChangesModal({ open, onSave, onDiscard, onClose }: Props) {
  const t = useTranslations("editor")
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unsaved_modal.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("unsaved_modal.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>{t("unsaved_modal.discard")}</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>{t("unsaved_modal.save")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
