/**
 * Fictitious sample CVs used to populate template PREVIEWS on marketing pages
 * (templates gallery + detail). Five detailed personas — mixed gender and
 * profession — so the gallery shows realistic variety, not the same person
 * everywhere. No real people.
 *
 * Consumed by MockTemplatePreview, which seeds an isolated resume store per
 * persona and renders the actual template component via ResumePreview.
 */

import { ResumeSectionsSchema, type ResumeSections, type ResumeConfig } from "@/types/resume"

export interface MockProfile {
  sectionData: ResumeSections
  config: ResumeConfig
}

function baseConfig(colorScheme: string, fontFamily: string, language: "es" | "en", photoUrl: string): ResumeConfig {
  return {
    templateId: "classic",
    colorScheme,
    fontFamily,
    fontSize: 14,
    spacing: 1.0,
    photoUrl,
    photoPosition: 50,
    language,
  }
}

export const MOCK_PROFILES: MockProfile[] = [
  // 1 — Marketing Manager (male)
  {
    config: baseConfig("#1a2e4a", "Poppins", "en", "/mock/avatar-1.webp"),
    sectionData: ResumeSectionsSchema.parse({
      personalDetails: { firstName: "Alex", lastName: "Carter", jobTitle: "Marketing Manager", email: "alex.carter@email.com", phone: "+1 (555) 018-2204", city: "New York", country: "USA", website: "alexcarter.me", linkedin: "in/alexcarter", yearsOfExperience: "8" },
      summary: "Results-driven marketing manager with 8+ years leading brand and growth campaigns across global teams. Proven record scaling acquisition and building high-performing teams.",
      workExperience: [
        { id: "w1", employer: "BrightWave", jobTitle: "Senior Marketing Manager", city: "New York", startDate: "2021", endDate: "", currentlyWorking: true, description: "• Scaled paid acquisition 3× while cutting CPA 28%.\n• Led a team of 6 across content, SEO and lifecycle.\n• Owned a $2M annual marketing budget." },
        { id: "w2", employer: "Nexa Group", jobTitle: "Marketing Specialist", city: "Boston", startDate: "2018", endDate: "2021", currentlyWorking: false, description: "• Launched a rebrand that lifted engagement 45%.\n• Built analytics dashboards and monthly executive reporting." },
      ],
      education: [{ id: "e1", institution: "State University", degree: "B.A. Business Administration", fieldOfStudy: "Marketing", city: "New York", startDate: "2014", endDate: "2018", currentlyStudying: false, description: "" }],
      skills: [{ id: "s1", name: "Brand Strategy", level: "expert" }, { id: "s2", name: "SEO / SEM", level: "advanced" }, { id: "s3", name: "Analytics", level: "advanced" }, { id: "s4", name: "Team Leadership", level: "expert" }, { id: "s5", name: "Content", level: "advanced" }, { id: "s6", name: "Paid Media", level: "advanced" }],
      languages: [{ id: "l1", name: "English", level: "native" }, { id: "l2", name: "Spanish", level: "c1" }],
      certifications: [{ id: "c1", name: "Google Analytics", issuer: "Google", date: "2023", url: "" }, { id: "c2", name: "HubSpot Inbound", issuer: "HubSpot", date: "2022", url: "" }],
      hobbies: "Photography, trail running, design systems",
    }),
  },
  // 2 — Product / UX Designer (female)
  {
    config: baseConfig("#7c3aed", "Montserrat", "en", "/mock/avatar-2.webp"),
    sectionData: ResumeSectionsSchema.parse({
      personalDetails: { firstName: "Sofía", lastName: "Romero", jobTitle: "Senior Product Designer", email: "sofia.romero@email.com", phone: "+34 612 905 318", city: "Barcelona", country: "Spain", website: "sofiaromero.design", linkedin: "in/sofiaromero", yearsOfExperience: "7" },
      summary: "Product designer crafting accessible, conversion-focused interfaces for SaaS and fintech. Bridges research, UI and front-end to ship polished, measurable products.",
      workExperience: [
        { id: "w1", employer: "Lumio", jobTitle: "Senior Product Designer", city: "Barcelona", startDate: "2020", endDate: "", currentlyWorking: true, description: "• Redesigned onboarding, raising activation 34%.\n• Built and maintained a 90-component design system.\n• Ran weekly usability tests with real users." },
        { id: "w2", employer: "Pixela Studio", jobTitle: "Product Designer", city: "Madrid", startDate: "2017", endDate: "2020", currentlyWorking: false, description: "• Designed mobile apps for 5 fintech clients.\n• Introduced design tokens and dark mode." },
      ],
      education: [{ id: "e1", institution: "ELISAVA", degree: "B.A. Interaction Design", fieldOfStudy: "Design", city: "Barcelona", startDate: "2013", endDate: "2017", currentlyStudying: false, description: "" }],
      skills: [{ id: "s1", name: "UX Research", level: "expert" }, { id: "s2", name: "UI Design", level: "expert" }, { id: "s3", name: "Figma", level: "expert" }, { id: "s4", name: "Prototyping", level: "advanced" }, { id: "s5", name: "Design Systems", level: "advanced" }, { id: "s6", name: "Accessibility", level: "advanced" }],
      languages: [{ id: "l1", name: "Spanish", level: "native" }, { id: "l2", name: "English", level: "c1" }, { id: "l3", name: "French", level: "b1" }],
      certifications: [{ id: "c1", name: "NN/g UX Certification", issuer: "Nielsen Norman", date: "2022", url: "" }],
      hobbies: "Ceramics, cycling, typography",
    }),
  },
  // 3 — Software Engineer (male)
  {
    config: baseConfig("#0ea5e9", "Inter", "en", "/mock/avatar-3.webp"),
    sectionData: ResumeSectionsSchema.parse({
      personalDetails: { firstName: "Daniel", lastName: "Brooks", jobTitle: "Software Engineer", email: "daniel.brooks@email.com", phone: "+1 (415) 555-0148", city: "San Francisco", country: "USA", website: "danbrooks.dev", github: "danbrooks", linkedin: "in/danielbrooks", yearsOfExperience: "6" },
      summary: "Full-stack engineer specialized in scalable web platforms and clean architecture. Ships reliable features end-to-end and mentors junior developers.",
      workExperience: [
        { id: "w1", employer: "Vertex Labs", jobTitle: "Software Engineer", city: "San Francisco", startDate: "2021", endDate: "", currentlyWorking: true, description: "• Cut API p95 latency 40% via caching and query tuning.\n• Led migration to a typed monorepo (TypeScript).\n• Shipped CI/CD pipeline reducing deploy time 70%." },
        { id: "w2", employer: "Cloudbyte", jobTitle: "Junior Developer", city: "Austin", startDate: "2018", endDate: "2021", currentlyWorking: false, description: "• Built REST and GraphQL services for 200k+ users.\n• Improved test coverage from 40% to 85%." },
      ],
      education: [{ id: "e1", institution: "UT Austin", degree: "B.Sc. Computer Science", fieldOfStudy: "Computer Science", city: "Austin", startDate: "2014", endDate: "2018", currentlyStudying: false, description: "" }],
      skills: [{ id: "s1", name: "TypeScript", level: "expert" }, { id: "s2", name: "React", level: "expert" }, { id: "s3", name: "Node.js", level: "advanced" }, { id: "s4", name: "PostgreSQL", level: "advanced" }, { id: "s5", name: "AWS", level: "intermediate" }, { id: "s6", name: "Docker", level: "advanced" }],
      languages: [{ id: "l1", name: "English", level: "native" }],
      certifications: [{ id: "c1", name: "AWS Solutions Architect", issuer: "Amazon", date: "2023", url: "" }],
      hobbies: "Open source, climbing, chess",
    }),
  },
  // 4 — Financial Analyst (female)
  {
    config: baseConfig("#047857", "Lato", "en", "/mock/avatar-4.webp"),
    sectionData: ResumeSectionsSchema.parse({
      personalDetails: { firstName: "Emma", lastName: "Lindqvist", jobTitle: "Financial Analyst", email: "emma.lindqvist@email.com", phone: "+46 70 123 4567", city: "Stockholm", country: "Sweden", linkedin: "in/emmalindqvist", yearsOfExperience: "9" },
      summary: "Financial analyst with a decade of FP&A and corporate finance experience. Turns complex data into clear decisions for executives and investors.",
      workExperience: [
        { id: "w1", employer: "Nordic Capital", jobTitle: "Senior Financial Analyst", city: "Stockholm", startDate: "2019", endDate: "", currentlyWorking: true, description: "• Built 3-statement models guiding €40M in investments.\n• Automated monthly reporting, saving 30 hours/month.\n• Presented quarterly results to the board." },
        { id: "w2", employer: "Atlas Bank", jobTitle: "Financial Analyst", city: "Gothenburg", startDate: "2015", endDate: "2019", currentlyWorking: false, description: "• Led budgeting and variance analysis for 4 units.\n• Improved forecast accuracy by 22%." },
      ],
      education: [{ id: "e1", institution: "Stockholm School of Economics", degree: "M.Sc. Finance", fieldOfStudy: "Finance", city: "Stockholm", startDate: "2012", endDate: "2014", currentlyStudying: false, description: "" }],
      skills: [{ id: "s1", name: "Financial Modeling", level: "expert" }, { id: "s2", name: "FP&A", level: "expert" }, { id: "s3", name: "Excel / VBA", level: "expert" }, { id: "s4", name: "Power BI", level: "advanced" }, { id: "s5", name: "Valuation", level: "advanced" }, { id: "s6", name: "SQL", level: "intermediate" }],
      languages: [{ id: "l1", name: "Swedish", level: "native" }, { id: "l2", name: "English", level: "c2" }, { id: "l3", name: "German", level: "b2" }],
      certifications: [{ id: "c1", name: "CFA Level II", issuer: "CFA Institute", date: "2021", url: "" }],
      hobbies: "Skiing, piano, economics podcasts",
    }),
  },
  // 5 — Project Manager (male)
  {
    config: baseConfig("#b45309", "Merriweather", "en", "/mock/avatar-5.webp"),
    sectionData: ResumeSectionsSchema.parse({
      personalDetails: { firstName: "Noah", lastName: "Kim", jobTitle: "Project Manager", email: "noah.kim@email.com", phone: "+1 (212) 555-0190", city: "Chicago", country: "USA", linkedin: "in/noahkim", yearsOfExperience: "10" },
      summary: "PMP-certified project manager delivering cross-functional programs on time and under budget. Calm under pressure, obsessed with clear communication.",
      workExperience: [
        { id: "w1", employer: "Meridian Health", jobTitle: "Senior Project Manager", city: "Chicago", startDate: "2018", endDate: "", currentlyWorking: true, description: "• Delivered a $5M platform rollout across 12 sites.\n• Coordinated 40+ stakeholders and 3 vendors.\n• Cut project overruns 25% with agile cadences." },
        { id: "w2", employer: "BuildCo", jobTitle: "Project Coordinator", city: "Denver", startDate: "2014", endDate: "2018", currentlyWorking: false, description: "• Managed schedules and budgets for 15 projects.\n• Standardized reporting across the PMO." },
      ],
      education: [{ id: "e1", institution: "Northwestern University", degree: "B.A. Management", fieldOfStudy: "Management", city: "Chicago", startDate: "2010", endDate: "2014", currentlyStudying: false, description: "" }],
      skills: [{ id: "s1", name: "Agile / Scrum", level: "expert" }, { id: "s2", name: "Stakeholder Mgmt", level: "expert" }, { id: "s3", name: "Risk Management", level: "advanced" }, { id: "s4", name: "Jira", level: "advanced" }, { id: "s5", name: "Budgeting", level: "advanced" }, { id: "s6", name: "Roadmapping", level: "advanced" }],
      languages: [{ id: "l1", name: "English", level: "native" }, { id: "l2", name: "Korean", level: "b2" }],
      certifications: [{ id: "c1", name: "PMP", issuer: "PMI", date: "2020", url: "" }, { id: "c2", name: "Certified ScrumMaster", issuer: "Scrum Alliance", date: "2019", url: "" }],
      hobbies: "Basketball, cooking, travel",
    }),
  },
]

/** Deterministic persona index for a template id, so each template always shows
 *  the same persona (stable across renders) while the gallery stays varied. */
export function profileIndexFor(templateId: string): number {
  let h = 0
  for (let i = 0; i < templateId.length; i++) h = (h * 31 + templateId.charCodeAt(i)) >>> 0
  return h % MOCK_PROFILES.length
}
