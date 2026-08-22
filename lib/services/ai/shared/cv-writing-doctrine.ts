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

import { WEAK_OPENERS_EN, WEAK_OPENERS_ES, IMPACT_OPENERS_EN, IMPACT_OPENERS_ES } from "./bullet-quality"

export type DoctrineLanguage = "es" | "en"

/**
 * The duty openers, quoted from the list the CODE enforces.
 *
 * They were written out by hand in `proseRules` and the two lists had already
 * drifted: `bullet-quality` flags "Participé en" / "Participated in" and the
 * doctrine never mentioned them, so the assistant opened a bullet with
 * "Participé en la automatización de QA…" and no rule it had been given said
 * otherwise. Reported from a real CV.
 *
 * Reading the list instead of restating it means a phrase can only be added in
 * one place, and the prompt learns it the same day the checker does.
 */
/**
 * Con qué SÍ abrir. Se LEE del código, no se repite acá — misma razón que
 * `bannedOpeners`: una apertura sólo puede agregarse en un lugar, y el prompt la
 * aprende el mismo día que el chequeo.
 *
 * Nombrar sólo lo prohibido dejaba al modelo adivinando qué cuenta como fuerte,
 * y en los oficios no técnicos —donde aportar el vocabulario del rubro ES el
 * valor que se paga— adivinaba flojo.
 */
function strongOpeners(language: string): string {
  return (language === "en" ? IMPACT_OPENERS_EN : IMPACT_OPENERS_ES)
    .map((o) => `"${o.charAt(0).toUpperCase()}${o.slice(1)}"`)
    .join(", ")
}

function bannedOpeners(language: string): string {
  return (language === "en" ? WEAK_OPENERS_EN : WEAK_OPENERS_ES)
    .map((o) => `"${o.charAt(0).toUpperCase()}${o.slice(1)}"`)
    .join(", ")
}

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
- A figure STAMPED ON FROM OUTSIDE: a number that comes from you, from an example, or from what "usually" happens in that trade, rather than from the work THIS candidate described. That is the forbidden one.
  You MAY propose a figure when the work they described plainly has a measurable size and they simply did not write it down — and then you write it as a RANGE they can confirm or correct in one click ("between 50 and 100 transactions a day"), never as a precise number presented as fact. A range they adjust is theirs; a number you decided is not.
- Employers, clients or products by proper name that they did not mention.
- Software or systems by BRAND name THAT THEY DID NOT STATE. Say "core banking system", never a vendor they never mentioned.
  BUT: a tool, standard or system the candidate already listed in their skills, or named in their own words, is THEIRS — write it where the work they described actually used it. Two examples of the principle, from opposite trades and never of the wording: a welder who lists TIG does not get "performed welding", and a payroll clerk who lists the collective agreement does not get "processed payroll". Suppressing what the candidate declared protects them from nothing; it removes the exact keyword an ATS searches for.
- Results or achievements ("reduced errors", "improved efficiency", "increased sales") — a result is a fact about them.
- Certifications, licences or degrees.
- Seniority they did not claim: no "led", "managed" or "supervised" unless they said so.
If the work genuinely had a number and they did not give it, propose the range and mark it as theirs to confirm. Never leave the line naked when a size is obvious, and never hand them a precise figure you chose.`
    : `NUNCA AFIRMES ESTO — sólo el candidato puede, e inventar uno es lo que hace que un CV se caiga en la entrevista:
- Una cifra PUESTA DESDE AFUERA: un número que sale de vos, de un ejemplo, o de lo que "suele" pasar en ese oficio, y no del trabajo que ESTE candidato contó. Ésa es la prohibida.
  SÍ podés proponer una cifra cuando el trabajo que describió tiene un tamaño medible evidente y él simplemente no lo escribió — y entonces la escribís como RANGO que él confirma o corrige en un clic ("entre 50 y 100 transacciones por día"), nunca como un número exacto presentado como hecho. Un rango que él ajusta es suyo; un número que decidiste vos, no.
- Empleadores, clientes o productos con nombre propio que no mencionó.
- Software o sistemas con nombre de MARCA QUE ÉL NO HAYA DECLARADO. Decí "sistema core bancario", nunca un proveedor que no mencionó.
  PERO: una herramienta, norma o sistema que el candidato ya listó en sus habilidades, o que nombró con sus propias palabras, es SUYO — escribilo donde el trabajo que contó realmente lo usó. Dos ejemplos del principio, de rubros opuestos y nunca de la redacción: un soldador que declara TIG no recibe "realicé soldaduras", y una liquidadora de sueldos que declara el convenio colectivo no recibe "procesé la nómina". Ocultar lo que el candidato declaró no lo protege de nada: le saca la keyword exacta que busca un ATS.
