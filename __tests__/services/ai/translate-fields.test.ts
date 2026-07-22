import { describe, it, expect } from "vitest"

import { ResumeSectionsSchema, type ResumeSections } from "@/types/resume"
import { collectResumeSegments, detectLanguage } from "@/lib/services/ai/shared/translate-fields"

function sampleResume(): ResumeSections {
  return ResumeSectionsSchema.parse({
    personalDetails: {
      firstName: "Ada",
      lastName: "Lovelace",
      jobTitle: "Ingeniera de Software",
      email: "ada@example.com",
      phone: "+51 999 888 777",
      website: "https://ada.dev",
      city: "Lima",
    },
    summary: "Ingeniera con experiencia en desarrollo backend.",
    workExperience: [
      {
        id: "w1",
        employer: "Acme Corp",
        jobTitle: "Desarrolladora Senior",
        city: "Lima",
        startDate: "2020",
        endDate: "2024",
        description: "• Lideré el equipo de pagos\n• Reduje latencia 40%",
      },
    ],
    education: [
      { id: "e1", institution: "MIT", degree: "Licenciatura en Informática", fieldOfStudy: "Ciencias de la Computación", startDate: "2014", endDate: "2018" },
    ],
    skills: [
      { id: "s1", name: "Liderazgo de equipos", level: "advanced" },
      { id: "s2", name: "React", level: "expert" },
    ],
    languages: [{ id: "l1", name: "Inglés", level: "c1" }],
    certifications: [{ id: "c1", name: "AWS Certified", issuer: "Amazon", date: "2023" }],
  })
}

describe("collectResumeSegments — what gets translated", () => {
  it("extracts prose fields (summary, jobTitle, descriptions, degree, skill/lang names)", () => {
    const data = sampleResume()
    const texts = collectResumeSegments(data).map((s) => s.text)

    expect(texts).toContain("Ingeniera de Software")
    expect(texts).toContain("Ingeniera con experiencia en desarrollo backend.")
    expect(texts).toContain("Desarrolladora Senior")
    expect(texts).toContain("• Lideré el equipo de pagos\n• Reduje latencia 40%")
    expect(texts).toContain("Licenciatura en Informática")
    expect(texts).toContain("Ciencias de la Computación")
    expect(texts).toContain("Liderazgo de equipos")
    expect(texts).toContain("React")
    expect(texts).toContain("Inglés")
  })

  it("NEVER extracts proper nouns / machine fields (names, employer, email, dates, cert names)", () => {
    const data = sampleResume()
    const texts = collectResumeSegments(data).map((s) => s.text)

    // person name, contact, employer, institution, dates, cert name+issuer
    for (const forbidden of [
      "Ada", "Lovelace", "ada@example.com", "+51 999 888 777", "https://ada.dev",
      "Acme Corp", "MIT", "2020", "2024", "AWS Certified", "Amazon", "Lima",
    ]) {
      expect(texts).not.toContain(forbidden)
    }
  })

  it("setters mutate ONLY the prose in place — structure and proper nouns are preserved", () => {
    const data = sampleResume()
    const segs = collectResumeSegments(data)
    // Simulate a translation: uppercase each segment (stand-in for translated text).
    segs.forEach((s) => s.set(s.text.toUpperCase()))

    // Prose changed…
    expect(data.summary).toBe("INGENIERA CON EXPERIENCIA EN DESARROLLO BACKEND.")
    expect(data.workExperience[0].jobTitle).toBe("DESARROLLADORA SENIOR")
    expect(data.skills[0].name).toBe("LIDERAZGO DE EQUIPOS")

    // …proper nouns and machine fields untouched.
    expect(data.personalDetails.firstName).toBe("Ada")
    expect(data.personalDetails.email).toBe("ada@example.com")
    expect(data.workExperience[0].employer).toBe("Acme Corp")
    expect(data.workExperience[0].id).toBe("w1")
    expect(data.workExperience[0].startDate).toBe("2020")
    expect(data.education[0].institution).toBe("MIT")
    expect(data.certifications[0].name).toBe("AWS Certified")
    expect(data.languages[0].level).toBe("c1")
  })

  it("skips empty/whitespace fields", () => {
    const data = ResumeSectionsSchema.parse({ summary: "   ", workExperience: [{ id: "w1", jobTitle: "", description: "Real bullet" }] })
    const texts = collectResumeSegments(data).map((s) => s.text)
    expect(texts).toEqual(["Real bullet"])
  })
})

describe("detectLanguage", () => {
  it("detects Spanish from function words and diacritics", () => {
    expect(detectLanguage(["Ingeniera con experiencia en el desarrollo de proyectos y gestión de equipos"])).toBe("es")
  })

  it("detects English from function words", () => {
    expect(detectLanguage(["Software engineer with experience in the development of projects and team management"])).toBe("en")
  })

  it("defaults to Spanish on empty input", () => {
    expect(detectLanguage([])).toBe("es")
    expect(detectLanguage(["", "   "])).toBe("es")
  })
})
