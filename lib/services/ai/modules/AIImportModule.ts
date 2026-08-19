// lib/services/ai/modules/AIImportModule.ts
//
// AI-primary CV import. Takes the raw text already extracted from the uploaded
// PDF/DOCX (layout-aware, via lib/resume-parser/extract-pdf + mammoth) and turns
// it into the structured ResumeSections the editor renders.
//
// Why AI-primary and not the regex heuristic: rule-based parsing tops out around
// 65–85% field recall because every template layout is a new edge case. An LLM
// generalises across layouts (industry parsers report 95–99%). But a naïve LLM
// hallucinates — it invents companies, drops bullets, guesses language levels.
// So this module is GROUNDED: every extracted entity's key field must appear in
// the source text (isGroundedIn) or it is discarded, and every description is
// checked with detectHallucination. The model locates data; it never fabricates.
//
// The route keeps the deterministic parseResumeText as a guaranteed fallback:
// if this returns null (not a resume / empty / model error), import still works
// exactly as before — zero regression.

import { AI_MODEL, AI_TEMPERATURE, logAIUsage } from "@/lib/ai-client"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { parseAIJson, detectHallucination, isGroundedIn } from "../shared/ai-helpers"
import { appearsIn, normaliseFigures, recoverContact, hostOf, linesForRole } from "../shared/import-recovery"
import { computeCostUsd } from "../shared/cost-tracker"
import { ResumeSectionsSchema, type ResumeSections } from "@/types/resume"
import { normalizeDescription } from "@/lib/utils"
import { randomUUID } from "crypto"
import { classifyImportedTerms } from "@/lib/ats/import-classification"

export interface ImportExtractInput {
  rawText: string
  language: "es" | "en"
}

// The raw JSON shape we ask the model for — flat and id-less; ids and defaults
// are applied here, then the whole thing is validated by ResumeSectionsSchema.
interface LlmResume {
  isResume?: boolean
  personalDetails?: Record<string, unknown> & { socials?: { network?: string; url?: string }[] }
  summary?: string
  workExperience?: Record<string, unknown>[]
  education?: Record<string, unknown>[]
  skills?: { name?: string; level?: string }[]
  languages?: { name?: string; level?: string }[]
  certifications?: Record<string, unknown>[]
  projects?: Record<string, unknown>[]
  volunteer?: Record<string, unknown>[]
  hobbies?: string
}

// Hard cap on the text sent to the model — a very long PDF is truncated rather
// than blowing the context/cost. ~18k chars ≈ a dense 3-4 page CV.
const MAX_IMPORT_CHARS = 18_000
const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "")


