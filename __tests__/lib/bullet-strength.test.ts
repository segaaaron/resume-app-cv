import { describe, it, expect } from "vitest"
import { scoreBullet, rankRoleBullets, KEEP_PER_ROLE, MAX_WEAK_SHOWN } from "@/lib/ats/bullet-strength"

// Deliberately non-technical. The rule this file encodes is about HOW a line is
// written, not what it is about — a nurse's duty line and an engineer's fail for
// the same reason. Fitting it to one profession is the failure mode this project
// has already paid for twice.
describe("scoreBullet", () => {
  it("ranks a checkable result above a bare figure above a duty", () => {
    const anchored = scoreBullet("Reduced medication errors from 12 to 3 per month across two wards")
    const figure = scoreBullet("Trained 14 nurses during onboarding")
    const duty = scoreBullet("Responsible for daily medication rounds on the ward")
    expect(anchored.score).toBeGreaterThan(figure.score)
    expect(figure.score).toBeGreaterThan(duty.score)
    expect(duty.reasons).toContain("duty_opener")
  })

  it("holds the same ordering in Spanish", () => {
    const strong = scoreBullet("Reduje el tiempo de espera de 40 a 15 minutos en recepción")
    const weak = scoreBullet("Encargado de la atención al cliente en el local")
    expect(strong.score).toBeGreaterThan(weak.score)
  })

  it("marks a line that would fit any candidate", () => {
    expect(scoreBullet("Excellent communication and strong team player skills").reasons)
      .toContain("empty_phrasing")
  })
})

describe("rankRoleBullets", () => {
  const duties = [
    "Responsible for opening the store each morning",
    "Assisted with stock rotation when needed",
    "Helped customers on the sales floor",
  ]
  const strong = [
    "Cut stock discrepancies from 8% to 2% over one quarter",
    "Trained 6 seasonal staff before the holiday season",
    "Recovered $4,200 in mispriced inventory during an audit",
    "Rebuilt the delivery schedule, ending late shipments",
    "Introduced a returns log adopted by three other branches",
    "Led the weekly count for a team of 11",
  ]

  it("leaves a readable role alone", () => {
    expect(rankRoleBullets([{ id: "a", jobTitle: "Nurse", bullets: strong.slice(0, 4) }])).toEqual([])
  })

  it("keeps the strongest and surfaces the diluting lines", () => {
    const [r] = rankRoleBullets([{ id: "a", jobTitle: "Store Manager", bullets: [...strong, ...duties] }])
    expect(r.strongest).toHaveLength(KEEP_PER_ROLE)
    expect(r.weakest).toHaveLength(3)
    // Every duty line landed in the cut list; no achievement did.
    expect(r.weakest.map((b) => b.text).sort()).toEqual([...duties].sort())
  })

  it("caps the weak list and says how many it held back", () => {
    // A badly parsed PDF import lands as one role with dozens of lines. Fifty
    // rows of "consider cutting this" is not advice, and hiding the excess in
    // silence would show part of the CV as if it were all of it.
    const many = Array.from({ length: 40 }, (_, i) => `Responsible for task number ${i}`)
    const [r] = rankRoleBullets([{ id: "a", bullets: many }])
    expect(r.weakest.length).toBe(MAX_WEAK_SHOWN)
    expect(r.weakestHidden).toBe(40 - KEEP_PER_ROLE - MAX_WEAK_SHOWN)
  })

  it("never invents or drops a line", () => {
    const bullets = [...strong, ...duties]
    const [r] = rankRoleBullets([{ id: "a", bullets }])
    const all = [...r.strongest, ...r.weakest].map((b) => b.text).sort()
    expect(all).toEqual([...bullets].map((b) => b.trim()).sort())
    expect(r.weakestHidden).toBe(0)
    expect(new Set([...r.strongest, ...r.weakest].map((b) => b.index)).size).toBe(bullets.length)
  })

  it("skips a role with no id — nothing can be edited without one", () => {
    expect(rankRoleBullets([{ jobTitle: "X", bullets: [...strong, ...duties] }])).toEqual([])
  })
})

import { cutReason } from "@/lib/ats/bullet-strength"

describe("cutReason", () => {
  it("never offers a compliment as the reason to delete a line", () => {
    const [r] = rankRoleBullets([
      {
        id: "a",
        bullets: [
          "Cut stock discrepancies from 8% to 2% over one quarter",
          "Recovered $4,200 in mispriced inventory during an audit",
          "Reduced late shipments from 30 to 4 per month",
          "Trained 6 seasonal staff before the holiday season",
          "Led the weekly count for a team of 11",
          "Grew branch revenue from $80k to $110k",
          "Coordinated schedules with the delivery drivers",
        ],
      },
    ])
    // "Coordinated…" scores only positives; saying "starts with an action" as the
    // reason to cut it, or inventing "too short", would both be lies.
    expect(cutReason(r.weakest[0])).toBe("outranked")
  })

  it("names the real defect when there is one", () => {
    const [r] = rankRoleBullets([
      {
        id: "a",
        bullets: [
          "Cut wait times from 40 to 15 minutes",
          "Trained 6 nurses on the new triage protocol",
          "Recovered $4,200 in billing errors",
          "Led a team of 11 on nights",
          "Reduced falls from 9 to 2 per quarter",
          "Introduced a handover log adopted ward-wide",
          "Responsible for daily medication rounds",
        ],
      },
    ])
    expect(cutReason(r.weakest[0])).toBe("duty_opener")
  })
})
