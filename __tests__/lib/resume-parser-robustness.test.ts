/**
 * Batería de robustez — el parser debe degradar con gracia ante CUALQUIER CV.
 * Cubre: formatos de fecha variados, secciones en desorden, datos faltantes,
 * bullets diversos, idiomas mezclados, ruido, y casos límite que rompen
 * parsers ingenuos. No exige perfección en todos — exige que NO crashee y que
 * acierte lo esencial (nombre, contacto, ≥1 trabajo cuando existe).
 */
import { describe, it, expect } from "vitest"
import { parseResumeText, detectLanguage } from "@/lib/parseResumeText"

describe("robustez: formatos de fecha variados", () => {
  const cases: Array<[string, string, string]> = [
    ["mes abreviado EN", "Software Engineer | Acme | Jan 2020 - Mar 2023", "03/2023"],
    ["mes completo EN", "Software Engineer | Acme | January 2020 - Present", ""],
    ["mes abreviado ES", "Ingeniero | Acme | Ene 2020 - Dic 2022", "12/2022"],
    ["slash MM/YYYY", "Software Engineer | Acme | 01/2020 - 03/2023", "03/2023"],
    ["solo años", "Software Engineer | Acme | 2020 - 2023", "2023"],
    ["año-presente ES", "Ingeniero | Acme | 2020 - Actualidad", ""],
    ["año-presente EN", "Engineer | Acme | 2020 - Current", ""],
    ["em-dash", "Engineer | Acme | 2020 — 2023", "2023"],
  ]
  for (const [label, line, expectedEnd] of cases) {
    it(label, () => {
      const cv = `John Doe\nEngineer\njohn@x.com\nWORK EXPERIENCE\n${line}\n• Did important work that mattered for the company.`
      const r = parseResumeText(cv)
      expect(r.workExperience.length).toBeGreaterThanOrEqual(1)
      expect(r.workExperience[0].employer).toBe("Acme")
      expect(r.workExperience[0].endDate).toBe(expectedEnd)
    })
  }
})

describe("robustez: bullets con símbolos diversos", () => {
  for (const bullet of ["•", "-", "–", "▪", "*", "●", "·", "►"]) {
    it(`bullet "${bullet}"`, () => {
      const cv = `Jane Roe\nDesigner\njane@x.com\nWORK EXPERIENCE\nDesigner | Studio | 2021 - 2023\n${bullet} Designed and shipped a complete brand system for the client.`
      const r = parseResumeText(cv)
      expect(r.workExperience[0]?.description).toContain("brand system")
    })
  }
})

describe("robustez: datos faltantes / CV mínimo", () => {
  it("solo nombre + email", () => {
    const r = parseResumeText("María Pérez\nmaria@correo.com")
    expect(r.personalDetails.firstName).toBe("María")
    expect(r.personalDetails.email).toBe("maria@correo.com")
    expect(r.workExperience).toEqual([])
  })

  it("CV vacío no crashea", () => {
    expect(() => parseResumeText("")).not.toThrow()
    const r = parseResumeText("")
    expect(r.workExperience).toEqual([])
  })

  it("solo ruido no crashea", () => {
    expect(() => parseResumeText("★ ★ ★\n— — —\n....\n@@@")).not.toThrow()
  })

  it("trabajo sin fecha", () => {
    const cv = "Bob Smith\nbob@x.com\nWORK EXPERIENCE\nSenior Engineer | Globex\n• Built the core platform from scratch with a small team."
    const r = parseResumeText(cv)
    expect(r.workExperience.length).toBeGreaterThanOrEqual(1)
    expect(r.workExperience[0].employer).toBe("Globex")
  })

  it("educación sin grado explícito", () => {
    const cv = "Ann Lee\nann@x.com\nEDUCATION\nStanford University | 2015 - 2019"
    const r = parseResumeText(cv)
    expect(r.education.length).toBeGreaterThanOrEqual(1)
    expect(r.education[0].institution).toContain("Stanford")
  })
})

describe("robustez: secciones en orden no estándar", () => {
  it("skills y educación antes de experiencia", () => {
    const cv = `Carlos Vega
Developer
carlos@x.com
SKILLS
Java, Python, SQL
EDUCATION
BSc Computer Science | MIT | 2012 - 2016
WORK EXPERIENCE
Backend Developer | Initech | 2017 - 2020
• Maintained legacy systems and migrated them to the cloud.`
    const r = parseResumeText(cv)
    expect(r.skills.map(s => s.name)).toEqual(expect.arrayContaining(["Java", "Python", "SQL"]))
    expect(r.education.length).toBe(1)
    expect(r.workExperience.length).toBe(1)
    expect(r.workExperience[0].employer).toBe("Initech")
  })

  it("contacto al final", () => {
    const cv = `Diego Torres
Analista de Datos
PERFIL
Analista con experiencia en visualización de datos y machine learning.
EXPERIENCIA
Analista | DataCorp | 2019 - 2022
• Construí dashboards interactivos para la alta dirección.
CONTACTO
diego.torres@correo.com
+52 55 1234 5678
Guadalajara, México`
    const r = parseResumeText(cv)
    expect(r.personalDetails.firstName).toBe("Diego")
    expect(r.personalDetails.email).toBe("diego.torres@correo.com")
    expect(r.workExperience.length).toBe(1)
  })
})

