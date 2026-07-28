/**
 * Per-engine ATS simulation — deterministic, no LLM.
 *
 * Every consumer ATS builder shows ONE score. That hides the fact that the real
 * engines behave differently: a two-column layout parses in Greenhouse and vanishes
 * in Lever; a renamed section works in Workday and returns an empty array in
 * Greenhouse. This module runs the extracted resume signals (see signals.ts) through
 * each engine's DOCUMENTED behaviour and returns a verdict per engine.
 *
 * Principle, same as the rest of the ATS: REPORT documented behaviour, never fabricate.
 * Every finding traces to published parser documentation, cross-checked against the
 * MIT `sunnypatell/ats-screener` engine-profile table (reference only — no code taken).
 * Where a source is a claim rather than a spec, the finding is phrased as a risk, not a
 * verdict, and severity never exceeds "caution".
 *
 * Deterministic: same signals in → same verdicts out. No LLM, no randomness, no dates.
 */
import type { Locale, ResumeSignals } from "./signals";
import { computeResumeSignals } from "./signals";

export type EngineId = "workday" | "taleo" | "icims" | "greenhouse" | "lever";

/** How cleanly this engine is expected to parse the resume. */
export type ParseVerdict = "clean" | "caution" | "risk";

export interface EngineFinding {
  /** Machine key for the underlying issue, stable across locales. */
  code: string;
  severity: "caution" | "risk";
  message: string;
}

export interface EngineResult {
  engine: EngineId;
  label: string;
  /** One-line description of how this engine parses, shown as a subtitle. */
  behavior: string;
  verdict: ParseVerdict;
  findings: EngineFinding[];
}

type Copy = { behavior: string; msg: Record<string, string> };

// ── Localised copy, one block per locale ──────────────────────────────────────
const COPY: Record<Locale, Record<EngineId, Copy>> = {
  en: {
    workday: {
      behavior: "Strict parser · ignores headers/footers · exact keyword match",
      msg: {
        multiColumn: "Multi-column layout — Workday's strict parser reorders or splits it.",
        contactHeader: "Contact looks like it sits in a header/footer — Workday reads the body only and never sees it.",
        mixedDates: "Inconsistent dates — Workday enforces a single \"Month YYYY\" format.",
      },
    },
    taleo: {
      behavior: "Oracle · literal exact match · worst with columns/tables",
      msg: {
        multiColumn: "Two-column or table layout — Taleo has the worst handling of any major ATS and can delete content silently.",
        nonStandard: "Non-standard section label — Taleo needs exact-match labels or the section is lost.",
        decorativeBullets: "Special-glyph bullets — Taleo can fail the whole line.",
        mixedDates: "Inconsistent dates — Taleo requires a strict format.",
      },
    },
    icims: {
      behavior: "Semantic ML match (forgiving) · strictest post-parse validation",
      msg: {
        mixedDates: "Inconsistent dates — iCIMS sends the whole experience block to manual candidate entry on a single mismatch.",
        decorativeBullets: "Special-glyph bullets — iCIMS flags them for manual review.",
        multiColumn: "Multi-column layout — may need manual field confirmation.",
      },
    },
    greenhouse: {
      behavior: "Semantic (LLM) · human review · handles modern formatting best",
      msg: {
        nonStandard: "Renamed section — Greenhouse returns an empty array for a section it can't label (e.g. \"Professional Journey\").",
        multiColumn: "Multi-column layout — Greenhouse tolerates it better than most, but a strict recruiter view may still reorder it.",
      },
    },
    lever: {
      behavior: "Stemming match · silently drops sidebars · abbreviation-blind",
      msg: {
        multiColumn: "Two-column / sidebar layout — Lever silently drops the sidebar, so those skills disappear entirely.",
        contactHeader: "Contact repeated like a header — Lever may not pick it up.",
      },
    },
  },
  es: {
    workday: {
      behavior: "Parser estricto · ignora encabezados/pies · match exacto",
      msg: {
        multiColumn: "Diseño de varias columnas — el parser estricto de Workday lo reordena o parte.",
        contactHeader: "Tu contacto parece estar en el encabezado/pie — Workday solo lee el cuerpo y no lo ve.",
        mixedDates: "Fechas inconsistentes — Workday exige un unico formato \"Mes AAAA\".",
      },
    },
    taleo: {
      behavior: "Oracle · match literal exacto · el peor con columnas/tablas",
      msg: {
        multiColumn: "Dos columnas o tablas — Taleo es el peor de todos y puede borrar contenido en silencio.",
        nonStandard: "Etiqueta de seccion no estandar — Taleo necesita nombres exactos o pierde la seccion.",
        decorativeBullets: "Vinetas con simbolos especiales — Taleo puede fallar la linea completa.",
        mixedDates: "Fechas inconsistentes — Taleo requiere un formato estricto.",
      },
    },
    icims: {
      behavior: "Match semantico ML (indulgente) · validacion post-parseo mas estricta",
      msg: {
        mixedDates: "Fechas inconsistentes — iCIMS manda todo el bloque de experiencia a carga manual con un solo error.",
        decorativeBullets: "Vinetas con simbolos especiales — iCIMS las marca para revision manual.",
        multiColumn: "Varias columnas — puede requerir confirmacion manual de campos.",
      },
    },
    greenhouse: {
      behavior: "Semantico (LLM) · revision humana · el mejor con formato moderno",
      msg: {
        nonStandard: "Seccion renombrada — Greenhouse devuelve vacio una seccion que no puede etiquetar (ej. \"Mi Trayectoria\").",
        multiColumn: "Varias columnas — Greenhouse lo tolera mejor que el resto, pero la vista del reclutador puede reordenarlo.",
      },
    },
    lever: {
      behavior: "Match por raices · descarta barras laterales en silencio · ciego a abreviaturas",
      msg: {
        multiColumn: "Dos columnas / barra lateral — Lever descarta la barra lateral en silencio y esas skills desaparecen.",
        contactHeader: "Contacto repetido como encabezado — Lever puede no leerlo.",
      },
    },
  },
};