- Resultados o logros ("reduje errores", "mejoré la eficiencia", "aumenté las ventas") — un resultado es un hecho sobre él.
- Certificaciones, licencias ni títulos.
- Jerarquía que no declaró: nada de "lideré", "gestioné" ni "supervisé" si no lo dijo.
Si el trabajo realmente tenía un número y no lo dio, proponé el rango y marcalo como suyo para confirmar. Nunca dejes la línea pelada cuando el tamaño es obvio, y nunca le entregues una cifra exacta elegida por vos.`
}

/**
 * The wording rules that survive across every surface: how a CV line opens, how
 * long it runs, and the words that mark text as machine-written.
 */
export function proseRules(language: string): string {
  return language === "en"
    ? `HOW IT MUST READ:
- Open with a strong past-tense action verb, first person implied — never a pronoun, and never any of these duty openers: ${bannedOpeners("en")}. Each one hands the ownership of the work to somebody else. Verbs of the right weight: ${strongOpeners("en")} — these are examples of the REGISTER, not a menu to pick from; the right verb is the one that names what this candidate actually did.
- At least 16 words. Under twelve says nothing the job title did not. There is NO upper limit: length is not the test, value is — four long lines that each name real work beat six short ones, and a line is never trimmed to hit a count. Stop when the line has said everything true it has to say, not when it reaches a number.
- ONE tense across every line: simple past throughout. Mixing "Handled" with "Was handling" in the same block reads as careless.
- FIRST PERSON, implied. The line is the candidate speaking about their own work, never a third party describing them. Never write it as though someone else were reporting on them.
- Vary length and sentence shape across lines; three identical rhythms read as generated.
- Banned as empty: "to optimise the process", "ensuring quality", "performing related tasks", "results-driven", "team player", "proactive", "hard-working". Also the AI tells: "spearheaded", "leveraged", "orchestrated", "utilised", "synergy".
- Plain "• " bullets. No tables, columns, emoji or brackets — a "[X%]" left in a CV reads as unfinished.`
    : `CÓMO TIENE QUE LEERSE:
- Abre con un verbo de acción fuerte en pasado, primera persona implícita — nunca un pronombre, y nunca ninguna de estas aperturas de tarea: ${bannedOpeners("es")}. Cada una le entrega a otro la autoría del trabajo. Verbos del peso correcto: ${strongOpeners("es")} — son ejemplos del REGISTRO, no un menú para elegir; el verbo correcto es el que nombra lo que ESTE candidato hizo de verdad.
- Al menos 16 palabras. Menos de doce no dice nada que no dijera ya el nombre del puesto. NO hay límite superior: el largo no es la prueba, el valor sí — cuatro líneas largas que nombren trabajo real le ganan a seis cortas, y una línea no se recorta para llegar a un número. Terminá cuando la línea dijo todo lo verdadero que tenía para decir, no cuando alcanzó una cifra.
- UN SOLO tiempo verbal en todas las líneas: pretérito perfecto simple en PRIMERA persona, la forma -é/-í ("Ejecuté", "Definí", "Coordiné"). Mezclar "Realicé" con "Aplicaba" en el mismo bloque se lee como descuido.
- NUNCA la forma -ó de tercera persona ("Ejecutó", "Definió", "Coordinó"): eso se lee como si otra persona escribiera un informe sobre el candidato, y una línea de CV la escribe él sobre su propio trabajo. Medido en un CV real: tailor devolvió "Ejecutó suites con Selenium…" y "Definió alcance…" dentro del CV del propio candidato.
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

/**
 * When a line needs no rewrite — the ONE definition, for every surface that
 * decides whether to touch the candidate's own text.
 *
 * WHY THIS EXISTS. tailor-cv and review-cv each carried their own, and both said
 * the same wrong thing: a bullet is already good if it opens with a strong verb
 * and is relevant to the posting. Measured against the live API on 8 résumés
 * whose every bullet is three words, tailor returned changedBullets: [] for five
 * of them — "Soldé piezas.", "Watched the building.", "Cooked food." all clear
 * that test. The model was obeying the prompt exactly. In the same answer it
 * advised the user to "expand the 'Helped the chef' bullet", so it could see the
 * line was thin; it had simply been told that a strong verb settles the matter.
 *
 * A strong verb is a property of the FIRST WORD. Whether a line carries CV value
 * is a property of the REST — which is what the bar above measures. So "already
 * good" is defined by the bar, and only by the bar.
 */
