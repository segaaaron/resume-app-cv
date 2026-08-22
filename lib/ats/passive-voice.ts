// lib/ats/passive-voice.ts
//
// LA VOZ PASIVA EN UNA VIÑETA: EL TRABAJO SIN DUEÑO.
//
// «Se implementó el pipeline de CI» y «El pipeline fue implementado» describen el
// mismo trabajo y borran al que lo hizo. Es la misma pérdida que `WEAK_OPENERS`
// —«Responsable de», «Participé en»— por otra puerta gramatical: la frase existe,
// la acción existe, y el candidato no aparece.
//
// La doctrina ya lo pide del lado del modelo: primera persona implícita, verbo de
// acción en pasado. Faltaba el detector determinista que lo NOMBRA en el CV que
// el usuario ya tiene escrito, que es lo único que cierra el círculo: la doctrina
// gobierna lo que la IA escribe, esto gobierna lo que él trajo.
//
// ── QUÉ NO SE MARCA, Y POR QUÉ IMPORTA MÁS QUE LO QUE SÍ ───────────────────
//
// En español la pasiva refleja con «se» es ambigua: «se coordinó con el equipo»
// es pasiva, pero «se especializó en pagos» es pronominal y perfectamente
// correcta. Marcar toda forma con «se» llenaría el panel de falsos positivos
// sobre líneas bien escritas — el error que hace que la gente deje de leer los
// avisos. Se exige la estructura completa (participio o auxiliar), nunca el «se»
// suelto.

/** Terminaciones de participio que cierran una pasiva en español. */
const ES_PARTICIPLE = "[a-záéíóúñ]+(?:ado|ados|ada|adas|ido|idos|ida|idas)"

/**
 * ── EL DEFECTO QUE ESTE ARCHIVO PAGÓ AL NACER (2026-08-22) ────────────────
 *
 * La primera versión cerraba los patrones españoles con `\b` y NO detectaba
 * «Se implementó el pipeline». Causa: en JavaScript `\b` es ASCII, y «ó» no es
 * un carácter de palabra para esa definición — así que entre «ó» y el espacio no
 * hay frontera y el patrón nunca cerraba. Todo el detector era mudo justo en las
 * formas acentuadas, que en español son LA MAYORÍA de los pasados.
 *
 * Lo cazó el test en la primera corrida. Ahora se cierra con un lookahead de
 * «no viene una letra» bajo la bandera `u`, que sí entiende acentos y ñ.
 */
const FIN = "(?![\\p{L}])"

const PATTERNS: RegExp[] = [
  // ES · pasiva perifrástica: "fue/fueron/es/son/será + participio"
  new RegExp(`(?<![\\p{L}])(?:fue|fueron|era|eran|es|son|ser[aá]|ser[aá]n|ha\\s+sido|han\\s+sido)\\s+${ES_PARTICIPLE}${FIN}`, "iu"),
  // ES · pasiva refleja CON verbo conjugado en tercera: "se implementó", "se realizaron"
  // Exige la forma -ó/-aron/-ieron, que es donde la autoría se pierde de verdad.
  /**
   * ── CÓMO SE SEPARA LA PASIVA REFLEJA DE LA PRONOMINAL ────────────────────
   *
   * «Se implementó EL pipeline» es pasiva: el sujeto es la cosa, el autor
   * desapareció. «Se especializó EN pagos» es pronominal y está perfectamente
   * escrita — marcarla sería un falso positivo sobre una línea buena, que es el
   * error que hace que la gente deje de leer los avisos.
   *
   * Las separa lo que viene DESPUÉS del verbo: una preposición abre un
   * complemento («en pagos», «de la caja», «con el equipo») y eso es pronominal;
   * cualquier otra cosa —un artículo o un sustantivo pelado— es el sujeto
   * paciente de una pasiva («el pipeline», «auditorías mensuales»).
   *
   * La primera versión no hacía esta distinción y el test la cazó con
   * «Se especializó en pagos».
   */
  new RegExp(
    `(?<![\\p{L}])se\\s+[a-záéíóúñ]+(?:ó|aron|ieron)\\s+(?!(?:en|con|por|a|al|de|del|como|para|sobre|entre|hacia|hasta|desde)(?![\\p{L}]))`,
    "iu",
  ),
  // EN · "was/were/is/are/been + past participle" (regular -ed y los irregulares
  // que de verdad aparecen en un CV; una lista corta y explícita evita el falso
  // positivo de "was responsible", que ya cazan los WEAK_OPENERS).
  /\b(?:was|were|is|are|been|being)\s+(?:[a-z]+ed|built|written|led|made|driven|taken|given|held|kept|run|sent|shown|brought|chosen|done)\b/i,
]

/** ¿Esta línea está escrita en pasiva? */
export function isPassiveVoice(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return PATTERNS.some((re) => re.test(t))
}

export interface PassiveBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
}

/** Las viñetas en pasiva, con su puesto y su posición. Tope para no inundar. */
export function findPassiveBullets(
  roles: Array<{ id?: string; jobTitle?: string; bullets: string[] }>,
  max = 6,
): PassiveBullet[] {
  const out: PassiveBullet[] = []
  for (const role of roles) {
    if (!role.id) continue
    role.bullets.forEach((text, index) => {
      if (out.length >= max) return
      if (isPassiveVoice(text)) {
        out.push({ targetId: role.id as string, jobTitle: role.jobTitle?.trim() ?? "", index, text: text.trim() })
      }
    })
  }
  return out
}
