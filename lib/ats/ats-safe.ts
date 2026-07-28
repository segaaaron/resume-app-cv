/**
 * ATS-safe resume rendering.
 *
 * The per-engine simulator (engines.ts) DETECTS what breaks a resume in each real ATS.
 * This module is the other half: it EMITS a version of the same resume that passes all
 * of them — single column, standard section labels, plain "-" bullets, one consistent
 * date format, contact in the body. The user keeps their designed two-column template
 * for human eyes; this is the machine-readable twin.
 *
 * Pure and deterministic: same resume in → same text out. No LLM, no layout, no dates
 * pulled from the clock. Every transform closes one documented parser-failure mode:
 *   · single column           → Lever/Taleo/Workday no longer scramble columns
 *   · standard section labels  → Greenhouse/Taleo find every section
 *   · "-" bullets              → Taleo/iCIMS never choke on a decorative glyph
 *   · one date format          → Workday/Taleo/iCIMS stop rejecting mixed dates
 *   · contact once, in body    → no header/footer region for an ATS to ignore
 */
import type { ResumeSections } from "@/types/resume";
import { SECTION_LABELS } from "@/types/resume";

export type Locale = "en" | "es";

// Month lookup: every English/Spanish name or abbreviation → 1..12.
const MONTHS: Record<string, number> = {};
const MONTH_TABLE: [string[], string[]][] = [
  [["jan", "january"], ["ene", "enero"]],
  [["feb", "february"], ["feb", "febrero"]],
  [["mar", "march"], ["mar", "marzo"]],
  [["apr", "april"], ["abr", "abril"]],
  [["may"], ["may", "mayo"]],
  [["jun", "june"], ["jun", "junio"]],
  [["jul", "july"], ["jul", "julio"]],
  [["aug", "august"], ["ago", "agosto"]],
  [["sep", "sept", "september"], ["sep", "set", "sept", "setiembre", "septiembre"]],
  [["oct", "october"], ["oct", "octubre"]],
  [["nov", "november"], ["nov", "noviembre"]],
  [["dec", "december"], ["dic", "diciembre"]],
];
MONTH_TABLE.forEach(([en, es], i) => {
  for (const w of [...en, ...es]) MONTHS[w] = i + 1;
});

const MONTH_SHORT: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
};

/**
 * Normalize a free-text date to a single format: "MMM YYYY" (or "YYYY" when no month is
 * present). Handles "January 2020", "Ene 2020", "01/2020", "2020-01", "'20", bare year.
 * Unparseable input (no year we can anchor to) is returned untouched — never destroy
 * data we cannot read, e.g. "Present" / "en curso".
 *
 * DELIBERATE: a season/quarter qualifier with a year ("Q1 2020", "Fall 2020") collapses
 * to the bare year. That is the ATS-safe outcome — a plain year is a clean, consistent
 * format, and "Q1"/"Fall" are exactly the tokens strict parsers stumble on. The year,
 * the only field an ATS indexes, is always preserved.
 */
