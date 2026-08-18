"use client"

import { useTranslations } from "next-intl"
import { ShieldAlert } from "lucide-react"

/**
 * A managed (LIMITED) account whose access is paused or elapsed.
 *
 * WHY IT EXISTS: blocking a managed user does not stop them logging in — it only makes
 * `isActive` false. So they arrived at a dashboard where the buttons failed one by one
 * with generic errors, the upgrade CTA is hidden for their plan on purpose, and the
 * pricing page redirects them back here. A dead end with nothing that explains it.
 *
 * The same gap opens for an EXPIRED account during the hours between its expiry and the
 * nightly cron that turns it into a normal free user.
 *
 * NOT dismissible, and with no action button: the only thing that lifts this is their
 * administrator, so offering a button the user cannot act on would be theatre.
 */
export default function ManagedAccessBanner({ reason }: { reason: "blocked" | "expired" }) {
  const t = useTranslations("dashboard.managed_banner")

  return (
    <div className="flex items-start gap-3 bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-4 py-3 mx-4 mt-4 text-sm">
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{t(reason === "blocked" ? "blocked_title" : "expired_title")}</p>
        <p className="text-slate-600 mt-0.5">{t(reason === "blocked" ? "blocked_body" : "expired_body")}</p>
      </div>
    </div>
  )
}