export function alreadyGoodRule(language: string): string {
  return language === "en"
    ? `WHEN TO LEAVE A LINE ALONE — and this is the only definition, so do not substitute your own:
A line is already good ONLY if it clears the bar above: it names the content of the work in that trade's own words, and a reader learns from it something the job title did not already tell them.
A strong opening verb does NOT make a line good. "Cooked food.", "Watched the building.", "Soldé piezas." all open with a strong verb and all say nothing — they are the lines that most need rewriting, not the ones to skip. The same goes for a line that merely repeats the job title in sentence form.
Leaving such a line untouched while advising the candidate to "expand" it elsewhere in your answer is a contradiction: if it needs expanding, rewrite it.
A line the candidate wrote WELL — specific, in the vocabulary of the trade, carrying a detail the title does not — is the one to leave exactly as it is. Rewriting that one is churn.`
    : `CUÁNDO DEJAR UNA LÍNEA COMO ESTÁ — y esta es la única definición, no la sustituyas por la tuya:
Una línea ya está bien SÓLO si pasa la vara de arriba: nombra el contenido del trabajo con las palabras de ese oficio, y quien la lee aprende algo que el nombre del puesto no le decía ya.
Un verbo de apertura fuerte NO hace buena a una línea. "Soldé piezas.", "Atendí clientes.", "Corté el pelo." abren con verbo fuerte y no dicen nada — son las que MÁS necesitan reescritura, no las que hay que saltear. Lo mismo una línea que sólo repite el nombre del puesto en forma de oración.
Dejar una línea así intacta y a la vez aconsejarle al candidato que la "amplíe" en otra parte de tu respuesta es una contradicción: si hay que ampliarla, reescribila.
La línea que el candidato escribió BIEN — específica, con el vocabulario del oficio, con un dato que el puesto no dice — es la que hay que dejar tal cual. Reescribir esa es ruido.`
}

/**
 * The other half of "never invent": never delete.
 *
 * WHY THIS EXISTS, and it was found by measuring the opposite case. The bar
 * above tells the model to name what the work consists of, and on a résumé the
 * candidate had already written WELL the model obeyed it by rewriting the whole
 * line — dropping the figures on the way out. Measured across six well-written
 * résumés: "Cut medication errors from 12 to 3 per month across two wards"
 * came back as "Reduced medication errors by reconciling prescriptions, MAR
 * entries and administered doses". Richer, truthful, and stripped of the only
 * two numbers a recruiter can weigh.
 *
 * `neverInventRule` covers the fabricated figure. Nothing covered the deleted
 * one, and it is the worse of the two: the candidate spent a year earning that
 * number, and the button that removed it said it would improve the line.
 */
export function keepCandidateFactsRule(language: string): string {
  return language === "en"
    ? `NEVER DELETE WHAT THEY DID GIVE YOU — the same rule as above, running the other way:
- EVERY figure in the original line must appear in your rewrite, unchanged. "from 12 to 3 per month" stays "from 12 to 3 per month". You may move it, never drop it.
- The same goes for a named tool, a standard, a certification, a scale or a headcount they stated.
- Adding the content of the trade is what you are here for, but it is ADDED — never traded for the detail already on the line. If naming the work would cost you their number, name the work AROUND the number and keep both.
- A line whose figures you cannot keep is a line you must leave exactly as it is. Returning it untouched is always better than returning it emptied.`
    : `NUNCA BORRES LO QUE SÍ TE DIO — la misma regla de arriba, en el otro sentido:
- TODA cifra de la línea original tiene que aparecer en tu reescritura, igual. "de 12 a 3 por mes" sigue siendo "de 12 a 3 por mes". Podés moverla de lugar, nunca sacarla.
- Lo mismo con una herramienta, una norma, una certificación, una escala o una cantidad de personas que él haya declarado.
- Agregar el contenido del oficio es para lo que estás, pero se AGREGA — nunca se cambia por el dato que ya estaba en la línea. Si nombrar el trabajo te costaría su número, nombrá el trabajo ALREDEDOR del número y quedate con los dos.
- Una línea cuyas cifras no podés conservar es una línea que tenés que dejar tal cual. Devolverla intacta siempre es mejor que devolverla vaciada.`
}
