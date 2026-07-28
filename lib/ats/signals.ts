/**
 * Deterministic resume signals — the raw, parser-relevant FACTS extracted from a
 * resume's text. No scoring, no LLM, no judgement here: just "does this resume have
 * a two-column layout? mixed date formats? decorative bullets?".
 *
 * Two consumers read these facts and interpret them differently:
 *   · analyzer.ts   → one general ATS score (Phase 1).
 *   · engines.ts    → a per-engine verdict, because each real ATS is documented to
 *                     trip on a different subset (Phase 2).
 *
 * Single source so the two can never disagree about the underlying facts.
 */
import { foldAccentsLower } from "@/lib/text/normalize";
import { SECTION_LABELS } from "@/types/resume";

export type Locale = "en" | "es";

const normalize = (text: string): string => foldAccentsLower(text, "NFKD");

/** Section labels a mainstream ATS recognises, per locale. */
export const SECTION_KEYWORDS: Record<Locale, Record<string, string[]>> = {
  en: {
    contact: ["contact", "personal information"],
    summary: ["summary", "objective", "profile", "about"],
    experience: ["experience", "work history", "employment", "professional experience"],
    education: ["education", "academic"],
    skills: ["skills", "competencies", "technical skills"],
  },
  es: {
    contact: ["contacto", "informacion personal", "datos personales"],
    summary: ["resumen", "perfil", "objetivo", "acerca de mi"],
    experience: ["experiencia", "experiencia profesional", "trayectoria"],
    education: ["educacion", "formacion", "estudios", "formacion academica"],
    skills: ["habilidades", "competencias", "aptitudes"],
  },
};

/**
 * A line whose first visible character is a decorative bullet glyph an ATS may drop.
 * Standard "-", "*" and "•" (the one glyph parsers universally accept) are NOT flagged.
 * Requires two such lines so a single stray symbol never trips it.
 */
export function hasUnicodeBulletMarkers(lines: string[]): boolean {
  let count = 0;
  for (const line of lines) {
    const first = line.trim().charCodeAt(0);
    const decorative =
      (first >= 0x2192 && first <= 0x21ff) || // arrows
      (first >= 0x2020 && first <= 0x2021) || // daggers
      first === 0x2023 || first === 0x2043 || first === 0x204c || first === 0x204d || // triangular / hyphen bullets
      (first >= 0x25a0 && first <= 0x25ff) || // geometric shapes (■ □ ● ○ ◆ ◇ ...)
      (first >= 0x2713 && first <= 0x2718) || // checks / crosses
      (first >= 0x27a1 && first <= 0x27bf) || // dingbat arrows
      (first >= 0x1f300 && first <= 0x1faff); // emoji
    if (decorative) count++;
    if (count >= 2) return true;
  }
  return false;
}

/**
 * Distinct date-format families present. More than one = inconsistent dates.
 * Families are mutually exclusive by construction; bilingual month names covered.
 */
