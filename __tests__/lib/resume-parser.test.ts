/**
 * Tests de regresión del pipeline de importación de CV:
 * reconstructText (reconstrucción posicional de columnas) + parseResumeText.
 *
 * Simula las 4 geometrías de las plantillas de la app con items posicionados
 * (mismo formato que entrega pdf.js): single-column, sidebar-left,
 * sidebar-right y header full-width + 2 columnas. Con summary sin heading.
 */
import { describe, it, expect } from "vitest"
import { reconstructText, type PageItems, type PositionedItem } from "@/lib/resume-parser/extract-pdf"
import { parseResumeText, detectLanguage } from "@/lib/parseResumeText"

const PAGE_W = 595
const CHAR_W = 0.5 // ancho aprox de un carácter Helvetica en em

/** Builder de página: añade items de texto con posición tipo pdf.js. */
class PageBuilder {
  items: PositionedItem[] = []
  y: number

  constructor(startY = 800) {
    this.y = startY
  }

  text(x: number, s: string, size = 10, gap = 14): this {
    this.items.push({ s, x, y: this.y, w: s.length * size * CHAR_W })
    this.y -= gap
    return this
  }

  /** Varias celdas en la misma línea (tabla / label+valor). */
  row(cells: Array<[number, string]>, size = 10, gap = 14): this {
    for (const [x, s] of cells) {
      this.items.push({ s, x, y: this.y, w: s.length * size * CHAR_W })
    }
    this.y -= gap
    return this
  }

  build(): PageItems {
    return { width: PAGE_W, items: this.items }
  }
}

function parse(pages: PageItems[]) {
  return parseResumeText(reconstructText(pages))
}

// ─── Contenido compartido ──────────────────────────────────────────────────

function addMain(b: PageBuilder, x: number): void {
  b.text(x, "WORK EXPERIENCE", 12, 18)
  b.text(x, "Senior iOS Developer | Acme Corp | 2020 - 2024")
  b.text(x, "Built scalable mobile applications used by millions of users daily.")
  b.text(x, "Led the migration of legacy Objective-C modules into modern Swift.")
  b.text(x, "Backend Developer | Beta Inc | 2017 - 2019")
  b.text(x, "Designed REST APIs consumed by web and mobile clients in production.")
}

function addSidebar(b: PageBuilder, x: number): void {
  b.text(x, "CONTACT", 11, 16)
  b.text(x, "jane@example.com", 9, 12)
  b.text(x, "+1 555 123 4567", 9, 12)
  b.text(x, "EDUCATION", 11, 16)
  b.text(x, "Bachelor of Science", 9, 12)
  b.text(x, "MIT", 9, 12)
  b.text(x, "2013 - 2017", 9, 12)
  b.text(x, "SKILLS", 11, 16)
  b.text(x, "Swift", 9, 12)
  b.text(x, "Kotlin", 9, 12)
  b.text(x, "GraphQL", 9, 12)
  b.text(x, "LANGUAGES", 11, 16)
  b.text(x, "English - Native", 9, 12)
  b.text(x, "Spanish - B2", 9, 12)
}

function expectCoreFields(r: ReturnType<typeof parseResumeText>): void {
  expect(r.personalDetails.firstName).toBe("Jane")
  expect(r.personalDetails.lastName).toBe("Doe Smith")
  expect(r.personalDetails.email).toBe("jane@example.com")
  expect(r.workExperience.length).toBe(2)
  expect(r.workExperience.map(j => j.employer)).toEqual(
    expect.arrayContaining(["Acme Corp", "Beta Inc"])
  )
  expect(r.education.length).toBe(1)
  expect(r.education[0].institution).toBe("MIT")
  expect(r.skills.map(s => s.name)).toEqual(
    expect.arrayContaining(["Swift", "Kotlin", "GraphQL"])
  )
  expect(r.languages.length).toBe(2)
}

// ─── Tests por geometría de plantilla ──────────────────────────────────────

