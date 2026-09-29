// lib/ats3/rewrite-checks.ts
//
// LOS CONTROLES DE UNA REESCRITURA. Lo que el código comprueba sobre el texto
// que propuso el modelo —lo prometido está escrito, nada ajeno al CV, sin lista
// de términos, huecos con su unidad, ejes cumplidos…— y el pedido de corrección
// que se le hace en el reintento, dicho en UN mensaje. Dependen sólo de la
// petición y de la línea original: `runRewrite` los usa para decidir.

import { TERMS_PER_BULLET, normalize, termsIn, type Axis, type JobSpec, type ResumeTree, type Suggestion, termKey } from "@/lib/ats3/contracts"
import { opensWeakly } from "@/lib/services/ai/shared/empty-phrasing"
import { cvTextOf, experienceYears, statesQuantity, titleForms } from "@/lib/ats3/score"
import { sameRoot } from "@/lib/ats3/findings"
import type { RewriteRequest } from "@/lib/ats3/rewrite"

export function controlesDe(req: RewriteRequest, original: string, isSummary: boolean) {
  /**
   * LO QUE LA TARJETA PROMETIÓ ESCRIBIR TIENE QUE ESTAR ESCRITO (2026-09-28).
   *
   * La tarjeta dice «la vacante pide X» y el botón promete escribirlo; nada lo
   * comprobaba. Medido en Chrome: la del cargo devolvió un resumen sin el cargo.
   * Se comprueba por PALABRA, como compara un filtro, y se pide una vez más
   * nombrando lo que falta. Si tampoco llega NO se entrega como si cerrara la
   * tarjeta: la persona confirmaba, la tarjeta pasaba a «Hechas» y el análisis
   * siguiente la volvía a abrir — el bucle. Se dice que no se pudo (`declined`).
   */
  const escrito = (texto: string, termino: string) => ` ${normalize(texto)} `.includes(` ${normalize(termino)} `)
  // Un cargo con barra se cumple con cualquiera de sus formas (`titleForms`).
  const faltan = (s: Suggestion) => (req.mustWrite ?? []).filter((t) => normalize(t) && !titleForms(t).some((f) => escrito(s.text, f)))
  /** Lo prometido como lo lee el modelo: las formas de un mismo término, separadas por « | ». */
  const prometido = req.mustWrite?.map((t) => titleForms(t).join(" | "))
  /**
   * Y EL RESUMEN NO AFIRMA NI COPIA LO QUE EL CV NO DICE.
   *
   * Dos cosas medibles para cualquier CV y cualquier vacante: un término que la
   * vacante pide y que el CV no escribe en ninguna parte (el resumen lo
   * afirmaría sin respaldo), y una viñeta pegada entera. Medido en Chrome: el
   * resumen nombró una herramienta del aviso que el CV no tenía y copió una
   * viñeta textual. Lo que la tarjeta pide escribir no cuenta como ajeno.
   */
  const enElCv = termsIn(req.index, cvTextOf(req.tree))
  /**
   * Y LA VIÑETA TAMPOCO (2026-09-28, medido contra la API con el CV del CEO): una
   * tarjeta que sólo pedía la cifra volvió con «…partnering with Agile teams in
   * Scrum and Kanban», y el CV no dice Kanban en ningún lado. Lo que la tarjeta
   * del ATS pidió escribir sí va: el ATS ya lo ancló donde el trabajo lo sostiene.
   */
  const ajenos = (s: Suggestion) =>
    [...termsIn(req.index, s.text)].filter(
      (t) =>
        !enElCv.has(t) &&
        !termsIn(req.index, original).has(t) &&
        !(req.mustWrite ?? []).some((m) => normalize(m) === normalize(t)),
    )
  /**
   * NI COPIA LAS TAREAS DEL AVISO COMO SI FUERAN SUYAS. Medido el 2026-09-28:
   * «Ajuste a registrar ventas, realizar arqueo de caja al cierre, atender
   * reclamos y apoyar en reposición de mercadería» — las funciones del aviso
   * pegadas, y una que el CV no dice. Cuenta cada tramo de tres palabras o más.
   */
  const copiaAviso = (s: Suggestion) => {
    if (!isSummary) return []
    const texto = ` ${normalize(s.text)} `
    return (req.spec.responsibilities ?? [])
      .flatMap((r) => r.split(/[,;]|\s+y\s+|\s+and\s+/))
      .map((r) => r.trim())
      .filter((r) => normalize(r).split(" ").length >= 3 && texto.includes(` ${normalize(r)} `))
  }
  /**
   * NI HABLA DEL CV. «The CV also shows…», «The profile includes…» (medido el
   * 2026-09-28): el resumen es el texto impreso, no un comentario sobre él.
   */
  const comenta = (s: Suggestion) => (isSummary ? s.text.match(/\b(cv|curr[íi]culum|r[ée]sum[ée])\b/gi) ?? [] : [])
  /**
   * NI ENUMERA TÉRMINOS SUELTOS. «Also demonstrated code reviews, Combine,
   * XCTest, and CI/CD.» (medido el 2026-09-28): tres términos del aviso o más
   * y casi nada más es relleno de palabras clave, no una oración.
   */
  const terminosDelAviso = [...req.index.ordered.map((o) => o.needle), ...(req.spec.softSignals ?? []).map(normalize)].filter(Boolean)
  const delAviso = new Set(
    [...(req.spec.mustHave ?? []), ...(req.spec.niceToHave ?? [])].map((r) => req.index.byKey.get(termKey(r.skill)) ?? r.skill),
  )
  const enumera = (s: Suggestion) =>
    isSummary
      ? s.text.split(/(?<=[.!?])\s+/).filter((o) => {
          let resto = ` ${normalize(o)} `
          let n = 0
          for (const t of terminosDelAviso) if (resto.includes(` ${t} `)) { n++; resto = resto.split(` ${t} `).join(" ") }
          // Lista: tres términos o más, y al menos el doble que el resto de las
          // palabras con contenido. «Migré flujos a Combine con Swift y SwiftUI»
          // tiene su acción y no es una lista.
          return n >= 3 && n >= 2 * resto.split(" ").filter((w) => w.length >= 4).length
        })
      : (() => {
          /**
           * UNA VIÑETA SUMA COMO MUCHO `TERMS_PER_BULLET` TÉRMINOS DEL AVISO QUE NO
           * TENÍA — la misma vara que el motor usa al repartir requisitos y que el
           * prompt le dice al modelo. Medido el 2026-09-28 en el banco de oficios:
           * el modelo metía los cuatro términos del aviso en cada línea de la docente.
           */
          const antes = termsIn(req.index, original)
          const nuevos = [...termsIn(req.index, s.text)].filter((t) => delAviso.has(t) && !antes.has(t))
          return nuevos.length > TERMS_PER_BULLET ? nuevos : []
        })()
  /**
   * LA PRUEBA LLEVA SU RESULTADO. Medido el 2026-09-28: con «20% reduction in
   * crash rates» entre los logros, tres resúmenes seguidos salieron sin una sola
   * cifra — identidad, lista de tareas, idiomas. Si el mejor logro elegido para
   * este puesto trae cifra, el resumen tiene que traer alguna además de los años.
   */
  const pruebaElegida = isSummary ? topBulletsOf(req.tree, req.spec)[0] : undefined
  const anios = String(Math.floor(experienceYears(req.tree)))
  const sinPrueba = (s: Suggestion) =>
    pruebaElegida && statesQuantity(pruebaElegida) && !(s.text.match(/\d+/g) ?? []).some((d) => d !== anios) ? [pruebaElegida] : []
  /**
   * CADA ORACIÓN TRABAJA PARA ESTE PUESTO. Salvo la identidad, una oración del
   * resumen trae algo que el aviso pide o la cifra de un logro. «English B2 and
   * Spanish native.» sobre un aviso que no pide idiomas no trae ninguna de las
   * dos (medido el 2026-09-28): ocupa la línea que un reclutador sí lee.
   */
  const fueraDelPuesto = (s: Suggestion) =>
    isSummary
      ? s.text
          .split(/(?<=[.!?])\s+/)
          .slice(1)
          .filter((o) => {
            const t = ` ${normalize(o)} `
            // Una CANTIDAD, no cualquier dígito: el «2» de «B2» no es un resultado.
            return o.trim() && !statesQuantity(o) && !terminosDelAviso.some((x) => t.includes(` ${x} `))
          })
      : []
  /** Y ninguna oración es un dato suelto: «Bachiller.» (medido el 2026-09-28). */
  const sueltas = (s: Suggestion) =>
    isSummary ? s.text.split(/(?<=[.!?])\s+/).map((o) => o.trim()).filter((o) => o && o.split(/\s+/).length < 3) : []
  /**
   * Una viñeta pegada no es sólo la copia exacta: medido el 2026-09-28, quitarle
   * «the … frameworks» a la primera viñeta la hacía pasar. Una oración de ocho
   * palabras o más con el 85% de sus palabras en UNA sola viñeta es esa viñeta.
   */
  const palabras = (t: string) => new Set(normalize(t).split(" ").filter((w) => w.length >= 3))
  const pegadas = (s: Suggestion) => {
    if (!isSummary) return []
    const vinetas = req.tree.roles.flatMap((r) => r.bullets)
    return s.text
      .split(/(?<=[.!?])\s+/)
      .flatMap((o) => {
        const po = palabras(o)
        if (normalize(o).split(" ").length < 8) return []
        const copia = vinetas.find((b) => {
          const pb = palabras(b.text)
          return [...po].filter((w) => pb.has(w)).length / po.size >= 0.85
        })
        return copia ? [copia.text] : []
      })
  }
  /**
   * UN VERBO QUE OTRA VIÑETA YA USA NO SE ESTRENA ACÁ.
   *
   * La tarjeta prometía dejar de repetir «Resolved» y la propuesta abría con
   * «Reduced», que ya abría otra línea (medido el 2026-09-28): arreglar una
   * repetición creaba otra. Cuenta si la línea nueva abre con el verbo que la
   * tarjeta prometió dejar, o con uno de otra viñeta que la original no usaba.
   */
  const aperturaDe = (texto: string) => normalize(texto).split(" ")[0] ?? ""
  const otrasAperturas = new Set(
    req.tree.roles.flatMap((r) => r.bullets).filter((b) => b.id !== req.nodeId).map((b) => aperturaDe(b.text)),
  )
  const repite = (s: Suggestion) => {
    if (isSummary) return []
    const abre = aperturaDe(s.text)
    if (req.avoidOpener && abre === normalize(req.avoidOpener)) return [req.avoidOpener]
    return abre !== aperturaDe(original) && otrasAperturas.has(abre) ? [s.text.split(/\s+/)[0]] : []
  }
  /**
   * LA TARJETA DE LA CIFRA PROMETE EL TAMAÑO. Medido en Chrome: devolvía la
   * misma línea con las palabras en otro orden, sin cifra ni hueco — una
   * consulta cobrada por nada. Cumple con una cifra que la línea ya diga o con
   * el hueco tipado para que la persona la escriba.
   */
  const sinTamano = (s: Suggestion) => (req.wantsSize && !statesQuantity(s.text) && s.placeholders.length === 0 ? 1 : 0)
  /**
   * UN HUECO SIN SALIDA TRABA LA TARJETA. Medido postulando el 2026-09-28: la
   * propuesta traía «across [n] reviews» sin su versión sin cifra, y la ventana
   * no podía ofrecer «no tengo ese dato» — el botón de confirmar quedaba
   * apagado para quien no sabe el número.
   */
  /**
   * UN HUECO DICE DE QUÉ ES EL NÚMERO (2026-09-28, banco de oficios contra la API):
   * «evitar paradas en [n]» y «[n] discrepancies per [n 2] counts». La persona no
   * sabe qué escribir y el ATS lee una línea rota. Vale un token con su unidad
   * adentro («[n piezas]», «[x%]», «[n/semana]») o «[n]» seguido de la palabra
   * que cuenta («[n] reviews»).
   */
  const TOKEN_OK = /^\[(x%|n|x|\$x|de x a y|from x to y|x\/y|n\/\p{L}+|n [\p{L}/ ]+)\]$/u
  const huecoMudo = (s: Suggestion) =>
    [...s.text.matchAll(/\[[^\]]*\]/g)]
      .filter((m) => {
        const tok = m[0]
        if (!TOKEN_OK.test(tok)) return true
        if (tok !== "[n]" && tok !== "[x]") return false
        return !/^\s+\p{L}{3,}/u.test(s.text.slice((m.index ?? 0) + tok.length))
      })
      .map((m) => m[0])
  const sinVariante = (s: Suggestion) => (!isSummary && s.placeholders.length > 0 && !s.variantWithoutMetric?.trim() ? 1 : 0)
  /**
   * LA LÍNEA NUEVA NO ABRE CON UNA TAREA. La tarjeta prometía «abrí con lo que
   * hiciste» y la propuesta volvió con «Apoyé el inventario…» (medido el
   * 2026-09-28): la auditoría siguiente la habría vuelto a señalar.
   */
  const debil = (s: Suggestion) => (!isSummary && opensWeakly(s.text) ? 1 : 0)
  /**
   * LOS EJES QUE LA TARJETA PROMETIÓ, CONTRA LOS QUE EL MODELO DECLARA DE SU
   * LÍNEA NUEVA (`newBasis`). Sin declaración no se le cree: cuenta como no
   * cumplido. El verbo lo prueba además el código (`debil`).
   */
  const ejeDe: Record<Axis, "hasActionVerb" | "hasResult" | "hasMethod"> = { verbo: "hasActionVerb", resultado: "hasResult", método: "hasMethod" }
  /**
   * Y LA DECLARACIÓN SE CONTRASTA CON LO QUE EL CÓDIGO PUEDE VER. Medido en
   * Chrome el 2026-09-28: «Resolví reclamos de clientes con atención al
   * cliente» volvió con los tres ejes en true. Lo único que agregaba era un
   * término de la vacante. Un resultado o un método son palabras NUEVAS que no
   * están en el original ni son un término del aviso —las de lo que la persona
   * contó sí cuentan—; con menos de dos, no se agregó ninguno de los dos.
   * ponytail: el umbral de dos palabras de cuatro letras o más no mira sentido;
   * alcanza para ver relleno de palabra clave, no para juzgar calidad.
   */
  // Lo conocido es el original. Lo que la persona contó ES el aporte legítimo:
  // contarlo como «ya dicho» hacía que una línea escrita con su respuesta
  // pareciera no agregar nada (medido en Chrome el 2026-09-28).
  const conocidas = normalize(original).split(" ").filter((w) => w.length >= 4)
  const aporta = (s: Suggestion) => {
    let texto = ` ${normalize(s.text)} `
    // Lo que la tarjeta prometió escribir y las blandas: ésos son los que
    // rellenan un eje sin decir nada («con atención al cliente»). Una
    // herramienta que el CV declara SÍ es un método —«with XCTest unit
    // tests»—: descontarla negaba la línea que la IA escribió bien (medido con
    // BairesDev el 2026-09-28). La que el CV no declara ya la saca `ajenos`.
    const terminos = [...(req.mustWrite ?? []).flatMap(titleForms).map(normalize), ...(req.spec.softSignals ?? []).map(normalize)]
    for (const t of terminos) if (t) texto = texto.split(` ${t} `).join(" ")
    return texto.split(" ").filter((w) => w.length >= 4 && !conocidas.some((c) => sameRoot(w, c))).length >= 2
  }
  const ejesFaltan = (s: Suggestion): Axis[] =>
    isSummary
      ? []
      : (req.axes ?? []).filter((e) => !s.newBasis?.[ejeDe[e]] || (e !== "verbo" && !aporta(s)))
  /**
   * EL RESUMEN NO HABLA DE LA PERSONA EN TERCERA. Medido el 2026-09-28: abrió
   * «Cajera con 4 años…» y siguió «Realizó el arqueo…, cobró…, atendió…». El
   * guard de persona sólo mira la primera palabra, y en el resumen la tercera
   * aparece en la segunda oración. En español una palabra de cuatro letras o
   * más terminada en «ó» es un pasado de tercera persona.
   * ponytail: los pocos sustantivos así (dominó, buró) contarían.
   *
   * EN INGLÉS, CON EL VOCABULARIO DEL PROPIO CV. «Builds…», «Specializes…» no
   * tienen una marca como la tilde, pero sí una prueba: si una oración abre con
   * una palabra en -s y el CV usa esa raíz como verbo —«developed»,
   * «leading»—, es un verbo en tercera persona. «Skills in…» no tiene esas
   * formas y pasa. Vale para el resumen (cada oración) y la viñeta (su
   * apertura), sin una lista de verbos.
   */
  const vocabulario = new Set(normalize(`${cvTextOf(req.tree)} ${original}`).split(" "))
  const verboEnS = (w: string) => {
    const x = w.toLowerCase()
    // Los tres auxiliares irregulares: una clase cerrada de la gramática, no una
    // lista de verbos que llega tarde. «Has integrated…» (medido el 2026-09-28).
    if (x === "has" || x === "is" || x === "does") return true
    if (x.length < 4 || !x.endsWith("s") || x.endsWith("ss") || w === w.toUpperCase()) return false
    const raices = [x.slice(0, -1), x.endsWith("es") ? x.slice(0, -2) : "", x.endsWith("ies") ? `${x.slice(0, -3)}y` : ""].filter(Boolean)
    return raices.some((r) =>
      [`${r}ed`, `${r}d`, `${r}ing`, r.endsWith("e") ? `${r.slice(0, -1)}ing` : "", r.endsWith("y") ? `${r.slice(0, -1)}ied` : ""].some((f) => f && vocabulario.has(f)),
    )
  }
  const terceraPersona = (s: Suggestion) => {
    if (req.language === "en") {
      const aperturas = (isSummary ? s.text.split(/(?<=[.!?])\s+/) : [s.text]).map((o) => o.trim().split(/\s+/)[0]?.replace(/[^\p{L}]/gu, "") ?? "")
      return [...new Set(aperturas.filter(verboEnS))]
    }
    return isSummary ? [...new Set((s.text.match(/\p{L}{3,}ó(?!\p{L})/gu) ?? []).filter((w) => w !== w.toUpperCase()))] : []
  }
  const problemas = (s: Suggestion) =>
    faltan(s).length + ajenos(s).length + pegadas(s).length + repite(s).length + sinTamano(s) + debil(s) + terceraPersona(s).length + copiaAviso(s).length + sueltas(s).length + ejesFaltan(s).length + comenta(s).length + enumera(s).length + sinPrueba(s).length + fueraDelPuesto(s).length + sinVariante(s) + huecoMudo(s).length
  /** Lo que falta, lo ajeno, lo pegado y el verbo repetido, dicho en UN pedido. */
  const correccion = (s: Suggestion): string => {
    const [f, a, p, v, t, d, tp, ca, su, ej, co, en_, sp, fp, sv] = [faltan(s), ajenos(s), pegadas(s), repite(s), sinTamano(s), debil(s), terceraPersona(s), copiaAviso(s), sueltas(s), ejesFaltan(s), comenta(s), enumera(s), sinPrueba(s), fueraDelPuesto(s), sinVariante(s)]
    const hm = huecoMudo(s)
    const en = req.language === "en"
    return [
      hm.length ? (en ? `The slot ${hm.map((x) => `"${x}"`).join(", ")} does not say what the number counts: put the unit inside it ("[n reviews/week]") or right after it ("[n] reviews").` : `El hueco ${hm.map((x) => `«${x}»`).join(", ")} no dice qué cuenta el número: poné la unidad adentro («[n piezas/día]») o justo después («[n] piezas»).`) : "",
      f.length ? (en ? `The card promised to write ${f.map((t) => titleForms(t).map((x) => `"${x}"`).join(" or ")).join(", ")} exactly as the posting writes it — those words together and in that order — and your text does not. Add it next to what the line already names, dropping nothing.` : `La tarjeta prometió escribir ${f.map((t) => titleForms(t).map((x) => `«${x}»`).join(" o ")).join(", ")} tal cual lo escribe la vacante —esas palabras juntas y en ese orden— y tu texto no lo dice. Agregalo al lado de lo que la línea ya nombra, sin soltar nada.`) : "",
      a.length ? (en ? `The CV never says ${a.map((t) => `"${t}"`).join(", ")}: remove it.` : `El CV no dice ${a.map((t) => `«${t}»`).join(", ")} en ninguna parte: sacalo.`) : "",
      p.length ? (en ? `You pasted a CV bullet verbatim ("${p[0]}"): tell that achievement in the summary's own voice.` : `Pegaste una viñeta tal cual («${p[0]}»): contá ese logro con la voz del resumen.`) : "",
      v.length ? (en ? `Another bullet already opens with "${v[0]}": open with a different verb that says the same.` : `Otra viñeta ya abre con «${v[0]}»: abrí con otro verbo que diga lo mismo.`) : "",
      sv ? (en ? `Your line carries a slot but no variantWithoutMetric: add the same line without the slot, keeping every figure the original had.` : `Tu línea lleva un hueco y no trae variantWithoutMetric: agregá la misma línea sin el hueco, conservando toda cifra que el original tenía.`) : "",
      fp.length ? (en ? `"${fp[0]}" names nothing this posting asks for and no result: replace it with what the person did that the posting asks, or leave it out.` : `«${fp[0]}» no nombra nada de lo que el aviso pide ni un resultado: cambiala por lo que la persona hizo y el aviso pide, o sacala.`) : "",
      sp.length ? (en ? `The summary has no proof: tell this achievement in the summary's voice, with its result and its figure exactly as the CV states them — "${sp[0]}".` : `El resumen no trae prueba: contá este logro con la voz del resumen, con su resultado y su cifra tal cual los dice el CV — «${sp[0]}».`) : "",
      en_.length
        ? isSummary
          ? en ? `"${en_[0]}" lists posting terms: name them inside what the person did, or leave them out.` : `«${en_[0]}» enumera términos del aviso: nombralos dentro de lo que la persona hizo, o sacalos.`
          : en
            ? `You added ${en_.length} posting terms (${en_.join(", ")}): keep at most ${TERMS_PER_BULLET}, the ones that best fit this work, and drop the rest.`
            : `Sumaste ${en_.length} términos del aviso (${en_.join(", ")}): dejá como máximo ${TERMS_PER_BULLET}, los que mejor encajan con este trabajo, y sacá el resto.`
        : "",
      co.length ? (en ? `You wrote about the CV ("${co[0]}"): the summary is the printed text itself, never a comment about the document.` : `Hablaste del CV («${co[0]}»): el resumen es el texto impreso, nunca un comentario sobre el documento.`) : "",
      ej.length ? (en ? `The card promised this line would have: ${ej.join(", ")}, and your newBasis says it does not. Use what the original and the person say; if they do not say it, keep it false — never fill it with a posting term.` : `La tarjeta prometió que esta línea tendría: ${ej.join(", ")}, y tu newBasis dice que no. Usá lo que dicen el original y la persona; si no lo dicen, dejalo en false — nunca lo rellenes con un término de la vacante.`) : "",
      su.length ? (en ? `${su.map((x) => `"${x}"`).join(", ")} is a loose datum: fold it into a complete sentence or leave it out.` : `${su.map((x) => `«${x}»`).join(", ")} es un dato suelto: integralo en una oración completa o sacalo.`) : "",
      ca.length ? (en ? `You copied the posting's duties (${ca.map((x) => `"${x}"`).join(", ")}): the summary says what the CV shows this person did.` : `Copiaste tareas del aviso (${ca.map((x) => `«${x}»`).join(", ")}): el resumen dice lo que el CV muestra que esta persona hizo.`) : "",
      tp.length
        ? en
          ? `${tp.map((w) => `"${w}"`).join(", ")} speaks of the person in the third person: ${isSummary ? "the summary is a noun phrase or the work itself, in one voice" : "open with a past-tense verb"}.`
          : `${tp.map((w) => `«${w}»`).join(", ")} habla de la persona en tercera: el resumen va como frase nominal o con el trabajo en sí, en una sola voz.`
        : "",
      d ? (en ? `It opens with a duty ("${s.text.split(/\s+/).slice(0, 2).join(" ")}…"): open with the verb of what was done.` : `Abre con una tarea («${s.text.split(/\s+/).slice(0, 2).join(" ")}…»): abrí con el verbo de lo que se hizo.`) : "",
      t ? (en ? `The card promised the size of this achievement: add the typed slot with its believable range, so the person writes the number.` : `La tarjeta prometió el tamaño de este logro: agregá el hueco tipado con su rango creíble, para que la persona escriba el número.`) : "",
    ].filter(Boolean).join(" ")
  }

  return { escrito, faltan, prometido, enElCv, ajenos, copiaAviso, comenta, terminosDelAviso, delAviso, enumera, pruebaElegida, anios, sinPrueba, fueraDelPuesto, sueltas, palabras, pegadas, aperturaDe, otrasAperturas, repite, sinTamano, TOKEN_OK, huecoMudo, sinVariante, debil, ejeDe, conocidas, aporta, ejesFaltan, vocabulario, verboEnS, terceraPersona, problemas, correccion }
}