export class AIImportModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  /**
   * Extract structured resume data from raw CV text. Returns validated
   * ResumeSections, or null when the text is not a resume / empty / the model
   * failed — the caller then falls back to the deterministic parser.
   */
  async extractResume(userId: string, input: ImportExtractInput, plan: string): Promise<ResumeSections | null> {
    const rawText = input.rawText.slice(0, MAX_IMPORT_CHARS)
    if (rawText.trim().length < 30) return null

    const system =
      "You are a precise resume data extractor. Extract ONLY information explicitly present in the resume text. " +
      "NEVER invent, guess or complete missing data — if a field is absent, leave it empty. " +
      "Preserve the original language and wording of the content; do not translate or rewrite. " +
      "Return ONLY valid JSON (no markdown). If the text is not a resume/CV, return {\"isResume\": false}."

    const userPrompt = this.buildPrompt(rawText, input.language)

    let response
    try {
      response = await this.aiClient.chat({
        model: AI_MODEL,
        max_tokens: 4000, // worst case: a dense multi-section CV as JSON
        temperature: AI_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      })
    } catch (err) {
      this.logger.warn("[AIImport] model call failed, will fall back", { error: (err as Error).message })
      return null
    }

    const raw = response.choices[0]?.message?.content ?? ""
    let parsed: LlmResume
    try {
      parsed = parseAIJson<LlmResume>(raw)
    } catch {
      this.logger.warn("[AIImport] unparseable model output, will fall back")
      return null
    }

    if (parsed.isResume === false) return null

    const usage = response.usage
    logAIUsage(userId, "import-cv", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })

    const sections = this.groundAndShape(parsed, rawText)

    // If grounding stripped everything (model returned nothing real), fall back.
    //
    // A contact field does NOT count here any more. Contacts are now recovered
    // from the document when the model's version fails to check out, so a run
    // where the model invented every single field still comes back carrying the
    // real email — and "we have an email" is not a résumé. Judge on substance:
    // a name, or an actual section. Otherwise the deterministic parser, which
    // is better than a page holding one address, never gets its turn.
    const hasAnything =
      s(sections.personalDetails.firstName) ||
      s(sections.personalDetails.lastName) ||
      sections.workExperience.length ||
      sections.education.length ||
      sections.skills.length
    if (!hasAnything) return null

    return sections
  }

  /** Build the extraction prompt: numbered text is NOT needed here — we ground
   *  against the whole source, so we send the plain reconstructed text. */
  private buildPrompt(rawText: string, language: "es" | "en"): string {
    const note = language === "es"
      ? "El contenido puede estar en español; consérvalo tal cual."
      : "Content may be in English; keep it as-is."
    return `Extract this resume into the following JSON shape. Include a field ONLY if it is present in the text; otherwise omit it or leave it empty. Do not invent anything. ${note}

{
  "isResume": true,
  "personalDetails": {
    "firstName": "", "lastName": "", "jobTitle": "",
    "email": "", "phone": "", "address": "", "city": "", "country": "", "postalCode": "",
    "website": "", "linkedin": "", "github": "",
    "socials": [{ "network": "twitter|instagram|behance|dribbble|portfolio|youtube|stackoverflow|...", "url": "" }]
  },
  "summary": "",
  "workExperience": [{ "employer": "", "jobTitle": "", "city": "", "startDate": "", "endDate": "", "currentlyWorking": false, "description": "" }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "city": "", "startDate": "", "endDate": "", "currentlyStudying": false, "description": "" }],
  "skills": [{ "name": "", "level": "beginner|intermediate|advanced|expert" }],
  "languages": [{ "name": "", "level": "a1|a2|b1|b2|c1|c2|native" }],
  "certifications": [{ "name": "", "issuer": "", "date": "", "url": "" }],
  "projects": [{ "name": "", "role": "", "startDate": "", "endDate": "", "description": "", "url": "" }],
  "volunteer": [{ "organization": "", "role": "", "startDate": "", "endDate": "", "description": "" }],
  "hobbies": ""
}

Rules:
- Full name: put the given name(s) in firstName and ALL surnames in lastName (Latin-American resumes usually have two surnames — keep both in lastName).
- Language level: map any wording (native, fluent, "conversacional", B2, advanced, stars) to the nearest CEFR value (a1..c2 or native).
- Work/project descriptions: preserve the ORIGINAL structure. If the source lists discrete achievements — whatever their marker (•, -, *, ●, ▪, →, ✓, numbered "1." / "a)") — return each as its own line prefixed with "• ". If a role is written as a genuine NARRATIVE PARAGRAPH (flowing prose describing scope and impact), keep it as prose — do NOT chop it into bullets. If it opens with an intro sentence and then lists achievements, keep the intro as a prose line and mark only the achievements with "• ". Never rephrase, merge, translate, or add metrics.
- Put LinkedIn/GitHub in their own fields; any other social/portfolio link goes in socials[].
- SKILL vs CERTIFICATION. A certification is a credential SOMEBODY AWARDED — a course, exam, bootcamp or licence, usually with an issuer or a year ("App Development with Swift Associate (2024)", "AWS Solutions Architect"). A bare capability is a SKILL ("SwiftUI", "Excel", "Triage"). Copy each item into the section its OWN heading puts it under; do not reassign items between the two lists, and never split one list across both fields.

=== RESUME TEXT ===
${rawText}`
  }

  /**
   * Apply ids + defaults, then DROP any entity whose identifying field is not
   * grounded in the source text, and blank any hallucinated description. This is
   * what guarantees precision: the model can only surface data that is actually
   * in the document.
   */
  private groundAndShape(p: LlmResume, rawText: string): ResumeSections {
    const source = rawText.toLowerCase()
    /** What the repair pass had to fix, and what it could not. Never silent. */
    const recoveredContacts = { fixed: 0, lost: 0 }
    const grounded = (v: unknown): boolean => {
      const val = s(v)
      return val.length > 0 && isGroundedIn(val, source)
    }
    // Contact fields, verified against the source and RECOVERED FROM IT when the
    // model's version does not match.
    //
    // This used to return "" on any mismatch, which meant the person who
    // imported a two-column PDF lost their own email and phone: extractors emit
    // "mikisaravia ios@gmail.com" for an address rendered without the space, and
    // a literal substring check calls that an invention. Nothing is invented
    // here either — when the model's value does not check out, the address is
    // read out of the document itself. Empty now means the CV really has none.
    const contactOrEmpty = (v: unknown): string => {
      const val = s(v)
      if (val && appearsIn(val, rawText)) return val
      const kind = val.includes("@") ? "email"
        : /^[+\d(]/.test(val) ? "phone"
        : "url"
      const recovered = recoverContact(kind, val, rawText, hostOf(val))
      if (!recovered && val) recoveredContacts.lost++
      else if (recovered && recovered !== val) recoveredContacts.fixed++
      return recovered
    }
    // A description that introduces facts absent from the source is cleared, but
    // the entry (job/edu) is kept — losing a whole job is worse than losing prose.
    //
    // LINE BY LINE, not all-or-nothing. Reported from a real import: a résumé
    // with five jobs came back with four of them carrying 7-12 bullets and one
    // carrying none. The check is whole-field, so ONE figure the model reformatted
    // ("15 %" for "15%") or one tool name it spelled differently is enough to
    // delete every bullet of that job — nine lines of someone's career, gone
    // because of the tenth. Bullets are independent claims and are now judged as
    // such: the invented line is dropped, the verifiable ones are kept.
    //
    // Prose (a paragraph with no line breaks) is unchanged: it is one claim, and
    // half a hallucinated paragraph is not a safe thing to keep.
    let dropped = 0
    const safeDesc = (v: unknown): string => {
      const val = s(v)
      if (!val) return ""
      if (!detectHallucination(val, rawText)) return val

      const lines = val.split("\n").map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) { dropped++; return "" }

      // Figures are compared on normalised text: the CV that says "15%" and the
      // model that writes "15 %" are stating the same number, and cutting the
      // line over the space deletes the user's own achievement.
      const normalisedSource = normaliseFigures(rawText)
      const kept = lines.filter((line) => !detectHallucination(normaliseFigures(line), normalisedSource))
      dropped += lines.length - kept.length
      return kept.join("\n")
    }
    // Canonicalise the description so it renders with the author's intent preserved:
    // any bullet marker (or numbered list) becomes a clean "• " bullet, an intro
    // paragraph before bullets stays prose, and a genuine narrative paragraph is left
    // untouched — never shredded into fake bullets. See normalizeDescription.
    const bulletDesc = (v: unknown): string => normalizeDescription(safeDesc(v))

    // Skills and certifications are routed together, once, by the classifier —
    // never by the model and never twice. See import-classification.ts.
    // Whatever was dropped is counted and reported. A silent discard is how a
    // job lost all its bullets without anything, anywhere, saying so.
    const reportDropped = () => {
      if (dropped > 0) this.logger.warn("[AIImport] hallucinated lines dropped", { count: dropped })
      if (recoveredContacts.fixed > 0 || recoveredContacts.lost > 0) {
        this.logger.warn("[AIImport] contact fields", recoveredContacts)
      }
    }

    const classified = classifyImportedTerms({
      skills: (p.skills ?? []).filter((sk) => grounded(sk.name)).map((sk) => ({ name: s(sk.name), level: s(sk.level) })),
      certifications: (p.certifications ?? [])
        .filter((c) => grounded(c.name))
        .map((c) => ({ name: s(c.name), issuer: s(c.issuer), date: s(c.date), url: contactOrEmpty(c.url) })),
    })

    const pd = p.personalDetails ?? {}
    const draft = {
      personalDetails: {
        firstName: s(pd.firstName),
        lastName: s(pd.lastName),
        jobTitle: s(pd.jobTitle),
        email: contactOrEmpty(pd.email),
        phone: contactOrEmpty(pd.phone),
        address: s(pd.address),
        city: s(pd.city),
        country: s(pd.country),
        postalCode: s(pd.postalCode),
        website: contactOrEmpty(pd.website),
        linkedin: contactOrEmpty(pd.linkedin),
        github: contactOrEmpty(pd.github),
        socials: (pd.socials ?? [])
          .map((x) => ({ network: s(x?.network), url: s(x?.url) }))
          .filter((x) => x.url && isGroundedIn(x.url, source))
          .slice(0, 8),
      },
      summary: safeDesc(p.summary),
      workExperience: (p.workExperience ?? [])
        .filter((w) => grounded(w.employer) || grounded(w.jobTitle))
        .map((w) => ({
          id: randomUUID(),
          employer: s(w.employer),
          jobTitle: s(w.jobTitle),
          city: s(w.city),
          startDate: s(w.startDate),
          endDate: s(w.endDate),
          currentlyWorking: w.currentlyWorking === true,
          description: bulletDesc(w.description),
        }))
        .slice(0, 20),
      education: (p.education ?? [])
        .filter((e) => grounded(e.institution) || grounded(e.degree))
        .map((e) => ({
          id: randomUUID(),
          institution: s(e.institution),
          degree: s(e.degree),
          fieldOfStudy: s(e.fieldOfStudy),
          city: s(e.city),
          startDate: s(e.startDate),
          endDate: s(e.endDate),
          currentlyStudying: e.currentlyStudying === true,
          description: safeDesc(e.description),
        }))
        .slice(0, 12),
      skills: classified.skills.map((sk) => ({ id: randomUUID(), name: sk.name, level: sk.level || "intermediate" })).slice(0, 60),
      languages: (p.languages ?? [])
        .filter((l) => grounded(l.name))
        .map((l) => ({ id: randomUUID(), name: s(l.name), level: (s(l.level) || "b1").toLowerCase() }))
        .slice(0, 12),
      certifications: classified.certifications
        .map((c) => ({ id: randomUUID(), name: c.name, issuer: c.issuer ?? "", date: c.date ?? "", url: contactOrEmpty(c.url) }))
        .slice(0, 20),
      projects: (p.projects ?? [])
        .filter((pr) => grounded(pr.name))
        .map((pr) => ({ id: randomUUID(), name: s(pr.name), role: s(pr.role), startDate: s(pr.startDate), endDate: s(pr.endDate), description: bulletDesc(pr.description), url: contactOrEmpty(pr.url) }))
        .slice(0, 20),
      volunteer: (p.volunteer ?? [])
        .filter((v) => grounded(v.organization) || grounded(v.role))
        .map((v) => ({ id: randomUUID(), organization: s(v.organization), role: s(v.role), startDate: s(v.startDate), endDate: s(v.endDate), description: bulletDesc(v.description) }))
        .slice(0, 12),
      hobbies: s(p.hobbies),
    }

    // NO JOB LEAVES EMPTY WHILE THE DOCUMENT HAS ITS LINES.
    //
    // The rule the CEO set, and the right one: a failed check may not end in a
    // hole. When every line of a role was cut — or the model returned none —
    // the answer is not an empty role, it is to go back to the document and
    // read that role's block out of it. Only a role the CV genuinely describes
    // in no words at all stays blank.
    //
    // Recovered text is the PDF's own, verbatim: this repairs, it never writes.
    const jobs = draft.workExperience as { jobTitle: string; employer: string; description: string }[]
    let recoveredJobs = 0
    for (const job of jobs) {
      if (job.description.trim()) continue
      const fromSource = linesForRole(rawText, job.jobTitle, job.employer)
      if (fromSource) { job.description = fromSource; recoveredJobs++ }
    }
    if (recoveredJobs > 0) this.logger.warn("[AIImport] job bullets recovered from source", { count: recoveredJobs })

    reportDropped()

    // ResumeSectionsSchema fills any remaining defaults + coerces enums
    // (e.g. an out-of-range language level falls back to "b1").
    return ResumeSectionsSchema.parse(draft)
  }
}