describe("resume-parser: geometrías de plantilla", () => {
  it("single-column", () => {
    const b = new PageBuilder()
    b.text(50, "Jane Doe Smith", 22, 26)
    b.text(50, "Senior iOS Developer", 12, 20)
    b.text(50, "jane@example.com | +1 555 123 4567", 9, 18)
    addMain(b, 50)
    b.text(50, "EDUCATION", 12, 18)
    b.text(50, "Bachelor of Science | MIT | 2013 - 2017")
    b.text(50, "SKILLS", 12, 18)
    b.text(50, "Swift, Kotlin, GraphQL")
    b.text(50, "LANGUAGES", 12, 18)
    b.text(50, "English - Native")
    b.text(50, "Spanish - B2")

    const r = parse([b.build()])
    expectCoreFields(r)
    expect(r.personalDetails.jobTitle).toBe("Senior iOS Developer")
  })

  it("sidebar-left (contact/skills izquierda, nombre y work derecha)", () => {
    const b = new PageBuilder()
    addSidebar(b, 40)
    const main = new PageBuilder()
    main.text(250, "Jane Doe Smith", 22, 26)
    main.text(250, "Senior iOS Developer", 12, 20)
    addMain(main, 250)
    b.items.push(...main.items)

    const r = parse([b.build()])
    expectCoreFields(r)
    expect(r.personalDetails.jobTitle).toBe("Senior iOS Developer")
  })

  it("sidebar-right (nombre y work izquierda, contact/skills derecha)", () => {
    const b = new PageBuilder()
    b.text(50, "Jane Doe Smith", 22, 26)
    b.text(50, "Senior iOS Developer", 12, 20)
    addMain(b, 50)
    const side = new PageBuilder()
    addSidebar(side, 440)
    b.items.push(...side.items)

    const r = parse([b.build()])
    expectCoreFields(r)
    expect(r.personalDetails.jobTitle).toBe("Senior iOS Developer")
  })

  it("header full-width + 2 columnas (nombre cruza el gutter)", () => {
    const b = new PageBuilder()
    // Nombre grande que CRUZA el gutter (x=150, ancho ~370 → cubre el centro)
    b.text(150, "Jane Doe Smith", 24, 28)
    b.text(150, "Senior iOS Developer", 14, 30)
    const main = new PageBuilder(740)
    addMain(main, 50)
    const side = new PageBuilder(740)
    addSidebar(side, 440)
    b.items.push(...main.items, ...side.items)

    const r = parse([b.build()])
    expect(r.personalDetails.firstName).toBe("Jane")
    expect(r.personalDetails.lastName).toBe("Doe Smith")
    expect(r.workExperience.length).toBe(2)
    expect(r.education.length).toBe(1)
    expect(r.skills.map(s => s.name)).toEqual(
      expect.arrayContaining(["Swift", "Kotlin", "GraphQL"])
    )
  })

  it("sidebar con summary SIN heading (estilo Rose) → summary rescue", () => {
    const side = new PageBuilder()
    // Párrafo de perfil sin heading, primera cosa del sidebar (envuelto a ~200pt)
    side.text(40, "Accomplished engineer with over ten years of professional experience", 5, 9)
    side.text(40, "delivering high-quality mobile products for global teams worldwide.", 5, 9)
    addSidebar(side, 40)
    const b = new PageBuilder()
    b.text(250, "Jane Doe Smith", 22, 26)
    b.text(250, "Senior iOS Developer", 12, 20)
    addMain(b, 250)
    b.items.push(...side.items)

    const r = parse([b.build()])
    expectCoreFields(r)
    expect(r.summary).toContain("Accomplished engineer")
  })

  it("tabla YR/ROLE/FIRM/LOC con años de 2 dígitos (celdas posicionadas)", () => {
    const b = new PageBuilder()
    b.text(50, "John Marks", 22, 26)
    b.text(50, "iOS Developer", 12, 20)
    b.text(50, "john@mail.com", 9, 16)
    b.text(50, "WORK EXPERIENCE", 12, 18)
    b.row([[55, "YR"], [85, "ROLE"], [230, "FIRM"], [340, "LOC"]], 9, 13)
    b.text(55, "15", 9, 11)
    b.row([[55, "—"], [85, "iOS Developer"], [230, "Xiobit"], [340, "Cochabamba"]], 9, 11)
    b.text(55, "16", 9, 13)
    b.text(85, "Developed efficient networking layers using URLSession and Combine.", 9, 13)
    b.text(55, "21", 9, 11)
    b.row([[55, "—"], [85, "iOS Developer"], [230, "Rappi"], [340, "Bogota"]], 9, 11)
    b.text(55, "22", 9, 13)
    b.text(85, "Implemented reactive programming patterns improving responsiveness.", 9, 13)

    const r = parse([b.build()])
    expect(r.workExperience.length).toBe(2)
    const [latest, oldest] = r.workExperience
    expect(latest.employer).toBe("Rappi")
    expect(latest.startDate).toBe("2021")
    expect(latest.endDate).toBe("2022")
    expect(oldest.employer).toBe("Xiobit")
    expect(oldest.startDate).toBe("2015")
    expect(oldest.endDate).toBe("2016")
    expect(oldest.description).toContain("networking layers")
  })

  it("date-first rows: '2015–2016 ⇥ Rol ⇥ Empresa · Ciudad' + bullets", () => {
    const b = new PageBuilder()
    b.row([[50, "Miguel Angel"], [200, "Saravia"]], 18, 24)
    b.text(50, "iOS Developer", 12, 20)
    b.text(50, "Work Experience", 13, 18)
    b.row([[50, "2015–2016"], [130, "iOS Developer"], [330, "Xiobit · Cochabamba"]], 10, 14)
    b.text(60, "Implemented efficient networking layers to improve sync.", 9, 13)
    b.text(60, "Enhanced app stability and reduced crash rates greatly.", 9, 13)
    b.row([[50, "2023–2026"], [130, "iOS Developer"], [330, "IA interactive · Mexico"]], 10, 14)
    b.text(60, "Developed and maintained iOS applications using Swift.", 9, 13)
    b.text(50, "Education", 13, 18)
    b.text(50, "· Systems engineer 2010 - 2015 · Catolica University", 9, 13)
    b.text(50, "Certifications", 13, 18)
    b.text(50, "Functional Programming", 9, 13)
    b.text(50, "Concurrency IOS with Swift · 2025", 9, 13)
    b.text(50, "Languages & Contact", 13, 18)
    b.text(50, "Spanish B1 · English B1", 9, 13)
    b.text(50, "—     I N   F I D E M   S C R I P S I     —", 9, 13)

    const r = parse([b.build()])
    expect(r.workExperience.length).toBe(2)
    const latest = r.workExperience[0]
    expect(latest.employer).toBe("IA interactive")
    expect(latest.city).toBe("Mexico")
    expect(latest.startDate).toBe("2023")
    expect(latest.endDate).toBe("2026")
    expect(r.education.length).toBe(1)
    expect(r.education[0].degree).toBe("Systems engineer")
    expect(r.education[0].institution).toBe("Catolica University")
    // Heading combinado "Languages & Contact" → idiomas, no certs
    expect(r.languages.map(l => l.name).sort()).toEqual(["English", "Spanish"])
    // Certs limpias: sin idiomas ni adorno latín
    expect(r.certifications.length).toBe(2)
    expect(r.certifications.some(c => /infidem|scripsi/i.test(c.name))).toBe(false)
    expect(r.certifications.some(c => /spanish|english/i.test(c.name))).toBe(false)
  })
})

