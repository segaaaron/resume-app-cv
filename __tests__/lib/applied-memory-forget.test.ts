// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from "vitest"
import { appliedSignatures, forgetOneApplied, rememberApplied } from "@/lib/ats/panel-actions"

/**
 * Y AL REVERTIR, LA MEMORIA TIENE QUE SOLTAR ESA FIRMA.
 *
 * ── POR QUÉ (CEO, 2026-08-25) ──────────────────────────────────────────────
 *
 * «Deshacer» restaura el texto anterior. Si la firma del texto aplicado quedara
 * guardada, el original vuelve al CV **y el hallazgo que lo señalaba queda
 * filtrado para siempre**: el defecto sigue ahí y el panel deja de verlo. Un
 * deshacer que esconde el problema es peor que no deshacer.
 *
 * Suelta UNA, no la memoria entera: todo lo demás que el usuario aceptó sigue
 * valiendo.
 */
describe("forgetOneApplied", () => {
  const CV = "resume-1"
  beforeEach(() => window.localStorage.clear())

  it("borra sólo la firma revertida", () => {
    rememberApplied(CV, "sig-a")
    rememberApplied(CV, "sig-b")
    forgetOneApplied(CV, "sig-a")
    expect(appliedSignatures(CV)).toEqual(["sig-b"])
  })

  it("olvidar la última deja la memoria vacía, no un resto", () => {
    rememberApplied(CV, "sig-unica")
    forgetOneApplied(CV, "sig-unica")
    expect(appliedSignatures(CV)).toEqual([])
  })

  it("una firma que no está no toca nada", () => {
    rememberApplied(CV, "sig-a")
    forgetOneApplied(CV, "sig-que-no-existe")
    expect(appliedSignatures(CV)).toEqual(["sig-a"])
  })

  it("no cruza CVs", () => {
    rememberApplied(CV, "sig-a")
    rememberApplied("resume-2", "sig-a")
    forgetOneApplied(CV, "sig-a")
    expect(appliedSignatures("resume-2")).toEqual(["sig-a"])
  })
})
