import { describe, it, expect } from "vitest"
import { checkSpelling } from "@/lib/ats/spellcheck"
import { collectSpellcheckText, collectProperNouns } from "@/lib/ats/spellcheck-collect"
import { applySpellingFix, replaceWord } from "@/lib/ats/apply-spelling"

const typed = (issues: { typed: string }[]) => issues.map((i) => i.typed.toLowerCase())

describe("checkSpelling — catches real typos", () => {
  it("flags Spanish misspellings and offers the right word", async () => {
    const issues = await checkSpelling(["Lideré el desarollo de la plataforma y el analisis de datos."], "es")
    expect(typed(issues)).toEqual(expect.arrayContaining(["desarollo", "analisis"]))
    const fix = issues.find((i) => i.typed === "desarollo")
    expect(fix?.suggestions[0]).toBe("desarrollo")
  })

  it("flags English misspellings", async () => {
    const issues = await checkSpelling(["Responsible for the managment of the enviroment and deployments."], "en")
    expect(typed(issues)).toEqual(expect.arrayContaining(["managment", "enviroment"]))
    expect(issues.find((i) => i.typed === "managment")?.suggestions[0]).toBe("management")
  })

  it("catches a typo the old hand-written list never had", async () => {
    // "liderasgo" was not in common-misspellings.ts — the whole point of a dictionary.
    const issues = await checkSpelling(["Demostré liderasgo en cada proyecto."], "es")
    expect(typed(issues)).toContain("liderasgo")
    expect(issues[0].suggestions[0]).toBe("liderazgo")
  })

  it("preserves the case of the word it corrects", async () => {
    const issues = await checkSpelling(["Managment of the team was my focus."], "en")
    expect(issues[0].suggestions[0]).toBe("Management")
  })
})

describe("checkSpelling — never cries wolf", () => {
  it("leaves technology names alone", async () => {
    const issues = await checkSpelling(
      ["Trabajé con Kubernetes, PostgreSQL, GraphQL, SwiftUI y AWS en produccion."],
      "es"
    )
    // The one real typo is found; not a single stack name is.
    expect(typed(issues)).toEqual(["produccion"])
  })

  it("leaves acronyms and short words alone", async () => {
    const issues = await checkSpelling(["Definí KPIs y SLAs con el equipo de QA y CI/CD."], "es")
    expect(issues).toEqual([])
  })

  it("leaves the candidate's own proper nouns alone, even at the start of a sentence", async () => {
    const sectionData = {
      personalDetails: { firstName: "Miguel", lastName: "Saravia" },
      workExperience: [{ employer: "Dokploy", description: "Saravia lideró el equipo. Dokploy creció." }],
    }
    const issues = await checkSpelling(
      collectSpellcheckText(sectionData),
      "es",
      collectProperNouns(sectionData)
    )
    expect(issues).toEqual([])
  })

  it("leaves loan words from the other language alone", async () => {
    const es = await checkSpelling(["Desarrollé software y firmware para el hardware del cliente."], "es")
    expect(es).toEqual([])
    const en = await checkSpelling(["Delivered the curriculum and the roadmap on time."], "en")
    expect(en).toEqual([])
  })

  // Reported from a real CV: every one of these is a correct word the bundled
  // Spanish dictionary does not carry, and each came back with an invented fix
  // ("backend → bachead", "reutilizables → fertilizables").
  it("leaves real words the dictionary lacks alone", async () => {
    const issues = await checkSpelling(
      [
        "Desarrollé capas de red entre apps iOS y servicios backend.",
        "Integré herramientas de depuración y monitoreo de rendimiento.",
        "Construí componentes modulares reutilizables en Swift.",
        "Integré APIs RESTful, mentorando a desarrolladores junior.",
        "Trabajé en el frontend con testeo automatizado y microservicios.",
      ],
      "es"
    )
    expect(issues).toEqual([])
  })

  it("never offers a correction that is a different word", async () => {
    const issues = await checkSpelling(
      ["Apliqué versionado, dockerizado y refactorización con mentoría del equipo."],
      "es"
    )
    expect(issues).toEqual([])
  })

  it("still catches the doubled-consonant slips English morphology could hide", async () => {
    const issues = await checkSpelling(["The failure occured after the refered request."], "en")
    expect(typed(issues)).toEqual(["occured", "refered"])
  })

  it("returns nothing for empty input", async () => {
    expect(await checkSpelling([], "es")).toEqual([])
    expect(await checkSpelling(["", "   "], "en")).toEqual([])
  })
})

