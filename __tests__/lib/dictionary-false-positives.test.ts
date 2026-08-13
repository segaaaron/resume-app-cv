import { describe, it, expect } from "vitest"
import { findProvenUnlistedSkills } from "@/lib/services/ai/shared/proven-skills"

/**
 * The dictionary is SCANNED AGAINST CV PROSE, so every entry added to it is a new
 * chance to tag somebody with a skill they never claimed. This product has paid
 * for that twice — "room", "expo", "glide", "vault", "epic" and bare "MVP" all had
 * to be pulled back out after they matched ordinary sentences.
 *
 * So each batch is measured against prose from the professions the words could
 * collide with, not against the profession the words came from. A nurse writing
 * about hydration, a builder about turbines and timber, a cook about rice and
 * stitching, a miner about prospecting.
 */
const clean = (prose: string) => findProvenUnlistedSkills(prose, [])

describe("no CROSS-DOMAIN false positives", () => {
  /**
   * The assertion is not "this prose yields no skills" — a nurse who writes about
   * vital signs HAS that skill and should be credited. It is that a word from one
   * profession must never be read as a term from another. Each case below names
   * the exact collision the batch could have caused.
   */
  it.each([
    [
      "nursing: hidratación is not SSR hydration",
      "Atendió a 30 pacientes por turno controlando la hidratación y el registro de signos vitales. Coordinó el traslado de pacientes críticos.",
      ["SSR Hydration", "Hydration"],
    ],
    [
      "construction: turbina and madera are not Turbine and Timber",
      "Supervisó el montaje de una turbina eólica y el aserrado de madera en obra. Coordinó cuadrillas de soldadura.",
      ["Turbine", "Timber"],
    ],
    [
      "hospitality: arroz is not RICE prioritization",
      "Preparó arroz y guarniciones para 200 cubiertos diarios. Capacitó al personal en manipulación de alimentos.",
      ["RICE Prioritization", "RICE"],
    ],
    [
      "textile: puntada and costura are not Stitch",
      "Realizó el corte y la costura de prendas a medida, controlando la puntada y el acabado.",
      ["Stitch"],
    ],
    [
      "mining: prospección is not sales prospecting",
      "Participó en tareas de prospección de minerales y en el mantenimiento de la sala de bombas.",
      ["Sales Prospecting", "Prospecting"],
    ],
    [
      "logistics: sala and depósito are not Room or Vault",
      "Organizó la carga y descarga de camiones en el depósito y ordenó la sala de máquinas.",
      ["Room Database", "Room", "Vault"],
    ],
    [
      "biochem: the acid cycle is not an iOS architecture",
      "Analizó el ciclo TCA en muestras de tejido y documentó los resultados del laboratorio.",
      ["The Composable Architecture (TCA)", "TCA"],
    ],
    [
      "travel: a trip to Moscow is not a prioritisation method",
      "Coordinó la logística de la delegación que viajó a Moscow durante la feria anual.",
      ["MoSCoW Prioritization", "MoSCoW"],
    ],
    [
      "safety: a safe workplace is not the SAFe framework",
      "Implementó procedimientos para mantener un ambiente de trabajo safe y ordenado.",
      ["Scaled Agile Framework (SAFe)", "SAFe"],
    ],
  ])("%s", (_n, prose, forbidden) => {
    const found = clean(prose)
    for (const f of forbidden) expect(found).not.toContain(f)
  })
})

/**
 * And the other half of the promise: the batch has to actually WORK for the people
 * it was written for.
 */
