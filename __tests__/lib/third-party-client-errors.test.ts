import { describe, it, expect } from "vitest"
import { isThirdPartyClientError } from "@/lib/client-error-reporter"

// Verbatim from the CEO's dev server log: an extension throwing inside our page,
// captured by window.onunhandledrejection, POSTed to /api/client-errors, and filed
// in the admin panel as if it were ours — repeatedly, on every page load.
const REAL_STACK = `TypeError: Cannot read properties of undefined (reading 'M_ID')
    at F (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)
    at X (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:1442)`

describe("isThirdPartyClientError — the panel is for OUR bugs", () => {
  it("drops the reported extension crash", () => {
    expect(isThirdPartyClientError("Cannot read properties of undefined (reading 'M_ID')", REAL_STACK)).toBe(true)
  })

  it.each([
    "at F (moz-extension://abc/content.js:1:1)",
    "at g (safari-web-extension://abc/x.js:2:2)",
    "at h (edge-extension://abc/x.js:2:2)",
  ])("drops other browsers' extensions too: %s", (frame) => {
    expect(isThirdPartyClientError("boom", `TypeError: boom\n    ${frame}`)).toBe(true)
  })

  it("drops the opaque cross-origin 'Script error.' that carries no information", () => {
    expect(isThirdPartyClientError("Script error.", undefined)).toBe(true)
  })

  // The expensive mistake in the other direction: silencing a real bug.
  it("keeps an error thrown by our own bundle", () => {
    const ours = `TypeError: x is not a function
    at Object.render (https://www.valhallaresume.com/_next/static/chunks/main.js:5:10)`
    expect(isThirdPartyClientError("x is not a function", ours)).toBe(false)
  })

  it("keeps our error even when an extension appears deeper in the stack", () => {
    const mixed = `TypeError: boom
    at ours (https://www.valhallaresume.com/_next/static/chunks/app.js:1:1)
    at F (chrome-extension://abc/executors/200.js:1:761)`
    expect(isThirdPartyClientError("boom", mixed)).toBe(false)
  })

  it("keeps an error with a message but no stack that is not 'Script error.'", () => {
    expect(isThirdPartyClientError("Cannot read properties of null", undefined)).toBe(false)
  })

  it("keeps a relative-path stack (dev server, no origin in the frame)", () => {
    expect(isThirdPartyClientError("boom", "TypeError: boom\n    at eval (webpack-internal:///./app/page.tsx:3:1)")).toBe(false)
  })
})
