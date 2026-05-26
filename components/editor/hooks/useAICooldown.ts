"use client"

import { useState, useCallback, useEffect } from "react"

function readCooldown(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? "0", 10) || 0 } catch { return 0 }
}

function writeCooldown(key: string, v: number): void {
  try {
    if (v > 0) localStorage.setItem(key, String(v))
    else localStorage.removeItem(key)
  } catch { /* noop */ }
}

export function useAICooldown(storageKey: string) {
  const [cooldownUntil, setCooldownUntilState] = useState<number>(0)

  useEffect(() => {
    setCooldownUntilState(readCooldown(storageKey))
  }, [storageKey])

  const setCooldownUntil = useCallback((v: number) => {
    setCooldownUntilState(v)
    writeCooldown(storageKey, v)
  }, [storageKey])

  return { cooldownUntil, setCooldownUntil }
}