describe("the batch does find the skills it was added for", () => {
  it.each([
    ["iOS", "Built the settings screen with SwiftUI Navigation and fixed several retain cycles found with Instruments profiling.", "instruments profiling"],
    ["Android", "Migrated the list to Jetpack Paging and set up Baseline Profiles before release.", "Jetpack Paging"],
    ["SRE", "Ran the on-call rotation and wrote the postmortem analysis after each incident.", "postmortem analysis"],
    ["security", "Led secure code review sessions and prepared the SOC 2 evidence package.", "secure code review"],
    ["data", "Built the data pipelines feeding the data lake and owned data quality checks.", "data pipelines"],
    ["sales", "Owned sales forecasting for the region and improved quota attainment across the team.", "sales forecasting"],
    ["HR", "Ran talent sourcing for engineering roles and led the employer branding refresh.", "talent sourcing"],
    ["finance", "Prepared the financial audit package and strengthened internal controls.", "internal controls"],
    ["marketing", "Owned media buying and rebuilt the marketing funnel end to end.", "media buying"],
  ])("%s: finds the skill in the prose", (_n, prose, expected) => {
    // Compared case-insensitively: the card preserves the CASING THE CV USED when
    // it matches the canonical term, so a lowercase sentence yields a lowercase
    // chip. That is deliberate — it is why displayAsWritten exists.
    expect(clean(prose).map((s) => s.toLowerCase())).toContain(expected.toLowerCase())
  })
})

/**
 * Second batch — the non-tech half of the dictionary, where the collisions are
 * between trades rather than between a trade and a framework.
 */
describe("no cross-trade false positives", () => {
  it.each([
    [
      "roadworks: nivelar el terreno is not student grading",
      "Supervisó la nivelación del terreno y el vaciado de hormigón en la obra vial.",
      ["Student Grading", "Grading"],
    ],
    [
      "office: pintar la oficina is not the painting trade",
      "Organizó la mudanza de la oficina, incluida la pintura de las salas de reunión.",
      ["Industrial Painting", "Painting"],
    ],
    [
      "warehouse: recepción de mercadería is not front desk",
      "Se encargó de la recepción de mercadería y del control de remitos en el depósito.",
      ["Front Desk Reception", "Front Desk", "Reception"],
    ],
    [
      "electrician: soldadura is welding, never electronics soldering",
      "Realizó soldadura de estructuras metálicas en obra siguiendo los planos.",
      ["Soldering"],
    ],
  ])("%s", (_n, prose, forbidden) => {
    const found = clean(prose)
    for (const f of forbidden) expect(found).not.toContain(f)
  })

  it.each([
    ["nurse", "Realizó la canalización venosa y la toma de muestras para laboratorio.", "iv insertion"],
    ["teacher", "Diseñó adaptaciones curriculares y trabajó con plataforma educativa Moodle.", "iep development"],
    ["paralegal", "Preparó escritos judiciales y participó en instancias de mediación.", "court filings"],
    ["welder", "Ejecutó soldadura TIG en cañerías de acero inoxidable.", "tig welding"],
    ["chef", "Organizó el mise en place y el control de porciones del turno noche.", "food preparation"],
    ["logistics", "Coordinó el despacho aduanero y la cadena de frío de los envíos.", "customs clearance"],
    ["support", "Atendió el chat en vivo y gestionó el escalamiento de casos críticos.", "live chat support"],
    ["embedded", "Trabajó en desarrollo de firmware para microcontroladores STM32.", "firmware development"],
  ])("%s: the trade's own vocabulary IS found", (_n, prose, expected) => {
    expect(clean(prose).map((s) => s.toLowerCase())).toContain(expected)
  })
})

/**
 * Found by this file: displayAsWritten matched the raw string, so a CV saying
 * "canalización venosa" never matched the alias "canalizacion venosa" — termPresent
 * had already found the skill and then the display step returned null and dropped
 * it in silence. EVERY accented Spanish term in the dictionary was affected.
 *
 * The same defect had been found and fixed once in the dictionary index and never
 * carried across to the place that decides what to show.
 */
