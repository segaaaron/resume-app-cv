import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  MANAGED_UNLIMITED,
  isManagedUnlimited,
  isValidManagedLimit,
  resolveResumeLimit,
  resolveCoverLetterLimit,
  LIMITED_DEFAULT_RESUME_LIMIT,
} from "@/lib/plans"

/**
 * "Sin límite", que hasta ahora no se podía decir.
 *
 * Dejar el campo en blanco no servía: `null` significa cosas OPUESTAS según el
 * campo — sin tope en descargas, cinco en CVs y cartas. Y el schema de admin
 * exigía `positive()`, así que no existía ningún valor que un administrador
 * pudiera escribir para pedir "sin tope". Un usuario LIMITED no podía tener CVs
 * ilimitados ni pidiéndolo, aunque `PLAN_LIMITS.LIMITED` los declare.
 *
 * Es -1 y no 0 porque -1 ya es el idioma de esta casa: `PLAN_LIMITS` lo usa para
 * los planes ilimitados y `enforceResumeLimit` ya sale temprano al verlo. Un 0
 * habría significado "infinito" en un archivo donde 0 significa "bloqueado" en
 * la tabla de al lado.
 */
describe("qué acepta un tope de managed", () => {
  it("acepta un positivo y la marca de sin límite", () => {
    expect(isValidManagedLimit(1)).toBe(true)
    expect(isValidManagedLimit(500)).toBe(true)
    expect(isValidManagedLimit(MANAGED_UNLIMITED)).toBe(true)
  })

  /** 0 sería "ninguno", no "infinito", y −2 no significa nada. */
  it("rechaza el cero, los negativos que no son la marca, y los no enteros", () => {
    for (const bad of [0, -2, -100, 1.5, NaN, Infinity]) {
      expect(isValidManagedLimit(bad), String(bad)).toBe(false)
    }
  })

  it("reconoce la marca y nada más", () => {
    expect(isManagedUnlimited(MANAGED_UNLIMITED)).toBe(true)
    for (const other of [null, undefined, 0, 5]) expect(isManagedUnlimited(other)).toBe(false)
  })
})

/**
 * Lo que hace que -1 sea la elección correcta: toda la cadena de abajo ya lo
 * entiende. `enforceResumeLimit` sale temprano, `CoverLetterService` saltea el
 * conteo y el panel de cuota lo describe como infinito. No hubo que tocar nada
 * de eso — sólo dejar que el valor llegue.
 */
describe("el tope viaja intacto hasta quien lo aplica", () => {
  it("deja pasar la marca de sin límite para un managed", () => {
    expect(resolveResumeLimit("LIMITED", MANAGED_UNLIMITED)).toBe(-1)
    expect(resolveCoverLetterLimit("LIMITED", MANAGED_UNLIMITED)).toBe(-1)
  })

  it("mantiene el default de 5 cuando el campo quedó en blanco", () => {
    expect(resolveResumeLimit("LIMITED", null)).toBe(LIMITED_DEFAULT_RESUME_LIMIT)
    expect(resolveResumeLimit("LIMITED", undefined)).toBe(LIMITED_DEFAULT_RESUME_LIMIT)
  })

  it("respeta un número puesto a mano", () => {
    expect(resolveResumeLimit("LIMITED", 20)).toBe(20)
  })

  it("no toca a ningún otro plan", () => {
    expect(resolveResumeLimit("PRO", MANAGED_UNLIMITED)).toBe(-1)
    expect(resolveResumeLimit("UNSUBSCRIBED", MANAGED_UNLIMITED)).toBe(1)
    expect(resolveResumeLimit("BASIC", MANAGED_UNLIMITED)).toBe(5)
  })
})

/**
 * EL CASO PELIGROSO. El cupo de descargas se reserva con un `updateMany` que
 * filtra `managedDownloadsUsed < límite`. Con -1 esa condición no se cumple
 * NUNCA, así que marcar "sin límite" habría bloqueado todas las descargas del
 * usuario — el reverso exacto de lo que el administrador pidió.
 */
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      updateMany: vi.fn(),
      findUnique: vi.fn(async () => ({ isManaged: true })),
    },
  },
}))
import { claimManagedDownload } from "@/lib/services/downloads/managed-quota"
import { db } from "@/lib/db"

describe("reservar una descarga con la marca de sin límite", () => {
  beforeEach(() => vi.clearAllMocks())

  const updateMany = () => db.user.updateMany as unknown as ReturnType<typeof vi.fn>

  it("no filtra por contador: la descarga pasa", async () => {
    updateMany().mockResolvedValue({ count: 1 })
    const r = await claimManagedDownload("u1", { isManaged: true, managedDownloadLimit: MANAGED_UNLIMITED })
    expect(r.ok).toBe(true)
    // La condición que habría bloqueado todo no puede estar en el where.
    const where = updateMany().mock.calls[0][0].where
    expect(where.managedDownloadsUsed).toBeUndefined()
  })

  it("sigue filtrando cuando hay un tope de verdad", async () => {
    updateMany().mockResolvedValue({ count: 1 })
    await claimManagedDownload("u1", { isManaged: true, managedDownloadLimit: 10 })
    expect(updateMany().mock.calls[0][0].where.managedDownloadsUsed).toEqual({ lt: 10 })
  })

  it("el campo en blanco sigue significando sin tope, como antes", async () => {
    updateMany().mockResolvedValue({ count: 1 })
    await claimManagedDownload("u1", { isManaged: true, managedDownloadLimit: null })
    expect(updateMany().mock.calls[0][0].where.managedDownloadsUsed).toBeUndefined()
  })
})
