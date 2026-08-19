// What makes a line worth putting on a CV — written once, used by every prompt.
//
// WHY THIS FILE EXISTS. Each AI endpoint carried its own idea of "good", spelled
// out differently, and the weakest version set the floor: the assistant handed
// back "Realicé arqueo." for a bank cashier — the user's own three words, tidied
// up and returned. Nobody pays for an AI to reorganise the sentence they just
// typed. The product's core claim is that what comes out reads like a
// professional in that trade wrote it.
//
// THE LINE THIS DRAWS, and it is the only subtle part:
//
//   INVENTING A FACT ABOUT THE PERSON — forbidden, always. Figures, employers,
//   brand-name systems, results, certifications, seniority. Only they know those,
//   and a CV that states one they did not is a CV that fails an interview.
//
//   NAMING WHAT THEIR TRADE'S WORK CONSISTS OF — required, and it is the value
//   being paid for. A till count IS reconciling cash, receipts and discrepancies
//   under internal control before the accounting close. Saying so is not a claim
//   about the person; it is the content of the task they said they performed.
//
// Everything here exists in BOTH languages because a rule that lives in one
// branch is a behaviour the other language never gets — and the English CV is
// not a translation of the Spanish one, it is the one that gets read in the
// markets this product targets.

export type DoctrineLanguage = "es" | "en"

/**
 * The bar: what separates a line with CV value from a line that fills space.
 * Written for a model that is about to produce résumé prose.
 */
export function cvValueBar(language: string): string {
  return language === "en"
    ? `WHAT COUNTS AS CV VALUE — the bar every line must clear:
1. It names the CONTENT of the work, in the vocabulary of THAT trade: the controls it runs under, the materials or documents it handles, the standards it answers to, the operations it performs. Use the words that trade uses and no other — a hairdresser's till is not reconciled "before the accounting close", and a welder does not "process transactions". Two examples of the principle, never of the wording: "handled money" is worthless where "reconciled cash and receipts against the day's sales" is the job; "cut hair" is worthless where "cut and layered to the consultation brief, finishing to the client's brief" is.
2. It uses the words a job ad for that role uses, so an ATS matching on keywords finds them in context rather than in a list.
3. It says something the reader could not already infer from the job title. If deleting the line loses nothing, the line was filler.
4. It is specific about WHAT, not vague about HOW WELL. "Processed transactions accurately and efficiently" claims a quality; "processed deposits, withdrawals and bill payments, verifying identity and documentation" states a fact.`
    : `QUÉ CUENTA COMO VALOR CURRICULAR — la vara que toda línea tiene que pasar:
1. Nombra el CONTENIDO del trabajo, con el vocabulario de ESE oficio: los controles bajo los que opera, los materiales o documentos que maneja, las normas a las que responde, las operaciones que ejecuta. Usá las palabras de ese oficio y de ningún otro — la caja de una peluquería no se cuadra "antes del cierre contable", y un soldador no "procesa transacciones". Dos ejemplos del principio, nunca de la redacción: "manejé dinero" no vale donde el trabajo es "cuadré efectivo y comprobantes contra las ventas del día"; "corté el pelo" no vale donde es "corté y desmeché según la consulta previa, terminando con el peinado acordado".
2. Usa las palabras que usa un aviso de trabajo de ese puesto, para que un ATS que matchea keywords las encuentre en contexto y no en una lista.
3. Dice algo que el lector no podría deducir del nombre del puesto. Si borrar la línea no pierde nada, la línea era relleno.
4. Es específica sobre QUÉ, no vaga sobre QUÉ TAN BIEN. "Procesé transacciones con precisión y eficiencia" afirma una cualidad; "procesé depósitos, retiros y pagos de servicios verificando identidad y documentación" afirma un hecho.`
}

/**
 * The facts only the candidate can state. Identical in both branches by design:
 * this list is the product's promise, and it must not vary by language.
 */
