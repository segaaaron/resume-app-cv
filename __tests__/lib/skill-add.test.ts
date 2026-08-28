import { describe, it, expect } from "vitest"
import { planSkillAdd } from "@/lib/ats/panel-actions"
import type { SkillItem } from "@/types/resume"

/**
 * LA DECISIÓN DE QUÉ ENTRA A LAS HABILIDADES DEL USUARIO.
 *
 * Vivía dentro de `ATSScorePanel.tsx` —1.744 líneas— mezclada con toasts, estado
 * local y un re-scoring. Ahí el único test posible era leer que la línea
 * existiera, y un test así da verde con la función desconectada: el proyecto ya
 * lo pagó con `applyAllPlan`. Acá se ejecuta.
 */
const id = () => "fixed-id"

const cv = (skills: string[] = []): Record<string, unknown> => ({
  skills: skills.map((name, i) => ({ id: `s${i}`, name, level: "intermediate" })) as SkillItem[],
  workExperience: [{ id: "j1", jobTitle: "Ejecutivo Comercial", employer: "Banco Mercantil", description: "• Ventas." }],
  // El validador lee `personalDetails`, no `personalInfo`: con la clave
  // equivocada el fixture no traía ciudad y el test pasaba por otra razón.
  personalDetails: { city: "Cochabamba", firstName: "Ana", lastName: "Quispe" },
})

describe("una habilidad de verdad entra", () => {
  it("con su grafía correcta", () => {
    const p = planSkillAdd("salesforce", cv(), id)
    expect(p.kind).toBe("add")
    if (p.kind !== "add") return
    expect(p.skills.at(-1)).toMatchObject({ name: "Salesforce", level: "intermediate" })
  })

  it("y conserva las que ya estaban", () => {
    const p = planSkillAdd("Salesforce", cv(["Excel", "SQL"]), id)
    expect(p.kind).toBe("add")
    if (p.kind !== "add") return
    expect(p.skills.map((s) => s.name)).toEqual(["Excel", "SQL", "Salesforce"])
  })
})

describe("la limpieza que evitaba una habilidad llamada «\"Salesforce\".»", () => {
  /**
   * El modelo entrecomilla y cierra con el signo que le toque según dónde caiga
   * el término en su frase. Sin limpiar, eso entraba literal al CV.
   */
  const sucios = ['"Salesforce"', "'Salesforce'", "Salesforce.", "Salesforce,", "“Salesforce”", "  Salesforce  "]
  for (const raw of sucios) {
    it(`«${raw}»`, () => {
      const p = planSkillAdd(raw, cv(), id)
      expect(p.kind, raw).toBe("add")
      if (p.kind !== "add") return
      expect(p.name).toBe("Salesforce")
    })
  }
})

describe("lo que ya está no se duplica", () => {
  it("con la misma grafía", () => {
    expect(planSkillAdd("Salesforce", cv(["Salesforce"]), id).kind).toBe("already_there")
  })

  it("con otra capitalización", () => {
    expect(planSkillAdd("salesforce", cv(["Salesforce"]), id).kind).toBe("already_there")
  })

  /** El defecto que la normalización viene a evitar: «objective-c» junto a «Objective-C». */
  it("bajo otra grafía del mismo término", () => {
    expect(planSkillAdd("objective-c", cv(["Objective-C"]), id).kind).toBe("already_there")
  })
})

describe("lo que NO es una habilidad suya no entra", () => {
  /**
   * Validado contra el motor, no por largo. Meter el empleador o la ciudad del
   * candidato en su lista de habilidades es un CV que se cae leyéndolo.
   */
  it("su propio empleador", () => {
    expect(planSkillAdd("Banco Mercantil", cv(), id).kind).toBe("not_a_skill")
  })

  it("su ciudad", () => {
    expect(planSkillAdd("Cochabamba", cv(), id).kind).toBe("not_a_skill")
  })

  it("su propio cargo", () => {
    expect(planSkillAdd("Ejecutivo Comercial", cv(), id).kind).toBe("not_a_skill")
  })
})

describe("las tres respuestas son tres, y no un booleano", () => {
  /**
   * «No se pudo» y «ya estaba» le piden cosas distintas al usuario: una dice que
   * el término no es una habilidad suya, la otra que ya la tiene escrita de otra
   * forma. Juntas en un booleano, el panel tenía que adivinar qué mensaje dar.
   */
  it("cada caso se distingue", () => {
    expect(planSkillAdd("Salesforce", cv(), id).kind).toBe("add")
    expect(planSkillAdd("Salesforce", cv(["Salesforce"]), id).kind).toBe("already_there")
    expect(planSkillAdd("Banco Mercantil", cv(), id).kind).toBe("not_a_skill")
  })
})
