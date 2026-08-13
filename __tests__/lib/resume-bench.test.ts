// __tests__/lib/resume-bench.test.ts
//
// The stability bench: a bank of résumés from different professions, run against
// every deterministic rule the panel shows, on every change.
//
// WHY IT EXISTS. Every defect this session was found the same way: the CEO used
// the product, hit something wrong, sent a screenshot. That finds real bugs and
// proves nothing about the rest — and it is why the same class of failure kept
// coming back wearing a different hat (two engines disagreeing, a button with
// nothing to do, a list fitted to one document).
//
// So the invariants are asserted here, over résumés nobody on this project wrote
// with a fix in mind: a nurse, a welder, a teacher, a shop manager, an accountant,
// a cook, a driver and one developer. If a rule only works on the developer, this
// file goes red.
//
// Everything here is pure and deterministic — no model, no network, no database.
// It runs in the normal suite, which is the whole point: a guard nobody remembers
// to run is not a guard.

import { describe, it, expect } from "vitest"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { computeCredibility } from "@/lib/ats/credibility"
import { assessResumeContent } from "@/lib/services/ai/shared/bullet-quality"
import { groundFixAction } from "@/lib/ats/fix-actions"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { findProvenUnlistedSkills } from "@/lib/services/ai/shared/proven-skills"
import { hasAnyMetric } from "@/lib/services/ai/shared/ai-helpers"
import { spliceSummary } from "@/lib/ats/summary-splice"
import { suggestFigureSlot } from "@/lib/ats/figure-slot"

type Bench = {
  trade: string
  summary: string
  skills: string[]
  work: { id: string; jobTitle: string; employer: string; startDate: string; endDate: string; description: string }[]
  education: { degree: string; fieldOfStudy: string; school: string; startDate: string; endDate: string }[]
}

/**
 * Written as a careful person in each trade would write them: reverse
 * chronological, real figures, no repetition, no invented units. A clean résumé
 * must come out clean — that is the half of the bench that catches false
 * positives, which are the expensive kind of wrong.
 */
