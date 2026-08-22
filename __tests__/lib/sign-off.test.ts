import { describe, it, expect } from "vitest"
import { stripSignOff, hasHardCodedFact } from "@/lib/services/ai/shared/ai-helpers"

describe("stripSignOff", () => {
  const body = "Dear Hiring Manager,\n\nI build iOS apps at Xiobit.\n\nI would welcome the chance to talk."

  it("removes a sign-off with a bracketed name", () => {
    expect(stripSignOff(`${body}\n\nSincerely,\n[Your Name]`)).toBe(body)
  })

  it("removes a bare sign-off", () => {
    expect(stripSignOff(`${body}\n\nBest regards,`)).toBe(body)
  })

  it("removes a Spanish sign-off", () => {
    expect(stripSignOff(`${body}\n\nAtentamente,\n[Tu Nombre]`)).toBe(body)
  })

  it("removes a sign-off followed by a real name", () => {
    expect(stripSignOff(`${body}\n\nSincerely,\nAna Rivas`)).toBe(body)
  })

  it("leaves a body with no sign-off untouched", () => {
    expect(stripSignOff(body)).toBe(body)
  })

  it("does not eat prose that merely contains a closing word", () => {
    const prose = "I sincerely believe this role fits.\n\nThe team's work on payments is why I applied."
    expect(stripSignOff(prose)).toBe(prose)
  })
})

describe("hasHardCodedFact — metric placeholders only", () => {
  const source = "Dear Hiring Manager, I ship iOS apps at Xiobit and helped my team deliver features."

  // The regression: bare "n"/"x" anywhere inside brackets made ordinary
  // bracketed prose look like a metric stand-in, binning whole cover letters.
  it("does not flag a name or company placeholder as a metric", () => {
    expect(hasHardCodedFact("Sincerely, [Your Name]", source)).toBe(false)
    expect(hasHardCodedFact("I want to join [Company].", source)).toBe(false)
  })

  it("still flags real metric placeholders", () => {
    expect(hasHardCodedFact("Grew revenue by [X%].", source)).toBe(true)
    expect(hasHardCodedFact("Served [N users] daily.", source)).toBe(true)
    expect(hasHardCodedFact("Saved [$Z] per quarter.", source)).toBe(true)
    expect(hasHardCodedFact("Shipped in [3 months].", source)).toBe(true)
    expect(hasHardCodedFact("Reached [number of clients].", source)).toBe(true)
  })

  it("still flags a metric absent from the source", () => {
    expect(hasHardCodedFact("Cut crashes by 40% last year.", source)).toBe(true)
  })

  it("passes clean prose anchored to the source", () => {
    expect(hasHardCodedFact("I ship iOS apps at Xiobit and help my team deliver features.", source)).toBe(false)
  })
})