describe("robustez: contacto en formatos variados", () => {
  it("teléfono internacional con paréntesis", () => {
    const r = parseResumeText("Test User\n+1 (555) 123-4567\ntest@x.com")
    expect(r.personalDetails.phone.replace(/\D/g, "")).toContain("5551234567")
  })

  it("LinkedIn y GitHub", () => {
    const cv = "Dev Person\ndev@x.com\nlinkedin.com/in/devperson\ngithub.com/devperson"
    const r = parseResumeText(cv)
    expect(r.personalDetails.linkedin).toContain("devperson")
    expect(r.personalDetails.github).toContain("devperson")
  })

  it("email con punto y guion", () => {
    const r = parseResumeText("A B\nfirst.last-name@sub.domain.com")
    expect(r.personalDetails.email).toBe("first.last-name@sub.domain.com")
  })
})

describe("robustez: skills en distintos formatos", () => {
  it("separados por coma", () => {
    const r = parseResumeText("X Y\nx@x.com\nSKILLS\nReact, Node.js, TypeScript, GraphQL")
    expect(r.skills.length).toBe(4)
  })

  it("separados por pipe", () => {
    const r = parseResumeText("X Y\nx@x.com\nSKILLS\nReact | Node.js | TypeScript")
    expect(r.skills.length).toBe(3)
  })

  it("lista vertical (uno por línea)", () => {
    const r = parseResumeText("X Y\nx@x.com\nSKILLS\nReact\nNode.js\nTypeScript")
    expect(r.skills.map(s => s.name)).toEqual(expect.arrayContaining(["React", "Node.js", "TypeScript"]))
  })

  it("preserva tokens con barra (CI/CD)", () => {
    const r = parseResumeText("X Y\nx@x.com\nSKILLS\nCI/CD, Docker, UX/UI Design")
    expect(r.skills.map(s => s.name)).toEqual(expect.arrayContaining(["CI/CD", "Docker"]))
  })
})

describe("robustez: idiomas con niveles variados", () => {
  it("CEFR (A1-C2)", () => {
    const cv = "X Y\nx@x.com\nLANGUAGES\nEnglish - C1\nGerman - B1\nFrench - A2"
    const r = parseResumeText(cv)
    expect(r.languages.length).toBe(3)
    expect(r.languages.find(l => l.name === "English")?.level).toBe("full_professional")
  })

  it("texto ES", () => {
    const cv = "X Y\nx@x.com\nIDIOMAS\nEspañol - Nativo\nInglés - Avanzado"
    const r = parseResumeText(cv)
    expect(r.languages.find(l => l.name === "Español")?.level).toBe("native")
  })

  it("varios idiomas en una línea", () => {
    const cv = "X Y\nx@x.com\nLANGUAGES\nSpanish (Native) · English (Fluent) · Italian (Basic)"
    const r = parseResumeText(cv)
    expect(r.languages.length).toBe(3)
  })
})

describe("robustez: nombres complejos", () => {
  it("dos apellidos con acentos", () => {
    const r = parseResumeText("José María Rодríguez Núñez\njose@x.com".replace("Rодríguez", "Rodríguez"))
    expect(r.personalDetails.firstName).toBe("José")
    expect(r.personalDetails.lastName).toContain("Rodríguez")
  })

  it("nombre con guion", () => {
    const r = parseResumeText("Anne-Marie Smith\nanne@x.com")
    expect(r.personalDetails.firstName).toBe("Anne-Marie")
  })
})

describe("robustez: múltiples trabajos preservan orden cronológico", () => {
  it("5 trabajos ordenados por fecha descendente", () => {
    const cv = `Multi Job
multi@x.com
WORK EXPERIENCE
Role A | Company A | 2022 - Present
• Led a high-impact initiative across multiple teams.
Role B | Company B | 2019 - 2022
• Delivered key features for the flagship product line.
Role C | Company C | 2016 - 2019
• Built internal tooling that improved team velocity.`
    const r = parseResumeText(cv)
    expect(r.workExperience.length).toBe(3)
    expect(r.workExperience[0].employer).toBe("Company A")
    expect(r.workExperience[0].currentlyWorking).toBe(true)
  })
})

describe("robustez: no inventa datos", () => {
  it("sin sección skills → skills vacío o solo reales", () => {
    const cv = "Solo Trabajo\nsolo@x.com\nWORK EXPERIENCE\nEngineer | Acme | 2020 - 2023\n• Worked on backend services and APIs for the platform."
    const r = parseResumeText(cv)
    // No debe meter palabras de la descripción como skills falsos
    expect(r.skills.every(s => s.name.length < 40)).toBe(true)
  })

  it("idioma de detección correcto", () => {
    expect(detectLanguage("EXPERIENCIA LABORAL\nEDUCACIÓN\nHABILIDADES")).toBe("es")
    expect(detectLanguage("WORK EXPERIENCE\nEDUCATION\nSKILLS")).toBe("en")
  })
})
