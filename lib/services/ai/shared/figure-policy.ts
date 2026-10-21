// lib/services/ai/shared/figure-policy.ts
//
// QUÉ ES DE LA PERSONA, Y QUÉ PASA CON LA CIFRA QUE NO DIO (CEO, 2026-10-20).
//
// Una sola decisión, en un solo lugar. Nada más vive acá: el verbo, el largo,
// la persona gramatical y el tono siguen en el prompt de cada superficie, que
// es donde pertenecen. La «doctrina compartida» anterior murió justamente por
// mezclarlos: inyectaba reglas de viñeta («al menos 16 palabras», «viñetas •»)
// dentro del prompt de una carta en párrafos, y después se contradecía con las
// reglas propias de cada módulo.
//
// ── POR QUÉ EL DESTINO ES UN PARÁMETRO ──────────────────────────────────────
// La pregunta «¿qué hago con una cifra que el CV no tiene?» se contestaba en
// seis prompts y de tres maneras distintas. No depende del módulo: depende de
// a dónde va el texto.
//
//   confirma → pasa por la ventana de confirmar (`SuggestionDiffModal`): el
//              hueco tipado es un CAMPO que la persona completa, y nada entra
//              al CV sin su visto bueno.
//   directo  → se imprime en el CV o se envía al reclutador tal como salió.
//              Un corchete ahí se lee como un documento sin terminar.
//
// Medido el 2026-10-20: `AISkillBulletModule` devuelve su texto al MISMO modal
// que el ATS3 y aun así prohibía el hueco, mientras el ATS3 lo pedía. Mismo
// destino, dos doctrinas opuestas, porque nadie miró el destino.

export type Destino = "confirma" | "directo"

type Lang = "es" | "en"

/**
 * La línea que separa enriquecer de afirmar de más, en los dos idiomas.
 *
 * Es lo único sutil de todo el motor, y está redactada como REGLA y no como
 * lista: una lista de prohibiciones deja afuera lo que nadie se acordó de
 * escribir — este proyecto ya midió que faltaba el ALCANCE y el modelo lo
 * escribía sin faltar a ninguna regla.
 *
 * El cierre («la persona revisa y confirma cada línea») sólo es verdad cuando
 * el texto pasa por la ventana de confirmar, así que viaja con el destino. Con
 * el default, el texto es idéntico al que el ATS3 venía enviando.
 */
export function truthRule(lang: Lang, destino: Destino = "confirma"): string {
  const confirma = destino === "confirma"
  return lang === "en"
    ? [
        "### WHAT BELONGS TO THE PERSON AND WHAT YOU CONTRIBUTE",
        "- The person's: the figures, the employers, the job titles and the dates. You never write a number they did not give, and you never change those details.",
        `- Yours, and it is the value of this product: the outcome of the work, the method, the posting's terms that fit that work, and the vocabulary of the trade.${confirma ? " The person reviews and confirms every line before it goes into their CV." : ""}`,
      ].join("\n")
    : [
        "### QUÉ ES DE LA PERSONA Y QUÉ APORTAS TÚ",
        "- De la persona: las cifras, los empleadores, los cargos y las fechas. Nunca escribes un número que no te dio ni cambias esos datos.",
        `- Tuyo, y es el valor de este producto: el resultado del trabajo, el método, los términos de la vacante que encajan con ese trabajo y el vocabulario del oficio.${confirma ? " La persona revisa y confirma cada línea antes de que entre en su CV." : ""}`,
      ].join("\n")
}

/**
 * QUÉ HACER CON LA CIFRA QUE LA PERSONA NO DIO.
 *
 * El ATS3 no usa esto: su P4 y su P5 llevan la política dentro de su propia
 * regla numerada, junto al contrato de campos (`figureRule`), y están medidos.
 * Esta pieza es para las superficies que quedaron sin ella.
 */
export function figurePolicy(destino: Destino, lang: Lang): string {
  if (destino === "confirma") {
    return lang === "en"
      ? [
          "### FIGURES IN THIS TEXT",
          "- A figure the person already gave is kept and used: it is the strongest thing they have.",
          "- The one they did not give goes in as a typed slot ([x%], [n], [$x], [n people]) tied to the RESULT, never to a trivial count. Wrong: 'Developed [n] applications'. Right: 'Increased retention by [x%] by developing…'.",
          "- The slot is a field, not a guess: this text goes to a confirmation window where the person fills it in before it reaches their CV.",
        ].join("\n")
      : [
          "### LAS CIFRAS EN ESTE TEXTO",
          "- La cifra que la persona ya dio se conserva y se usa: es lo más fuerte que tiene.",
          "- La que no dio va como hueco tipado ([x%], [n], [$x], [n personas]) ligado al RESULTADO, nunca a una cuenta trivial. Mal: «Desarrollé [n] aplicaciones». Bien: «Aumenté la retención en [x%] desarrollando…».",
          "- El hueco es un campo, no una suposición: este texto va a una ventana de confirmación donde la persona lo completa antes de que llegue a su CV.",
        ].join("\n")
  }
  return lang === "en"
    ? [
        "### FIGURES IN THIS TEXT",
        "- This text enters the document exactly as you write it: it is printed or sent to the recruiter, and nobody will fill anything in afterwards.",
        "- A figure the person already gave is kept and used: it is the strongest thing they have.",
        "- The one they did not give is not written, and NEVER as a bracketed slot ([x%], [n]): a bracket in a CV reads as an unfinished document. State the result without a number.",
      ].join("\n")
    : [
        "### LAS CIFRAS EN ESTE TEXTO",
        "- Este texto entra al documento tal como lo escribes: se imprime o se envía al reclutador, y nadie lo va a completar después.",
        "- La cifra que la persona ya dio se conserva y se usa: es lo más fuerte que tiene.",
        "- La que no dio no se escribe, y NUNCA como hueco entre corchetes ([x%], [n]): un corchete en un CV se lee como algo sin terminar. Di el resultado sin número.",
      ].join("\n")
}
