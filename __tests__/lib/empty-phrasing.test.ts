import { describe, it, expect } from "vitest"
import { isEmptyPhrasing } from "@/lib/services/ai/shared/empty-phrasing"
import { hasCliche, findCliches } from "@/lib/services/ai/shared/cliches"

// Every phrase below is one the curated list does NOT contain. Measured before
// this module existed: it caught 0 of 50 such phrases. They are not exotic — they
// are what an ordinary CV says.
describe("isEmptyPhrasing — finds the empty sentence without having been told it", () => {
  it.each([
    "Highly motivated professional with a strong work ethic",
    "Excellent communication and interpersonal skills",
    "Strong analytical and problem-solving abilities",
    "A dedicated and reliable individual",
    "Quick learner with a can-do attitude",
    "Adaptable and flexible in fast-paced environments",
    "Extensive experience in a variety of settings",
    "Strong sense of ownership and accountability",
    "Thrives in a collaborative environment",
  ])("English: %s", (text) => {
    expect(isEmptyPhrasing(text)).toBe(true)
  })

  it.each([
    "Profesional altamente motivado con gran capacidad de trabajo",
    "Excelentes habilidades de comunicación e interpersonales",
    "Gran capacidad analítica y de resolución de problemas",
    "Persona responsable y comprometida con su trabajo",
    "Líder nato con gran don de mando",
    "Amplia experiencia en diversos entornos",
    "Meticuloso y detallista",
  ])("Spanish: %s", (text) => {
    expect(isEmptyPhrasing(text)).toBe(true)
  })

  it.each([
    "Please find attached my resume for your consideration",
    "I am writing to apply for the position advertised on your website",
    "Adjunto mi currículum para su consideración",
    "Quedo a la espera de su respuesta",
    "Me dirijo a ustedes con el fin de postular al puesto",
  ])("application boilerplate: %s", (text) => {
    expect(isEmptyPhrasing(text)).toBe(true)
  })
})

// The expensive error. A false positive sends the gate off to rewrite a sentence
// that was already doing its job, which costs a model call and can replace real
// content with worse content.
// Known, deliberate misses. A phrase with NO rating word in it is left alone,
// because the rule that caught these also caught seven of ten real generated
// summaries ("Enfermera con experiencia en sala de emergencias"). Kept as a test
// so the trade-off is visible and nobody "fixes" it without re-measuring the cost.
describe("isEmptyPhrasing — what it deliberately does not catch", () => {
  it.each([
    "Capacidad para trabajar bajo presión",
    "Clara vocación de servicio al cliente",
    "Able to work well under pressure",
  ])("accepted miss (no rating word): %s", (text) => {
    expect(isEmptyPhrasing(text)).toBe(false)
  })
})

describe("isEmptyPhrasing — leaves real work alone", () => {
  it.each([
    "Ingeniero de software con experiencia en sistemas de pago",
    "Enfermera con experiencia en sala de emergencias",
    "Abogado con trayectoria en derecho laboral",
    "Experienced in Kubernetes and Terraform",
    "Reduced checkout latency from 800ms to 120ms by caching the pricing call",
    "Trained 30 nurses on the new triage protocol",
    "Handled customer inquiries and processed refunds daily",
    "Configured firewall rules for the branch offices",
    "Prepared monthly financial statements for management",
    "Atendió consultas de clientes y procesó devoluciones a diario",
    "Preparó estados financieros mensuales para la gerencia",
    "Soldó estructuras metálicas según planos",
    "Impartió clases de historia a alumnos de secundaria",
    "Tomó signos vitales y registró la evolución de los pacientes",
    "Gestionó el inventario del almacén y las devoluciones a proveedores",
  ])("keeps: %s", (text) => {
    expect(isEmptyPhrasing(text)).toBe(false)
  })

  // These two are in the file's own history: bare "proactivo" and "trabajo en
  // equipo" were once flagged, and it cost real model calls rewriting letters that
  // were fine. A figure or a name is what says the sentence is not generic.
  it("a figure rescues a sentence that hits both word classes", () => {
    expect(isEmptyPhrasing("Un enfoque proactivo al monitoreo evitó 3 caídas del sistema")).toBe(false)
  })

  it("a proper noun rescues it too", () => {
    expect(isEmptyPhrasing("Migró la capacidad de cómputo del equipo a Kubernetes")).toBe(false)
  })

  // Found by auditing this module: a summary headline written in Title Case has a
  // capital on almost every word, which the proper-noun guard read as "this names
  // something real" — so the emptiest line in the CV was the one it let through.
  it("Title Case does not count as grounding", () => {
    expect(isEmptyPhrasing("Highly Motivated Professional With A Strong Work Ethic")).toBe(true)
    expect(isEmptyPhrasing("Excellent Communication And Interpersonal Skills")).toBe(true)
  })

  it("still lets a real name ground a normally-written sentence", () => {
    expect(isEmptyPhrasing("Excellent knowledge of Kubernetes and Terraform")).toBe(false)
  })

  it("empty input is not a cliché", () => {
    expect(isEmptyPhrasing("")).toBe(false)
    expect(isEmptyPhrasing("   ")).toBe(false)
  })
})

describe("one owner — the gates read the structure too, not just the list", () => {
  it("hasCliche now sees a phrase that is nowhere in the list", () => {
    // Not a substring of any entry in CLICHES_EN / CLICHES_ES.
    expect(hasCliche("Excellent organizational and multitasking skills")).toBe(true)
  })

  it("findCliches names the structural finding instead of returning nothing", () => {
    const found = findCliches("Excellent organizational and multitasking skills")
    expect(found).toHaveLength(1)
    expect(found[0]).toContain("empty phrasing")
  })

  it("the list still answers for the phrases it owns", () => {
    expect(findCliches("A proven track record of success")).toContain("proven track record")
  })
})