/**
 * LA PRUEBA DEL RESUMEN SALE DE LO QUE ESTE PUESTO PIDE (2026-09-28).
 *
 * Eran las tres primeras viñetas con un número, sin mirar la vacante: el
 * resumen podía probar lo que el puesto no pide y callar lo que sí. Ahora gana
 * la viñeta que demuestra más de lo pedido —cada término vale más cuanto antes
 * lo pide la vacante—, y a igual demostración, la que trae cifra y la del
 * puesto más reciente.
 */
export function topBulletsOf(tree: ResumeTree, spec: JobSpec): string[] {
  // Lo que el puesto pide, con su peso: antes pedido, más pesa. Por RAÍZ, como
  // `bestHomeFor`: para elegir la prueba importa que la viñeta hable de eso
  // —«RESTful APIs» habla de «REST APIs»—, no que lo escriba literal; eso lo
  // mide el puntaje, no esta elección.
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].map((r) => normalize(r.skill).split(" ").filter((w) => w.length >= 4))
  return tree.roles
    .flatMap((r, ri) => r.bullets.map((b) => ({ b, ri })))
    .map(({ b, ri }) => {
      const palabras = normalize(b.text).split(" ")
      const relevancia = pedidos.reduce(
        (n, ws, i) => n + (ws.length > 0 && ws.some((w) => palabras.some((p) => sameRoot(w, p))) ? pedidos.length - i : 0),
        0,
      )
      // La PRUEBA es un resultado: entre las viñetas que hablan de lo pedido,
      // primero las que traen cifra — sin cifra el modelo no tiene qué contar y
      // copia la viñeta (medido el 2026-09-28). Una cifra sobre trabajo que el
      // puesto no pide no prueba ajuste.
      const cifra = statesQuantity(b.text) && relevancia > 0 ? 100_000 : 0
      return { texto: b.text, valor: cifra + relevancia * 10 - ri }
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3)
    .map((x) => x.texto)
}

