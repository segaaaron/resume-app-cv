import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Target, Lightbulb, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "how-to-write-resume-summary"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 9
const LOCALE_TARGET = "en"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_resume_summary" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://readycvv.com/en/blog/${SLUG}`,
        "x-default": `https://readycvv.com/en/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://readycvv.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://readycvv.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["ReadyCVV Team"],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

export default async function ResumeSummaryPostPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // English-only post — redirect ES users to blog index (no Spanish equivalent yet).
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "How to Write a Resume Summary (50 Examples That Get Interviews)"
  const SUBTITLE =
    "Recruiters spend roughly seven seconds on your resume before deciding. Your summary is the line that buys you the next thirty. Here is the exact framework — plus 50 examples by role — to write one that lands interviews."
  const TAG = "Resume Writing"

  const toc = [
    { id: "what-is-summary", label: "What is a resume summary (and what it isn't)" },
    { id: "summary-vs-objective", label: "Summary vs objective vs profile: which to use" },
    { id: "formula", label: "The 4-line formula that works in 2026" },
    { id: "step-by-step", label: "Step-by-step: writing yours in 15 minutes" },
    { id: "examples", label: "50 resume summary examples by role" },
    { id: "mistakes", label: "7 mistakes that get your summary skipped" },
    { id: "ats-summary", label: "How to make your summary ATS-friendly" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "How long should a resume summary be?",
      a: "Three to five lines, or roughly 40-60 words. Anything shorter feels generic; anything longer becomes a wall recruiters skip. If you cannot describe yourself in 60 words, you have not finished thinking about your positioning.",
    },
    {
      q: "Should I write my summary in first person or third person?",
      a: "Neither. Use implicit subject: 'Senior data engineer with 8 years building real-time pipelines.' Never write 'I am' or 'He is'. First person sounds amateur; third person sounds like LinkedIn fluff written by someone else.",
    },
    {
      q: "Do I need a summary if I have a cover letter?",
      a: "Yes. Roughly half of recruiters do not open cover letters at all, and ATS systems parse the resume body first. The summary is your only guaranteed first-impression real estate inside the document itself.",
    },
    {
      q: "What goes first: my years of experience or my job title?",
      a: "Job title or seniority level first, then years, then specialization. Example: 'Senior Product Manager with 6 years scaling B2B SaaS from $1M to $20M ARR.' Recruiters scan for the role match before the tenure.",
    },
    {
      q: "Can I reuse the same summary for every job application?",
      a: "Technically yes, strategically no. Swap one or two keywords from each job description into your summary. It takes 60 seconds and roughly doubles your ATS match score. ReadyCVV's ATS Checker shows you exactly which keywords are missing.",
    },
    {
      q: "Should I include soft skills in my summary?",
      a: "Only if they are backed by results. 'Strong communicator' is noise. 'Led cross-functional team of 12 across three time zones to ship Q3 release on schedule' is the same skill, proven. Replace adjectives with evidence.",
    },
  ]

  const relatedItems = [
    {
      slug: "action-verbs-resume",
      title: "300+ Action Verbs for Your Resume (by Industry)",
      desc: "The verbs that recruiters look for in 2026, sorted by industry and seniority level.",
      tag: "Resume Writing",
      readingTime: 7,
    },
    {
      slug: "resume-mistakes-to-avoid",
      title: "15 Resume Mistakes That Cost You The Interview",
      desc: "The errors recruiters silently reject — and how to fix each in under five minutes.",
      tag: "Resume Tips",
      readingTime: 8,
    },
    {
      slug: "como-pasar-el-ats",
      title: "How to Pass ATS Screening in 2026 (Proven Tactics)",
      desc: "What an ATS actually filters is narrower than you've been told. The format and keyword decisions that genuinely matter.",
      tag: "ATS",
      readingTime: 7,
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
        keywords={[
          "resume summary",
          "resume summary examples",
          "professional summary resume",
          "how to write resume summary",
          "resume profile",
        ]}
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
                Most candidates treat the resume summary like an afterthought — three lines of recycled buzzwords pasted under their name. That is precisely why most resumes get skipped. A great summary is not a soft introduction; it is the single most valuable piece of real estate on your resume, because it is the first (and sometimes only) section a recruiter reads carefully.
              </p>
              <p>
                In this guide you will get the exact 4-line formula we have refined over thousands of resumes, 50 role-specific examples you can adapt, the seven mistakes that quietly tank otherwise-strong resumes, and the ATS rules that turn a good summary into one that actually gets parsed correctly. By the time you finish, you will be able to write yours in 15 minutes.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="what-is-summary">What is a resume summary (and what it isn&apos;t)</h2>
              <p>
                A resume summary is a 3-5 line block, placed directly under your contact information, that positions you for the specific role you are applying to. It answers three questions a recruiter is asking simultaneously while scanning:
              </p>
              <ul>
                <li><strong>Who are you, professionally?</strong> (Job title, seniority, specialization)</li>
                <li><strong>What is your strongest, most-relevant evidence?</strong> (Quantified outcomes)</li>
                <li><strong>Why are you applying here?</strong> (Implicit match between your value and the role)</li>
              </ul>
              <p>
                What a summary is <em>not</em>: an objective (&quot;Seeking a challenging role where I can grow…&quot;), a list of soft skills (&quot;Hard-working, motivated, team player…&quot;), or a paragraph of biographical filler. Those formats died around 2015. If yours still reads that way, you are signaling that your job search advice is a decade out of date — before the recruiter has even read your experience.
              </p>

              <h2 id="summary-vs-objective">Summary vs objective vs profile: which to use</h2>
              <p>
                The terminology is a mess. Here is the clean version that aligns with how recruiters and ATS tools categorize the section in 2026:
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Format</th>
                      <th className="px-4 py-3 text-left font-semibold">Use when</th>
                      <th className="px-4 py-3 text-left font-semibold">Status in 2026</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Summary</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">You have 2+ years of experience in your field</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">Default standard</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10 bg-[#00D4FF]/3">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Profile</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">UK / European market preference</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">Equivalent to summary</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Objective</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Career change or fresh graduate only</td>
                      <td className="px-4 py-3 text-amber-700 font-medium">Use sparingly</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Headline</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Single-line tagline above summary</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">Optional, high-impact</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Default to <strong>Summary</strong> unless you have a specific reason not to. Recruiters in tech, finance, healthcare, and operations expect it. The label itself matters less than the content, but using &quot;Summary&quot; signals you are aligned with current conventions.
              </p>

              <h2 id="formula">The 4-line formula that works in 2026</h2>
              <p>
                Every great summary we have analyzed follows the same skeleton. Memorize this and you will never stare at a blank cursor again:
              </p>

              <blockquote>
                <strong>Line 1:</strong> [Seniority] [Job title] with [X years] [doing thing] in [industry/domain].<br />
                <strong>Line 2:</strong> Proven track record of [quantified outcome #1] and [quantified outcome #2].<br />
                <strong>Line 3:</strong> Deep expertise in [hard skill 1], [hard skill 2], [hard skill 3] — and the [soft trait] needed to [business outcome].<br />
                <strong>Line 4 (optional):</strong> Currently seeking [type of role] where [unique value you bring] can [strategic contribution].
              </blockquote>

              <p>Filled in, that looks like:</p>

              <blockquote>
                <strong>Senior Backend Engineer</strong> with 7 years building distributed systems at high-traffic SaaS companies. Proven track record of cutting p99 latency by 62% across two production services and shipping a real-time pricing engine that lifted revenue by $4.2M ARR. Deep expertise in Go, Kafka, PostgreSQL — paired with the cross-team ownership required to migrate legacy services without downtime. Seeking a staff role where infrastructure-first thinking can scale a Series B SaaS through its next inflection.
              </blockquote>

              <p>
                Why this works: line 1 passes the recruiter scan and the ATS keyword match. Line 2 supplies hard proof. Line 3 anchors your technical stack (more keywords) plus one credible soft trait. Line 4 — optional — telegraphs you actually read the job posting.
              </p>

              <h2 id="step-by-step">Step-by-step: writing yours in 15 minutes</h2>

              <h3>Step 1 — Mine the job description (3 min)</h3>
              <p>
                Open the posting. Copy every noun and adjective that appears more than once into a scratch doc. Those are your ATS keywords. If &quot;cross-functional&quot; appears three times, the hiring manager wrote it three times for a reason — they want it back in your summary.
              </p>

              <h3>Step 2 — List your top 3 quantified wins (5 min)</h3>
              <p>
                Not your job duties — your <em>outcomes</em>. Use this prompt: &quot;The thing I did that saved/made/improved [number] [unit] in [timeframe].&quot; Examples: &quot;Reduced churn 18% in 6 months,&quot; &quot;Closed $1.4M new ARR in Q3,&quot; &quot;Led migration of 240k users with zero data loss.&quot;
              </p>

              <h3>Step 3 — Draft against the formula (5 min)</h3>
              <p>
                Fill in the 4-line skeleton above using the keywords from Step 1 and the wins from Step 2. Do not edit yet — drafts always feel ugly. Get the structure on the page first.
              </p>

              <h3>Step 4 — Cut, then sharpen (2 min)</h3>
              <p>
                Read it aloud. If a sentence has the words &quot;passionate,&quot; &quot;driven,&quot; &quot;detail-oriented,&quot; or &quot;dynamic,&quot; delete them. They add zero information. Replace with the evidence that earned you those traits in the first place. Then see how <Link href={`/${locale}/tools/ats-checker`}>ReadyCV PRO&apos;s ATS score</Link> reads your draft to confirm the keyword match.
              </p>

              <h2 id="examples">50 resume summary examples by role</h2>
              <p>
                These are condensed to 2-3 lines each for readability — your final summary should match the 4-line formula. Each one passes the test: specific role, quantified result, named hard skill.
              </p>

              <h3>Software & Engineering</h3>
              <ul>
                <li><strong>Frontend Engineer:</strong> React engineer with 5 years building accessible component libraries used across 8 product teams. Shipped a design-system migration that cut feature dev time by 30%.</li>
                <li><strong>Backend Engineer:</strong> Go and Python backend engineer focused on payment infrastructure. Built a tokenization service processing 4M transactions/day at 99.99% uptime.</li>
                <li><strong>Full-stack Engineer:</strong> Full-stack engineer (Node/Next.js/Postgres) with a track record of shipping greenfield products solo from spec to scaled launch.</li>
                <li><strong>DevOps Engineer:</strong> Kubernetes-native DevOps engineer who reduced cloud spend by $480K/year by rearchitecting CI/CD across 60 microservices.</li>
                <li><strong>Mobile Engineer (iOS):</strong> Swift engineer with 6 App Store releases and one app featured by Apple. Specialized in offline-first architecture.</li>
                <li><strong>Mobile Engineer (Android):</strong> Senior Kotlin developer who led the rebuild of a 2M-user app, improving cold-start time by 41%.</li>
                <li><strong>Engineering Manager:</strong> EM of 12 across two squads, doubled team output without adding headcount by restructuring on-call and PR review cadence.</li>
                <li><strong>QA Engineer:</strong> Test automation lead who built a Playwright suite covering 87% of critical user flows, eliminating 6 hours/week of manual regression.</li>
              </ul>

              <h3>Data & AI</h3>
              <ul>
                <li><strong>Data Scientist:</strong> Data scientist focused on churn modeling. Shipped an XGBoost classifier that lifted retention campaign ROI by 3.4x.</li>
                <li><strong>Data Engineer:</strong> Built and own a Snowflake + dbt warehouse serving 90+ daily dashboards across product, finance and growth.</li>
                <li><strong>ML Engineer:</strong> Production ML engineer specializing in recommendation systems. Deployed a two-tower model that lifted CTR by 22%.</li>
                <li><strong>Analytics Engineer:</strong> Analytics engineer who owns the source-of-truth metrics layer for a Series B fintech, refactoring 400+ legacy queries into dbt models.</li>
                <li><strong>BI Analyst:</strong> Looker-certified BI analyst supporting 50+ stakeholders. Cut average dashboard load time from 14s to 2s.</li>
              </ul>

              <h3>Product, Design & UX</h3>
              <ul>
                <li><strong>Product Manager:</strong> Senior PM who scaled a B2B SaaS from $2M to $18M ARR in 24 months by leading a focused replatforming and pricing redesign.</li>
                <li><strong>Technical Product Manager:</strong> Engineer-turned-PM owning developer-facing APIs. Drove a 38% increase in monthly API calls through better docs and quotas.</li>
                <li><strong>Product Designer:</strong> Product designer with end-to-end ownership of three flagship features that increased weekly active users by 27%.</li>
                <li><strong>UX Researcher:</strong> Mixed-methods UX researcher who reshaped the onboarding flow of a fintech app, lifting activation by 19 points.</li>
                <li><strong>Design Manager:</strong> Design manager of 8 ICs. Built the team&apos;s first design ops practice — file audits, component governance, async critique.</li>
              </ul>

              <h3>Marketing, Sales & Growth</h3>
              <ul>
                <li><strong>Performance Marketer:</strong> Paid acquisition lead who reduced CPA by 41% across Meta and Google while doubling monthly signups.</li>
                <li><strong>Content Marketer:</strong> SEO content lead behind a blog that grew from 2K to 180K monthly organic visits in 18 months.</li>
                <li><strong>Growth Marketer:</strong> Growth marketer specializing in PLG funnels — owned a self-serve activation flow that lifted paid conversion by 2.3x.</li>
                <li><strong>Brand Marketer:</strong> Brand lead who repositioned a B2B platform from &quot;tool&quot; to &quot;infrastructure,&quot; lifting brand search by 4x.</li>
                <li><strong>Account Executive:</strong> Mid-market AE who closed $2.1M in net-new ARR last fiscal year, finishing at 142% of quota.</li>
                <li><strong>Sales Development Rep:</strong> SDR who booked 312 qualified meetings in 12 months — top performer of an 18-rep team.</li>
                <li><strong>Customer Success Manager:</strong> CSM owning a $4M ARR book with 118% net revenue retention.</li>
                <li><strong>Sales Engineer:</strong> Sales engineer supporting enterprise deals averaging $180K ACV. Custom POCs converted at 67%.</li>
              </ul>

              <h3>Finance, Operations & HR</h3>
              <ul>
                <li><strong>Financial Analyst:</strong> FP&amp;A analyst who built a driver-based model adopted as the company&apos;s official planning standard across 5 business units.</li>
                <li><strong>Accountant:</strong> Senior accountant who led the rollout of NetSuite for a 200-person company, closing books 7 days faster month-over-month.</li>
                <li><strong>Controller:</strong> Controller of a Series C SaaS overseeing GAAP-compliant reporting and an audit-clean Big 4 review two years running.</li>
                <li><strong>Operations Manager:</strong> Ops manager who redesigned the support escalation playbook, cutting average resolution time from 38h to 9h.</li>
                <li><strong>Supply Chain Analyst:</strong> Demand-planning analyst who reduced stockouts by 26% while trimming on-hand inventory by $1.8M.</li>
                <li><strong>HR Business Partner:</strong> HRBP supporting a 220-person engineering org. Led performance review redesign with an 87% adoption rate.</li>
                <li><strong>Recruiter:</strong> Technical recruiter who closed 47 engineering hires in 12 months with a 31% offer-acceptance lift.</li>
              </ul>

              <h3>Healthcare, Education & Legal</h3>
              <ul>
                <li><strong>Registered Nurse:</strong> ICU nurse with 9 years across two Level-1 trauma centers. Charge nurse certification and BLS/ACLS/PALS credentials.</li>
                <li><strong>Nurse Practitioner:</strong> Family NP managing a panel of 1,400 patients with HEDIS quality scores in the 92nd percentile.</li>
                <li><strong>Physician Assistant:</strong> Orthopedic PA with 5 years assisting in 600+ surgical cases per year.</li>
                <li><strong>K-12 Teacher:</strong> 4th-grade teacher whose class outperformed district reading benchmarks by 18 points two years running.</li>
                <li><strong>University Lecturer:</strong> Adjunct lecturer in computational statistics with 4.8/5 average student evaluation across 11 semesters.</li>
                <li><strong>Paralegal:</strong> Litigation paralegal supporting 3 partners on civil cases averaging $4M+ in dispute value.</li>
                <li><strong>Attorney:</strong> Corporate attorney with 6 years closing M&amp;A transactions ranging from $20M to $400M.</li>
              </ul>

              <h3>Career Transitions & Entry-Level</h3>
              <ul>
                <li><strong>Bootcamp Graduate:</strong> Career-switcher (former mechanical engineer) with 9 months building production React apps at a fintech bootcamp capstone team.</li>
                <li><strong>Recent Graduate:</strong> Computer Science graduate (3.8 GPA) with two paid internships in backend engineering and a published open-source CLI tool.</li>
                <li><strong>Returning to workforce:</strong> Senior project manager returning after a 4-year caregiving break. Recent PMP recertification and 6-month freelance pilot with two SaaS clients.</li>
                <li><strong>Military transition:</strong> Former Army logistics officer (Captain) translating 8 years of large-team operations leadership into supply-chain management.</li>
                <li><strong>Industry switch (Finance → Tech):</strong> Investment-banking analyst pivoting into product management after completing 4 PM-focused internships and shipping a personal SaaS to 200 paying users.</li>
              </ul>

              <h3>Executive / Senior Leadership</h3>
              <ul>
                <li><strong>VP of Engineering:</strong> VPE of a 65-person org. Grew the team from 22, established the first staff-engineer ladder, and shipped two greenfield products in 18 months.</li>
                <li><strong>Director of Marketing:</strong> Marketing director who built the function from scratch at a Series A startup — first hire to a team of 11, attribution stack to $9M ARR.</li>
                <li><strong>CTO (early stage):</strong> Founding CTO of a YC W23 company. Built the platform solo to 1,200 paying customers and led the first 4 engineering hires.</li>
                <li><strong>COO:</strong> COO of a 180-person remote SaaS overseeing People, Finance and CS. Led the operational scale-up from Series A to Series C.</li>
                <li><strong>CFO (small-mid market):</strong> Fractional CFO across 4 SaaS clients ranging from $3M to $20M ARR. Closed two acquisition rounds and one venture debt raise.</li>
              </ul>

              <h2 id="mistakes">7 mistakes that get your summary skipped</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { icon: XCircle, title: "Buzzword salad", text: "\"Results-driven, dynamic, passionate team player.\" Every candidate writes this. None of it is verifiable. Replace every adjective with a number." },
                  { icon: XCircle, title: "Listing job duties", text: "\"Responsible for managing team and ensuring quality.\" That is a job description, not a summary. Recruiters want outcomes, not responsibilities." },
                  { icon: XCircle, title: "Generic enough to fit anywhere", text: "If your summary works equally well for a frontend role and a marketing role, it works for neither. Tailor it to the specific job family." },
                  { icon: XCircle, title: "First-person pronouns", text: "\"I am a hard-working professional...\" Drop the I. Summaries use implicit subject. Cleaner, more confident, more standard." },
                  { icon: XCircle, title: "More than 5 lines", text: "Recruiters scan, they do not read. Anything past line 5 in your summary will be skipped on roughly 80% of resumes." },
                  { icon: XCircle, title: "No quantified results", text: "If there is not a single number in your summary, you are competing on adjectives — and adjectives lose every time to evidence." },
                  { icon: XCircle, title: "Wrong keywords for the role", text: "Reusing the same summary for every role tanks ATS match. Swap 2-3 keywords from each posting before applying." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <Icon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="ats-summary">How to make your summary ATS-friendly</h2>
              <p>
                A recruiter opening your resume reads the summary first and decides in seconds whether to keep going. It is the densest, highest-value patch of your entire resume — get this section right and your ATS score jumps measurably. The rules:
              </p>

              <div className="not-prose grid sm:grid-cols-2 gap-4 my-8">
                {[
                  { icon: CheckCircle2, color: "emerald", title: "Use exact title from the posting", text: "If they say \"Senior Software Engineer,\" do not write \"Sr SWE.\" Match the literal string." },
                  { icon: CheckCircle2, color: "emerald", title: "Include 3-5 hard skills verbatim", text: "Pull the tech stack, tools or methodologies named most often in the job description." },
                  { icon: CheckCircle2, color: "emerald", title: "Spell out acronyms once", text: "Write \"Search Engine Optimization (SEO)\" the first time, so both versions are indexed." },
                  { icon: CheckCircle2, color: "emerald", title: "Plain text only", text: "No icons, no tables, no graphics in your summary. ATS parsers strip them and you lose context." },
                  { icon: Target, color: "cyan", title: "Lead with the role match", text: "First seven words of your summary should answer: \"Is this person the right kind of candidate?\"" },
                  { icon: Lightbulb, color: "cyan", title: "Mirror the posting's tone", text: "Casual posting → casual summary. Formal posting → formal summary. Both ATS and humans pattern-match." },
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
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Pro tip — Test before you send</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    See how <Link href={`/${locale}/tools/ats-checker`}>ReadyCVV PRO&apos;s ATS score</Link> reads your summary against the job description: it tells you which keywords from the posting are missing, your match score and the three highest-impact edits. Most candidates lift their score 20+ points with a 5-minute summary rewrite.
                  </p>
                </div>
              </div>

              <p>
                The summary is not the place to be modest, vague, or elegant. It is the place to be specific, quantified, and aligned with the role. Get the four lines right and the rest of your resume gets read with a much friendlier eye.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="data" />

              <BlogCTA
                locale={locale}
                title="Build a resume with a summary that gets you the interview."
                description="ReadyCV PRO gives you 111+ ATS-optimized templates, AI-generated summary suggestions tailored to your target role, and the ATS Checker that scores every keyword. Start in under two minutes."
                buttonLabel="Start with ReadyCV PRO"
                hint="$15/mo or $144/yr · 7 AI tools included · Cancel anytime"
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

          {/* Sticky TOC sidebar (desktop) */}
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