// ─── CV en español: paridad ES/EN + todas las secciones ─────────────────────

describe("resume-parser: CV en español completo", () => {
  const cvES = `Ana García López
Ingeniera de Software
ana.garcia@correo.com | +34 612 345 678 | Madrid, España
PERFIL PROFESIONAL
Ingeniera de software con 8 años de experiencia desarrollando aplicaciones web escalables y liderando equipos ágiles.
EXPERIENCIA LABORAL
Desarrolladora Senior | Acme España | 2020 - Presente
• Lideré la migración de la plataforma a microservicios reduciendo costes un 40%.
Desarrolladora Backend | Beta Soluciones | 2017 - 2019
• Diseñé APIs REST consumidas por aplicaciones móviles en producción.
EDUCACIÓN
Licenciatura en Ingeniería Informática | Universidad Politécnica de Madrid | 2011 - 2016
HABILIDADES
Python, Go, Docker, Kubernetes, PostgreSQL, React
IDIOMAS
Español - Nativo
Inglés - Avanzado
Francés - Intermedio
PROYECTOS
Sistema de Reservas — Plataforma SaaS para gestión hotelera con 10k usuarios.
VOLUNTARIADO
Mentora | Code for All | 2019 - 2021
REFERENCIAS
Carlos Ruiz — CTO en Acme España
carlos.ruiz@acme.es | +34 600 111 222
INTERESES
Fotografía, senderismo, ajedrez`

  const r = parseResumeText(cvES)

  it("detecta idioma español", () => {
    expect(detectLanguage(cvES)).toBe("es")
  })

  it("datos personales + ubicación embebida en línea de contacto", () => {
    expect(r.personalDetails.firstName).toBe("Ana")
    expect(r.personalDetails.lastName).toBe("García López")
    expect(r.personalDetails.jobTitle).toBe("Ingeniera de Software")
    expect(r.personalDetails.city).toBe("Madrid")
    expect(r.personalDetails.country).toBe("España")
    expect(r.personalDetails.email).toBe("ana.garcia@correo.com")
  })

  it("experiencia, educación, habilidades", () => {
    expect(r.workExperience.length).toBe(2)
    expect(r.workExperience[0].employer).toBe("Acme España")
    expect(r.workExperience[0].currentlyWorking).toBe(true)
    expect(r.education[0].institution).toBe("Universidad Politécnica de Madrid")
    expect(r.skills.map(s => s.name)).toEqual(
      expect.arrayContaining(["Python", "Go", "Docker", "React"])
    )
    // Sin contaminación de referencias en skills
    expect(r.skills.some(s => /carlos|ruiz|cto/i.test(s.name))).toBe(false)
  })

  it("idiomas en español con niveles", () => {
    expect(r.languages.map(l => l.name).sort()).toEqual(["Español", "Francés", "Inglés"])
    expect(r.languages.find(l => l.name === "Español")?.level).toBe("native")
  })

  it("proyectos, voluntariado, referencias, hobbies", () => {
    expect(r.projects.length).toBe(1)
    expect(r.projects[0].name).toBe("Sistema de Reservas")
    expect(r.projects[0].description).toContain("SaaS")

    expect(r.volunteer.length).toBe(1)
    expect(r.volunteer[0].role).toBe("Mentora")
    expect(r.volunteer[0].organization).toBe("Code for All")

    expect(r.references.length).toBe(1)
    expect(r.references[0].name).toBe("Carlos Ruiz")
    expect(r.references[0].email).toBe("carlos.ruiz@acme.es")

    expect(r.hobbies).toContain("Fotografía")
  })
})

