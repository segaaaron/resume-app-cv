// 300+ resume action verbs organized by category for the EN blog post
// `action-verbs-resume`. Each category targets a specific competency cluster
// recruiters scan for. Verbs are deliberately varied — no overused defaults
// like "managed" or "responsible for" appear here on purpose.

export type VerbCategory = {
  id: string
  title: string
  description: string
  verbs: string[]
}

export const ACTION_VERB_CATEGORIES: VerbCategory[] = [
  {
    id: "leadership",
    title: "Leadership & Management",
    description: "Use these when you led people, projects, or strategic initiatives. Avoid 'managed' as a default — pick a verb that signals scope.",
    verbs: [
      "Spearheaded", "Orchestrated", "Directed", "Championed", "Mobilized",
      "Galvanized", "Steered", "Headed", "Piloted", "Shepherded",
      "Mentored", "Coached", "Cultivated", "Empowered", "Inspired",
      "Delegated", "Oversaw", "Governed", "Convened", "Chaired",
      "Aligned", "Unified", "Consolidated", "Established", "Instituted",
      "Founded", "Launched", "Pioneered", "Initiated", "Originated",
      "Spawned", "Catalyzed", "Drove", "Propelled", "Advanced",
      "Restructured", "Reorganized", "Transformed", "Reinvigorated", "Revitalized",
    ],
  },
  {
    id: "communication",
    title: "Communication & Collaboration",
    description: "Use these when describing presentations, cross-functional work, stakeholder engagement, or any verbal/written impact.",
    verbs: [
      "Articulated", "Conveyed", "Communicated", "Presented", "Briefed",
      "Authored", "Drafted", "Edited", "Composed", "Documented",
      "Negotiated", "Mediated", "Facilitated", "Brokered", "Resolved",
      "Liaised", "Coordinated", "Collaborated", "Partnered", "Aligned",
      "Persuaded", "Influenced", "Lobbied", "Advocated", "Championed",
      "Translated", "Interpreted", "Synthesized", "Clarified", "Distilled",
      "Engaged", "Cultivated", "Fostered", "Nurtured", "Strengthened",
    ],
  },
  {
    id: "results",
    title: "Achievement & Results",
    description: "Use these when you can attach a metric. The strongest bullets pair a results verb with a quantified outcome — never use these without a number.",
    verbs: [
      "Achieved", "Delivered", "Exceeded", "Surpassed", "Outperformed",
      "Generated", "Produced", "Yielded", "Drove", "Doubled",
      "Tripled", "Quadrupled", "Multiplied", "Boosted", "Lifted",
      "Increased", "Grew", "Expanded", "Scaled", "Amplified",
      "Maximized", "Optimized", "Improved", "Enhanced", "Elevated",
      "Reduced", "Cut", "Trimmed", "Slashed", "Decreased",
      "Saved", "Recovered", "Recaptured", "Reclaimed", "Salvaged",
      "Earned", "Secured", "Captured", "Won", "Closed",
      "Accelerated", "Hastened", "Expedited", "Streamlined", "Shortened",
    ],
  },
  {
    id: "analysis",
    title: "Analysis & Research",
    description: "Use these for data, research, audit, or investigative work. Pair with the methodology or dataset for credibility.",
    verbs: [
      "Analyzed", "Investigated", "Researched", "Examined", "Studied",
      "Evaluated", "Assessed", "Audited", "Benchmarked", "Measured",
      "Quantified", "Modeled", "Forecasted", "Projected", "Calculated",
      "Diagnosed", "Identified", "Detected", "Uncovered", "Discovered",
      "Interpreted", "Decoded", "Mapped", "Charted", "Tracked",
      "Validated", "Verified", "Tested", "Reconciled", "Synthesized",
    ],
  },
  {
    id: "innovation",
    title: "Creativity & Innovation",
    description: "Use these when you designed, invented, or rethought something. Avoid for incremental improvements — they belong in 'Results'.",
    verbs: [
      "Designed", "Devised", "Conceived", "Conceptualized", "Engineered",
      "Architected", "Created", "Crafted", "Fashioned", "Forged",
      "Invented", "Innovated", "Reimagined", "Reinvented", "Modernized",
      "Prototyped", "Drafted", "Modeled", "Formulated", "Composed",
      "Curated", "Tailored", "Customized", "Personalized", "Adapted",
      "Reframed", "Repositioned", "Redefined", "Reshaped", "Refined",
    ],
  },
  {
    id: "technical",
    title: "Technical & Engineering",
    description: "Use these for code, infrastructure, or hardware work. Specificity matters more here than verb intensity — name the system or stack.",
    verbs: [
      "Built", "Coded", "Programmed", "Engineered", "Developed",
      "Deployed", "Implemented", "Integrated", "Migrated", "Refactored",
      "Optimized", "Automated", "Configured", "Provisioned", "Orchestrated",
      "Architected", "Designed", "Scaled", "Hardened", "Secured",
      "Debugged", "Tested", "Validated", "Patched", "Maintained",
      "Monitored", "Instrumented", "Profiled", "Benchmarked", "Tuned",
      "Operated", "Administered", "Supervised", "Upgraded", "Decommissioned",
    ],
  },
  {
    id: "sales",
    title: "Sales & Customer-Facing",
    description: "Use these for revenue, pipeline, account, or customer-success work. Pair with deal size, retention rate, or pipeline value.",
    verbs: [
      "Closed", "Sold", "Pitched", "Prospected", "Qualified",
      "Generated", "Sourced", "Cultivated", "Nurtured", "Converted",
      "Retained", "Renewed", "Upsold", "Cross-sold", "Expanded",
      "Onboarded", "Activated", "Engaged", "Reactivated", "Recovered",
      "Negotiated", "Brokered", "Secured", "Earned", "Captured",
      "Advised", "Consulted", "Guided", "Recommended", "Resolved",
    ],
  },
  {
    id: "projects",
    title: "Project Management",
    description: "Use these for delivery, scope, and stakeholder management. Pair with budget, timeline, or team size for impact.",
    verbs: [
      "Delivered", "Executed", "Launched", "Shipped", "Rolled out",
      "Planned", "Scheduled", "Mapped", "Sequenced", "Prioritized",
      "Coordinated", "Aligned", "Orchestrated", "Synchronized", "Marshaled",
      "Tracked", "Monitored", "Forecasted", "Reported", "Escalated",
      "Mitigated", "De-risked", "Stabilized", "Recovered", "Salvaged",
      "Budgeted", "Allocated", "Reallocated", "Forecasted", "Reconciled",
    ],
  },
  {
    id: "teaching",
    title: "Teaching & Training",
    description: "Use these for instructional design, training delivery, mentoring, or knowledge transfer.",
    verbs: [
      "Trained", "Taught", "Instructed", "Coached", "Mentored",
      "Facilitated", "Educated", "Onboarded", "Upskilled", "Reskilled",
      "Demonstrated", "Modeled", "Illustrated", "Explained", "Clarified",
      "Designed", "Curated", "Developed", "Authored", "Scripted",
      "Evaluated", "Assessed", "Certified", "Credentialed", "Graduated",
    ],
  },
]