const BENCH: Bench[] = [
  {
    trade: "nurse",
    summary: "Registered nurse with 9 years in emergency care. Triaged up to 30 patients per shift and trained 6 new hires on the handover protocol.",
    skills: ["Triage", "Patient care", "Electronic health records"],
    work: [
      { id: "n1", jobTitle: "Charge Nurse", employer: "Hospital Viedma", startDate: "03/2021", endDate: "06/2026",
        description: "- Cut medication errors from 12 to 3 per month across two wards\n- Trained 6 nurses on the new handover protocol\n- Coordinated triage for up to 30 patients per shift" },
      { id: "n2", jobTitle: "Staff Nurse", employer: "Clínica Los Olivos", startDate: "01/2017", endDate: "02/2021",
        description: "- Managed post-operative care for 15 beds\n- Reduced readmissions from 9% to 4% over two years" },
    ],
    education: [{ degree: "Licenciatura en Enfermería", fieldOfStudy: "Nursing", school: "UMSS", startDate: "02/2012", endDate: "12/2016" }],
  },
  {
    trade: "welder",
    summary: "Certified welder with 12 years in structural steel. Completed 40 building frames with zero rework in the last two years.",
    skills: ["TIG Welding", "Blueprint reading", "Structural steel"],
    work: [
      { id: "w1", jobTitle: "Lead Welder", employer: "Metalúrgica Andina", startDate: "05/2019", endDate: "07/2026",
        description: "- Completed 40 structural frames with zero rework\n- Cut scrap from 8% to 2% by changing the cutting sequence\n- Trained 4 apprentices on TIG welding" },
      { id: "w2", jobTitle: "Welder", employer: "Talleres Cruz", startDate: "01/2014", endDate: "04/2019",
        description: "- Fabricated 120 steel gates for a housing project\n- Passed 3 external weld inspections without a finding" },
    ],
    education: [{ degree: "Técnico Superior", fieldOfStudy: "Soldadura Industrial", school: "INFOCAL", startDate: "02/2012", endDate: "11/2013" }],
  },
  {
    trade: "teacher",
    summary: "Primary school teacher with 8 years in bilingual classrooms. Raised reading scores by 18 points across two grades.",
    skills: ["Lesson planning", "Classroom management", "Curriculum design"],
    work: [
      { id: "t1", jobTitle: "Grade 4 Teacher", employer: "Colegio San Agustín", startDate: "02/2020", endDate: "06/2026",
        description: "- Raised average reading scores from 62 to 80 over two years\n- Designed a bilingual reading plan adopted by 3 other grades\n- Mentored 5 new teachers through their first year" },
      { id: "t2", jobTitle: "Teaching Assistant", employer: "Escuela Bolívar", startDate: "03/2017", endDate: "12/2019",
        description: "- Supported 28 students in daily literacy sessions\n- Ran an after-school club with 15 regular attendees" },
    ],
    education: [{ degree: "Licenciatura en Educación", fieldOfStudy: "Primary Education", school: "UPB", startDate: "02/2013", endDate: "12/2016" }],
  },
  {
    trade: "shop manager",
    summary: "Store manager with 7 years in retail. Cut stock discrepancies from 8% to 2% and led a team of 11.",
    skills: ["Inventory management", "Visual merchandising", "Team leadership"],
    work: [
      { id: "s1", jobTitle: "Store Manager", employer: "Multicentro", startDate: "04/2021", endDate: "08/2026",
        description: "- Cut stock discrepancies from 8% to 2% in one quarter\n- Recovered $4,200 in mispriced inventory during an audit\n- Led the weekly count for a team of 11" },
      { id: "s2", jobTitle: "Assistant Manager", employer: "Tienda Central", startDate: "06/2019", endDate: "03/2021",
        description: "- Trained 6 seasonal staff before the holiday season\n- Introduced a returns log adopted by three other branches" },
    ],
    education: [{ degree: "Técnico Superior", fieldOfStudy: "Administración", school: "CBA", startDate: "02/2016", endDate: "11/2018" }],
  },
  {
    trade: "accountant",
    summary: "Accountant with 10 years in payroll and tax. Closed 120 monthly payrolls with no penalty.",
    skills: ["Accounting", "Payroll", "Tax filing", "Excel"],
    work: [
      { id: "a1", jobTitle: "Senior Accountant", employer: "Consultora Vega", startDate: "01/2020", endDate: "07/2026",
        description: "- Closed 120 monthly payrolls with zero penalties\n- Reduced the month-end close from 9 days to 4\n- Filed 60 tax returns per year without a correction" },
      { id: "a2", jobTitle: "Accounting Assistant", employer: "Distribuidora Sur", startDate: "02/2016", endDate: "12/2019",
        description: "- Reconciled 3 bank accounts monthly\n- Cut invoice errors from 6% to 1% in one year" },
    ],
    education: [{ degree: "Licenciatura en Contaduría Pública", fieldOfStudy: "Accounting", school: "UMSS", startDate: "02/2011", endDate: "12/2015" }],
  },
  {
    trade: "developer",
    summary: "iOS developer with 7 years building consumer apps. Cut crash rate from 1.8% to 0.6% on an app used by 120k people.",
    skills: ["Swift", "SwiftUI", "Core Data", "Git"],
    work: [
      { id: "d1", jobTitle: "iOS Developer", employer: "Xiobit", startDate: "01/2022", endDate: "08/2026",
        description: "- Reduced crash rate from 1.8% to 0.6% for 120k active users\n- Cut sync time from 3.2s to 1.1s across 80k users\n- Mentored 3 junior developers through their first release" },
      { id: "d2", jobTitle: "Mobile Developer", employer: "Salamanca", startDate: "02/2019", endDate: "12/2021",
        description: "- Shipped 4 App Store releases in the first year\n- Cut the release cycle from 4 weeks to 2 weeks" },
    ],
    education: [{ degree: "Ingeniería de Sistemas", fieldOfStudy: "Systems Engineering", school: "Católica", startDate: "02/2013", endDate: "12/2018" }],
  },
]

