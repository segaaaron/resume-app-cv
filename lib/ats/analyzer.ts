/**
 * ATS Resume Analyzer — deterministic MVP (no external AI calls).
 * Computes overall + per-category scores by comparing resume text vs JD.
 *
 * Weighting:
 *  - keywords 40 %
 *  - format   20 %
 *  - sections 15 %
 *  - length   15 %
 *  - contact  10 %
 */

import { ATS_SKILLS, allSkillForms, findSkill } from "./skills-dictionary";
import { expandTerm, normalizeTerm, termPresent } from "./vocabulary";

export type Locale = "en" | "es";

export type AtsAnalysisInput = {
  resumeText: string;
  jobDescription: string;
  locale: Locale;
};

export type AtsAnalysisResult = {
  scoreOverall: number;
  breakdown: {
    keywords: {
      score: number;
      matched: string[];
      missing: string[];
      suggested: string[];
    };
    format: {
      score: number;
      issues: string[];
      passes: string[];
    };
    sections: {
      score: number;
      detected: string[];
      missing: string[];
    };
    length: {
      score: number;
      wordCount: number;
      recommendation: string;
    };
    contact: {
      score: number;
      hasEmail: boolean;
      hasPhone: boolean;
      hasLinkedIn: boolean;
    };
  };
  preview: {
    overallScore: number;
    topMissingKeywords: string[];
    quickWins: string[];
  };
  full: {
    allMissingKeywords: string[];
    allQuickWins: string[];
    detailedSuggestions: string[];
    upgradePath: string;
  };
};

/* ---------------------- Stopwords (EN + ES) ---------------------- */

const STOPWORDS_EN = new Set([
  "the","a","an","and","or","but","if","then","else","for","of","to","in","on","at","by","with","as","is","are","was","were","be","been","being","have","has","had","do","does","did","not","no","yes","this","that","these","those","it","its","we","you","your","our","their","they","he","she","his","her","i","me","my","mine","ours","yours","theirs","them","us","from","about","into","over","under","up","down","out","off","again","further","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","only","own","same","so","than","too","very","can","will","just","also","like","than","into","across","via","per","etc","using","use","used","ability","strong","excellent","good","great","required","preferred","skill","skills","experience","experiences","year","years","work","working","role","position","ideal","candidate","candidates","opportunity","team","teams","including","include","includes","based","new","high","low","large","small","quickly","please","apply","join","help","plus","need","needs","one","two","three","four","five","day","week","month","time","times","right","best","top","key","focus","focused","drive","driven","make","made","get","gets","getting","take","takes","taking","across","within","without","ensure","ensures","ensuring","provide","provides","providing","build","builds","building","develop","develops","developing","create","creates","creating","manage","manages","managing","support","supports","supporting","through","while","since","upon","every","each","what","which","who","whom","whose","could","should","would","may","might","must","shall","ours","yourself","themselves","ourselves","onto","because","before","after","during","between","among","throughout","along"
]);

const STOPWORDS_ES = new Set([
  "el","la","los","las","un","una","unos","unas","y","o","pero","si","entonces","de","del","al","en","por","con","como","es","son","fue","fueron","ser","sido","siendo","tener","tiene","tenido","hacer","hace","hizo","no","sí","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","aquellos","aquellas","lo","le","les","te","me","nos","nuestro","nuestra","nuestros","nuestras","su","sus","tu","tus","mi","mis","vuestro","vuestra","sobre","entre","desde","hasta","hacia","para","tras","ante","bajo","cabe","con","contra","sin","durante","mediante","cuando","donde","porque","aunque","mientras","cada","todo","toda","todos","todas","mucho","mucha","muchos","muchas","poco","poca","pocos","pocas","otro","otra","otros","otras","mismo","misma","mismos","mismas","ya","aún","incluso","también","tampoco","más","menos","muy","tan","tanto","tanta","muy","puede","poder","puedan","debe","deben","puede","experiencia","experiencias","habilidad","habilidades","año","años","trabajo","trabajar","rol","puesto","posición","candidato","candidatos","oportunidad","equipo","equipos","empresa","compañía","fuerte","excelente","bueno","requerido","preferido","alguno","alguna","algunos","algunas","ningún","ninguno","ninguna","ninguno","sino","puede","capaz","capacidad","conocimiento","conocimientos","ambiente","entorno","modelo","modelos"
]);

const STOPWORDS = new Set<string>([...STOPWORDS_EN, ...STOPWORDS_ES]);

