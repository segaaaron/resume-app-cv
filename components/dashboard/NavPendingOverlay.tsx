"use client"

import { createPortal } from "react-dom"
import { useLinkStatus } from "next/link"
import { useTranslations } from "next-intl"

/**
 * Full-screen feedback while a dashboard tab is loading.
 *
 * Every dashboard page is an async Server Component (`auth()` + DB queries), so a
 * click on a nav link fires an RSC request and the browser keeps painting the OLD
 * page until the server answers. Without this the app looks frozen: the user
 * clicks and nothing moves.
 *
 * `useLinkStatus` only works inside a `<Link>` descendant (it returns
 * `{ pending: false }` elsewhere instead of throwing), so this renders as a child
 * of each nav link and portals the overlay to `document.body` to cover the whole
 * viewport — sidebar and topbar included.
 *
 * Two separate jobs, on purpose:
 *  - It BLOCKS CLICKS from the instant the navigation starts. An `opacity-0`
 *    element still captures pointer events, so the repeated impatient taps are
 *    swallowed before the overlay is even visible. Never add pointer-events-none.
 *  - It BECOMES VISIBLE 120ms later, so a navigation that resolves instantly
 *    does not flash a spinner at the user.
 */
export default function NavPendingOverlay() {
  const { pending } = useLinkStatus()
  const t = useTranslations("dashboard.nav")

  // `pending` can only turn true after a click, so there is nothing to portal
  // during SSR — no mount flag needed, just a guard for the server pass.
  if (!pending || typeof document === "undefined") return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
      className="fixed inset-0 z-[1100] flex items-center justify-center opacity-0 bg-[rgba(244,247,251,0.72)] backdrop-blur-[6px] [animation:navPendingIn_200ms_ease-out_120ms_forwards]"
    >
      <div className="flex flex-col items-center gap-[14px] px-9 py-8 rounded-2xl bg-white/95 border border-[var(--dash-cyan-border)] shadow-[0_24px_60px_rgba(15,25,45,0.14),0_0_0_1px_rgba(0,212,255,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]">
        {/* Ring */}
        <span className="relative block w-11 h-11" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border-[3px] border-[rgba(0,212,255,0.16)]" />
          <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-dash-cyan [animation:dp-ring-spin_0.7s_linear_infinite]" />
          <span className="absolute inset-[6px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.14)_0%,transparent_70%)]" />
        </span>

        <span className="text-[13px] font-semibold tracking-[0.01em] text-dash-navy">
          {t("loading")}
        </span>
      </div>
    </div>,
    document.body,
  )
}
