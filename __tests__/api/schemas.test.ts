import { describe, it, expect, vi } from "vitest"

// These run the SHIPPED schemas. They used to re-declare their own copies of all three,
// which meant the file kept passing no matter what the services actually accepted — the
// same failure mode that once left 39 green tests over a broken product. Migrating them
// immediately exposed two places where the copy described behaviour the real schema does
// not have (see the `photoUrl` and `content` cases below).
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

import { coverLetterPatchSchema } from "@/lib/services/cover-letter/CoverLetterService"
import { resumePatchSchema, snapshotSchema } from "@/lib/services/resume/ResumeService"

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("coverLetterPatchSchema", () => {
  it("accepts full valid payload", () => {
    const payload = {
      title: "Mi Carta de Presentación",
      templateId: "timeline",
      content: {
        recipientName: "",
        recipientTitle: "",
        company: "",
        subject: "Desarrollador iOS",
        body: "<p>Párrafo con <strong>HTML</strong> y acentos: áéíóú.</p>",
        closing: "Atentamente",
        candidateName: "Miguel Saravia",
        candidateJobTitle: "iOS Developer",
        candidateEmail: "test@test.com",
        candidatePhone: "76944986",
        candidateAddress: "Calle 123",
        candidatePhoto: "",
        candidateLinkedin: "",
        candidateWebsite: "",
      },
    }
    const result = coverLetterPatchSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it("accepts empty content object", () => {
    const result = coverLetterPatchSchema.safeParse({ content: {} })
    expect(result.success).toBe(true)
  })

  it("accepts content with nested objects", () => {
    const result = coverLetterPatchSchema.safeParse({
      content: { nested: { deep: true }, arr: [1, 2, 3] },
    })
    expect(result.success).toBe(true)
  })

  it("accepts base64 photo inside content", () => {
    const base64 = "data:image/jpeg;base64," + "A".repeat(5000)
    const result = coverLetterPatchSchema.safeParse({
      content: { candidatePhoto: base64 },
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid colorScheme", () => {
    const result = coverLetterPatchSchema.safeParse({ colorScheme: "blue" })
    expect(result.success).toBe(false)
  })

  it("rejects templateId > 50 chars", () => {
    const result = coverLetterPatchSchema.safeParse({ templateId: "x".repeat(51) })
    expect(result.success).toBe(false)
  })

  it("accepts all known templateIds", () => {
    const ids = ["classic", "elegant", "sidebar", "split", "executive", "material",
      "gradient", "twotone", "timeline", "minimal", "monogram", "architect",
      "diagonal", "newspaper"]
    for (const id of ids) {
      const result = coverLetterPatchSchema.safeParse({ templateId: id })
      expect(result.success, `templateId "${id}" should pass`).toBe(true)
    }
  })

  it("accepts payload with no fields (all optional)", () => {
    const result = coverLetterPatchSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("resumePatchSchema", () => {
  it("accepts valid sections array", () => {
    const result = resumePatchSchema.safeParse({
      title: "Mi CV",
      sections: [{ id: "work", type: "workExperience", label: "Experiencia" }],
      sectionData: { personalDetails: { name: "Miguel" } },
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid config", () => {
    const result = resumePatchSchema.safeParse({
      config: { colorScheme: "#2a72d7", fontSize: 12, spacing: 1.5, language: "es" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects fontSize out of range", () => {
    const result = resumePatchSchema.safeParse({ config: { fontSize: 5 } })
    expect(result.success).toBe(false)
  })

  it("rejects invalid colorScheme", () => {
    const result = resumePatchSchema.safeParse({ config: { colorScheme: "#zzz" } })
    expect(result.success).toBe(false)
  })

  it("rejects empty title", () => {
    const result = resumePatchSchema.safeParse({ title: "" })
    expect(result.success).toBe(false)
  })

  it("accepts photoUrl as data:image", () => {
    const result = resumePatchSchema.safeParse({
      config: { photoUrl: "data:image/png;base64,abc123" },
    })
    expect(result.success).toBe(true)
  })

  // The old copy of this schema claimed an https photo URL was accepted. The shipped
  // schema takes base64 data URLs ONLY, and that is the correct behaviour: photos are
  // uploaded through /api/resumes/[id]/photo, which stores a data URL (ResumeService
  // .updatePhoto), and accepting a remote URL would let a résumé embed — and make our
  // PDF renderer fetch — an arbitrary third-party address. The copy documented a
  // capability the product never had, and nothing failed because nothing ran the real
  // schema.
  it("rejects a remote photo URL — photos are stored as data URLs", () => {
    const result = resumePatchSchema.safeParse({
      config: { photoUrl: "https://cdn.example.com/photo.jpg" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid photoUrl", () => {
    const result = resumePatchSchema.safeParse({
      config: { photoUrl: "ftp://bad.url/photo.jpg" },
    })
    expect(result.success).toBe(false)
  })

  it("accepts language es and en", () => {
    expect(resumePatchSchema.safeParse({ config: { language: "es" } }).success).toBe(true)
    expect(resumePatchSchema.safeParse({ config: { language: "en" } }).success).toBe(true)
  })

  it("rejects unknown language", () => {
    const result = resumePatchSchema.safeParse({ config: { language: "fr" } })
    expect(result.success).toBe(false)
  })
})

describe("snapshotSchema", () => {
  it("accepts full snapshot", () => {
    const result = snapshotSchema.safeParse({
      title: "CV 1",
      sections: [{ id: "s1" }],
      sectionData: { workExperience: [] },
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty snapshot", () => {
    expect(snapshotSchema.safeParse({}).success).toBe(true)
  })
})
