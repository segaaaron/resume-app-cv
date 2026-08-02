import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Sparkles, Target, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "resume-skills-by-industry"
const SLUG_ES = "habilidades-para-cv"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 11
const LOCALE_TARGET = "en"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_resume_skills" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://www.valhallaresume.com/en/blog/${SLUG}`,
        es: `https://www.valhallaresume.com/es/blog/${SLUG_ES}`,
        "x-default": `https://www.valhallaresume.com/en/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["Valhalla Resume Team"],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
  }
}

type SkillGroup = { title: string; hard: string[]; soft: string[]; tools?: string[] }

export default async function ResumeSkillsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Resume Skills: 200+ Skills by Industry (2026 Guide)"
  const SUBTITLE =
    "Listing the wrong skills (or the right skills the wrong way) is one of the fastest ways to lose an ATS match. Here are 200+ skills organized by industry, the exact rules for choosing yours, and where to place them on your resume."
  const TAG = "Resume Skills"

  const toc = [
    { id: "hard-vs-soft", label: "Hard vs soft skills (with examples)" },
    { id: "choose-skills", label: "How to choose the right skills for your resume" },
    { id: "by-industry", label: "200+ skills by industry" },
    { id: "where-place", label: "Where to place skills on your resume" },
    { id: "ats-format", label: "ATS-friendly skills formatting" },
    { id: "mistakes", label: "5 mistakes that kill your skills section" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const industries: SkillGroup[] = [
    {
      title: "Software & Tech",
      hard: [
        "JavaScript",
        "TypeScript",
        "Python",
        "Go",
        "Rust",
        "React",
        "Next.js",
        "Node.js",
        "PostgreSQL",
        "Redis",
        "Kafka",
        "Docker",
        "Kubernetes",
        "AWS (EC2, S3, Lambda)",
        "GCP",
        "Terraform",
        "CI/CD (GitHub Actions, GitLab)",
        "REST & GraphQL APIs",
        "System design",
        "Unit & integration testing",
      ],
      soft: ["Code review", "Async collaboration", "Technical writing", "Ownership", "Mentorship"],
    },
    {
      title: "Data & AI",
      hard: [
        "SQL (Postgres, BigQuery, Snowflake)",
        "Python (pandas, numpy, scikit-learn)",
        "PyTorch",
        "TensorFlow",
        "dbt",
        "Airflow",
        "Spark",
        "Databricks",
        "Looker",
        "Tableau",
        "Power BI",
        "A/B testing",
        "Statistical modeling",
        "Feature engineering",
        "MLOps (MLflow, SageMaker)",
        "Time-series forecasting",
        "NLP",
        "Computer vision",
        "Causal inference",
        "Experimentation platforms",
      ],
      soft: ["Stakeholder management", "Hypothesis framing", "Data storytelling"],
    },
    {
      title: "Healthcare & Nursing",
      hard: [
        "Patient assessment",
        "IV therapy",
        "Wound care",
        "Triage",
        "Electronic Health Records (Epic, Cerner)",
        "HIPAA compliance",
        "Medication administration",
        "Phlebotomy",
        "EKG interpretation",
        "Telemetry monitoring",
        "BLS / ACLS / PALS",
        "CPR certification",
        "Charge nurse duties",
        "Care plan documentation",
        "Infection control",
        "Vital signs monitoring",
        "Discharge planning",
      ],
      soft: ["Patient empathy", "Family communication", "Shift handoff", "Crisis composure"],
    },
    {
      title: "Marketing & Growth",
      hard: [
        "Google Ads",
        "Meta Ads Manager",
        "LinkedIn Ads",
        "Google Analytics 4",
        "SEO (technical, on-page, link-building)",
        "Content marketing",
        "Email marketing (HubSpot, Klaviyo)",
        "Marketing automation",
        "Attribution modeling",
        "A/B testing",
        "CRO (conversion rate optimization)",
        "Salesforce",
        "Webflow",
        "WordPress",
        "Figma",
        "Notion",
        "Lifecycle marketing",
        "Account-based marketing",
        "Brand positioning",
      ],
      soft: ["Copywriting", "Cross-functional briefs", "Vendor management"],
    },
    {
      title: "Finance & Accounting",
      hard: [
        "Advanced Excel (pivots, INDEX/MATCH, Power Query)",
        "Financial modeling (3-statement, DCF, LBO)",
        "QuickBooks",
        "NetSuite",
        "SAP",
        "Oracle Financials",
        "GAAP / IFRS",
        "Month-end close",
        "Variance analysis",
        "Budgeting & forecasting",
        "P&L ownership",
        "Treasury & cash flow",
        "Audit support (Big 4)",
        "Tax compliance",
        "Accounts payable / receivable",
        "Reconciliations",
        "CPA / CFA / CMA certifications",
      ],
      soft: ["Executive communication", "Cross-department partnering"],
    },
    {
      title: "Sales & Business Development",
      hard: [
        "Salesforce",
        "HubSpot CRM",
        "Outreach",
        "Apollo",
        "ZoomInfo",
        "LinkedIn Sales Navigator",
        "Gong",
        "Pipeline management",
        "Forecasting",
        "MEDDIC / MEDDPICC",
        "SPIN selling",
        "Challenger methodology",
        "Discovery calls",
        "Demo delivery",
        "Negotiation",
        "Account expansion (land & expand)",
        "Channel partnerships",
        "Cold outbound",
      ],
      soft: ["Active listening", "Objection handling", "Executive presence"],
    },
    {
      title: "Education & Teaching",
      hard: [
        "Lesson planning",
        "Differentiated instruction",
        "Classroom management",
        "IEP / 504 plan implementation",
        "Curriculum design",
        "Common Core / state standards",
        "Google Classroom",
        "Canvas LMS",
        "Schoology",
        "Formative & summative assessment",
        "Blended learning",
        "ESL strategies",
        "Restorative discipline",
        "Standardized test prep",
        "Reading interventions (LLI, Orton-Gillingham)",
      ],
      soft: ["Parent conferences", "Cross-grade collaboration", "Student mentorship"],
    },
    {
      title: "Engineering (Mechanical, Civil, Electrical)",
      hard: [
        "AutoCAD",
        "SolidWorks",
        "Revit",
        "MATLAB",
        "ANSYS",
        "SAP2000",
        "Bluebeam Revu",
        "Finite Element Analysis (FEA)",
        "PLC programming",
        "PCB design (Altium)",
        "Six Sigma (Green/Black Belt)",
        "Lean manufacturing",
        "GD&T (Geometric Dimensioning)",
        "OSHA compliance",
        "Project lifecycle management",
        "Bills of materials (BOM)",
        "RFI / submittal management",
      ],
      soft: ["Cross-discipline coordination", "Vendor & contractor management"],
    },
    {
      title: "Customer Service & Hospitality",
      hard: [
        "Zendesk",
        "Intercom",
        "Freshdesk",
        "Salesforce Service Cloud",
        "Live chat tools",
        "Macros & workflows",
        "Ticket categorization",
        "SLA management",
        "POS systems",
        "Opera PMS (hotels)",
        "Reservation systems",
        "Bilingual support",
        "Escalation handling",
        "Voice & email support",
        "Knowledge base authoring",
      ],
      soft: ["De-escalation", "Empathy", "Cross-shift handoffs", "Upsell awareness"],
    },
    {
      title: "Product, Design & UX",
      hard: [
        "Figma",
        "Sketch",
        "Adobe XD",
        "Principle",
        "Framer",
        "Maze",
        "Dovetail",
        "Notion",
        "Jira",
        "Linear",
        "Roadmap planning",
        "PRD authoring",
        "User research (qualitative & quantitative)",
        "Usability testing",
        "Information architecture",
        "Design systems",
        "Accessibility (WCAG 2.2)",
        "Prototyping",
        "User journey mapping",
      ],
      soft: ["Stakeholder alignment", "Design critique", "Async writing"],
    },
  ]

  const faqs = [
    {
      q: "How many skills should I list on my resume?",
      a: "Between 8 and 15 in a dedicated Skills section. Fewer than 8 looks underqualified; more than 15 dilutes signal and forces the recruiter to skim. Prioritize the skills that appear in the job description verbatim, then add 3-5 supporting ones.",
    },
    {
      q: "Should I list skills by category or as a flat list?",
      a: "Categories outperform flat lists at any seniority above entry-level. Group as Technical / Tools / Methodologies (or similar). Categories help recruiters scan in 3 seconds and help ATS systems parse subsections without dropping context.",
    },
    {
      q: "Are soft skills worth listing at all?",
      a: "Only when the job description explicitly names them, and only when paired with evidence. 'Strong communicator' is filler. 'Led weekly cross-functional standup with engineering, design and CS' proves communication without claiming it. Move soft skills into your experience bullets whenever possible.",
    },
    {
      q: "Should I include proficiency levels (Beginner, Intermediate, Expert)?",
      a: "No. Self-assigned proficiency is noise — every candidate writes 'Expert' next to every skill. If you need to signal depth, do it through your experience bullets ('Led migration to Kubernetes across 60 microservices') instead of next to the skill name.",
    },
    {
      q: "What if I have skills that don't fit any standard category?",
      a: "Create a section called 'Domain Expertise' or 'Specialized Knowledge' and list them there. Examples: 'Clinical trial design (Phase II/III)', 'Cross-border M&A due diligence', 'Manufacturing scale-up for medical devices'. Recruiters value specific niche skills more than generic ones.",
    },
    {
      q: "How do I make sure my skills pass the ATS?",
      a: "Use exact strings from the job description, spell out acronyms once (Search Engine Optimization (SEO)), avoid icons and progress bars, and keep skills in plain text. Valhalla Resume's ATS Checker shows you which keywords from the posting are present in your resume and which are missing — most candidates lift their match score by 20+ points after a 10-minute skills section rewrite.",
    },
  ]

  const relatedItems = [
    {
      slug: "how-to-write-resume-summary",
      title: "How to Write a Resume Summary (50 Examples That Get Interviews)",
      desc: "The 4-line formula recruiters expect in 2026, plus 50 role-specific examples that actually work.",
      tag: "Resume Writing",
      readingTime: 9,
    },
    {
      slug: "action-verbs-resume",
      title: "300+ Action Verbs for Your Resume (by Industry)",
      desc: "The verbs recruiters look for in 2026, sorted by industry and seniority.",
      tag: "Resume Writing",
      readingTime: 7,
    },
    {
      slug: "cv-vs-resume-differences",
      title: "US Resume vs International Resume 2026",
      desc: "When to use each, country-by-country expectations, and the 7 differences that matter most.",
      tag: "Resume Basics",
      readingTime: 8,
    },
  ]

  return (
    <BlogArticle>
      <BlogSchemas
        locale={locale}
        slug={SLUG}
        title={TITLE}
        description={SUBTITLE}
        datePublished={DATE_PUBLISHED}
        dateModified={DATE_MODIFIED}
        faqs={faqs}
        breadcrumbBlogLabel={tBlog("browse")}
        keywords={["resume skills", "skills for resume", "hard skills", "soft skills", "skills by industry", "ATS skills"]}
      />

      <BlogHero
        locale={locale}
        tag={TAG}
        title={TITLE}
        subtitle={SUBTITLE}
        datePublished={DATE_PUBLISHED}
        readingTime={READING_TIME}
        breadcrumbBlogLabel={tBlog("browse")}
        breadcrumbHomeLabel="Home"
        readingLabel={tBlog("reading_time")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
          <article className="min-w-0">
            <BlogProse>
              <p>
                Your Skills section is the most-scanned, least-thought-about part of your resume. Recruiters glance at it for 2-3 seconds before deciding whether to keep reading; ATS systems weight it heavily for keyword match scoring. Yet most candidates throw together a generic list of buzzwords copied from a LinkedIn profile they made three years ago.
              </p>
              <p>
                This guide fixes that. Below you will find the exact framework to choose your skills (not just list them), 200+ skills organized by ten major industries with hard / soft / tool breakdowns, the placement rules that ATS systems actually reward, and the five mistakes that quietly tank your match score. Every example here is the real string a recruiter wants to see — not a generic adjective.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="hard-vs-soft">Hard vs soft skills (with examples)</h2>
              <p>
                Hard skills are teachable, measurable, and usually involve a tool, framework or methodology. Soft skills are behavioral patterns — harder to verify, easier to fake. ATS systems care almost exclusively about hard skills; recruiters care about both, but only when soft skills are backed by evidence.
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Hard skill</th>
                      <th className="px-4 py-3 text-left font-semibold">Soft skill equivalent</th>
                      <th className="px-4 py-3 text-left font-semibold">Where to place it</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Salesforce administration", "Cross-team coordination", "Skills section + experience"],
                      ["Python (pandas, scikit-learn)", "Hypothesis framing", "Skills section"],
                      ["AutoCAD", "Spatial reasoning", "Skills section"],
                      ["MEDDIC sales framework", "Discovery instinct", "Experience bullet"],
                      ["Epic EHR", "Patient empathy", "Skills section + bullet evidence"],
                      ["A/B testing platforms (Optimizely, VWO)", "Experimentation mindset", "Skills section"],
                    ].map(([h, s, w], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-medium text-[#1a2e4a]">{h}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{s}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                The rule of thumb: <strong>if a skill can be Googled and learned in under 40 hours, it is a hard skill</strong>. If it lives in how you behave or communicate, it is a soft skill. Hard skills go in the Skills section. Soft skills should appear as evidence inside your experience bullets — never as standalone words.
              </p>

              <h2 id="choose-skills">How to choose the right skills for your resume</h2>
              <p>
                Stop listing every skill you have ever touched. Use this 4-step process for each application:
              </p>

              <h3>Step 1 — Extract the job description vocabulary</h3>
              <p>
                Open the posting and copy every noun phrase that appears more than once into a scratch doc. Tools mentioned, methodologies named, frameworks listed. These are your <strong>must-have keywords</strong> — the ATS literally searches for these strings.
              </p>

              <h3>Step 2 — Score yourself honestly on each one</h3>
              <p>
                Three buckets: <em>proficient</em> (shipped real work), <em>familiar</em> (used in a project), <em>unfamiliar</em>. Only list <em>proficient</em> and the strongest <em>familiar</em>. Padding your skills with unfamiliar ones gets caught in technical interviews and is the #1 reason senior candidates get rejected after promising screens.
              </p>

              <h3>Step 3 — Map to the job&apos;s priority order</h3>
              <p>
                List skills in the order the posting prioritizes them, not alphabetically. If the job description leads with &quot;TypeScript, React, GraphQL&quot;, your skills section should too. Both ATS and human readers pattern-match the first 3-5 entries hardest.
              </p>

              <h3>Step 4 — Fill remaining slots with strategic adjacent skills</h3>
              <p>
                If you have 5 slots left after must-haves, add skills that signal seniority (system design, mentorship, code review for tech; pipeline forecasting, MEDDIC for sales). These are the differentiators between a junior and senior candidate at the same headline-skill level.
              </p>

              <h2 id="by-industry">200+ skills by industry</h2>
              <p>
                These lists are not exhaustive — they are the most-searched, most-ATS-weighted skills per industry in 2026. Use them as a starting point and tailor with the specific tools your target job mentions.
              </p>

              {industries.map((ind) => (
                <div key={ind.title} className="not-prose my-8 rounded-2xl border border-[#1a2e4a]/10 bg-gradient-to-br from-white to-[#00D4FF]/3 p-5 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1a2e4a] mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#00D4FF]" />
                    {ind.title}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1a2e4a]/60 mb-2">Hard skills</p>
                      <ul className="space-y-1.5">
                        {ind.hard.map((s) => (
                          <li key={s} className="text-sm text-[#1a2e4a]/85 flex gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00D4FF] shrink-0 mt-1" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1a2e4a]/60 mb-2">Soft / interpersonal</p>
                      <ul className="space-y-1.5">
                        {ind.soft.map((s) => (
                          <li key={s} className="text-sm text-[#1a2e4a]/85 flex gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-[#00D4FF] shrink-0 mt-1" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <h2 id="where-place">Where to place skills on your resume</h2>
              <p>
                There are three valid locations. Pick the one that matches your seniority and industry:
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Placement</th>
                      <th className="px-4 py-3 text-left font-semibold">Best for</th>
                      <th className="px-4 py-3 text-left font-semibold">Trade-off</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Top, under summary</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Career changers, tech roles, ATS-heavy applications</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Less space for narrative summary</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10 bg-[#00D4FF]/5">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Sidebar (right column)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Design, marketing, creative roles</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Some ATS parsers mis-handle multi-column</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Bottom, after experience</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Senior / executive resumes</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Skills indexed lower in ATS scoring</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                <strong>Recommended default for 2026:</strong> top placement, single column, under your professional summary. This wins both the ATS score (skills indexed in the top third of the document) and the 7-second human scan. Use sidebar layout only with templates that have been ATS-verified — the <Link href={`/${locale}/templates`}>Valhalla Resume template gallery</Link> marks each design with its ATS compatibility level.
              </p>

              <h2 id="ats-format">ATS-friendly skills formatting</h2>

              <div className="not-prose grid sm:grid-cols-2 gap-4 my-8">
                {[
                  { icon: CheckCircle2, color: "emerald", title: "Plain text only", text: "No icons next to skill names. ATS strips them and you lose visual hierarchy. Save icons for the template visual layer." },
                  { icon: CheckCircle2, color: "emerald", title: "Comma-separated or bullet", text: "Both parse correctly. Bullets are easier for humans to scan; comma-separated saves vertical space." },
                  { icon: CheckCircle2, color: "emerald", title: "Spell acronyms out once", text: "Search Engine Optimization (SEO), Application Programming Interface (API). Indexed under both forms." },
                  { icon: CheckCircle2, color: "emerald", title: "Match capitalization exactly", text: "If the posting says \"JavaScript\", do not write \"Javascript\" or \"JS\". String match matters." },
                  { icon: Target, color: "cyan", title: "Group with subheadings", text: "Languages / Frameworks / Tools / Methodologies. ATS reads subheadings; recruiters scan them." },
                  { icon: Target, color: "cyan", title: "Skip rating bars", text: "Star ratings, progress bars and percentages do not survive ATS parsing — and they look amateur to recruiters." },
                ].map(({ icon: Icon, color, title, text }, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${color === "emerald" ? "border-emerald-100 bg-emerald-50/30" : "border-[#00D4FF]/20 bg-[#00D4FF]/5"}`}>
                    <Icon className={`h-5 w-5 mb-3 ${color === "emerald" ? "text-emerald-600" : "text-[#00D4FF]"}`} />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Run the keyword match before you apply</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    See how <Link href={`/${locale}/tools/ats-checker`}>Valhalla Resume PRO&apos;s ATS score</Link> reads your resume against the job description: your match score, the exact missing keywords from the posting, and the three highest-impact skill edits. Average lift after one rewrite: +22 points.
                  </p>
                </div>
              </div>

              <h2 id="mistakes">5 mistakes that kill your skills section</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Listing every skill you have ever touched", text: "A 30-item skill list signals you cannot prioritize. Cap at 15 and curate ruthlessly. The skills you cut signal almost as much as the ones you keep." },
                  { title: "Overclaiming proficiency", text: "Listing \"Expert in Kubernetes\" when you have only deployed two services is a guaranteed credibility hit in the technical screen. Reserve highest-claimed skills for work you can defend in a deep-dive interview." },
                  { title: "Ignoring the job description", text: "Reusing the same skills section across applications cuts your ATS match score in half. Swap 2-3 skills per application — it takes 90 seconds and roughly doubles your shortlist rate." },
                  { title: "Mixing tools, methodologies and soft skills in one list", text: "\"Salesforce, MEDDIC, teamwork, Excel, communication\" is unscannable. Group by type. Recruiters and ATS both reward visible structure." },
                  { title: "Using outdated tools as headliners", text: "Listing \"Microsoft Office\" or \"email\" as a top skill in 2026 reads as filler. If a skill is assumed for the role, it does not earn a slot." },
                ].map((m, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{m.title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p>
                Your skills section is the densest, highest-value patch of keywords on your entire resume. Treat it like the strategic asset it is — curate, group, prove, and match. Get this right and your shortlist rate moves measurably, every single time.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Build a skills section that passes ATS and impresses recruiters."
                description="Valhalla Resume PRO suggests the exact skills for your target role, scores your ATS match in real time, and offers 143 templates with verified ATS compatibility. Start in under two minutes."
                buttonLabel="Start with Valhalla Resume PRO"
                hint="$15/mo or $99/yr · 7 AI tools included · Cancel anytime"
              />
            </div>

            <div className="mt-16">
              <BlogRelatedPosts
                locale={locale}
                items={relatedItems}
                title="Continue reading"
                readingLabel={tBlog("reading_time")}
              />
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <BlogTableOfContents items={toc} title="On this page" />
            </div>
          </aside>
        </div>
      </div>
    </BlogArticle>
  )
}
