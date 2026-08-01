"use client"

import Script from "next/script"

interface UmamiScriptProps {
  websiteId: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Umami privacy-friendly web analytics (self-hosted, shared instance).
 *
 * Served same-origin via Next.js rewrites (see `next.config.ts`): the tracker
 * script is proxied at `/script.js` and events post to `/api/send`, both under
 * readycvv.com. That keeps everything within the existing CSP `'self'` (no
 * whitelist needed) and side-steps ad blockers that pattern-match on external
 * `analytics.*` hosts. Loads with `afterInteractive` so it never blocks LCP/INP.
 *
 * Only mounts when a valid website UUID is supplied via
 * `NEXT_PUBLIC_UMAMI_WEBSITE_ID`.
 */
export default function UmamiScript({ websiteId }: UmamiScriptProps) {
  if (!websiteId || !UUID_RE.test(websiteId)) return null

  return (
    <Script
      src="/script.js"
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
