import { describe, it, expect } from "vitest"
import { hallucinationKind } from "@/lib/services/ai/shared/ai-helpers"

/**
 * UN SISTEMA CON NOMBRE PROPIO QUE EL CANDIDATO NUNCA DECLARÓ.
 *
 * `TECH_BUZZWORDS` era una lista SÓLO TÉCNICA, y estaba declarada como hueco
 * conocido: «Temenos T24» en el CV de un cajero de banco no lo cazaba nadie más
 * que el prompt. El producto atiende cajeros, enfermeras, abogados y agricultores,
 * y cada rubro tiene sus sistemas — una lista por rubro es una carrera que se
 * pierde, siempre falta el siguiente.
 *
 * Se cierra POR FORMA: la pregunta correcta nunca fue «¿es una marca que conozco?»
 * sino «¿el candidato declaró esto?».
 */
const CV_BANCO = "Cajero en Banco Mercantil Santa Cruz. Arqueo de caja, atención en ventanilla."
const CV_QA = "QA Engineer. Automatización con Selenium y Cypress. Manejo de Jira."
const CV_VENTAS = "Ejecutivo comercial. Gestión de cartera y cierre. Manejo de Excel."

describe("caza el sistema que el CV no dice, en cualquier rubro", () => {
  const casos: Array<[string, string, string]> = [
    ["banca", "Operé Temenos T24 para apertura de cuentas.", CV_BANCO],
    ["ERP", "Registré asientos contables en SAP S4HANA.", CV_VENTAS],
    ["contabilidad", "Concilié cuentas en QuickBooks mensualmente.", CV_VENTAS],
    ["inteligencia de negocio", "Construí tableros en PowerBI para la gerencia.", CV_VENTAS],
    ["diseño técnico", "Dibujé planos de estructura en AutoCAD2024.", CV_BANCO],
  ]
  for (const [rubro, texto, cv] of casos) {
    it(rubro, () => expect(hallucinationKind(texto, cv)).toBe("brand"))
  }
})

describe("y NO toca lo que es legítimo", () => {
  /**
   * La mitad que decide si el guard sirve. «Un guard que tira trabajo bueno hace
   * más daño que el hueco que tapa» — por eso cada uno de estos tiene su razón.
   */
  const casos: Array<[string, string, string]> = [
    ["la herramienta que el propio CV declara", "Automaticé la suite de regresión con Selenium.", CV_QA],
    ["prosa del oficio sin ninguna marca", "Cuadré efectivo, comprobantes y diferencias bajo control interno.", CV_BANCO],
    ["una sigla del oficio", "Cumplí los KPI comerciales mediante prospección activa.", CV_VENTAS],
    ["el empleador que está en el CV", "Atendí clientes en Banco Mercantil Santa Cruz.", CV_BANCO],
    ["siglas de soldadura", "Ejecuté uniones MIG y TIG en estructuras de acero.", CV_BANCO],
    ["una ciudad", "Coordiné la logística entre Cochabamba y Santa Cruz.", CV_BANCO],
    ["un mes", "Cerré el inventario cada Marzo con conteo cíclico.", CV_BANCO],
    ["un nivel de idioma", "Certifiqué inglés B2 para la atención a clientes.", CV_BANCO],
    ["una norma", "Apliqué la norma ISO 9001 en los controles de calidad.", CV_BANCO],
  ]
  for (const [que, texto, cv] of casos) {
    it(que, () => expect(hallucinationKind(texto, cv), texto).not.toBe("brand"))
  }
})

describe("lo que este guard deliberadamente NO mira", () => {
  /**
   * Una palabra capitalizada normal. Cazarla exigiría marcar todo nombre propio,
   * y ahí caerían empleadores reales, ciudades, meses y apellidos — descartando
   * reescrituras correctas. Ese resto lo contiene el prompt, y se dice así en vez
   * de fingir que está cubierto.
   */
  it("una marca sin mayúscula interna ni dígitos se le escapa, y está asumido", () => {
    expect(hallucinationKind("Operé Temenos a diario en ventanilla.", CV_BANCO)).not.toBe("brand")
  })
})
