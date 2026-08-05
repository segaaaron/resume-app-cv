// lib/ats/spellcheck-collect.ts
//
// The prose a spell-checker is allowed to look at, and nothing else.
//
// A résumé is mostly proper nouns: names, employers, schools, certifications,
// technologies. Running a dictionary over those produces a wall of false alarms
// ("Kubernetes", "Saravia", "Dokploy") that trains the user to ignore the panel.
// So the collector is the FIRST line of defence: it hands over sentences the
// candidate wrote, and never the fields that exist to hold names.
//
// Deliberately EXCLUDED: person name, employers, institutions, certification
// names + issuers, references, skills, language names, links, dates. Skills are
// excluded even though users misspell them — a misspelled skill that matters for
// ATS matching is already caught by near-miss.ts against the real job posting,
// where the correct spelling is known instead of guessed.
//
// Pure and dependency-free, so the editor can call it client-side and send only
// the prose to the server (which owns the dictionary).

type Unknown = Record<string, unknown>

function pick(obj: unknown, key: string): string {
  const v = (obj as Unknown | null)?.[key]
  return typeof v === "string" ? v : ""
}

function list(obj: unknown, key: string): Unknown[] {
  const v = (obj as Unknown | null)?.[key]
  return Array.isArray(v) ? (v as Unknown[]) : []
}

/** Free prose from every section that holds sentences the candidate wrote. */
export function collectSpellcheckText(sectionData: unknown): string[] {
  const out: string[] = []
  const add = (v: string) => { if (v.trim()) out.push(v) }

  add(pick(sectionData, "summary"))
  add(pick(sectionData, "hobbies"))
  add(pick((sectionData as Unknown | null)?.personalDetails, "jobTitle"))

  for (const w of list(sectionData, "workExperience")) {
    add(pick(w, "jobTitle"))
    add(pick(w, "description"))
  }
  for (const e of list(sectionData, "education")) {
    add(pick(e, "degree"))
    add(pick(e, "fieldOfStudy"))
    add(pick(e, "description"))
  }
  for (const p of list(sectionData, "projects")) {
    add(pick(p, "role"))
    add(pick(p, "description"))
  }
  for (const v of list(sectionData, "volunteer")) {
    add(pick(v, "role"))
    add(pick(v, "description"))
  }
  for (const c of list(sectionData, "customSections")) {
    add(pick(c, "title"))
    for (const it of list(c, "items")) {
      add(pick(it, "title"))
      add(pick(it, "subtitle"))
      add(pick(it, "description"))
    }
  }

  return out
}

/**
 * The CV's own proper nouns — the candidate's name, employers, schools, cities,
 * certifications, skills, referees. No dictionary contains these, so any of them
 * appearing in prose ("At Dokploy I…", "Saravia led…") would be reported as a
 * misspelling, complete with a confident wrong suggestion ("Saravia → sarapia").
 * Collecting them from the CV itself is what makes the checker safe on the one
 * case a generic spell-checker always gets wrong.
 */
export function collectProperNouns(sectionData: unknown): string[] {
  const out: string[] = []
  const add = (v: string) => { if (v.trim()) out.push(v) }
  const pd = (sectionData as Unknown | null)?.personalDetails

  add(pick(pd, "firstName"))
  add(pick(pd, "lastName"))
  add(pick(pd, "city"))
  add(pick(pd, "country"))

  for (const w of list(sectionData, "workExperience")) {
    add(pick(w, "employer"))
    add(pick(w, "city"))
  }
  for (const e of list(sectionData, "education")) {
    add(pick(e, "institution"))
    add(pick(e, "city"))
  }
  for (const c of list(sectionData, "certifications")) {
    add(pick(c, "name"))
    add(pick(c, "issuer"))
  }
  for (const s of list(sectionData, "skills")) add(pick(s, "name"))
  for (const l of list(sectionData, "languages")) add(pick(l, "name"))
  for (const p of list(sectionData, "projects")) add(pick(p, "name"))
  for (const r of list(sectionData, "references")) {
    add(pick(r, "name"))
    add(pick(r, "company"))
  }

  return out
}
