// lib/editor/apply-profile.ts
//
// One answer in, a whole résumé out — computed in one place.
//
// The assistant used to return a stack of cards and make the person press Apply
// on each one, which is not an assistant writing a CV: it is an assistant making
// you assemble it. This turns a model response into the complete set of section
// writes, so the document appears at once and the only things left blank are the
// ones nobody can know for you — the employer, the dates, the university.
//
// Pure on purpose: it takes the current sections and returns the new ones, so it
// is tested against data instead of against a rendered panel, and both entry
// points (the free-text box and the first question) share exactly one copy.
import { nanoid } from "nanoid"
import type {
  PersonalDetails, SkillItem, WorkExperienceItem,
  EducationItem, CertificationItem,
} from "@/types/resume"

/** The subset of a fill-profile response this writes into a CV. */
export interface GeneratedProfile {
  summary?: string | null
  jobTitle?: string | null
  hobbies?: string | null
  suggestedSkills?: string[]
  inferredSkills?: string[]
  suggestedCertifications?: string[]
  workExperienceNew?: {
    jobTitle: string
    employer: string
    city?: string
    startDate?: string
    endDate?: string
    currentlyWorking?: boolean
    description: string
  }[]
  workExperienceUpdates?: { id: string; description: string }[]
  educationNew?: {
    degree: string
    institution: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
  }[]
}

/** One section write: the key to set and the value to set it to. */
export interface SectionWrite {
  key: "personalDetails" | "summary" | "hobbies" | "skills" | "certifications" | "workExperience" | "education"
  value: unknown
}

/** What landed, so the UI can say it without re-deriving it. */
export interface AppliedSummary {
  jobTitle: boolean
  summary: boolean
  skills: number
  certifications: number
  experience: number
  education: number
}

export interface ApplyResult {
  writes: SectionWrite[]
  applied: AppliedSummary
}

const norm = (s: string) => s.toLowerCase().trim()

/**
 * Turns a model response into the writes that build the CV.
 *
 * Nothing here invents a FACT: an employer, a date or a university the model was
 * not told is written as an empty string, and the caller asks for it. What it
 * does write freely is role-typical content — the summary, the skills, the
 * duties of the trade — which is precisely what the person asked the assistant
 * for, and all of it is one click from being removed in the editor.
 */
export function buildProfileWrites(
  data: GeneratedProfile,
  sectionData: Record<string, unknown>,
): ApplyResult {
  const writes: SectionWrite[] = []
  const applied: AppliedSummary = {
    jobTitle: false, summary: false, skills: 0,
    certifications: 0, experience: 0, education: 0,
  }

  const title = (data.jobTitle ?? "").trim()
  if (title) {
    const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
    writes.push({ key: "personalDetails", value: { ...pd, jobTitle: title } })
    applied.jobTitle = true
  }

  const summary = (data.summary ?? "").trim()
  if (summary) {
    writes.push({ key: "summary", value: summary })
    applied.summary = true
  }

  const hobbies = (data.hobbies ?? "").trim()
  if (hobbies) writes.push({ key: "hobbies", value: hobbies })

  // Both skill lists land together: by the time they get here the server has
  // already separated what the user said from what the role implies, and kept
  // employers and cities from entering dressed as skills.
  const skillNames = [...(data.suggestedSkills ?? []), ...(data.inferredSkills ?? [])]
  if (skillNames.length) {
    const existing = (sectionData.skills ?? []) as SkillItem[]
    const seen = new Set(existing.map((s) => norm(s.name ?? "")))
    const fresh: string[] = []
    for (const n of skillNames) {
      const t = n.trim()
      if (!t || seen.has(norm(t))) continue
      seen.add(norm(t))
      fresh.push(t)
    }
    if (fresh.length) {
      writes.push({
        key: "skills",
        value: [...existing, ...fresh.map((n): SkillItem => ({ id: nanoid(), name: n, level: "intermediate" }))],
      })
      applied.skills = fresh.length
    }
  }

  if (data.suggestedCertifications?.length) {
    const existing = (sectionData.certifications ?? []) as CertificationItem[]
    const seen = new Set(existing.map((c) => norm(c.name ?? "")))
    const fresh: string[] = []
    for (const n of data.suggestedCertifications) {
      const t = n.trim()
      if (!t || seen.has(norm(t))) continue
      seen.add(norm(t))
      fresh.push(t)
    }
    if (fresh.length) {
      writes.push({
        key: "certifications",
        value: [...existing, ...fresh.map((n): CertificationItem => ({ id: nanoid(), name: n, issuer: "", date: "", url: "" }))],
      })
      applied.certifications = fresh.length
    }
  }

  // Experience: the updates rewrite descriptions of roles that already exist,
  // the new ones are appended. Computed as ONE array so a CV that gets both in
  // the same response does not lose the first write to the second.
  const existingJobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
  const updates = data.workExperienceUpdates ?? []
  const newJobs = data.workExperienceNew ?? []
  if (updates.length || newJobs.length) {
    const patched = existingJobs.map((j) => {
      const u = updates.find((x) => x.id === j.id)
      return u?.description ? { ...j, description: u.description } : j
    })
    const appended = newJobs.map((e): WorkExperienceItem => ({
      id: nanoid(),
      jobTitle: (e.jobTitle ?? "").trim(),
      employer: (e.employer ?? "").trim(),
      city: e.city ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      currentlyWorking: e.currentlyWorking ?? false,
      description: e.description ?? "",
    }))
    writes.push({ key: "workExperience", value: [...patched, ...appended] })
    applied.experience = appended.length
  }

  if (data.educationNew?.length) {
    const existing = (sectionData.education ?? []) as EducationItem[]
    const appended = data.educationNew.map((e): EducationItem => ({
      id: nanoid(),
      institution: (e.institution ?? "").trim(),
      degree: (e.degree ?? "").trim(),
      fieldOfStudy: e.fieldOfStudy ?? "",
      city: "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      currentlyStudying: false,
      description: "",
    }))
    writes.push({ key: "education", value: [...existing, ...appended] })
    applied.education = appended.length
  }

  return { writes, applied }
}
