import { describe, it, expect } from "vitest"
import { z } from "zod"

// ─── Cover Letter PATCH schema ───────────────────────────────────────────────
const coverLetterPatchSchema = z.object({
  title:       z.string().max(200).optional(),
  content:     z.any().optional(),
  colorScheme: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily:  z.string().max(100).optional(),
  templateId:  z.string().max(50).optional(),
})

// ─── Resume PATCH schema ──────────────────────────────────────────────────────
const resumePatchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: z.any().optional(),
  config: z.object({
    templateId:  z.string().optional(),
    colorScheme: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    fontFamily:  z.string().max(100).optional(),
    fontSize:    z.number().int().min(8).max(24).optional(),
    spacing:     z.number().min(0.5).max(3).optional(),
    photoUrl:    z.string().refine(
      (v) => v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Invalid photo URL"
    ).nullable().optional(),
    photoPosition: z.number().int().min(0).max(100).optional(),
    language:      z.enum(["es", "en"]).optional(),
  }).optional(),
})

// ─── Snapshot schema (versions) ───────────────────────────────────────────────
const snapshotSchema = z.object({
  title:       z.string().optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: z.any().optional(),
})

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

  it("accepts photoUrl as https url", () => {
    const result = resumePatchSchema.safeParse({
      config: { photoUrl: "https://cdn.example.com/photo.jpg" },
    })
    expect(result.success).toBe(true)
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
