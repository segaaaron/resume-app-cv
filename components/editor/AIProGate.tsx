"use client"

import { Sparkles, Lock } from "lucide-react"
import { useEditorPro } from "./EditorContext"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface AIProGateProps {
  children: React.ReactNode
}

/**
 * Wraps any AI feature. If the user is not Pro, renders a locked
 * upgrade banner instead of the children.
 */
export default function AIProGate({ children }: AIProGateProps) {
  const { isPro, openUpgrade } = useEditorPro()
  const t = useTranslations("editor.ai_gate")

  if (isPro) return <>{children}</>

  return (
    <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-6 flex flex-col items-center gap-3 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{t("title")}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{t("description")}</p>
      </div>
      <Button size="sm" className="gap-1.5 mt-1" onClick={openUpgrade}>
        <Sparkles className="h-3.5 w-3.5" />
        {t("cta")}
      </Button>
    </div>
  )
}
