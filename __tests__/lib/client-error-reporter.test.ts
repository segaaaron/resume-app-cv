// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { reportClientError } from "@/lib/client-error-reporter"

describe("reportClientError — Next control-flow signals are not errors", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true } as Response)))
  })

  it.each(["NEXT_REDIRECT;replace;/es/login;307", "NEXT_NOT_FOUND", "Error: NEXT_HTTP_ERROR_FALLBACK;404"])(
    "does NOT report %s",
    (msg) => {
      reportClientError(msg, "at redirect (next/navigation)", "react")
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it("filters when the sentinel is only in the stack", () => {
    reportClientError("Something", "at foo\n  digest: NEXT_REDIRECT;...", "error")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("still reports a real client error", () => {
    reportClientError("TypeError: Cannot read properties of undefined (reading 'x')", "at Foo.tsx:10", "error")
    expect(fetch).toHaveBeenCalledOnce()
  })
})