const LABEL: Record<EngineId, string> = {
  workday: "Workday",
  taleo: "Taleo",
  icims: "iCIMS",
  greenhouse: "Greenhouse",
  lever: "Lever",
};

/** Worst severity among findings decides the verdict. */
function verdictFrom(findings: EngineFinding[]): ParseVerdict {
  if (findings.some((f) => f.severity === "risk")) return "risk";
  if (findings.some((f) => f.severity === "caution")) return "caution";
  return "clean";
}

// ── One rule set per engine. Each rule cites documented behaviour. ─────────────
type Rule = { when: (s: ResumeSignals) => boolean; code: string; severity: "caution" | "risk"; msgKey: string };

const RULES: Record<EngineId, Rule[]> = {
  // Ignores header/footer, strict dates, strict on multi-column.
  workday: [
    { when: (s) => s.multiColumn, code: "multiColumn", severity: "risk", msgKey: "multiColumn" },
    { when: (s) => s.contactInHeaderFooter, code: "contactHeader", severity: "risk", msgKey: "contactHeader" },
    { when: (s) => s.mixedDates, code: "mixedDates", severity: "risk", msgKey: "mixedDates" },
  ],
  // The strictest: literal labels, worst with columns/tables, fails glyph bullets.
  taleo: [
    { when: (s) => s.multiColumn, code: "multiColumn", severity: "risk", msgKey: "multiColumn" },
    { when: (s) => s.nonStandardHeadings.length > 0, code: "nonStandard", severity: "risk", msgKey: "nonStandard" },
    { when: (s) => s.decorativeBullets, code: "decorativeBullets", severity: "risk", msgKey: "decorativeBullets" },
    { when: (s) => s.mixedDates, code: "mixedDates", severity: "risk", msgKey: "mixedDates" },
  ],
  // Forgiving on matching, but strict post-parse validation flags things for manual entry.
  icims: [
    { when: (s) => s.mixedDates, code: "mixedDates", severity: "risk", msgKey: "mixedDates" },
    { when: (s) => s.decorativeBullets, code: "decorativeBullets", severity: "caution", msgKey: "decorativeBullets" },
    { when: (s) => s.multiColumn, code: "multiColumn", severity: "caution", msgKey: "multiColumn" },
  ],
  // Most resume-friendly, but hypersensitive to non-standard section labels.
  greenhouse: [
    { when: (s) => s.nonStandardHeadings.length > 0, code: "nonStandard", severity: "risk", msgKey: "nonStandard" },
    { when: (s) => s.multiColumn, code: "multiColumn", severity: "caution", msgKey: "multiColumn" },
  ],
  // Silently drops sidebars — the two-column failure is its signature.
  lever: [
    { when: (s) => s.multiColumn, code: "multiColumn", severity: "risk", msgKey: "multiColumn" },
    { when: (s) => s.contactInHeaderFooter, code: "contactHeader", severity: "caution", msgKey: "contactHeader" },
  ],
};

const ENGINE_ORDER: EngineId[] = ["workday", "taleo", "icims", "greenhouse", "lever"];

/** Run one engine's rules against the signals. */
function runEngine(engine: EngineId, signals: ResumeSignals, locale: Locale): EngineResult {
  const copy = COPY[locale][engine];
  const findings: EngineFinding[] = [];
  for (const rule of RULES[engine]) {
    if (rule.when(signals)) {
      findings.push({ code: rule.code, severity: rule.severity, message: copy.msg[rule.msgKey] });
    }
  }
  return { engine, label: LABEL[engine], behavior: copy.behavior, verdict: verdictFrom(findings), findings };
}

export interface EngineSimulation {
  engines: EngineResult[];
  /** How many of the engines parse the resume cleanly. */
  cleanCount: number;
  total: number;
}

/**
 * Simulate all supported ATS engines against a resume's extracted text.
 * Deterministic. Never throws — an empty resume yields all-clean (nothing to trip on).
 */
export function simulateAtsEngines(resumeText: string, locale: Locale): EngineSimulation {
  const signals = computeResumeSignals(resumeText, locale);
  const engines = ENGINE_ORDER.map((id) => runEngine(id, signals, locale));
  return {
    engines,
    cleanCount: engines.filter((e) => e.verdict === "clean").length,
    total: engines.length,
  };
}
