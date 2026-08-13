import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { answerHash } from "@/lib/services/ai/shared/answer-cache"
import { createHash } from "node:crypto"

const sha = (s: string) => createHash("sha256").update(s).digest("hex")

// The rule these tests defend: a cache key must cover every input the answer
// depends on. The keyword extraction receives the candidate's résumé, so keying
// it on the posting alone served one person the reading of another's document.
describe("cache scope", () => {
  const key = (posting: string, resume: string, lang: "en" | "es" = "es") =>
    answerHash("model-x", lang, "jd", posting, sha(resume))

  it("two résumés against the same posting do not share an answer", () => {
    const posting = "Buscamos enfermera para el área de emergencias"
    expect(key(posting, "CV de Ana, 9 años en urgencias")).not.toBe(key(posting, "CV de Luis, recién egresado"))
  })

  it("the same résumé and posting always land on the same answer", () => {
    // This is the case that repeats, and the one the refund pays back.
    const posting = "Structural welder, 5 years"
    const cv = "Soldador certificado, 12 años, TIG y MIG"
    expect(key(posting, cv)).toBe(key(posting, cv))
  })

  it("the same résumé against two postings does not share an answer", () => {
    const cv = "Contadora con 10 años en nómina"
    expect(key("Analista de nómina", cv)).not.toBe(key("Jefa de contabilidad", cv))
  })

  it("language is part of the question", () => {
    const posting = "Registered nurse, emergency care"
    const cv = "Enfermera con 9 años"
    expect(key(posting, cv, "en")).not.toBe(key(posting, cv, "es"))
  })
})
