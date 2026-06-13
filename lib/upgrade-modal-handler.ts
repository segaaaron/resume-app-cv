/**
 * Maps backend freemium error codes to UpgradeModal triggers.
 *
 * Backend contracts (see lib/free-quota-status.ts and controllers):
 *  - free_quota_exhausted (429)   → 'ai-quota'           context: { endpoint }
 *  - feature_pro_only (403)       → 'pro-feature'        context: { feature }
 *  - plan_limit_resume (403)      → 'second-resume'
 *  - plan_limit_cover_letter (403)→ 'second-cover-letter'
 *  - subscription_required (403)  → 'download'
 *
 * Usage (legacy — still supported):
 *   const handle = createApiErrorHandler({ open, redirect, locale })
 *   if (!res.ok) { const json = await res.json(); handle(json); return }
 *
 * Usage (preferred — one-call helper for catch blocks):
 *   try { ... } catch (err) {
 *     handleApiError(err, {
 *       openUpgradeModal: open,
 *       redirect: (p) => router.push(p),
 *       locale,
 *       fallbackToast: () => toast.error(t("errors.unexpected")),
 *     })
 *   }
 */

import type { UpgradeTrigger, UpgradeModalContext } from "@/components/shared/UpgradeModal"

export interface ApiErrorPayload {
  code?: string
  error?: string
  statusCode?: number
  context?: { endpoint?: string; feature?: string }
}

export interface ApiErrorHandlerDeps {
  open: (trigger: UpgradeTrigger, context?: UpgradeModalContext) => void
  redirect: (path: string) => void
  locale: string
  onUnhandled?: (error: ApiErrorPayload) => void
}

const TRIGGER_MAP: Record<string, UpgradeTrigger> = {
  free_quota_exhausted: "ai-quota",
  feature_pro_only: "pro-feature",
  plan_limit_resume: "second-resume",
  plan_limit_cover_letter: "second-cover-letter",
  subscription_required: "download",
}

export function createApiErrorHandler(deps: ApiErrorHandlerDeps) {
  const { open, onUnhandled } = deps

  return function handleApiError(error: ApiErrorPayload): boolean {
    const code = error?.code ?? error?.error
    if (!code) {
      onUnhandled?.(error)
      return false
    }

    const trigger = TRIGGER_MAP[code]
    if (trigger) {
      open(trigger, error.context)
      return true
    }

    onUnhandled?.(error)
    return false
  }
}

/** Pure helper for callsites that just want the trigger mapping. */
export function triggerFromErrorCode(code: string): UpgradeTrigger | null {
  return TRIGGER_MAP[code] ?? null
}

// ─── Single-call helper for catch blocks ─────────────────────────────────────

export interface HandleApiErrorOptions {
  openUpgradeModal: (trigger: UpgradeTrigger, context?: UpgradeModalContext) => void
  redirect: (path: string) => void
  locale: string
  /** Called when no error code matched a freemium trigger. */
  fallbackToast?: () => void
  /**
   * Called on 429 `daily_cap_reached` (anti-abuse cap for unlimited plans).
   * Must NOT show an upgrade prompt — the user already pays. Falls back to
   * `fallbackToast` when not provided.
   */
  dailyCapToast?: () => void
  onUnhandled?: (error: ApiErrorPayload) => void
}

/**
 * Extracts a freemium error payload from anything a `catch` block may receive:
 *  - a fetch `Response` (we read .json() once)
 *  - an Error with a `.payload` we attached
 *  - a plain object already shaped like ApiErrorPayload
 *  - `null` / `undefined`
 */
async function extractPayload(err: unknown): Promise<ApiErrorPayload | null> {
  if (!err) return null
  if (typeof err === "object" && err !== null) {
    const anyErr = err as Record<string, unknown>
    if (typeof anyErr.code === "string" || typeof anyErr.error === "string") {
      return anyErr as ApiErrorPayload
    }
    if (anyErr.payload && typeof anyErr.payload === "object") {
      return anyErr.payload as ApiErrorPayload
    }
    // Response-like
    if (typeof (anyErr as unknown as Response).json === "function" && "status" in anyErr) {
      try {
        const json = await (anyErr as unknown as Response).clone().json()
        return json as ApiErrorPayload
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Unified one-call helper. Returns `true` if the error was mapped to a
 * freemium trigger (modal opened or redirect issued); `false` otherwise.
 * On `false`, `fallbackToast` is invoked.
 */
export async function handleApiError(
  err: unknown,
  opts: HandleApiErrorOptions,
): Promise<boolean> {
  const payload = await extractPayload(err)
  const code = payload?.code ?? payload?.error

  if (code === "daily_cap_reached") {
    ;(opts.dailyCapToast ?? opts.fallbackToast)?.()
    return true
  }

  const trigger = code ? TRIGGER_MAP[code] : null
  if (trigger && payload) {
    opts.openUpgradeModal(trigger, payload.context)
    return true
  }

  if (payload) opts.onUnhandled?.(payload)
  opts.fallbackToast?.()
  return false
}
