// ─────────────────────────────────────────────────────────────────────────────
// Analytics event catalog — single source of truth.
//
// This file IS the governance guard: an event name outside `AnalyticsEvent`
// or a payload that doesn't match its shape will not compile. Keep it in sync
// with docs/analytics-events.md and the published tracking plan.
//
// Rules baked in:
//   • object_action snake_case names, ≤50 chars (Umami hard limit).
//   • Track outcomes, not clicks.
//   • Low-cardinality property values only — NEVER PII, resume content,
//     raw timestamps, ids, prices, or free text.
// ─────────────────────────────────────────────────────────────────────────────

/** Lifecycle stage of the visitor/user. Attached to every session via identify(). */
export type UserType =
  | "visitor"
  | "unactivated"
  | "activated"
  | "engaged"
  | "power_user"
  | "paying"
  | "churned"
  | "managed"

export type Provider = "stripe" | "paypal" | "none"
export type Locale = "es" | "en"
export type BillingCycle = "monthly" | "annual" | "one_time"
export type Tenure = "new" | "returning" | "veteran"

/** Session identity traits — the "who". Sent with umami.identify(). No PII. */
export interface IdentityTraits {
  user_type: UserType
  plan: string
  provider: Provider
  locale: Locale
  tenure: Tenure
  referred: boolean
  is_authenticated: boolean
}

// Shared low-cardinality buckets used across events.
export type ResultBucket = "low" | "mid" | "high"
export type ScoreBucket = "0-40" | "40-60" | "60-75" | "75-90" | "90-100"
export type ErrorType = "server" | "network" | "quota" | "offtopic" | "client"
export type PaywallFeature = "ai" | "pro_template" | "resume_cap" | "cover_cap" | "download"

/**
 * The typed event catalog. Key = event name, value = its payload shape.
 * `Record<string, never>` marks an event that carries no properties.
 */
export interface AnalyticsEventMap {
  // ── Acquisition ────────────────────────────────────────────────────────────
  home_viewed: Record<string, never>
  home_cta_clicked: { target: "build" | "pricing" | "templates" }
  pricing_viewed: Record<string, never>
  pricing_cta_clicked: { plan: string; billing_cycle: BillingCycle }
  template_previewed: { template_id: string; is_pro: boolean }
  template_use_clicked: { template_id: string; is_pro: boolean }
  ats_checker_used: { result_bucket?: ResultBucket }
  content_cta_clicked: { slug?: string; surface: "blog" | "guide" | "faq" }

  // ── Activation ─────────────────────────────────────────────────────────────
  signup_started: { locale: Locale; source?: string }
  signup_completed: { locale: Locale }
  email_verified: Record<string, never>
  login_completed: { method: "password" | "oauth" }
  dashboard_viewed: { section: "resumes" | "cover_letters" | "applications" | "referrals" | "settings" | "jobs" }
  resume_created: { method: "blank" | "template"; template_id?: string }
  resume_imported: { format: "pdf" | "docx" }
  resume_duplicated: Record<string, never>
  resume_first_download: { plan: string; template_id?: string }

  // ── AI ─────────────────────────────────────────────────────────────────────
  ai_used: { endpoint: string; plan: string }
  ai_profile_filled: { plan: string }
  ai_bullet_improved: { plan: string }
  ai_summary_generated: { plan: string; mode: "generate" | "improve" }
  ai_tailor_completed: { plan: string; added_count?: number }
  ai_ats_scored: { plan: string; score_bucket: ScoreBucket }
  ats_verified_real: { plan: string }
  ai_review_completed: { plan: string; findings_count?: number }
  ats_export_downloaded: { format: "txt" | "pdf" }
  ai_suggestion_applied: { type: "bullet" | "summary" | "cover" }
  ai_suggestion_dismissed: { type: "bullet" | "summary" | "cover" }
  ai_error_shown: { endpoint: string; error_type: ErrorType }

  // ── Monetization ─────────────────────────────────────────────────────────��─
  paywall_hit: { feature: PaywallFeature; current_plan: string }
  upgrade_cta_clicked: { from_feature?: string }
  checkout_started: { plan: string; billing_cycle: BillingCycle; provider: Provider }
  // billing_cycle/provider are known at checkout_started; at confirmation only the
  // plan is reliably available, so they are optional here (the pair links the funnel).
  plan_purchased: { plan: string; billing_cycle?: BillingCycle; provider?: Provider }
  checkout_abandoned: { plan?: string; provider?: Provider }
  billing_portal_opened: { provider: Provider }
  subscription_canceled: { plan: string; provider: Provider }
  past_due_recover_clicked: Record<string, never>

  // ── Engagement ───────────────────────────────────────────────────────────��─
  cover_letter_created: { method: "blank" | "ai" }
  application_tracked: { status?: string }
  application_status_changed: { to_status: string }
  template_switched: { to_pro: boolean }
  resume_translated: { target_locale?: Locale }
  pdf_downloaded: { type: "resume" | "cover"; template_id?: string; plan: string }
  referral_link_shared: { channel: "copy" | "social" }

  // ── Service health ───────────────────────────────────────────────────────��─
  service_error_shown: { source: string; endpoint?: string; status: number; error_type: ErrorType }
  client_crash: { route?: string }
}

export type AnalyticsEvent = keyof AnalyticsEventMap

/**
 * Derives the Umami service `source` and `endpoint` from an app URL, mirroring
 * the server-side `serviceFromRoute` used by the ErrorLog sink so both systems
 * bucket failures identically.
 */
export function serviceFromUrl(url: string): { source: string; endpoint?: string } {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url
    const m = path.match(/^\/api\/([^/?]+)(?:\/([^/?]+))?/)
    if (!m) return { source: "app", endpoint: path.split("?")[0] }
    const [, seg1, seg2] = m
    if (seg1 === "ai") return { source: "ai", endpoint: seg2 }
    return { source: seg1, endpoint: seg2 }
  } catch {
    return { source: "app" }
  }
}