describe("collectSpellcheckText", () => {
  it("reads prose from every section but never the name fields", () => {
    const texts = collectSpellcheckText({
      summary: "Resumen profesional",
      personalDetails: { firstName: "Miguel", jobTitle: "Ingeniero" },
      workExperience: [{ employer: "Acme", jobTitle: "Backend", description: "Construí la API" }],
      education: [{ institution: "UMSA", degree: "Ingeniería", description: "Tesis sobre redes" }],
      skills: [{ name: "Kubernetes" }],
      certifications: [{ name: "AWS Certified" }],
    })
    expect(texts).toContain("Resumen profesional")
    expect(texts).toContain("Ingeniero")
    expect(texts).toContain("Construí la API")
    expect(texts).toContain("Tesis sobre redes")
    // Names and skills are never handed to the dictionary.
    expect(texts).not.toContain("Acme")
    expect(texts).not.toContain("Miguel")
    expect(texts).not.toContain("UMSA")
    expect(texts).not.toContain("Kubernetes")
    expect(texts).not.toContain("AWS Certified")
  })

  it("survives an empty or malformed resume", () => {
    expect(collectSpellcheckText({})).toEqual([])
    expect(collectSpellcheckText(null)).toEqual([])
    expect(collectSpellcheckText({ workExperience: "nope" })).toEqual([])
  })
})

describe("applySpellingFix", () => {
  const cv = {
    summary: "Experiencia en desarollo de software",
    personalDetails: { firstName: "Ana", jobTitle: "Desarollo backend" },
    workExperience: [
      { employer: "Acme", jobTitle: "Backend", description: "Lideré el desarollo del API" },
      { employer: "Globex", jobTitle: "Frontend", description: "Sin errores aquí" },
    ],
    education: [{ institution: "UMSA", description: "Proyecto de desarollo web" }],
  }

  it("replaces the word in every prose field at once", () => {
    const { patch, changed } = applySpellingFix(cv, "desarollo", "desarrollo")
    expect(changed).toBe(true)
    expect(patch.summary).toBe("Experiencia en desarrollo de software")
    expect((patch.personalDetails as { jobTitle: string }).jobTitle).toBe("Desarrollo backend")
    expect((patch.workExperience as { description: string }[])[0].description).toBe("Lideré el desarrollo del API")
    expect((patch.education as { description: string }[])[0].description).toBe("Proyecto de desarrollo web")
  })

  it("keeps every untouched item byte-identical (no data loss)", () => {
    const { patch } = applySpellingFix(cv, "desarollo", "desarrollo")
    const work = patch.workExperience as unknown[]
    // The second job had nothing to fix — same object reference, nothing rebuilt.
    expect(work[1]).toBe(cv.workExperience[1])
    // Employers and institutions are never rewritten.
    expect((work[0] as { employer: string }).employer).toBe("Acme")
  })

  it("reports no change when the word is absent", () => {
    const { patch, changed } = applySpellingFix(cv, "inexistente", "existente")
    expect(changed).toBe(false)
    expect(patch).toEqual({})
  })

  it("never replaces inside a longer word", () => {
    const { patch } = applySpellingFix({ summary: "predesarollo y desarollo" }, "desarollo", "desarrollo")
    expect(patch.summary).toBe("predesarollo y desarrollo")
  })
})

