import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, ListOrdered, Sparkles, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "chronological-vs-functional-resume"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 10
const LOCALE_TARGET = "en"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_chronological_functional" })
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

export default async function ChronoVsFunctionalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Chronological vs Functional Resume: Which Format to Use (2026)"
  const SUBTITLE =
    "Chronological wins for most candidates in 2026 — but not all. Here is the honest breakdown of the three resume formats, when functional or combination beats the default, and which one actually clears the ATS."
  const TAG = "Resume Formats"

  const toc = [
    { id: "tldr", label: "TL;DR: which format to use" },
    { id: "overview", label: "The three resume formats" },
    { id: "chronological", label: "Chronological resume" },
    { id: "functional", label: "Functional resume" },
    { id: "combination", label: "Combination (hybrid) resume" },
    { id: "comparison", label: "Side-by-side comparison" },
    { id: "ats", label: "Which one passes the ATS?" },
    { id: "examples", label: "Real candidate examples" },
    { id: "mistakes", label: "Common mistakes per format" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "Is the functional resume really dead in 2026?",
      a: "Not dead — but high-risk. Most US recruiters openly distrust functional resumes because they hide employment dates. The functional format still works for genuine career-change situations or for candidates returning after a long gap, but you must accept the trade-off: shorter shortlists and more questions in the interview.",
    },
    {
      q: "Will the ATS reject a functional resume automatically?",
      a: "The ATS does not reject based on format — it parses whatever text it finds. The damage happens after parsing: many ATS dashboards display roles by date, and a functional resume without clear dated employment fields will display oddly or with gaps, prompting the human reviewer to skip it.",
    },
    {
      q: "I have one 6-month employment gap — chronological or functional?",
      a: "Chronological. A single 6-month gap is normal in 2026 and explainable in one sentence in the cover letter or interview. Switching to functional to hide a 6-month gap is overkill and signals you have more to hide than you actually do.",
    },
    {
      q: "I am switching careers — should I use functional?",
      a: "Use a combination resume, not pure functional. Lead with a strong professional summary and a skills section that emphasizes transferable competencies for the new role, then list your work experience chronologically so the recruiter still sees the timeline. You get the framing benefits of functional without the trust penalty.",
    },
    {
      q: "What format is best for executives with 25+ years of experience?",
      a: "Combination, leaning chronological. Lead with an executive summary and a 'core competencies' bar (5-8 areas), then chronological experience with only the most recent 15-20 years detailed. Roles older than that get one-line entries under 'earlier career.'",
    },
    {
      q: "Do recruiters actually have a format preference, or is it a myth?",
      a: "It is documented preference, not myth. Surveys of US recruiters in 2024-2025 consistently show 80-90% prefer chronological, citing trust and ease of scanning as reasons. Use functional only with a clear, defensible reason — and own that reason proactively in the summary.",
    },
  ]

  const relatedItems = [
    { slug: "resume-length-guide", title: "Resume Length: 1 or 2 Pages? Complete Guide", desc: "When 1 page wins, when 2 is required, and what to cut without losing impact.", tag: "Resume Basics", readingTime: 7 },
    { slug: "resume-skills-by-industry", title: "Resume Skills: 200+ Skills by Industry", desc: "The skills recruiters look for in 2026, organized by industry and ATS-validated.", tag: "Resume Skills", readingTime: 11 },
    { slug: "how-to-write-resume-summary", title: "How to Write a Resume Summary (50 Examples)", desc: "The 4-line formula recruiters expect, plus 50 role-specific examples that work.", tag: "Resume Writing", readingTime: 9 },
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
        keywords={["chronological resume", "functional resume", "combination resume", "resume format", "hybrid resume"]}
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
                The resume format you pick is a structural decision — not a stylistic one. It determines which information appears first, which the recruiter sees in a six-second scan, and whether your candidacy passes the trust filter in the human reviewer&apos;s head. Pick the wrong format and even great content gets buried.
              </p>
              <p>
                Three formats dominate every resume guide: <strong>chronological</strong>, <strong>functional</strong>, and <strong>combination</strong> (also called hybrid). This guide walks through what each actually is, when each is the right call, and why the conventional wisdom (&quot;functional is great for career changers!&quot;) is partly true and partly outdated.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="tldr">TL;DR: which format to use</h2>
              <div className="not-prose my-6 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: CheckCircle2, title: "Chronological", text: "Default choice. Use it if you have any consistent work history, even with gaps under 12 months.", color: "emerald" },
                  { icon: Sparkles, title: "Combination", text: "Use it for career changes, executive roles, or skill-heavy positions where competencies matter more than tenure.", color: "cyan" },
                  { icon: AlertTriangle, title: "Functional", text: "Last resort. Justified only for major gaps, returning to work after 3+ years, or radical career pivots.", color: "amber" },
                ].map(({ icon: Icon, title, text, color }, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${color === "emerald" ? "border-emerald-100 bg-emerald-50/40" : color === "cyan" ? "border-[#00D4FF]/20 bg-[#00D4FF]/5" : "border-amber-200 bg-amber-50/40"}`}>
                    <Icon className={`h-5 w-5 mb-3 ${color === "emerald" ? "text-emerald-600" : color === "cyan" ? "text-[#00D4FF]" : "text-amber-600"}`} />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <h2 id="overview">The three resume formats</h2>
              <p>
                The format defines the <em>ordering</em> and <em>weighting</em> of sections — not the content itself. The same career history can be presented in any of the three formats; what changes is which information the recruiter sees first.
              </p>

              <h2 id="chronological">What is a chronological resume?</h2>
              <p>
                A chronological resume — technically &quot;reverse chronological&quot; — lists your work experience from most recent to oldest, with dates explicit for every role. The work experience section is the centerpiece, occupying roughly 60-70% of the document. Skills appear in a supporting role; education sits at the bottom (except for recent graduates).
              </p>
              <p>
                <strong>Best for:</strong> Candidates with a continuous, relevant employment history. The format builds trust through transparency — every gap, every role, every date is visible. Recruiters trained on thousands of resumes are conditioned to scan chronological layouts in seconds.
              </p>

              <h2 id="functional">What is a functional resume?</h2>
              <p>
                A functional resume reorganizes around <strong>skill categories</strong> rather than employment timeline. Instead of &quot;Senior Analyst, Acme Corp (2021-2024)&quot; you see &quot;Data Analysis,&quot; &quot;Project Leadership,&quot; &quot;Stakeholder Communication&quot; — each with bullet points pulling achievements from anywhere in your career. Employment history is reduced to a short list at the bottom (sometimes just employer + dates, no role detail).
              </p>
              <p>
                <strong>Best for:</strong> Candidates with significant employment gaps, returning to work after years out, or making a radical career change where role titles in the past would actively confuse the audience. The trade-off is real: many recruiters interpret a functional format as deliberate concealment.
              </p>

              <h2 id="combination">What is a combination (hybrid) resume?</h2>
              <p>
                The combination resume puts a <strong>strong skills/competencies section near the top</strong> (often paired with a professional summary), then follows with chronological work experience. You get the framing power of functional — telling the recruiter what to focus on first — without hiding the timeline.
              </p>
              <p>
                <strong>Best for:</strong> Career changers, executives, technical specialists, consultants with diverse client work, and anyone whose skill set is the strongest selling point. This is the format most modern recruiters describe as their preferred layout when asked directly.
              </p>

              <h2 id="comparison">Side-by-side comparison</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Dimension</th>
                      <th className="px-4 py-3 text-left font-semibold">Chronological</th>
                      <th className="px-4 py-3 text-left font-semibold">Functional</th>
                      <th className="px-4 py-3 text-left font-semibold">Combination</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Length", "1-2 pages", "1-2 pages", "1-2 pages"],
                      ["Focus", "Work history & dates", "Skills & competencies", "Skills + work history"],
                      ["First section", "Summary → Experience", "Summary → Skill groups", "Summary → Skills → Experience"],
                      ["Best for", "Consistent careers", "Major gaps, returns", "Career changers, executives"],
                      ["ATS compatibility", "Excellent", "Risky — date parsing fails", "Excellent"],
                      ["Recruiter trust", "High", "Low (perceived as hiding)", "High"],
                      ["Popularity 2026", "~80%", "~5%", "~15%"],
                    ].map(([k, c, f, h], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{k}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{c}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{f}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="ats">Which one passes the ATS?</h2>
              <p>
                Chronological and combination resumes pass ATS systems reliably because both surface clearly dated employment fields — the exact data points modern ATS parsers (Workday, Greenhouse, Lever, iCIMS, Taleo) expect to extract. Functional resumes fail more often because the parser cannot map &quot;Data Analysis&quot; as a skill cluster to specific job tenure, leaving date fields empty in the recruiter dashboard.
              </p>
              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Run a format check before submitting</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Validate your draft against the role description with <Link href={`/${locale}/tools/ats-checker`}>ReadyCV&apos;s ATS Checker</Link>. It catches missing date fields, structural parsing issues, and keyword gaps — the three reasons functional resumes commonly fall out of the pipeline. Start from a parser-clean <Link href={`/${locale}/templates`}>ATS-verified template</Link> to skip the rework.
                  </p>
                </div>
              </div>

              <h2 id="examples">Real candidate examples</h2>
              <div className="not-prose space-y-4 my-8">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Chronological — software engineer (8 years experience)</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Maria built backend services at three companies (2017 → present) with no gaps. Chronological is the only format that makes sense: each role shows tech stack progression, increasing scope, and the natural arc from mid-level to staff engineer. Recruiters spot the trajectory in seconds.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2">Combination — marketing manager pivoting to product</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    James spent 7 years in marketing but is targeting product manager roles. He leads with a summary positioning him for PM, a competencies section emphasizing user research, roadmapping, and analytics, then chronological roles where each bullet reframes marketing work in PM language (&quot;owned product launch positioning,&quot; &quot;defined success metrics with engineering&quot;).
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">Functional — parent returning after 4 years out</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Lisa left her HR role in 2021 for childcare and is returning to entry-mid HR work in 2026. She leads with a strong summary owning the gap directly, organizes skills into &quot;Recruitment Operations,&quot; &quot;Employee Relations,&quot; &quot;HRIS Administration&quot; with concrete achievements under each, then lists employment compactly at the bottom. The gap is acknowledged, not hidden.
                  </p>
                </div>
              </div>

              <h2 id="mistakes">Common mistakes per format</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Chronological: burying recent achievements in old role bullets", text: "Recent roles should have 5-6 bullets; roles older than 10 years should be compressed to 1-2 lines or grouped under &apos;earlier career.&apos;" },
                  { title: "Functional: no employment list at all", text: "Even a pure functional resume must include employer names and date ranges at the bottom. Omitting them entirely is the fastest auto-reject signal." },
                  { title: "Combination: skills section that duplicates experience bullets", text: "The skills section should be categories and competencies, not the same bullets restated. Use it for framing; keep specific achievements in the experience section." },
                  { title: "Any format: undated certifications, projects, or education", text: "ATS parsers expect dates on every entry. Missing dates create empty fields in the recruiter dashboard regardless of format." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Default to chronological", text: "Trust, ATS performance, recruiter habit — three reasons to pick it unless you have a real exception." },
                  { icon: ListOrdered, title: "Use combination for pivots", text: "Career change, executive level, or skill-led roles — combination frames without hiding." },
                  { icon: Sparkles, title: "Own gaps directly", text: "A one-line acknowledgement in the summary beats any format trick that recruiters see through." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                The format question is downstream of a more important question: <em>what story does my career tell, and which structure makes it impossible to miss?</em> For 80% of candidates, that answer is chronological. For the rest — career changers, executives, returners — combination wins. Pure functional is a niche tool. Use it only when the alternative is worse.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Pick the right format and let ReadyCV PRO handle the rest."
                description="111+ ATS-verified templates covering chronological, combination and hybrid layouts. AI rewrites your bullets, summary and skills section to match any format you pick — in under two minutes."
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
