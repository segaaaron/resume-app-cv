import { describe, it, expect, beforeAll } from "vitest"

// Ensure a predictable secret is set before importing the module
beforeAll(() => {
  process.env.UNSUBSCRIBE_SECRET = "test-secret-for-vitest"
})

import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token"

describe("generateUnsubscribeToken", () => {
  it("returns a hex string of expected length (sha256 = 64 hex chars)", () => {
    const token = generateUnsubscribeToken("user-1")
    expect(typeof token).toBe("string")
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it("returns consistent value for same userId", () => {
    const t1 = generateUnsubscribeToken("user-abc")
    const t2 = generateUnsubscribeToken("user-abc")
    expect(t1).toBe(t2)
  })

  it("returns different tokens for different userIds", () => {
    const t1 = generateUnsubscribeToken("user-1")
    const t2 = generateUnsubscribeToken("user-2")
    expect(t1).not.toBe(t2)
  })
})

describe("verifyUnsubscribeToken", () => {
  it("returns true for a valid token", () => {
    const userId = "user-verify-ok"
    const token = generateUnsubscribeToken(userId)
    expect(verifyUnsubscribeToken(userId, token)).toBe(true)
  })

  it("returns false for a wrong token", () => {
    const userId = "user-verify-bad"
    expect(verifyUnsubscribeToken(userId, "wrongtoken")).toBe(false)
  })

  it("returns false for a token generated for a different userId", () => {
    const token = generateUnsubscribeToken("user-a")
    expect(verifyUnsubscribeToken("user-b", token)).toBe(false)
  })

  it("returns false for an empty token", () => {
    const userId = "user-empty"
    expect(verifyUnsubscribeToken(userId, "")).toBe(false)
  })

  it("returns false when token has correct length but wrong content", () => {
    const userId = "user-tampered"
    const token = generateUnsubscribeToken(userId)
    // Flip first char
    const tampered = (token[0] === "a" ? "b" : "a") + token.slice(1)
    expect(verifyUnsubscribeToken(userId, tampered)).toBe(false)
  })
})
