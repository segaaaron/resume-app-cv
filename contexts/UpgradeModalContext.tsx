"use client"

/**
 * Global provider for the shared UpgradeModal. Mounts a single modal instance
 * for the whole app so any client component can call `useUpgradeModal().open()`
 * without instantiating its own dialog.
 *
 * Mounted in `app/[locale]/layout.tsx` inside `NextIntlClientProvider`.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import UpgradeModal, {
  type UpgradeTrigger,
  type UpgradeModalContext as UpgradeContext,
} from "@/components/shared/UpgradeModal"

interface UpgradeModalContextValue {
  isOpen: boolean
  open: (trigger: UpgradeTrigger, context?: UpgradeContext) => void
  close: () => void
}

const Ctx = createContext<UpgradeModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean
    trigger: UpgradeTrigger
    context?: UpgradeContext
  }>({ isOpen: false, trigger: "pro-feature" })

  const open = useCallback(
    (trigger: UpgradeTrigger, context?: UpgradeContext) => {
      setState({ isOpen: true, trigger, context })
    },
    [],
  )

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }))
  }, [])

  const value = useMemo<UpgradeModalContextValue>(
    () => ({ isOpen: state.isOpen, open, close }),
    [state.isOpen, open, close],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <UpgradeModal
        isOpen={state.isOpen}
        onClose={close}
        trigger={state.trigger}
        context={state.context}
      />
    </Ctx.Provider>
  )
}

export function useUpgradeModal() {
  return useContext(Ctx)
}