describe("replaceWord — case handling", () => {
  it("keeps a capitalised occurrence capitalised", () => {
    expect(replaceWord("Desarollo backend", "desarollo", "desarrollo")).toBe("Desarrollo backend")
  })

  it("leaves a canonical spelling with its own capitals untouched", () => {
    expect(replaceWord("Javscript y javscript", "javscript", "JavaScript")).toBe("JavaScript y JavaScript")
  })

  it("does not capitalise a mid-sentence occurrence", () => {
    expect(replaceWord("uso desarollo diario", "desarollo", "desarrollo")).toBe("uso desarrollo diario")
  })
})

describe("applySpellingFix — every section it checks, it can fix", () => {
  it("fixes custom sections (checked by the collector, so they must be fixable)", () => {
    const cv = {
      customSections: [
        {
          title: "Logros de desarollo",
          items: [
            { title: "Premio de desarollo", subtitle: "Sin typo", description: "Proyecto de desarollo interno" },
            { title: "Otro", description: "Limpio" },
          ],
        },
      ],
    }
    const { patch, changed } = applySpellingFix(cv, "desarollo", "desarrollo")
    expect(changed).toBe(true)
    const sections = patch.customSections as { title: string; items: { title: string; description?: string }[] }[]
    expect(sections[0].title).toBe("Logros de desarrollo")
    expect(sections[0].items[0].title).toBe("Premio de desarrollo")
    expect(sections[0].items[0].description).toBe("Proyecto de desarrollo interno")
    // Untouched item keeps its exact identity.
    expect(sections[0].items[1]).toBe(cv.customSections[0].items[1])
  })

  it("covers every prose field the collector reads", () => {
    // Guard against the two drifting apart: anything checked must be fixable.
    const cv = {
      summary: "x desarollo",
      hobbies: "x desarollo",
      personalDetails: { jobTitle: "x desarollo" },
      workExperience: [{ jobTitle: "x desarollo", description: "x desarollo" }],
      education: [{ degree: "x desarollo", fieldOfStudy: "x desarollo", description: "x desarollo" }],
      projects: [{ role: "x desarollo", description: "x desarollo" }],
      volunteer: [{ role: "x desarollo", description: "x desarollo" }],
      customSections: [{ title: "x desarollo", items: [{ title: "x desarollo", subtitle: "x desarollo", description: "x desarollo" }] }],
    }
    const { patch } = applySpellingFix(cv, "desarollo", "desarrollo")
    expect(JSON.stringify(patch)).not.toContain("desarollo ")
    expect(Object.keys(patch).sort()).toEqual(
      ["customSections", "education", "hobbies", "personalDetails", "projects", "summary", "volunteer", "workExperience"]
    )
  })
})

describe("applySpellingFix — skills mode (job-keyword near-miss fix)", () => {
  const cv = {
    skills: [{ id: "s1", name: "Javscript" }, { id: "s2", name: "React" }],
    summary: "Experiencia con Javscript",
    education: [{ institution: "UMSA", description: "Curso de Javscript" }],
  }

  it("fixes the skill AND every prose field in one pass", () => {
    const { patch, changed } = applySpellingFix(cv, "Javscript", "JavaScript", { includeSkills: true })
    expect(changed).toBe(true)
    expect((patch.skills as { name: string }[])[0].name).toBe("JavaScript")
    expect(patch.summary).toBe("Experiencia con JavaScript")
    // The old narrow copy of this writer never touched education.
    expect((patch.education as { description: string }[])[0].description).toBe("Curso de JavaScript")
    // Untouched skill keeps its identity.
    expect((patch.skills as unknown[])[1]).toBe(cv.skills[1])
  })

  it("leaves skills alone by default — the spell checker never reads them", () => {
    const { patch } = applySpellingFix(cv, "Javscript", "JavaScript")
    expect(patch.skills).toBeUndefined()
    expect(patch.summary).toBe("Experiencia con JavaScript")
  })
})