describe("accented Spanish is not silently dropped", () => {
  it.each([
    ["canalización venosa", "Realizó la canalización venosa en el turno noche.", "IV Insertion"],
    ["adaptaciones curriculares", "Diseñó adaptaciones curriculares para el grupo.", "IEP Development"],
    ["despacho aduanero", "Coordinó el despacho aduanero de cada embarque.", "Customs Clearance"],
    ["cadena de frío", "Controló la cadena de frío durante el traslado.", "Cold Chain"],
    ["gestión documental", "Implementó la gestión documental del área.", "Document Management"],
  ])("finds a skill written with accents: %s", (_n, prose, expected) => {
    expect(clean(prose)).toContain(expected)
  })

  it("still shows the term the way the candidate wrote it when it is the canonical one", () => {
    expect(clean("Built the settings screen with SwiftUI and shipped it.")).toContain("SwiftUI")
  })
})

/**
 * The chip writes this string into a nurse's or a welder's CV, in front of a
 * recruiter who knows how it is spelled.
 */
describe("acronyms in the new batch are not title-cased into nonsense", () => {
  it.each([
    ["Realizó la canalización venosa.", "IV Insertion", "Iv Insertion"],
    ["Ejecutó soldadura TIG en cañerías.", "TIG Welding", "Tig Welding"],
    ["Programó automatización industrial con PLC.", "PLC Programming", "Plc Programming"],
  ])("%s", (prose, right, wrong) => {
    const found = clean(prose)
    expect(found).toContain(right)
    expect(found).not.toContain(wrong)
  })
})

/**
 * Found by auditing the dictionary rather than by a bug report, and every one of
 * these was live before today: the card that says "you've already proven these"
 * was offering skills to people who never claimed them.
 *
 * The earlier fix for this class NAMED the offenders — room, expo, glide, vault,
 * epic. That is a list, and there are 164 forms of four characters or fewer in
 * this dictionary. The structural difference is capitalisation: an acronym is
 * written in capitals in a résumé, an ordinary word is not.
 */
describe("a short word is not an acronym unless the CV wrote it like one", () => {
  it.each([
    ["go the verb", "I go to the client site every week and go through the checklist.", ["go", "Go", "Monday.com"]],
    ["word the noun", "Kept my word with every customer and passed word of the promotions.", ["word", "Word"]],
    ["zoom the lens", "Used a zoom lens to photograph the product line for the catalogue.", ["zoom", "Zoom"]],
    ["lean the cut", "Prepared lean cuts of meat and trimmed portions for the daily menu.", ["lean", "Lean"]],
    ["rag the cloth", "Cleaned the machines with a rag at the end of every shift.", ["rag", "RAG"]],
    ["hive the bees", "Managed the bee hive inspections and the honey harvest each season.", ["Apache Hive", "hive"]],
    ["sox the socks", "Sorted sox and socks by size in the textile warehouse.", ["Internal Controls"]],
    ["monday the weekday", "Coordinó la reunión de los lunes y el reporte semanal del equipo.", ["Monday.com"]],
  ])("%s is not a skill", (_n, prose, forbidden) => {
    const found = clean(prose)
    for (const f of forbidden) expect(found).not.toContain(f)
  })

  // The other half: a real acronym, written the way people write it, still counts.
  it.each([
    ["Go", "Built the payments service in Go and deployed it on Kubernetes.", "Go"],
    ["SQL", "Wrote SQL queries against the reporting warehouse every week.", "SQL"],
    ["AWS", "Migrated the stack to AWS over two quarters.", "AWS"],
    ["UCI", "Trabajó en la UCI del hospital atendiendo pacientes críticos.", "Intensive Care"],
    ["HVAC", "Performed HVAC maintenance across three buildings.", "HVAC"],
  ])("%s written as an acronym still counts", (_n, prose, expected) => {
    expect(clean(prose)).toContain(expected)
  })

  // Longer terms are unaffected: they never needed the evidence.
  it("does not ask a long term to shout", () => {
    expect(clean("coordinó la instalación eléctrica de quince viviendas.")).toContain("Electrical Installation")
  })
})
