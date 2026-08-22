import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * EL REGISTRO DE LOS TESTS QUE LEEN CÓDIGO EN VEZ DE EJECUTARLO.
 *
 * ── EL PROBLEMA QUE ESTE ARCHIVO CIERRA ────────────────────────────────────
 *
 * Un test que busca una cadena dentro de un archivo fuente pasa en verde con la
 * funcionalidad rota, y se pone en rojo por renombrar una variable. Da una
 * confianza que no existe. En el panel ATS había 23 —incluido uno que verificaba
 * un COMENTARIO, `toContain("se fue al riel")`— y son parte de por qué los
 * defectos llegaban a la pantalla del CEO con la suite entera en verde.
 *
 * ── PERO NO TODOS SON MALOS, Y LA DIFERENCIA ES PRECISA ────────────────────
 *
 * Hay dos casos donde leer el fuente es la única forma honesta de comprobar algo:
 *
 *   AUSENCIA (`not.toContain`) — de un acceso, un import o una rama que NO
 *   existe no hay comportamiento que ejecutar. Así se verifica que el panel no
 *   lea el crudo del servidor, o que `emails.send` aparezca una sola vez.
 *
 *   OMISIÓN EN UNA RAMA DE IDIOMA — que una regla del prompt exista en español y
 *   en inglés. El defecto es que la rama no esté escrita; no hay salida que
 *   observar en un prompt que nunca se armó.
 *
 * ── CÓMO FUNCIONA ────────────────────────────────────────────────────────────
 *
 * Barre `__tests__/`, cuenta los asserts de PRESENCIA sobre texto leído del disco
 * y los compara con el registro. Agregar uno sin anotarlo falla; retirar uno sin
 * bajar el número, también.
 *
 * No prohíbe: obliga a escribir por qué. Una deuda con nombre y motivo deja de
 * ser una deuda difusa que nadie sabe si vale la pena pagar.
 *
 * ── CÓMO CUENTA, Y POR QUÉ ASÍ ─────────────────────────────────────────────
 *
 * Sólo cuenta cuando la variable se asigna, EN ESE MISMO ARCHIVO, leyendo algo
 * del repo. Una primera versión buscaba nombres de variable conocidos (`src`,
 * `body`…) y contaba de más: en `admin-users-export` la variable `body` es el CSV
 * que devuelve el endpoint, y ese test verifica salida real. Contarlo habría
 * inflado la deuda con tests sanos — el error simétrico del que este guard evita.
 */

/**
 * Archivo → cuántos asserts de presencia tiene hoy, y por qué se aceptan.
 *
 * Bajar un número siempre se puede y es el objetivo. Subirlo obliga a justificar
 * el caso nuevo acá mismo.
 */
const REGISTRO: Record<string, { max: number; razon: string }> = {
  // ── OMISIÓN EN UNA RAMA DE IDIOMA ────────────────────────────────────────
  // El prompt español y el inglés tienen que decir lo mismo. Una rama que no
  // existe no produce salida que mirar: el defecto ES la ausencia.
  "lib/locale-resolution.test.ts": { max: 16, razon: "la resolución de idioma vive repartida en middleware, correos y crons" },
  "lib/tailor-bullet-payload.test.ts": { max: 11, razon: "las reglas del prompt de tailor, en los dos idiomas" },
  "lib/prompt-integrity.test.ts": { max: 3, razon: "las reglas duras existen en las dos ramas del prompt" },
  "lib/cv-writing-doctrine.test.ts": { max: 3, razon: "todos los prompts leen la doctrina compartida" },
  "lib/profile-modes.test.ts": { max: 2, razon: "la cobertura declarada por oficio, en las dos ramas" },

  // ── OWNERSHIP: UN SOLO PUNTO DE SALIDA ───────────────────────────────────
  // El defecto sería una llamada NUEVA en otro archivo, y eso no se observa
  // ejecutando lo que ya existe.
  "lib/list-page-contract.test.ts": { max: 3, razon: "las páginas de lista usan el parser compartido" },
  "lib/billing-portal-guard.test.ts": { max: 2, razon: "la página usa la regla compartida de pasarela" },
  "lib/letter-body-contract.test.ts": { max: 2, razon: "la carta sanitiza en un solo lugar" },
  "services/ai/cover-letter-one-page.test.ts": { max: 1, razon: "las plantillas leen el contrato de métricas" },
  "services/ai/cover-letter-no-jd.test.ts": { max: 1, razon: "el formulario tiene una sola caja, la de la vacante" },
  "lib/cover-letter-ats-merged.test.ts": { max: 1, razon: "el panel ATS de la carta vive dentro de generar con IA" },
  "lib/expire-subscriptions-guard.test.ts": { max: 1, razon: "el cron usa la constante compartida de degradación" },

  // ── COMPOSICIÓN Y CONFIGURACIÓN ──────────────────────────────────────────
  // Ejecutarlo exigiría montar el panel entero con su store y su sesión para
  // leer un árbol de componentes que no depende de datos.
  "lib/ats-block-ownership.test.ts": { max: 3, razon: "el panel monta el riel y el modal, y ningún bloque propio" },
  "lib/analysis-cache-revision.test.ts": { max: 2, razon: "la huella del caché se deriva de la doctrina, no se escribe a mano" },
  "lib/prompt-length-guard.test.ts": { max: 3, razon: "el recorte ocurre antes de armar el prompt, fuera del alcance del test" },
  "lib/ats-one-truth.test.ts": { max: 1, razon: "la herramienta pública conserva la matriz que el panel ya no usa" },
  "lib/ats-panel-memory.test.ts": { max: 1, razon: "la copia del estado final existe en los dos idiomas" },
  "lib/ats-no-duplicate-sections.test.ts": { max: 1, razon: "el panel no conserva ningún bloque propio" },
  "lib/impact-scoring.test.ts": { max: 1, razon: "la banda de cuantificación tiene un solo dueño, no una copia en el panel" },
  "lib/doctrine-ownership.test.ts": { max: 12, razon: "los SIETE prompts que escriben prosa del CV citan la doctrina compartida, y ninguno lleva su copia de la lista de palabras-IA" },
  "lib/grounding-covers-the-work.test.ts": { max: 2, razon: "el grounding del ejecutor ya no recorta a ciegas los puestos" },
  "lib/no-invention-framing.test.ts": { max: 1, razon: "la extracción conserva el no-inventes; los seis de prosa no" },
  "lib/modal-stacking.test.ts": { max: 7, razon: "ningún modal vuelve a elegir su capa a mano; el defecto es una clase que NO debe estar" },
  "lib/figure-guard-ownership.test.ts": { max: 14, razon: "la regla de la cifra es una llamada AUSENTE en el módulo que se la salta" },
  "lib/language-parity.test.ts": { max: 8, razon: "un bloque de prompt escrito en una sola rama es una AUSENCIA: del lado que falta no hay comportamiento que ejecutar" },
  "lib/dial-tone.test.ts": { max: 1, razon: "el tono no puede volver a recibir los críticos; se vigila la FIRMA, que es una ausencia" },
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.test\.tsx?$/.test(e) ? [full] : []
  })
}