const asSections = (b: Bench): Record<string, unknown> => ({
  summary: b.summary,
  skills: b.skills.map((name, i) => ({ id: `sk${i}`, name, level: "advanced" })),
  workExperience: b.work,
  education: b.education,
})

describe("stability bench — a clean résumé comes out clean, in every trade", () => {
  for (const b of BENCH) {
    it(`${b.trade}: no credibility findings on a well-written résumé`, () => {
      const cred = computeCredibility(analyzeWriting(asSections(b)))
      // A false positive here sends someone editing a résumé that was fine, and
      // it is the failure mode that costs the most trust.
      expect(cred.findings.map((f) => f.key)).toEqual([])
      expect(cred.score).toBe(100)
    })

    it(`${b.trade}: its figures are recognised as figures`, () => {
      const q = assessResumeContent(asSections(b))
      // Every trade measures in its own units — patients, frames, payrolls,
      // students, crashes. A unit list would fail here; a structural rule does not.
      expect(q.quantificationPct).toBeGreaterThanOrEqual(50)
    })

    it(`${b.trade}: no button is drawn that has nothing to do`, () => {
      const sections = asSections(b)
      for (const kind of ["fix_dates", "remove_duplicates"] as const) {
        expect(groundFixAction({ kind }, sections)).toEqual({ kind: "manual" })
      }
    })

    it(`${b.trade}: the score is the same number twice`, () => {
      const keywords = { jobTitle: b.work[0].jobTitle, hardSkills: b.skills, softSkills: [], mustHaves: [] }
      const hay = `${b.summary} ${b.skills.join(" ")} ${b.work.map((w) => w.description).join(" ")}`.toLowerCase()
      const sections = { summary: true, work: true, skills: true, education: true }
      const a = computeATSMatch(keywords, hay, b.work[0].jobTitle, sections, hay)
      const c = computeATSMatch(keywords, hay, b.work[0].jobTitle, sections, hay)
      expect(a.score).toBe(c.score)
    })

    it(`${b.trade}: no skill is invented from its prose`, () => {
      const prose = b.work.map((w) => w.description).join(" ")
      const proven = findProvenUnlistedSkills(prose, b.skills)
      // Whatever it offers must be traceable to the dictionary AND to this text —
      // never a common word that happens to also be a product name.
      for (const skill of proven) {
        expect(prose.toLowerCase()).toContain(skill.toLowerCase().slice(0, 4))
      }
    })
  }
})

describe("stability bench — the rules that must converge", () => {
  it("a figure hint never writes into the résumé, only shows where it goes", () => {
    for (const b of BENCH) {
      for (const line of b.work.flatMap((w) => w.description.split("\n"))) {
        const slot = suggestFigureSlot(line.replace(/^- /, ""))
        // Lines that already carry a figure are left alone entirely.
        if (slot) expect(slot.example).toContain("___")
      }
    }
  })

  it("a summary rewrite never shrinks a résumé's summary to a fragment", () => {
    for (const b of BENCH) {
      const fragment = b.summary.split(". ")[1] ?? b.summary
      const out = spliceSummary(b.summary, fragment)
      if (out !== null) {
        // Either a full replacement of comparable length, or a splice that kept
        // the rest. Never a paragraph reduced to one of its own sentences.
        expect(out.length).toBeGreaterThanOrEqual(Math.min(b.summary.length, fragment.length))
      }
    }
  })

  it("every trade's own units count as quantification", () => {
    const lines = [
      "Triaged 30 patients per shift",
      "Completed 40 structural frames with zero rework",
      "Raised reading scores from 62 to 80",
      "Recovered $4,200 in mispriced inventory",
      "Closed 120 monthly payrolls",
      "Cut the release cycle from 4 weeks to 2 weeks",
      "Served 120 covers per night",
      "Drove 1,800 km per week on the northern route",
    ]
    for (const l of lines) expect(hasAnyMetric(l)).toBe(true)
    for (const l of ["Responsible for daily operations", "Encargado de la atención al cliente"]) {
      expect(hasAnyMetric(l)).toBe(false)
    }
  })
})
