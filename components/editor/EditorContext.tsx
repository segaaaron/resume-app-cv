"use client"

import { createContext, useContext, useState } from "react"
import UpgradeModal from "./UpgradeModal"

interface EditorContextValue {
  isPro: boolean
  /** Effective plan — lets feature gates check per-endpoint AI capability (BASIC/SPRINT). */
  plan: string
  openUpgrade: () => void
}

const EditorContext = createContext<EditorContextValue>({
  isPro: false,
  plan: "UNSUBSCRIBED",
  openUpgrade: () => {},
})

export function EditorProvider({ isPro, plan = "UNSUBSCRIBED", children }: { isPro: boolean; plan?: string; children: React.ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <EditorContext.Provider value={{ isPro, plan, openUpgrade: () => setUpgradeOpen(true) }}>
      {children}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </EditorContext.Provider>
  )
}

export function useEditorPro() {
  return useContext(EditorContext)
}