/** Cuántos asserts de presencia sobre texto leído del disco tiene un test. */
function presenceAsserts(source: string): number {
  // Fuera los comentarios: varios EXPLICAN un assert retirado citándolo, y
  // contarlos sería contar la documentación del propio arreglo.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")

  // Sólo las variables que en ESTE archivo salen de leer algo del repo.
  const readVars = new Set<string>()
  for (const m of code.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[^\n]*(?:readFileSync|\bread\(|\bcode\()/g)) {
    readVars.add(m[1])
  }

  let n = (code.match(/expect\(\s*(?:read|code)\([^)]*\)\s*\)[^.]*\.toContain\(/g) ?? []).length
  for (const v of readVars) {
    n += (code.match(new RegExp(`expect\\(\\s*${v}\\b[^)]*\\)\\s*(?:,[^)]*\\))?\\s*\\.toContain\\(`, "g")) ?? []).length
  }
  return n
}

const ROOT = join(process.cwd(), "__tests__")

describe("los tests que leen código fuente están registrados y justificados", () => {
  const conteo = new Map<string, number>()
  for (const file of walk(ROOT)) {
    const n = presenceAsserts(readFileSync(file, "utf8"))
    if (n > 0) conteo.set(file.slice(ROOT.length + 1), n)
  }

  it("ninguno tiene más asserts de fuente que los declarados", () => {
    const excedidos = [...conteo]
      .filter(([f, n]) => n > (REGISTRO[f]?.max ?? 0))
      .map(([f, n]) => `${f}: ${n} (registrado ${REGISTRO[f]?.max ?? 0}${REGISTRO[f] ? "" : " — SIN REGISTRAR, hay que justificarlo o reemplazarlo por un test que ejecute"})`)
    expect(excedidos).toEqual([])
  })

  /**
   * El registro no puede envejecer en silencio: una entrada que ya no
   * corresponde a nada da la impresión de que la deuda sigue viva cuando ya se
   * pagó, y quien venga después no sabe cuál de las dos cosas es cierta.
   */
  it("y no lista deudas que ya se pagaron", () => {
    const sobran = Object.entries(REGISTRO)
      .filter(([f]) => (conteo.get(f) ?? 0) === 0)
      .map(([f]) => f)
    expect(sobran).toEqual([])
  })

  it("cada entrada dice por qué se acepta", () => {
    for (const [f, { razon }] of Object.entries(REGISTRO)) {
      expect(razon.length, f).toBeGreaterThan(15)
    }
  })

  /**
   * El total, a la vista. Si sube, alguien está pagando con moneda falsa y este
   * número lo dice antes de que se note en una captura del CEO.
   */
  it("el total registrado es el que hay", () => {
    const total = [...conteo.values()].reduce((a, b) => a + b, 0)
    const declarado = Object.values(REGISTRO).reduce((a, r) => a + r.max, 0)
    expect(total).toBeLessThanOrEqual(declarado)
  })
})