export function detectDateFormatFamilies(resumeText: string): string[] {
  const families: string[] = [];
  const monthNames =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|ene|abr|ago|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\.?\s+\d{4}\b/i;
  const numericSlash = /\b\d{1,2}\/\d{4}\b/;                  // 01/2022
  const numericDash = /\b(?:\d{4}-\d{1,2}|\d{1,2}-\d{4})\b/;  // 2022-01 or 01-2022
  const apostropheYear = /['’]\d{2}\b/;                       // '22 / ’24
  if (monthNames.test(resumeText)) families.push("month-name");
  if (numericSlash.test(resumeText)) families.push("numeric-slash");
  if (numericDash.test(resumeText)) families.push("numeric-dash");
  if (apostropheYear.test(resumeText)) families.push("apostrophe-year");
  return families;
}

/**
 * Contact info repeated across the document — the text-level signature of a running
 * header/footer, which most ATS ignore. Same email or phone appearing 2+ times.
 */
export function contactLooksRepeatedInHeaderFooter(resumeText: string): boolean {
  const emails = resumeText.match(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g) ?? [];
  if (hasRepeatedValue(emails.map((e) => e.toLowerCase()))) return true;
  const phones = resumeText.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [];
  return hasRepeatedValue(phones.map((p) => p.replace(/\D/g, "")));
}

function hasRepeatedValue(values: string[]): boolean {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}

/**
 * ALL-CAPS standalone header-style lines that match no recognised section label.
 * Conservative: only UPPERCASE 1-4 word lines, so a title-case job title or company
 * name is never mistaken for a section header. Returns offending labels (original case).
 */
export function findNonStandardSectionHeadings(lines: string[], locale: Locale): string[] {
  const known = new Set<string>();
  for (const kws of Object.values(SECTION_KEYWORDS[locale])) {
    for (const kw of kws) known.add(normalize(kw));
  }
  // Also whitelist every section label the product itself renders, in BOTH locales —
  // "References", "Volunteer Work", "Hobbies", "Projects"... are legitimate, recognised
  // sections. Otherwise the ATS-safe version we emit would flag its own headings, and a
  // Spanish resume viewed in English would false-positive. The only genuinely non-standard
  // heading left is a user's invented one (e.g. "My Career Journey").
  for (const map of [SECTION_LABELS.en, SECTION_LABELS.es]) {
    for (const label of Object.values(map)) known.add(normalize(label));
  }
  for (const extra of ["awards", "premios", "interests", "intereses", "publications", "publicaciones"]) {
    known.add(normalize(extra));
  }
  const offenders: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (t.length < 3 || t.length > 30) continue;
    if (t.split(/\s+/).length > 4) continue;
    if (!/[A-Za-zÀ-ÿ]/.test(t) || /[a-zà-ÿ]/.test(t)) continue; // uppercase only
    if (/[.!?:,;]$/.test(t)) continue;
    const norm = normalize(t);
    if (![...known].some((k) => norm.includes(k) || k.includes(norm))) offenders.push(t);
    if (offenders.length >= 3) break;
  }
  return offenders;
}

/**
 * Multi-column / table layout signature: many lines with a wide internal whitespace
 * gap, which is what a serialized two-column PDF looks like once extracted.
 */
export function looksMultiColumn(lines: string[]): boolean {
  const wideGapLines = lines.filter((l) => /\s{6,}\S+\s{6,}/.test(l)).length;
  return wideGapLines > 8;
}

/** Whether a recognised section label of the given kind is present. */
function hasSection(resumeText: string, locale: Locale, kind: "experience" | "education" | "skills"): boolean {
  const norm = normalize(resumeText);
  return SECTION_KEYWORDS[locale][kind].some((kw) => norm.includes(normalize(kw)));
}

/** The complete, parser-relevant fact sheet for one resume. Pure + deterministic. */
export interface ResumeSignals {
  extractable: boolean;
  multiColumn: boolean;
  decorativeBullets: boolean;
  mixedDates: boolean;
  nonStandardHeadings: string[];
  contactInHeaderFooter: boolean;
  hasSkillsSection: boolean;
  hasExperienceSection: boolean;
  hasEducationSection: boolean;
}

export function computeResumeSignals(resumeText: string, locale: Locale): ResumeSignals {
  const lines = resumeText.split("\n");
  return {
    extractable: resumeText.trim().length > 200,
    multiColumn: looksMultiColumn(lines),
    decorativeBullets: hasUnicodeBulletMarkers(lines),
    mixedDates: detectDateFormatFamilies(resumeText).length > 1,
    nonStandardHeadings: findNonStandardSectionHeadings(lines, locale),
    contactInHeaderFooter: contactLooksRepeatedInHeaderFooter(resumeText),
    hasSkillsSection: hasSection(resumeText, locale, "skills"),
    hasExperienceSection: hasSection(resumeText, locale, "experience"),
    hasEducationSection: hasSection(resumeText, locale, "education"),
  };
}
