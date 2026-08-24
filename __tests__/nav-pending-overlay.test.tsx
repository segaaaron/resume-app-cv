// @vitest-environment happy-dom
//
// Switching dashboard tabs hits an async Server Component (auth + DB), so the
// browser keeps showing the OLD page until the server answers and the app looks
// frozen. The overlay is the only feedback in that window — if it stops
// rendering while a navigation is pending, the bug is back and invisible.
import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { createRoot } from "react-dom/client"
import * as React from "react"
import { act } from "react"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let pending = false

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
}))
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
  useLinkStatus: () => ({ pending }),
}))

import NavPendingOverlay from "@/components/dashboard/NavPendingOverlay"
import { Z_ROUTE_PENDING, Z_DASHBOARD_OVERLAY, Z_DRAWER_SCRIM } from "@/lib/ui/z-layers"

function render() {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => {
    root.render(React.createElement(NavPendingOverlay))
  })
  return () => act(() => root.unmount())
}

function overlay(): HTMLElement | null {
  return document.body.querySelector('[role="status"]')
}

describe("NavPendingOverlay", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("shows nothing while navigation is idle", () => {
    pending = false
    const unmount = render()
    expect(overlay()).toBeNull()
    unmount()
  })

  it("covers the whole viewport while a navigation is pending", () => {
    pending = true
    const unmount = render()
    const el = overlay()
    expect(el).not.toBeNull()
    // Portaled to body, not trapped inside the sidebar's stacking context.
    expect(el?.parentElement).toBe(document.body)
    expect(el?.className).toContain("fixed")
    expect(el?.className).toContain("inset-0")
    // Above the mobile drawer and its backdrop — and it takes the number from
    // the shared scale, so it can no longer drift away from them.
    expect((el as HTMLElement).style.zIndex).toBe(String(Z_ROUTE_PENDING))
    expect(Z_ROUTE_PENDING).toBeGreaterThan(Z_DASHBOARD_OVERLAY)
    expect(Z_DASHBOARD_OVERLAY).toBeGreaterThan(Z_DRAWER_SCRIM)
    unmount()
  })

  it("announces itself to screen readers", () => {
    pending = true
    const unmount = render()
    expect(overlay()?.getAttribute("aria-live")).toBe("polite")
    expect(overlay()?.getAttribute("aria-label")).toBe("loading")
    unmount()
  })

  it("starts hidden and fades in on a delay, so a fast route never flashes it", () => {
    pending = true
    const unmount = render()
    const cls = overlay()?.className ?? ""
    expect(cls).toContain("opacity-0")
    const delay = cls.match(/navPendingIn_\d+ms_[a-z-]+_(\d+)ms_forwards/)?.[1]
    expect(delay).toBeDefined()
    // Long enough that an instant route does not flash a spinner, short enough
    // that a real wait gets its answer before the user doubts the click landed.
    expect(Number(delay)).toBeGreaterThan(0)
    expect(Number(delay)).toBeLessThanOrEqual(150)
    unmount()
  })

  // The whole point of the overlay while the skeleton takes over: the very
  // first impatient re-tap must land on the overlay, not on another nav link.
  // An opacity-0 element still captures pointer events — pointer-events-none
  // here would silently reopen the double-navigation the CEO described.
  it("swallows repeat taps from the instant it mounts, before it is visible", () => {
    pending = true
    const unmount = render()
    const cls = overlay()?.className ?? ""
    expect(cls).not.toContain("pointer-events-none")
    unmount()
  })

  // The element ships `opacity-0` and only the animation brings it back. A
  // missing keyframe is not a build error — it would leave a full-screen
  // invisible overlay swallowing clicks, which is worse than no overlay.
  it("has the keyframe its fade-in depends on", () => {
    const css = readFileSync("app/globals.css", "utf-8")
    expect(css).toMatch(/@keyframes\s+navPendingIn\s*\{/)
    expect(css).toMatch(/@keyframes\s+dp-ring-spin\s*\{/)
  })
})
