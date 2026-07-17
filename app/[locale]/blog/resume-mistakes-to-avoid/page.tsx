import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"
import { RESUME_MISTAKES, SELF_AUDIT_CHECKLIST } from "@/lib/blog/resume-mistakes-data"

const SLUG = "resume-mistakes-to-avoid"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_resume_mistakes" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://readycvv.com/en/blog/${SLUG}`,
        es: `https://readycvv.com/es/blog/errores-comunes-cv`,
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

const impactStyle: Record<string, string> = {
  "Deal-breaker": "bg-rose-100 text-rose-700 border-rose-200",
  High: "bg-amber-100 text-amber-700 border-amber-200",
  Medium: "bg-[#00D4FF]/15 text-[#1a2e4a] border-[#00D4FF]/30",
}

export default async function ResumeMistakesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "15 Resume Mistakes That Cost You The Interview (2026)"
  const SUBTITLE =
    "Most rejected resumes are rejected for the same handful of fixable reasons. Here are the 15 highest-cost mistakes — ranked by impact — with the fix, the example, and a 12-item self-audit checklist."
  const TAG = "Resume Basics"

  const toc = [
    { id: "intro", label: "Why most resumes get rejected" },
    { id: "ranked", label: "The 15 highest-cost mistakes (ranked)" },
    { id: "ats-killers", label: "ATS-specific killers" },
    { id: "checklist", label: "Self-audit checklist (12 items)" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "What percentage of resumes get rejected at the ATS stage?",
      a: "Far lower than the figures you have seen quoted, and those figures have no study behind them. In 2025 Enhancv interviewed 25 US recruiters across more than 10 different ATS: 92% said rejections are manual or triggered only by eligibility filters such as work authorisation — never by formatting or missing keywords. Automatic rejection on resume content is the exception, not the rule. What does bury an application is volume: one role can draw thousands, and most recruiters review in the order they arrive and stop once they have strong candidates.",
    },
    {
      q: "If I fix every mistake on this list, am I guaranteed an interview?",
      a: "No — fixing mistakes only removes friction. You still need relevant experience, a good keyword match to the JD, and a clear achievement-led narrative. But removing these 15 sources of friction is the single highest-leverage step you can take.",
    },
    {
      q: "How often should I update my resume?",
      a: "At least every 6 months when employed, and tailored per application when job-searching. The biggest hidden mistake is submitting a resume you last touched 2 years ago — it shows in language, formatting and the tooling you reference.",
    },
    {
      q: "Are these mistakes the same for senior executives as for entry-level candidates?",
      a: "Mostly yes. The deal-breakers (typos, lying, bad PDF) hit equally hard at every level. The format-related mistakes (length, photo, template) become more punishing the more senior you get because the recruiter pool is more discerning.",
    },
    {
      q: "Should I trust an AI tool to fix all of these for me?",
      a: "AI can catch typos, suggest verb replacements, and rewrite bullets in achievement form. AI cannot pick the right photo convention for your country, decide which role is irrelevant, or stop you from exaggerating credentials. Use AI for the mechanical fixes and human judgment for the strategic ones.",
    },
    {
      q: "What is the single mistake that costs the most candidates the interview?",
      a: "Missing keywords from the JD. It is the only mistake that produces silent rejection — you never hear back and never know why, because the ATS filtered you out before any human saw your resume. The 10-minute keyword pass is the highest ROI edit you can make per application.",
    },
  ]

  const relatedItems = [
    { slug: "action-verbs-resume", title: "300+ Action Verbs for Your Resume", desc: "The verbs to use and the verbs to drop in 2026, organized by industry.", tag: "Resume Writing", readingTime: 9 },
    { slug: "resume-skills-by-industry", title: "Resume Skills: 200+ Skills by Industry", desc: "The skills recruiters look for in 2026, ATS-validated by industry.", tag: "Resume Skills", readingTime: 11 },
    { slug: "resume-length-guide", title: "Resume Length: 1 or 2 Pages? Complete Guide", desc: "The honest answer on resume length with country-by-country expectations.", tag: "Resume Basics", readingTime: 8 },
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
        keywords={["resume mistakes", "resume mistakes to avoid", "cv mistakes", "common resume errors", "what not to put on resume"]}
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
                Most rejected resumes are not rejected because the candidate is unqualified. They are rejected because of a handful of fixable, well-documented mistakes that compound silently — at the ATS gate, then again in the recruiter&apos;s six-second scan, then again in the hiring manager&apos;s shortlist call. By the time you get the &quot;we have moved forward with other candidates&quot; email, three different filters have already vetoed you for reasons you could have fixed in twenty minutes.
              </p>
              <p>
                This guide ranks the fifteen highest-cost resume mistakes by impact, explains <em>why</em> each one hurts in 2026 hiring, gives you the concrete fix, and ends with a 12-item self-audit checklist you can run against every draft before you submit.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="intro">Why most resumes get rejected</h2>
              <p>
                A modern application goes through three filters: <strong>ATS parsing</strong> (does the document parse cleanly and match keywords), <strong>recruiter scan</strong> (does the first impression hold), <strong>hiring manager review</strong> (does the substance match the role). Each filter has its own failure modes. The mistakes below map to all three.
              </p>

              <h2 id="ranked">The 15 highest-cost mistakes (ranked)</h2>
              <div className="not-prose space-y-4 my-8">
                {RESUME_MISTAKES.map((m) => (
                  <div key={m.rank} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 sm:p-6 hover:shadow-md hover:border-[#1a2e4a]/20 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#1a2e4a]/80 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {m.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[#1a2e4a] text-base sm:text-lg">{m.title}</h3>
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${impactStyle[m.impact]}`}>
                            {m.impact}
                          </span>
                        </div>
                        <p className="text-sm text-[#1a2e4a]/80 leading-relaxed mb-3">
                          <span className="font-semibold text-[#1a2e4a]">Why it hurts:</span> {m.why}
                        </p>
                        <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                          <span className="font-semibold text-emerald-700">How to fix:</span> {m.fix}
                        </p>
                        {m.example && (
                          <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-1">Before</p>
                              <p className="text-sm text-[#1a2e4a]/85 italic">{m.example.before}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">After</p>
                              <p className="text-sm text-[#1a2e4a]/85">{m.example.after}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="ats-killers">ATS-specific killers</h2>
              <p>
                Beyond the 15 ranked mistakes, three formatting choices do break parsing for real: what the parser cannot read never reaches the recruiter as text. Audit for these explicitly.
              </p>
              <div className="not-prose space-y-3 my-6">
                {[
                  { title: "Graphics, icons, or charts as core content", text: "Many ATS parsers ignore image content entirely. Skills shown as bar graphs or charts disappear in the parsed text. Keep visuals decorative, never load-bearing." },
                  { title: "Tables for layout (not data)", text: "Multi-column resume layouts built with tables produce scrambled text in the parser output. Use proper single or two-column CSS layouts on parser-clean templates." },
                  { title: "Critical information in headers or footers", text: "Some parsers skip the header/footer regions of a PDF entirely. Never put your phone, email, or name only in the header — duplicate the contact line in the document body." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="checklist">Self-audit checklist (12 items)</h2>
              <p>Run this checklist against every draft before submitting. Aim for 12/12 on every application.</p>
              <div className="not-prose my-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Pre-submission checklist
                </p>
                <ul className="space-y-2.5">
                  {SELF_AUDIT_CHECKLIST.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#1a2e4a]/85">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Run the audit automatically</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    The <Link href={`/${locale}/tools/ats-checker`}>ReadyCV ATS Checker</Link> automates 8 of the 12 audit items: PDF cleanliness, keyword match, verb-first structure, bullet metrics, length, and parser-safe layout. Start from an <Link href={`/${locale}/templates`}>ATS-verified template</Link> and the format-related mistakes never appear in the first place.
                  </p>
                </div>
              </div>

              <p>
                None of these fifteen mistakes are about candidate quality. They are about preventable friction — the difference between a resume that reaches the hiring manager and one that does not. Fix them once, build them into your default template, and every future application starts ahead of the candidates who never read this list.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Build a resume that avoids all 15 mistakes by design."
                description="ReadyCV PRO templates are pre-validated against every mistake in this guide: ATS-clean PDFs, structured headers, achievement-led bullet templates, country-aware photo conventions and AI keyword tailoring per application."
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