// Overused verbs to avoid (and their stronger replacements)
export const OVERUSED_VERBS: { weak: string; strong: string[] }[] = [
  { weak: "Managed", strong: ["Directed", "Spearheaded", "Orchestrated", "Oversaw"] },
  { weak: "Responsible for", strong: ["Owned", "Led", "Directed", "Drove"] },
  { weak: "Worked on", strong: ["Built", "Delivered", "Shipped", "Engineered"] },
  { weak: "Helped with", strong: ["Partnered", "Collaborated", "Supported", "Contributed"] },
  { weak: "Used", strong: ["Leveraged", "Applied", "Deployed", "Operated"] },
  { weak: "Made", strong: ["Built", "Created", "Crafted", "Generated"] },
  { weak: "Did", strong: ["Executed", "Delivered", "Performed", "Completed"] },
  { weak: "Improved", strong: ["Optimized", "Streamlined", "Elevated", "Boosted"] },
]

// Before/after rewrites — concrete pairs showing weak verb → strong rewrite
export const BEFORE_AFTER_EXAMPLES: { before: string; after: string; verb: string }[] = [
  {
    before: "Responsible for managing the social media team.",
    after: "Directed a 4-person social media team, growing audience from 12K to 48K in 9 months.",
    verb: "Directed",
  },
  {
    before: "Helped with the new onboarding process.",
    after: "Architected onboarding flow that reduced time-to-first-value from 14 to 4 days.",
    verb: "Architected",
  },
  {
    before: "Worked on a project to reduce costs.",
    after: "Spearheaded cost-reduction initiative across 3 departments, saving USD 480K annually.",
    verb: "Spearheaded",
  },
  {
    before: "Did training for new employees.",
    after: "Designed and delivered onboarding training for 60+ new hires across 4 cohorts.",
    verb: "Designed",
  },
  {
    before: "Used Tableau to make reports.",
    after: "Built 12 executive Tableau dashboards adopted by leadership for weekly reviews.",
    verb: "Built",
  },
]

// Helper count for the post header
export const TOTAL_VERB_COUNT = ACTION_VERB_CATEGORIES.reduce(
  (sum, cat) => sum + cat.verbs.length,
  0,
)