export function neverInventRule(language: string): string {
  return language === "en"
    ? `NEVER STATE THESE — only the candidate can, and inventing one is what makes a CV fail an interview:
- Figures, percentages, amounts, volumes, headcounts or timeframes they did not give.
- Employers, clients or products by proper name that they did not mention.
- Software or systems by BRAND name. Say "core banking system", never a vendor; "point-of-sale system", never a product.
- Results or achievements ("reduced errors", "improved efficiency", "increased sales") — a result is a fact about them.
- Certifications, licences or degrees.
- Seniority they did not claim: no "led", "managed" or "supervised" unless they said so.
If the work genuinely had a number and they did not give it, write the line without one. A missing figure costs less than an invented one.`
    : `NUNCA AFIRMES ESTO — sólo el candidato puede, e inventar uno es lo que hace que un CV se caiga en la entrevista:
- Cifras, porcentajes, montos, volúmenes, cantidad de personas o plazos que no dio.
- Empleadores, clientes o productos con nombre propio que no mencionó.
- Software o sistemas con nombre de MARCA. Decí "sistema core bancario", nunca un proveedor; "sistema de punto de venta", nunca un producto.
- Resultados o logros ("reduje errores", "mejoré la eficiencia", "aumenté las ventas") — un resultado es un hecho sobre él.
- Certificaciones, licencias ni títulos.
- Jerarquía que no declaró: nada de "lideré", "gestioné" ni "supervisé" si no lo dijo.
Si el trabajo realmente tenía un número y no lo dio, escribí la línea sin número. Una cifra que falta cuesta menos que una inventada.`
}

/**
 * The wording rules that survive across every surface: how a CV line opens, how
 * long it runs, and the words that mark text as machine-written.
 */
export function proseRules(language: string): string {
  return language === "en"
    ? `HOW IT MUST READ:
- Open with a strong past-tense action verb, first person implied — never "Responsible for", "In charge of", "Helped with", and never a pronoun.
- 16 to 28 words per bullet. Under twelve words says nothing the job title did not.
- ONE tense across every line: simple past throughout. Mixing "Handled" with "Was handling" in the same block reads as careless.
- Vary length and sentence shape across lines; three identical rhythms read as generated.
- Banned as empty: "to optimise the process", "ensuring quality", "performing related tasks", "results-driven", "team player", "proactive", "hard-working". Also the AI tells: "spearheaded", "leveraged", "orchestrated", "utilised", "synergy".
- Plain "• " bullets. No tables, columns, emoji or brackets — a "[X%]" left in a CV reads as unfinished.`
    : `CÓMO TIENE QUE LEERSE:
- Abre con un verbo de acción fuerte en pasado, primera persona implícita — nunca "Responsable de", "Encargado de", "Ayudé con", nunca un pronombre.
- Entre 16 y 28 palabras por viñeta. Menos de doce no dice nada que no dijera ya el nombre del puesto.
- UN SOLO tiempo verbal en todas las líneas: pretérito perfecto simple (-é/-í). Mezclar "Realicé" con "Aplicaba" en el mismo bloque se lee como descuido.
- Variá el largo y la forma de la frase entre líneas; tres ritmos idénticos se leen como generados.
- Prohibidas por vacías: "para optimizar el proceso", "asegurando la calidad", "realizando tareas afines", "orientado a resultados", "trabajo en equipo", "proactivo". También las marcas de IA: "orquestó", "apalancó", "utilizó", "sinergia".
- Viñetas "• " simples. Sin tablas, columnas, emojis ni corchetes — un "[X%]" olvidado en un CV se lee como algo sin terminar.`
}

/**
 * The full doctrine, for a prompt that writes résumé prose from scratch.
 * Endpoints that only need part of it call the pieces directly.
 */
export function cvWritingDoctrine(language: string): string {
  return [cvValueBar(language), neverInventRule(language), proseRules(language)].join("\n\n")
}
