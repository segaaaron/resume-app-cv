// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import * as React from "react"
import { act } from "react"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/**
 * LA VENTANA QUE EL CEO PIDIÓ RECUPERAR, EJECUTADA.
 *
 * Los otros casos de esta carpeta leen el código fuente para comprobar que
 * ninguna escritura esquiva la confirmación. Eso no prueba que la ventana
 * FUNCIONE: que las tres versiones se dibujen, que elegir una cambie lo que se
 * va a escribir, y que una viñeta nueva no invente un número de línea. Esto se
 * monta y se aprieta, que es lo más cerca del navegador que llega un test.
 */
const dict: Record<string, string> = {
  diff_title: "Cambio sugerido",
  diff_field_workExperience: "Descripción de experiencia",
  diff_where_line: "línea {n}",
  options_title: "Elige una versión",
  diff_changes: "Qué cambia",
  diff_before: "Actual",
  diff_after: "Sugerido",
  diff_empty: "(vacío)",
  diff_cancel: "Cancelar",
  diff_confirm: "Confirmar cambio",
}
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (k: string, p?: Record<string, string | number>) => {
      let s = dict[k] ?? k
      if (p) for (const [n, v] of Object.entries(p)) s = s.split(`{${n}}`).join(String(v))
      return s
    }
    t.has = (k: string) => k in dict
    return t
  },
}))

const Modal = (await import("@/components/editor/SuggestionDiffModal")).default

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => { root.unmount() })
  container.remove()
})

const texto = () => document.body.textContent ?? ""
function botón(nombre: string): HTMLButtonElement {
  const b = [...document.body.querySelectorAll("button")].find((x) => x.textContent?.trim() === nombre)
  if (!b) throw new Error(`sin botón "${nombre}"`)
  return b as HTMLButtonElement
}
async function click(el: HTMLElement) {
  await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })) })
}

const SUG = { field: "workExperience.description" as const, type: "replace" as const, preview: "A", reason: "" }

describe("la ventana de confirmación", () => {
  it("dibuja las TRES versiones y elegir una cambia lo que se va a escribir", async () => {
    const escrito: string[] = []
    function Host() {
      const [pick, setPick] = React.useState("recomendada")
      return (
        <Modal
          open
          onClose={() => {}}
          onConfirm={(t) => escrito.push(t ?? "")}
          suggestion={{ ...SUG, preview: pick }}
          currentValue="lo que decía antes"
          afterOverride={pick}
          options={[
            { text: "recomendada", label: "Recomendada", why: "", active: pick === "recomendada", onPick: () => setPick("recomendada") },
            { text: "técnica", label: "Técnica", why: "", active: pick === "técnica", onPick: () => setPick("técnica") },
            { text: "negocio", label: "Negocio", why: "", active: pick === "negocio", onPick: () => setPick("negocio") },
          ]}
        />
      )
    }
    await act(async () => { root.render(<Host />) })

    const opciones = [...document.body.querySelectorAll("button[aria-pressed]")]
    expect(opciones).toHaveLength(3)
    expect(opciones.filter((o) => o.getAttribute("aria-pressed") === "true")).toHaveLength(1)

    // Elegir otro ángulo cambia el estado y, con él, el texto que se confirma.
    await click(opciones[1] as HTMLElement)
    /* La marca se mueve con la elección: el estado vive en quien llama, así que
       comprobarlo en el DOM es comprobar el cable entero, no una variable. */
    const marcadas = [...document.body.querySelectorAll("button[aria-pressed=\"true\"]")]
    expect(marcadas).toHaveLength(1)
    expect(marcadas[0].textContent).toContain("técnica")
    await click(botón("Confirmar cambio"))
    expect(escrito).toEqual(["técnica"])
  })

  it("no escribe NADA hasta que se confirma: cancelar no llama a onConfirm", async () => {
    const escrito: string[] = []
    await act(async () => {
      root.render(
        <Modal open onClose={() => {}} onConfirm={(t) => escrito.push(t ?? "")}
          suggestion={SUG} currentValue="antes" afterOverride="después" />,
      )
    })
    await click(botón("Cancelar"))
    expect(escrito).toEqual([])
  })

  it("una viñeta NUEVA no inventa un número de línea", async () => {
    await act(async () => {
      root.render(
        <Modal open onClose={() => {}} onConfirm={() => {}}
          suggestion={{ ...SUG, type: "append" }} currentValue="" afterOverride="la línea nueva"
          where={{ jobTitle: "Cajera — Súper" }} />,
      )
    })
    expect(texto()).toContain("Cajera — Súper")
    /* La pastilla del número, no la palabra: el texto de la propia viñeta puede
       decir «línea» y el test se pondría verde por la razón equivocada. */
    expect(texto()).not.toMatch(/línea\s*(\d+|undefined|NaN)/)
  })

  it("la línea que se reemplaza SÍ se numera", async () => {
    await act(async () => {
      root.render(
        <Modal open onClose={() => {}} onConfirm={() => {}}
          suggestion={SUG} currentValue="antes" afterOverride="después"
          where={{ jobTitle: "Cajera — Súper", line: 2 }} />,
      )
    })
    expect(texto()).toContain("línea 2")
  })

  it("el botón se apaga cuando quien llama dice que falta un dato", async () => {
    await act(async () => {
      root.render(
        <Modal open onClose={() => {}} onConfirm={() => {}}
          suggestion={SUG} currentValue="antes" afterOverride="después" blocked />,
      )
    })
    expect(botón("Confirmar cambio").disabled).toBe(true)
  })
})
