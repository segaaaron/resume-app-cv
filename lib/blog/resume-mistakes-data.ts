// 15 highest-cost resume mistakes ranked by impact, for the EN blog post
// `resume-mistakes-to-avoid`. Each entry pairs the mistake with a concrete fix
// and a before/after example or impact note.

export type ResumeMistake = {
  rank: number
  title: string
  impact: "Deal-breaker" | "High" | "Medium"
  why: string
  fix: string
  example?: { before: string; after: string }
}

export const RESUME_MISTAKES: ResumeMistake[] = [
  {
    rank: 1,
    title: "Typos and grammar errors",
    impact: "Deal-breaker",
    why: "A typo in the first 50 words is the single most common deal-breaker. Recruiters interpret it as proof that you do not proofread your own work — a direct red flag for any role.",
    fix: "Read aloud, run through Grammarly, and have one other person review before submitting. Names of companies and tools are the most common error site.",
  },
  {
    rank: 2,
    title: "Generic, copy-paste resume with no customization",
    impact: "High",
    why: "ATS systems score by keyword match against the specific JD. A generic resume scores 35-50% match; a tailored one scores 70-90%. Generic resumes lose at the parsing stage before a human ever sees them.",
    fix: "Spend 10 minutes per application updating the summary, top 5 skills, and bullet keywords to match the JD vocabulary verbatim.",
  },
  {
    rank: 3,
    title: "Wrong file format or corrupted PDF",
    impact: "Deal-breaker",
    why: "ATS systems expect text-extractable PDFs. Scanned PDFs, exported images, or .pages files fail at the parsing stage and produce empty fields in the recruiter dashboard.",
    fix: "Export as PDF from a text-based editor (Word, Google Docs, ReadyCV). Verify by opening the PDF and selecting the text — if you cannot, the ATS cannot either.",
  },
  {
    rank: 4,
    title: "Unprofessional email address",
    impact: "High",
    why: "skater_boy_89@hotmail.com signals lack of seriousness in under a second. Some recruiters openly admit to discarding resumes on email address alone for senior roles.",
    fix: "Use firstname.lastname@gmail.com or a similar professional format. Spend the two minutes to create one.",
  },
  {
    rank: 5,
    title: "Missing keywords from the job description",
    impact: "High",
    why: "ATS dashboards rank candidates by keyword density against the JD. Missing the top 5-10 keywords drops you below the human-review threshold regardless of how strong your background is.",
    fix: "Pull the top recurring nouns and verbs from the JD. Embed them verbatim in your summary and at least one bullet each.",
    example: {
      before: "Worked extensively with cloud services and modern web frameworks.",
      after: "Built AWS-based microservices in TypeScript and Next.js, deploying via CI/CD to production.",
    },
  },
  {
    rank: 6,
    title: "Listing duties instead of achievements",
    impact: "High",
    why: "A bullet that describes what the job required reads like a job posting. A bullet that describes what you accomplished reads like a candidate. Recruiters interview candidates, not job postings.",
    fix: "Reframe each bullet around the outcome. Use the formula: verb + action + quantified result.",
    example: {
      before: "Responsible for managing marketing campaigns across multiple channels.",
      after: "Ran 14 multi-channel campaigns generating USD 1.2M in attributed pipeline at 4.2x ROAS.",
    },
  },
  {
    rank: 7,
    title: "Vague language ('helped with', 'responsible for', 'worked on')",
    impact: "Medium",
    why: "Vague verbs leave the reader uncertain whether you led the work or watched it happen. In a competitive pool, doubt becomes elimination.",
    fix: "Replace with specific verbs. See the action verbs guide for 300+ alternatives organized by category.",
  },
  {
    rank: 8,
    title: "Inconsistent formatting",
    impact: "Medium",
    why: "Mixed bullet styles, inconsistent date formats (2023 vs Mar 2023), shifting font sizes — all signal a rushed assembly. Recruiters take it as a quality proxy for the work you would do for them.",
    fix: "Lock to one bullet style, one date format, one font, two type sizes (body + heading). Apply once and audit visually.",
  },
  {
    rank: 9,
    title: "Outdated 'Objective' statement",
    impact: "Medium",
    why: "The objective statement ('Seeking an opportunity to leverage my skills...') was retired around 2018. It now reads as filler and pushes valuable real estate down the page.",
    fix: "Replace with a professional summary — 3-4 lines stating your role, years of experience, and your top 2 differentiators.",
  },
  {
    rank: 10,
    title: "Wrong length for your level",
    impact: "Medium",
    why: "Forcing 15 years of experience onto 1 page reads as unconfident; padding 2 years onto 2 pages reads as inflated. Length signals self-awareness.",
    fix: "0-7 years experience: 1 page. 7+ years: 2 pages. See the resume length guide for the country-by-country breakdown.",
  },
  {
    rank: 11,
    title: "Photo on a US resume (or no photo on a German CV)",
    impact: "High",
    why: "Photo conventions are sharply regional. A photo on a US resume can trigger ATS-image-rejection rules; a missing photo on a German Lebenslauf reads as incomplete.",
    fix: "USA, Canada, UK, Australia: no photo. Germany, France, Spain, Latin America: photo expected. Adapt to the country of the employer.",
  },
  {
    rank: 12,
    title: "Including references on the resume",
    impact: "Medium",
    why: "'References available on request' wastes a line. Listing referees directly wastes more and exposes their contact info to every applicant pipeline you join.",
    fix: "Omit entirely. Provide a separate references sheet when the employer asks at offer stage.",
  },
  {
    rank: 13,
    title: "Listing irrelevant experience",
    impact: "Medium",
    why: "A 5-line bullet about your part-time barista role 8 years ago crowds out current relevant work. The recruiter notices what is taking the space.",
    fix: "Roles older than 10 years collapse to a single 'Earlier career' line. Irrelevant adjacent work gets one line — title, employer, dates — no bullets.",
  },
  {
    rank: 14,
    title: "Creative template for a traditional role",
    impact: "High",
    why: "Multi-column graphic-heavy templates often fail ATS parsing. They also signal a brand mismatch when applied to law, finance, healthcare or government roles.",
    fix: "Pick a single-column, ATS-verified template. Save the creative format for design and marketing portfolios — and even then, attach a parser-clean version as backup.",
  },
  {
    rank: 15,
    title: "Lying or exaggerating credentials",
    impact: "Deal-breaker",
    why: "Background checks now extend to degree verification, employment dates, and increasingly to specific claimed achievements. A discrepancy revealed mid-process invalidates the offer and often blacklists you internally.",
    fix: "Always reframe rather than fabricate. There is a true, strong version of every weak fact — find it, do not invent.",
  },
]

// Self-audit checklist — 12 items to verify before submitting
export const SELF_AUDIT_CHECKLIST: string[] = [
  "No typos in name, email, employer names, or tool names",
  "PDF text is selectable when opened (not a scanned image)",
  "File name follows: FirstnameLastname_Resume.pdf",
  "Email address is a professional firstname.lastname@gmail.com format",
  "Top 5-10 keywords from the JD appear at least once each",
  "Every bullet starts with an action verb in the correct tense",
  "Every bullet has at least one quantified metric (number, %, USD, time)",
  "No verb appears more than twice across the whole resume",
  "Length matches: 1 page (0-7 yrs) or 2 pages (7+ yrs)",
  "Photo presence/absence matches country convention",
  "Header repeated on page 2 with name + contact",
  "Final visual scan: consistent fonts, dates, bullets, indentation",
]
