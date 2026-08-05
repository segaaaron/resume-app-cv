import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// apiFetch is the only I/O the store does; everything else is pure state.
const apiFetch = vi.fn()
vi.mock("@/lib/apiFetch", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() } }))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }) }))

import { useResumeStore } from "@/stores/resumeStore"

const ok = () => ({ ok: true, status: 200, json: async () => ({}) })
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) })

function seed() {
  useResumeStore.setState({
    resumeId: "r1",
    isSaving: false,
    isDirty: true,
    saveError: null,
    lastSaved: null,
  } as never)
}

describe("resumeStore.save — a failed save is never silent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seed()
  })
  afterEach(() => {
    useResumeStore.setState({ saveError: null, isDirty: false } as never)
  })

  it("records a retryable error on a server failure and KEEPS the changes dirty", async () => {
    apiFetch.mockResolvedValue(fail(500))
    await useResumeStore.getState().save({ skipThumbnail: true })
    const s = useResumeStore.getState()
    expect(s.saveError).toEqual({ kind: "server", fatal: false })
    // The work is still unsaved — saying otherwise is how edits get lost.
    expect(s.isDirty).toBe(true)
    expect(s.isSaving).toBe(false)
  })

  it("records a retryable error when the network drops", async () => {
    apiFetch.mockRejectedValue(new Error("network_error"))
    await useResumeStore.getState().save({ skipThumbnail: true })
    const s = useResumeStore.getState()
    expect(s.saveError).toEqual({ kind: "network", fatal: false })
    expect(s.isDirty).toBe(true)
  })

  it("marks a deleted resume as fatal WITHOUT pretending the work was saved", async () => {
    apiFetch.mockResolvedValue(fail(404))
    await useResumeStore.getState().save({ skipThumbnail: true })
    const s = useResumeStore.getState()
    expect(s.saveError).toEqual({ kind: "gone", fatal: true })
    // Regression: this used to set isDirty = false, which told the UI everything
    // was saved right after the server said the resume no longer exists.
    expect(s.isDirty).toBe(true)
  })

  it("marks a forbidden save as fatal", async () => {
    apiFetch.mockResolvedValue(fail(403))
    await useResumeStore.getState().save({ skipThumbnail: true })
    expect(useResumeStore.getState().saveError).toEqual({ kind: "forbidden", fatal: true })
  })

  it("stops retrying after a fatal error, but keeps saying it failed", async () => {
    apiFetch.mockResolvedValue(fail(404))
    await useResumeStore.getState().save({ skipThumbnail: true })
    apiFetch.mockClear()

    await useResumeStore.getState().save({ skipThumbnail: true })
    expect(apiFetch).not.toHaveBeenCalled()
    expect(useResumeStore.getState().saveError?.fatal).toBe(true)
  })

  it("clears the error and the dirty flag once a save succeeds", async () => {
    apiFetch.mockResolvedValue(fail(500))
    await useResumeStore.getState().save({ skipThumbnail: true })
    expect(useResumeStore.getState().saveError).not.toBeNull()

    apiFetch.mockResolvedValue(ok())
    await useResumeStore.getState().save({ skipThumbnail: true })
    const s = useResumeStore.getState()
    expect(s.saveError).toBeNull()
    expect(s.isDirty).toBe(false)
    expect(s.lastSaved).toBeInstanceOf(Date)
  })
})