export function normalizeDate(raw: string, locale: Locale): string {
  const s = raw.trim();
  if (!s) return "";

  // 4-digit year, or a 2-digit apostrophe year ('20 → 2020).
  let year: number | null = null;
  const y4 = s.match(/\b(19|20)\d{2}\b/);
  if (y4) year = Number(y4[0]);
  else {
    const y2 = s.match(/['’](\d{2})\b/);
    if (y2) year = 2000 + Number(y2[1]);
  }
  if (year === null) return s; // no year we can anchor to — leave as typed

  // Month: a name, or a numeric month in MM/YYYY or YYYY-MM.
  let month: number | null = null;
  const nameMatch = s.toLowerCase().match(/[a-záéíóú]+/);
  if (nameMatch && MONTHS[nameMatch[0]] != null) {
    month = MONTHS[nameMatch[0]];
  } else {
    const numMatch = s.match(/\b(\d{1,2})\/\d{4}\b/) ?? s.match(/\b\d{4}-(\d{1,2})\b/);
    if (numMatch) {
      const m = Number(numMatch[1]);
      if (m >= 1 && m <= 12) month = m;
    }
  }

  return month ? `${MONTH_SHORT[locale][month - 1]} ${year}` : String(year);
}

/** A date range in one consistent format. "Present"/"Actual" for a current role. */
function dateRange(start: string, end: string, current: boolean, locale: Locale): string {
  const s = normalizeDate(start, locale);
  const present = locale === "es" ? "Actual" : "Present";
  const e = current ? present : normalizeDate(end, locale);
  if (!s && !e) return "";
  if (s && e) return `${s} - ${e}`;
  return s || e;
}

/** Strip HTML/markup and re-emit each bullet as a plain "- " line. */
function toPlainBullets(html: string): string[] {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(li|p|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^[\s•\-–—*·▪◦‣→✓]+/, "").trim();
    if (line) out.push(`- ${line}`);
  }
  return out;
}

const SKILL_SEP = ", ";

/**
 * Render an ATS-safe plain-text resume. Sections are emitted in a fixed, parser-friendly
 * order using their STANDARD labels, regardless of how the user renamed or reordered
 * them in their designed template.
 */
export function toAtsSafeResumeText(data: ResumeSections, locale: Locale): string {
  const L = SECTION_LABELS[locale];
  const pd = data.personalDetails;
  const lines: string[] = [];

  // ── Name + contact, once, in the body ──────────────────────────────────────
  const name = [pd.firstName, pd.lastName].filter(Boolean).join(" ").trim();
  if (name) lines.push(name);
  if (pd.jobTitle) lines.push(pd.jobTitle);
  const contact = [pd.email, pd.phone, [pd.city, pd.country].filter(Boolean).join(", "), pd.linkedin]
    .filter(Boolean)
    .join(" | ");
  if (contact) lines.push(contact);

  const section = (label: string, body: string[]) => {
    if (body.length === 0) return;
    lines.push("", label.toUpperCase(), ...body);
  };

  // ── Summary ────────────────────────────────────────────────────────────────
  if (data.summary?.trim()) {
    section(L.summary, [data.summary.replace(/<[^>]+>/g, "").trim()]);
  }

  // ── Work experience ──────────────────────────────────────────────────────
  const exp: string[] = [];
  for (const job of data.workExperience ?? []) {
    const head = [job.jobTitle, job.employer].filter(Boolean).join(" - ");
    const place = [job.city].filter(Boolean).join("");
    const range = dateRange(job.startDate, job.endDate, job.currentlyWorking, locale);
    const meta = [place, range].filter(Boolean).join(" | ");
    if (head) exp.push(meta ? `${head} (${meta})` : head);
    exp.push(...toPlainBullets(job.description ?? ""));
  }
  section(L.workExperience, exp);

  // ── Education ────────────────────────────────────────────────────────────
  const edu: string[] = [];
  for (const e of data.education ?? []) {
    const head = [e.degree, e.fieldOfStudy].filter(Boolean).join(", ");
    const place = [e.institution, e.city].filter(Boolean).join(", ");
    const range = dateRange(e.startDate, e.endDate, e.currentlyStudying, locale);
    const meta = [place, range].filter(Boolean).join(" | ");
    if (head || place) edu.push(meta ? `${head || place} (${meta})` : head || place);
    if (e.description?.trim()) edu.push(...toPlainBullets(e.description));
  }
  section(L.education, edu);

  // ── Skills (single comma-separated line — the format Workday/Taleo expect) ──
  const skills = (data.skills ?? []).map((s) => s.name).filter(Boolean);
  if (skills.length) section(L.skills, [skills.join(SKILL_SEP)]);

  // ── Certifications ───────────────────────────────────────────────────────
  const certs = (data.certifications ?? [])
    .map((c) => [c.name, c.issuer, normalizeDate(c.date ?? "", locale)].filter(Boolean).join(" - "))
    .filter(Boolean);
  if (certs.length) section(L.certifications, certs.map((c) => `- ${c}`));

  // ── Projects ─────────────────────────────────────────────────────────────
  const projects: string[] = [];
  for (const p of data.projects ?? []) {
    const head = [p.name, p.role].filter(Boolean).join(" - ");
    const range = dateRange(p.startDate, p.endDate, false, locale);
    if (head) projects.push(range ? `${head} (${range})` : head);
    if (p.description?.trim()) projects.push(...toPlainBullets(p.description));
  }
  if (projects.length) section(L.projects, projects);

  // ── Volunteer work ─────────────────────────────────────────────────────
  const volunteer: string[] = [];
  for (const v of data.volunteer ?? []) {
    const head = [v.role, v.organization].filter(Boolean).join(" - ");
    const range = dateRange(v.startDate, v.endDate, false, locale);
    if (head) volunteer.push(range ? `${head} (${range})` : head);
    if (v.description?.trim()) volunteer.push(...toPlainBullets(v.description));
  }
  if (volunteer.length) section(L.volunteer, volunteer);

  // ── Languages ────────────────────────────────────────────────────────────
  const langs = (data.languages ?? []).map((l) => l.name).filter(Boolean);
  if (langs.length) section(L.languages, [langs.join(SKILL_SEP)]);

  // ── Hobbies (free text, one line) ────────────────────────────────────────
  if (data.hobbies?.trim()) {
    section(L.hobbies, [data.hobbies.replace(/<[^>]+>/g, "").trim()]);
  }

  // ── Custom sections — the user's own headings kept, content preserved ─────
  // Emitted in Title Case, NOT upper-cased like the standard sections: an ALL-CAPS
  // heading the ATS whitelist doesn't know trips the non-standard-label check, and a
  // custom title is by definition outside that list. Title Case keeps the content
  // labelled for the human reader without flagging the machine-readable version.
  for (const cs of data.customSections ?? []) {
    if (!cs.title?.trim()) continue;
    const body: string[] = [];
    for (const item of cs.items ?? []) {
      const head = [item.title, item.subtitle, normalizeDate(item.date ?? "", locale)].filter(Boolean).join(" - ");
      if (head) body.push(head);
      if (item.description?.trim()) body.push(...toPlainBullets(item.description));
    }
    if (body.length) lines.push("", cs.title.trim(), ...body);
  }

  // ── References ───────────────────────────────────────────────────────────
  const refs = (data.references ?? [])
    .map((r) => [r.name, r.company, r.email, r.phone].filter(Boolean).join(" - "))
    .filter(Boolean);
  if (refs.length) section(L.references, refs.map((r) => `- ${r}`));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