describe("resume-parser: letter-spaced headings (styled 2-column templates)", () => {
  // Regression: templates with letter-spaced sidebar headings extract the
  // heading as single letters ("S K I L L S"). isNoiseLine used to discard it
  // as decoration, so the whole skills section was dropped → "imported CV shows
  // no skills". The collapsed form ("skills") must be recognized as a heading.
  it("detects a 'S K I L L S' heading and parses its skills", () => {
    const text = [
      "John Doe",
      "iOS Developer",
      "Professional Summary",
      "iOS engineer with 7 years of experience.",
      "S K I L L S",
      "Swift\t100",
      "Objective-C\t75",
      "Clean Architecture\t75",
      "XCTest\t75",
    ].join("\n")
    const r = parseResumeText(text)
    const names = r.skills.map((s) => s.name)
    expect(names).toContain("Swift")
    expect(names).toContain("Clean Architecture")
    expect(names).toContain("XCTest")
  })

  it("does not mistake a 'Curriculum Vitæ' document title for the name; reads the sidebar name across lines", () => {
    const cv = [
      "Curriculum Vitæ\t2 0 2 6",
      "CONTACT",
      "Miguel Angel",
      "Saravia",
      "iOS Developer",
      "miki@example.com",
      "Professional Summary",
      "Engineer with 7 years of experience.",
    ].join("\n")
    const r = parseResumeText(cv)
    expect(r.personalDetails.firstName).not.toBe("Curriculum")
    expect(`${r.personalDetails.firstName} ${r.personalDetails.lastName}`).toBe("Miguel Angel Saravia")
    expect(r.personalDetails.jobTitle).toBe("iOS Developer")
  })

  it("parses a date-first education block (2-col sidebar: date / degree / institution)", () => {
    const cv = [
      "CONTACT",
      "John Doe",
      "john@x.com",
      "EDUCATION",
      "2010 — 2015",
      "Systems engineer",
      "Catolica University",
      "EXPERIENCE",
      "iOS Developer\t2015 — 2016",
      "Acme Corp",
      "Built iOS apps.",
    ].join("\n")
    const r = parseResumeText(cv)
    expect(r.education.length).toBe(1)
    const e = r.education[0]
    expect(e.degree).toBe("Systems engineer")     // was the date "2010 — 2015" before
    expect(e.institution).toBe("Catolica University")
    expect(e.startDate).toBe("2010")
    expect(e.endDate).toBe("2015")
    // No phantom work entry whose "employer" is just the education date range.
    expect(r.workExperience.some(j => /^\s*\d{4}\s*[-–—]\s*\d{4}\s*$/.test(j.employer))).toBe(false)
  })

  it("date-first education with an institution ACRONYM: fixes degree/institution swap", () => {
    // "MIT" is not caught by INSTITUTION_RE, so the positional pass mislabels it
    // as the degree — the sanity swap corrects it using the degree keyword.
    const cv = [
      "CONTACT", "x@x.com",
      "EDUCATION",
      "2010 — 2015",
      "MIT",
      "Bachelor of Science",
      "EXPERIENCE", "Developer\t2016 — 2018", "Acme", "• Built things",
    ].join("\n")
    const e = parseResumeText(cv).education[0]
    expect(e.institution).toBe("MIT")
    expect(e.degree).toBe("Bachelor") // "of Science" split into fieldOfStudy
    expect(e.startDate).toBe("2010")
    expect(e.endDate).toBe("2015")
  })

  it("still discards decorative letter-spaced banners that are NOT headings", () => {
    const text = [
      "C U R R I C U L U M",
      "John Doe",
      "Skills",
      "Python, Django",
    ].join("\n")
    const r = parseResumeText(text)
    // "C U R R I C U L U M" collapses to "curriculum" — not a section → stays noise.
    expect(r.skills.map((s) => s.name)).toContain("Python")
    expect(r.skills.map((s) => s.name)).not.toContain("Curriculum")
  })
})
