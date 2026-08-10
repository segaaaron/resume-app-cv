// components/resume/templates/ats/dates.ts
//
// Date rendering for the ATS-safe templates, in the one shape a parser reads
// best: MM/YYYY.
//
// Workday, Taleo, iCIMS and Lever all derive tenure from these strings, so
// "May 2022" on one role next to "2015" on the next hands them two formats to
// reconcile. These templates exist precisely to avoid that.
//
// Two rules make it safe:
//   · Formatting happens at RENDER. The user's stored data is never rewritten
//     behind their back — that is the job of the explicit "unify dates" action.
//   · A field that cannot be read with certainty is printed EXACTLY as typed.
//     `toMachineDate` returns null for a bare year, and writing "01/2015" over
//     "2015" would invent a month — inventing tenure is worse than mixed format.

import { toMachineDate } from "@/lib/ats/normalize-dates"

/** One date field as MM/YYYY, or unchanged when it cannot be read confidently. */
export function atsDate(raw: string | undefined): string {
  const v = (raw ?? "").trim()
  if (!v) return ""
  return toMachineDate(v) ?? v
}

/**
 * "MM/YYYY — MM/YYYY", "MM/YYYY — Present", or just the start when there is no
 * end date. `present` is passed in so the caller keeps ownership of the wording
 * and its language.
 */
export function atsPeriod(
  start: string | undefined,
  end: string | undefined,
  ongoing: boolean,
  present: string,
  separator = "—",
): string {
  const from = atsDate(start)
  if (!from) return ongoing ? present : atsDate(end)
  if (ongoing) return `${from} ${separator} ${present}`
  const to = atsDate(end)
  return to ? `${from} ${separator} ${to}` : from
}
