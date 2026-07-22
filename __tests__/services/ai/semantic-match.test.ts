import { describe, it, expect, vi } from "vitest"
import { cosineSimilarity, findSemanticMatches, SEMANTIC_MATCH_THRESHOLD } from "@/lib/services/ai/shared/semantic-match"

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors, 0 for orthogonal, 0 for a zero vector", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
    expect(cosineSimilarity([1], [1, 2])).toBe(0) // length mismatch → 0
  })
})

describe("findSemanticMatches", () => {
  // embed returns vectors in input order: [...missing, ...cvTerms].
  it("credits a missing keyword whose CV term is above the similarity threshold", async () => {
    // "APIs REST" (missing) ≈ "REST APIs" (cv) → same vector → cosine 1.
    const embed = vi.fn().mockResolvedValue([
      [1, 0], // "APIs REST"
      [1, 0], // "REST APIs"
    ])
    const matched = await findSemanticMatches(["APIs REST"], ["REST APIs"], embed)
    expect(matched.has("apis rest")).toBe(true) // normalized key
  })

  it("does NOT credit a keyword below threshold (avoids false positives)", async () => {
    const embed = vi.fn().mockResolvedValue([
      [1, 0], // missing "Kubernetes"
      [0, 1], // cv "Photoshop" → cosine 0
    ])
    const matched = await findSemanticMatches(["Kubernetes"], ["Photoshop"], embed)
    expect(matched.size).toBe(0)
  })

  it("returns an empty set (fail closed) when embed throws — exact score stands", async () => {
    const embed = vi.fn().mockRejectedValue(new Error("embed api down"))
    const matched = await findSemanticMatches(["Kubernetes"], ["Docker"], embed)
    expect(matched.size).toBe(0)
  })

  it("no-ops without calling embed when there is nothing to match", async () => {
    const embed = vi.fn()
    expect((await findSemanticMatches([], ["React"], embed)).size).toBe(0)
    expect((await findSemanticMatches(["React"], [], embed)).size).toBe(0)
    expect(embed).not.toHaveBeenCalled()
  })

  it("threshold is conservative (>0.5) to protect against crediting unheld skills", () => {
    expect(SEMANTIC_MATCH_THRESHOLD).toBeGreaterThan(0.5)
  })
})
