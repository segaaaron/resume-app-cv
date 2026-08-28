/**
 * EXTRACTOR DE KEYWORDS COMPARTIDO — lo que queda de este archivo, y por qué.
 *
 * ── QUÉ SE BORRÓ, Y QUÉ ERA (2026-08-22, orden del CEO) ────────────────────
 *
 * Acá vivía `analyzeAts`: un motor de puntuación sobre texto plano —keywords 40%,
 * formato 20%, secciones 15%, LONGITUD 15%, contacto 10%— con sus cinco
 * sub-scorers. **No lo llamaba ningún producto.** Sus únicos consumidores eran
 * tres archivos de test que lo probaban a él. La herramienta pública, que era su
 * dueña declarada, hace rato consume `simulateAtsEngines` directo desde
 * `engines.ts`, que sólo depende de `signals.ts`.
 *
 * Y adentro llevaba una regla que la investigación de mercado desmintió:
 * «recortá a 1-2 páginas», puntuando la longitud como el 15% de un ATS. La
 * evidencia de 2026 dice lo contrario — los parsers no penalizan longitud, y los
 * reclutadores prefieren dos páginas 2,3 veces más que una. O sea: código muerto
 * dando un consejo equivocado, esperando a que alguien lo reviviera.
 *
 * ── LO QUE SÍ SIGUE VIVO ───────────────────────────────────────────────────
 *
 * `normalize` y `extractTopKeywords`, que usa el motor ATS de la CARTA. Son el
 * motivo de que este archivo exista todavía: la carta se revisa contra las mismas
 * keywords y con el mismo plegado de acentos que el CV, y eso sólo se garantiza
 * compartiendo la función, no copiándola.
 */

import { allSkillForms, findSkill } from "@/lib/ats/skills-dictionary";
import { expandTerm, normalizeTerm } from "@/lib/ats/vocabulary";
import { foldAccentsLower } from "@/lib/text/normalize";

export type Locale = "en" | "es";



/* ---------------------- Stopwords (EN + ES) ---------------------- */

const STOPWORDS_EN = new Set([
  "the","a","an","and","or","but","if","then","else","for","of","to","in","on","at","by","with","as","is","are","was","were","be","been","being","have","has","had","do","does","did","not","no","yes","this","that","these","those","it","its","we","you","your","our","their","they","he","she","his","her","i","me","my","mine","ours","yours","theirs","them","us","from","about","into","over","under","up","down","out","off","again","further","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","only","own","same","so","than","too","very","can","will","just","also","like","than","into","across","via","per","etc","using","use","used","ability","strong","excellent","good","great","required","preferred","skill","skills","experience","experiences","year","years","work","working","role","position","ideal","candidate","candidates","opportunity","team","teams","including","include","includes","based","new","high","low","large","small","quickly","please","apply","join","help","plus","need","needs","one","two","three","four","five","day","week","month","time","times","right","best","top","key","focus","focused","drive","driven","make","made","get","gets","getting","take","takes","taking","across","within","without","ensure","ensures","ensuring","provide","provides","providing","build","builds","building","develop","develops","developing","create","creates","creating","manage","manages","managing","support","supports","supporting","through","while","since","upon","every","each","what","which","who","whom","whose","could","should","would","may","might","must","shall","ours","yourself","themselves","ourselves","onto","because","before","after","during","between","among","throughout","along"
]);

const STOPWORDS_ES = new Set([
  "el","la","los","las","un","una","unos","unas","y","o","pero","si","entonces","de","del","al","en","por","con","como","es","son","fue","fueron","ser","sido","siendo","tener","tiene","tenido","hacer","hace","hizo","no","sí","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","aquellos","aquellas","lo","le","les","te","me","nos","nuestro","nuestra","nuestros","nuestras","su","sus","tu","tus","mi","mis","vuestro","vuestra","sobre","entre","desde","hasta","hacia","para","tras","ante","bajo","cabe","con","contra","sin","durante","mediante","cuando","donde","porque","aunque","mientras","cada","todo","toda","todos","todas","mucho","mucha","muchos","muchas","poco","poca","pocos","pocas","otro","otra","otros","otras","mismo","misma","mismos","mismas","ya","aún","incluso","también","tampoco","más","menos","muy","tan","tanto","tanta","muy","puede","poder","puedan","debe","deben","puede","experiencia","experiencias","habilidad","habilidades","año","años","trabajo","trabajar","rol","puesto","posición","candidato","candidatos","oportunidad","equipo","equipos","empresa","compañía","fuerte","excelente","bueno","requerido","preferido","alguno","alguna","algunos","algunas","ningún","ninguno","ninguna","ninguno","sino","puede","capaz","capacidad","conocimiento","conocimientos","ambiente","entorno","modelo","modelos"
]);

