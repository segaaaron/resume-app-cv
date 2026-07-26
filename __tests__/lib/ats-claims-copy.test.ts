/**
 * Guard against UNSUBSTANTIATED ATS claims in customer-facing copy.
 *
 * The copy used to say the ATS Score was "validated against Workday, Greenhouse,
 * Lever, iCIMS and Taleo parsing behavior" and that templates were "tested against"
 * how those systems read a file. Neither is true: there is no integration, no test
 * suite and no fixtures for any of those products anywhere in the codebase. What we
 * actually do is render the user's real PDF (`callPdfService`), extract its text
 * (`extractTextFromPDF`) and score that — a stronger claim, and a true one.
 *
 * This is the third time a headline number/claim drifted from reality (164 vs 128
 * templates, $144 vs $99, then this), and the most exposed of the three because it
 * names third-party trademarks. So it gets a test.
 *
 * The rule this encodes — the standard the project already set in its own copy
 * ("we don't claim a certification we don't have; we align with documented parsing
 * behavior"): describing how those systems BEHAVE is fine. Claiming we TESTED or
 * VALIDATED our product against them is not, until such a test actually exists.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

const locales = { en, es } as const

/**
 * Customer-facing copy that lives in .ts modules instead of messages/*.json —
 * template SEO descriptions render on public pages, so they need the same guard.
 */
const COPY_MODULES = ["lib/templates-seo.ts"]

/** Named third-party ATS products that appear in our copy. */
const ATS_VENDORS = ["Workday", "Greenhouse", "Lever", "iCIMS", "Taleo"]

/**
 * Verbs that assert WE tested/certified against those vendors. Each is paired with
 * the vendor list in the same sentence, so a generic use of the word elsewhere
 * (e.g. "validated input") does not trip the guard.
 */
const VALIDATION_VERBS = [
  // en
  "validated against",
  "tested against",
  "certified",
  "verified against",
  "approved by",
  // es
  "validado contra",
  "validadas contra",
  "probado contra",
  "probadas contra",
  "certificado",
  "certificada",
  "aprobado por",
]

/** Absolute superlatives we cannot substantiate about a competitive field. */
const UNPROVABLE_ABSOLUTES = [
  "parse perfectly across all",
  "the only builder",
  "parsear perfectamente en todas",
  "el único builder",
]

/** Every string value in the message tree, with its dotted key path. */
function flatten(node: unknown, path = "", out: Array<[string, string]> = []): Array<[string, string]> {
  if (typeof node === "string") {
    out.push([path, node])
    return out
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      flatten(v, path ? `${path}.${k}` : k, out)
    }
  }
  return out
}

/** Sentence-ish chunks, so "validated" and a vendor must be near each other to match. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/)
}

describe("ATS claims in customer-facing copy", () => {
  for (const [locale, messages] of Object.entries(locales)) {
    describe(locale, () => {
      it("never claims we validated or tested our product against a named ATS vendor", () => {
        const offenders: string[] = []

        for (const [key, value] of flatten(messages)) {
          for (const sentence of sentences(value)) {
            const lower = sentence.toLowerCase()
            const vendor = ATS_VENDORS.find((v) => sentence.includes(v))
            if (!vendor) continue
            const verb = VALIDATION_VERBS.find((v) => lower.includes(v))
            if (verb) offenders.push(`${key}: "${verb}" + "${vendor}" → ${sentence.trim()}`)
          }
        }

        expect(offenders, offenders.join("\n")).toEqual([])
      })

      it("avoids absolutes we cannot prove", () => {
        const offenders = flatten(messages)
          .filter(([, value]) =>
            UNPROVABLE_ABSOLUTES.some((phrase) => value.toLowerCase().includes(phrase)),
          )
          .map(([key]) => key)

        expect(offenders, offenders.join(", ")).toEqual([])
      })
    })
  }

  it.each(COPY_MODULES)("%s makes no validation claim either", (relPath) => {
    const source = readFileSync(join(process.cwd(), relPath), "utf8")
    const offenders: string[] = []

    for (const sentence of sentences(source)) {
      const lower = sentence.toLowerCase()
      const vendor = ATS_VENDORS.find((v) => sentence.includes(v))
      if (!vendor) continue
      const verb = VALIDATION_VERBS.find((v) => lower.includes(v))
      if (verb) offenders.push(`"${verb}" + "${vendor}" → ${sentence.trim().slice(0, 160)}`)
    }

    expect(offenders, offenders.join("\n")).toEqual([])
  })

  it("still makes the claim that IS true — scoring the real exported PDF", () => {
    // Guards the other direction: our actual differentiator must stay in the copy.
    // If someone removes it, we are back to being indistinguishable on this axis.
    expect(es.pricing.feature6).toMatch(/PDF real/i)
    expect(en.pricing.feature6).toMatch(/real PDF/i)
  })
})
