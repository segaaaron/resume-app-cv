import { describe, it, expect } from "vitest"
import { planRoleReorder } from "@/lib/ats/role-order"
import type { WorkExperienceItem } from "@/types/resume"

/**
 * EL ORDEN DE LA EXPERIENCIA, decidido fuera del componente.
 *
 * Esta función mueve los puestos del CV del usuario. Vivía dentro de
 * `ATSScorePanel.tsx` —1.700 líneas— donde lo único que un test podía hacer era
 * comprobar que la línea existiera. Acá se ejecuta con historiales de verdad.
 */
const rol = (jobTitle: string, startDate?: string, endDate?: string, currentlyWorking = false): WorkExperienceItem =>
  ({ id: jobTitle, jobTitle, startDate, endDate, currentlyWorking, description: "• x" }) as WorkExperienceItem

const titulos = (rows: WorkExperienceItem[] | null) => rows?.map((r) => r.jobTitle) ?? null

describe("ordena del más reciente al más antiguo", () => {
  it("un historial invertido se da vuelta", () => {
    const out = planRoleReorder([
      rol("Cajero", "01/2015", "01/2017"),
      rol("Analista", "02/2017", "03/2020"),
      rol("Gerente", "04/2020", "01/2023"),
    ])
    expect(titulos(out)).toEqual(["Gerente", "Analista", "Cajero"])
  })

  /**
   * El año pelado tiene que leerse. Antes esto parseaba sólo MM/AAAA, así que en
   * un CV escrito «2015 – 2016» nada se ordenaba y el botón respondía «ya está en
   * orden» al hallazgo que acababa de decir lo contrario.
   */
  it("también con años pelados", () => {
    const out = planRoleReorder([rol("Cajero", "2015", "2017"), rol("Gerente", "2020", "2023")])
    expect(titulos(out)).toEqual(["Gerente", "Cajero"])
  })

  it("el puesto actual va primero", () => {
    const out = planRoleReorder([
      rol("Cajero", "01/2015", "01/2017"),
      rol("Gerente", "02/2017", undefined, true),
    ])
    expect(titulos(out)).toEqual(["Gerente", "Cajero"])
  })
})

describe("un puesto sin fecha legible CONSERVA SU POSICIÓN", () => {
  /**
   * La regla que es toda la función. Mandarlo al final o adivinar dónde va sería
   * inventar un orden — el mismo tipo de daño que inventar una fecha: el CV
   * termina afirmando algo que el candidato no dijo.
   */
  it("se queda en su índice mientras los fechados se ordenan alrededor", () => {
    const out = planRoleReorder([
      rol("Cajero", "01/2015", "01/2017"),
      rol("Voluntariado"),
      rol("Gerente", "01/2020", "01/2023"),
    ])
    expect(titulos(out)).toEqual(["Gerente", "Voluntariado", "Cajero"])
  })

  it("y si está en el medio, sigue en el medio aunque todo lo demás se mueva", () => {
    const out = planRoleReorder([
      rol("A", "01/2015", "01/2016"),
      rol("B", "01/2017", "01/2018"),
      rol("SinFecha"),
      rol("C", "01/2021", "01/2022"),
    ])
    expect(titulos(out)?.[2]).toBe("SinFecha")
  })
})

describe("no propone nada cuando no hay nada que hacer", () => {
  it("ya está en orden", () => {
    expect(planRoleReorder([rol("Gerente", "01/2020", "01/2023"), rol("Cajero", "01/2015", "01/2017")])).toBeNull()
  })

  it("un solo puesto", () => {
    expect(planRoleReorder([rol("Cajero", "01/2015", "01/2017")])).toBeNull()
  })

  /** Con una sola fecha legible no hay dos cosas que ordenar entre sí. */
  it("un solo puesto con fecha", () => {
    expect(planRoleReorder([rol("Cajero", "01/2015", "01/2017"), rol("SinFecha")])).toBeNull()
  })

  it("ninguno con fecha legible", () => {
    expect(planRoleReorder([rol("A"), rol("B"), rol("C")])).toBeNull()
  })
})

describe("no pierde ni inventa puestos", () => {
  it("salen los mismos que entraron", () => {
    const entrada = [rol("A", "01/2015", "01/2016"), rol("B"), rol("C", "01/2021", "01/2022")]
    const out = planRoleReorder(entrada)
    expect(out).toHaveLength(3)
    expect(titulos(out)?.slice().sort()).toEqual(["A", "B", "C"])
  })

  /** Empate por fecha: gana el que ya venía primero, no el que decida el sort. */
  it("un empate conserva el orden original", () => {
    expect(planRoleReorder([rol("Primero", "01/2020", "01/2021"), rol("Segundo", "01/2020", "01/2021")])).toBeNull()
  })
})
