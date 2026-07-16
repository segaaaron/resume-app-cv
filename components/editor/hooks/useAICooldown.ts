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
  const [cooldownUntil, setCooldownUntilState] = useState<number>(() => readCooldown(storageKey))

  useEffect(() => {
    setCooldownUntilState(readCooldown(storageKey))
  }, [storageKey])

  const setCooldownUntil = useCallback((v: number) => {
    setCooldownUntilState(v)
    writeCooldown(storageKey, v)
  }, [storageKey])

  return { cooldownUntil, setCooldownUntil }
}

/**
 * Ticks once a second while a cooldown is live and formats what's left as
 * "m:ss" (or "Ns" under a minute). Stops the interval the moment it expires, so
 * an idle panel isn't re-rendering every second forever.
 */
export function useCooldownLabel(cooldownUntil: number) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => {
      const ts = Date.now()
      setNow(ts)
      if (ts >= cooldownUntil) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const inCooldown = now < cooldownUntil
  const remaining = inCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0
  const label = remaining >= 60
    ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : `${remaining}s`

  return { inCooldown, remaining, label }
}
