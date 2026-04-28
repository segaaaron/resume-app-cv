"use client"

import { createContext, useContext, useState } from "react"
import UpgradeModal from "./UpgradeModal"

interface EditorContextValue {
  isPro: boolean
  openUpgrade: () => void
}

const EditorContext = createContext<EditorContextValue>({
  isPro: false,
  openUpgrade: () => {},
})

export function EditorProvider({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <EditorContext.Provider value={{ isPro, openUpgrade: () => setUpgradeOpen(true) }}>
      {children}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </EditorContext.Provider>
  )
}

export function useEditorPro() {
  return useContext(EditorContext)
}