const STOPWORDS = new Set<string>([...STOPWORDS_EN, ...STOPWORDS_ES]);

/* ---------------------- Helpers ---------------------- */

// Accents + compatibility chars folded away for matching (NFKD). Shared primitive.
// Exported so the cover-letter ATS engine normalizes text the exact same way the
// resume tool does — same folding, so keyword presence agrees across both.
export const normalize = (text: string): string => foldAccentsLower(text, "NFKD");

/**
 * PARTE EN KEYWORDS, NO EN PALABRAS — y por eso no usa la `contentWords` común.
 *
 * Conserva `+`, `#` y `.` dentro del token a propósito: sin eso «c++», «c#» y
 * «node.js» se parten en pedazos y dejan de ser la keyword que el usuario
 * escribió. La compartida separa por todo lo que no sea alfanumérico, que es lo
 * correcto para comparar prosa y lo incorrecto para extraer términos.
 *
 * Se revisó al unificar los tokenizadores (2026-08-28): son dos preguntas
 * distintas —«¿qué palabra cuenta en una frase?» contra «¿qué es un término?»— y
 * mezclarlas rompería los términos con símbolo.
 */
function tokenize(text: string): string[] {
  return text
    .split(/[^a-z0-9+#.]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}


function singularize(word: string): string {
  // very basic singular/plural normalization (en + es)
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/* ---------------------- Keyword extraction ---------------------- */

// Exported for the cover-letter ATS engine — the same JD keyword extractor the
// resume tool uses, so a letter is checked against the very keywords the CV is.
export function extractTopKeywords(jd: string): string[] {
  const norm = normalize(jd);
  const tokens = tokenize(norm).filter(
    (t) => !STOPWORDS.has(t) && !/^\d+$/.test(t) && t.length > 2,
  );

  // Frequency map keyed by the CANONICAL form, and — critically — storing a
  // real word as the label. This used to key on singularize(raw), which blindly
  // strips "es"/"s": "sales" became "sal" and "kubernetes" became "kubernet",
  // and those keys are what we return and render to the user. Canonicalising
  // through the shared vocabulary merges plurals and aliases properly, and the
  // label stays a word a human can read.
  const freq = new Map<string, number>();
  const label = new Map<string, string>();
  for (const raw of tokens) {
    const canonical = canonicalForm(raw);
    freq.set(canonical, (freq.get(canonical) ?? 0) + 1);
    // Keep the first real spelling seen, never the stemmed stub.
    if (!label.has(canonical)) label.set(canonical, raw);
  }

  // boost known skills (any term in the dictionary present in JD bumps weight)
  for (const skillForm of allSkillForms()) {
    const sf = normalize(skillForm);
    // multi-word skill: count occurrences in JD
    if (sf.includes(" ") || sf.includes(".") || sf.includes("#") || sf.includes("+")) {
      const regex = new RegExp(`\\b${sf.replace(/[.+#]/g, (m) => `\\${m}`)}\\b`, "g");
      const matches = norm.match(regex);
      if (matches) {
        const entry = findSkill(skillForm);
        const canonical = entry ? entry.term : skillForm;
        freq.set(canonical, (freq.get(canonical) ?? 0) + matches.length * 3);
      }
    } else if (freq.has(sf)) {
      freq.set(sf, (freq.get(sf) ?? 0) + 3);
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => label.get(w) ?? w);
}

/**
 * Canonical key for a token: the dictionary's own term when it knows one (so
 * "aws" and "amazon web services" collapse together), otherwise a conservative
 * plural strip. Never used as a user-facing label — see `label` above.
 */
function canonicalForm(token: string): string {
  const expanded = expandTerm(token);
  // expandTerm returns the whole equivalence set; take a stable member so every
  // variant maps to the same key regardless of which one appeared first.
  if (expanded.length > 1) return [...expanded].sort()[0];
  return singularize(normalizeTerm(token));
}