/* ---------------------- Helpers ---------------------- */

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    // remove combining marks (accents) for matching purposes only
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .split(/[^a-z0-9+#.]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function singularize(word: string): string {
  // very basic singular/plural normalization (en + es)
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/* ---------------------- Keyword extraction ---------------------- */

function extractTopKeywords(jd: string): string[] {
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

/**
 * Presence check, delegated to the shared vocabulary so the free tool and the
 * paid ats-score agree. It used to be a local regex with plural tolerance only,
 * which meant "k8s" in a CV never matched a JD asking for "Kubernetes" — the
 * alias was already in skills-dictionary.ts, one import away.
 */
function containsKeyword(resumeNorm: string, keyword: string): boolean {
  return termPresent(keyword, resumeNorm);
}

/* ---------------------- Sub-scorers ---------------------- */

function scoreKeywords(resumeText: string, jobDescription: string, locale: Locale) {
  const topKeywords = extractTopKeywords(jobDescription);
  const resumeNorm = normalize(resumeText);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of topKeywords) {
    if (containsKeyword(resumeNorm, kw)) matched.push(kw);
    else missing.push(kw);
  }
  const score = topKeywords.length
    ? Math.round((matched.length / topKeywords.length) * 100)
    : 0;
  const suggested = missing.slice(0, 5).map((kw) => {
    return locale === "es"
      ? `Incluye "${kw}" en tu sección Habilidades o Experiencia.`
      : `Add "${kw}" to your Skills or Experience section.`;
  });
  return {
    score,
    matched: matched.slice(0, 15),
    missing: missing.slice(0, 15),
    suggested,
  };
}

function scoreFormat(resumeText: string, locale: Locale) {
  const passes: string[] = [];
  const issues: string[] = [];

  const hasText = resumeText.trim().length > 200;
  if (hasText) {
    passes.push(locale === "es" ? "Texto legible y extraíble del PDF" : "Text is readable and extractable from PDF");
  } else {
    issues.push(
      locale === "es"
        ? "El PDF parece escaneado o tiene poco texto extraíble — los ATS no podrán leerlo."
        : "PDF looks scanned or has little extractable text — ATS won't read it.",
    );
  }

  // tables heuristic: many lines with multiple "  " gaps may indicate columns
  const lines = resumeText.split("\n");
  const wideGapLines = lines.filter((l) => /\s{6,}\S+\s{6,}/.test(l)).length;
  if (wideGapLines > 8) {
    issues.push(
      locale === "es"
        ? "Demasiado contenido en columnas o tablas — algunos ATS los interpretan mal."
        : "Too much column/table layout — some ATS misread it.",
    );
  } else {
    passes.push(locale === "es" ? "Estructura simple de una columna" : "Clean single-column structure");
  }

  // section heading heuristic: short uppercase or title-case lines
  const headingCount = lines.filter((l) => {
    const t = l.trim();
    return t.length > 2 && t.length < 40 && /^[A-Z]/.test(t) && !/[.!?]$/.test(t);
  }).length;
  if (headingCount >= 3) {
    passes.push(locale === "es" ? "Encabezados de sección identificables" : "Identifiable section headings");
  } else {
    issues.push(
      locale === "es"
        ? "Faltan encabezados claros de sección (Experiencia, Educación, Habilidades...)."
        : "Missing clear section headings (Experience, Education, Skills...).",
    );
  }

  // weird characters (excessive bullets, icons)
  const weirdChars = (resumeText.match(/[☀-➿-]/g) ?? []).length;
  if (weirdChars > 30) {
    issues.push(
      locale === "es"
        ? "Demasiados iconos o caracteres especiales — pueden romper el parseo ATS."
        : "Too many icons or special characters — may break ATS parsing.",
    );
  } else {
    passes.push(locale === "es" ? "Uso moderado de caracteres especiales" : "Reasonable use of special characters");
  }

  // ratio passes/(passes+issues)
  const total = passes.length + issues.length;
  const score = total ? Math.round((passes.length / total) * 100) : 0;
  return { score, passes, issues };
}

const SECTION_KEYWORDS: Record<Locale, Record<string, string[]>> = {
  en: {
    contact: ["contact", "personal information"],
    summary: ["summary", "objective", "profile", "about"],
    experience: ["experience", "work history", "employment", "professional experience"],
    education: ["education", "academic"],
    skills: ["skills", "competencies", "technical skills"],
  },
  es: {
    contact: ["contacto", "información personal", "datos personales"],
    summary: ["resumen", "perfil", "objetivo", "acerca de mí"],
    experience: ["experiencia", "experiencia profesional", "trayectoria"],
    education: ["educación", "formación", "estudios", "formación académica"],
    skills: ["habilidades", "competencias", "aptitudes"],
  },
};

function scoreSections(resumeText: string, locale: Locale) {
  const norm = normalize(resumeText);
  const map = SECTION_KEYWORDS[locale];
  const detected: string[] = [];
  const missing: string[] = [];
  for (const [section, kws] of Object.entries(map)) {
    const found = kws.some((kw) => norm.includes(normalize(kw)));
    if (found) detected.push(section);
    else missing.push(section);
  }
  const total = Object.keys(map).length;
  const score = Math.round((detected.length / total) * 100);
  return { score, detected, missing };
}

function scoreLength(resumeText: string, locale: Locale) {
  const wordCount = countWords(resumeText);
  let score = 50;
  let recommendation = "";
  if (wordCount >= 400 && wordCount <= 800) {
    score = 100;
    recommendation = locale === "es"
      ? "Longitud ideal para perfiles junior/mid (1 página)."
      : "Ideal length for junior/mid profiles (1 page).";
  } else if (wordCount > 800 && wordCount <= 1200) {
    score = 90;
    recommendation = locale === "es"
      ? "Longitud apropiada para perfiles senior (2 páginas)."
      : "Appropriate length for senior profiles (2 pages).";
  } else if (wordCount < 400) {
    score = 50;
    recommendation = locale === "es"
      ? "Tu CV es muy corto. Añade más detalle a tus experiencias y logros."
      : "Your resume is too short. Add more detail to your experiences and achievements.";
  } else {
    score = 60;
    recommendation = locale === "es"
      ? "Tu CV es demasiado largo. Recorta a 1-2 páginas enfocándote en lo más relevante."
      : "Your resume is too long. Trim to 1-2 pages focusing on what is most relevant.";
  }
  return { score, wordCount, recommendation };
}

function scoreContact(resumeText: string) {
  const hasEmail = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(resumeText);
  const hasPhone = /(\+?\d[\d\s().-]{6,}\d)/.test(resumeText);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(resumeText);
  const passed = [hasEmail, hasPhone, hasLinkedIn].filter(Boolean).length;
  const score = Math.round((passed / 3) * 100);
  return { score, hasEmail, hasPhone, hasLinkedIn };
}

/* ---------------------- Main entry ---------------------- */

export function analyzeAts(input: AtsAnalysisInput): AtsAnalysisResult {
  const { resumeText, jobDescription, locale } = input;

  const keywords = scoreKeywords(resumeText, jobDescription, locale);
  const format = scoreFormat(resumeText, locale);
  const sections = scoreSections(resumeText, locale);
  const length = scoreLength(resumeText, locale);
  const contact = scoreContact(resumeText);

  const overall = Math.round(
    keywords.score * 0.4 +
      format.score * 0.2 +
      sections.score * 0.15 +
      length.score * 0.15 +
      contact.score * 0.1,
  );

  // Quick wins: actionable single-line fixes
  const quickWinsAll: string[] = [];
  if (!contact.hasEmail)
    quickWinsAll.push(locale === "es"
      ? "Añade un email profesional en el encabezado."
      : "Add a professional email at the top of your resume.");
  if (!contact.hasLinkedIn)
    quickWinsAll.push(locale === "es"
      ? "Incluye tu URL de LinkedIn (linkedin.com/in/...)."
      : "Include your LinkedIn URL (linkedin.com/in/...).");
  if (!contact.hasPhone)
    quickWinsAll.push(locale === "es"
      ? "Añade un número de teléfono con código de país."
      : "Add a phone number with country code.");
  for (const m of sections.missing) {
    quickWinsAll.push(locale === "es"
      ? `Añade una sección de "${m}" claramente etiquetada.`
      : `Add a clearly labeled "${m}" section.`);
  }
  for (const issue of format.issues) quickWinsAll.push(issue);
  quickWinsAll.push(...keywords.suggested);

  const detailedSuggestions: string[] = [
    ...keywords.suggested,
    ...quickWinsAll,
    length.recommendation,
  ];

  const upgradePath = locale === "es"
    ? "ReadyCV PRO genera bullets optimizados para ATS, sugiere palabras clave automáticamente y reescribe tu CV adaptado al puesto. Pruébalo desde $15/mes."
    : "ReadyCV PRO writes ATS-optimized bullets, auto-suggests keywords, and tailors your resume per job. Try it from $15/month.";

  return {
    scoreOverall: overall,
    breakdown: { keywords, format, sections, length, contact },
    preview: {
      overallScore: overall,
      topMissingKeywords: keywords.missing.slice(0, 3),
      quickWins: quickWinsAll.slice(0, 2),
    },
    full: {
      allMissingKeywords: keywords.missing,
      allQuickWins: quickWinsAll,
      detailedSuggestions: Array.from(new Set(detailedSuggestions)),
      upgradePath,
    },
  };
}

// re-export skills count for diagnostics
export const SKILL_DICT_SIZE = ATS_SKILLS.length;
