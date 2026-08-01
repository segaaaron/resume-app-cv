"use client"

import { useEffect } from "react"
import { identify } from "@/lib/analytics/track"
import type { IdentityTraits } from "@/lib/analytics/events"

/**
 * Attaches the authenticated user's non-PII segment traits to the Umami session.
 * Mounted once in the dashboard/editor layout; re-runs if the traits change
 * (e.g. the user upgrades mid-session). Renders nothing.
 */
export default function AnalyticsIdentity({ traits }: { traits: IdentityTraits }) {
  const key = JSON.stringify(traits)
  useEffect(() => {
    identify(traits)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}
