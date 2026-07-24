import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Sparkles, AlertTriangle, Wand2 } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"
import {
  ACTION_VERB_CATEGORIES,
  OVERUSED_VERBS,
  BEFORE_AFTER_EXAMPLES,
  TOTAL_VERB_COUNT,
} from "@/lib/blog/action-verbs-data"

const SLUG = "action-verbs-resume"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_action_verbs" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://readycvv.com/en/blog/${SLUG}`,
        es: `https://readycvv.com/es/blog/verbos-de-accion-cv`,
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

export default async function ActionVerbsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = `${TOTAL_VERB_COUNT}+ Action Verbs for Your Resume (By Industry, 2026)`
  const SUBTITLE =
    "Recruiters spend six seconds on the first scan. Action verbs are how you survive those six seconds. Here are 300+ verbs organized by category, the framework to pick the right one, and 5 before/after rewrites."
  const TAG = "Resume Writing"

  const toc = [
    { id: "why", label: "Why action verbs matter" },
    { id: "science", label: "The science behind the 6-second scan" },
    { id: "framework", label: "How to choose the right verb (4 steps)" },
    ...ACTION_VERB_CATEGORIES.map((c) => ({ id: c.id, label: c.title })),
    { id: "by-level", label: "Action verbs by experience level" },
    { id: "overused", label: "Overused verbs and stronger replacements" },
    { id: "rewrites", label: "Before/after rewrites" },
    { id: "ats", label: "ATS-friendly verb usage" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "How many different action verbs should I use in a single resume?",
      a: "Across a 1-2 page resume you should use 15-25 distinct action verbs — roughly one per bullet, with no verb repeated more than twice. Repetition is the silent signal of an unedited resume.",
    },
    {
      q: "Should I always use past tense?",
      a: "Use past tense for all completed roles, and present tense only for your current role&apos;s ongoing responsibilities. Mixing tenses within the same role is the most common consistency mistake.",
    },
    {
      q: "Are some action verbs flagged as 'AI-written'?",
      a: "Yes — overused AI defaults like 'leveraged,' 'spearheaded,' and 'streamlined' appear so often in AI-generated resumes that some recruiters are starting to flag them. Mix in less expected verbs like 'piloted,' 'galvanized,' 'instituted,' or 'reframed' to break the pattern.",
    },
    {
      q: "Do ATS systems care which action verbs I use?",
      a: "Not directly. The ATS does not score by verb intensity. But strong action verbs make the surrounding bullet keyword-dense and quantified — which the ATS does reward. Verbs are leverage, not the lever itself.",
    },
    {
      q: "Should I use industry-specific verbs even if I have no experience in that industry?",
      a: "Use them sparingly and only if the action is genuine. If you architected systems, say 'architected.' But do not invent technical-sounding verbs for non-technical work — recruiters spot it in the interview.",
    },
    {
      q: "Is it ever appropriate to use 'managed' or 'responsible for'?",
      a: "Almost never on a competitive resume. Both have stronger replacements that signal the same idea with more force — directed, oversaw, owned, led. Reserve 'managed' for the rare cases where its specific nuance of operational stewardship matters.",
    },
  ]

  const relatedItems = [
    { slug: "how-to-write-resume-summary", title: "How to Write a Resume Summary (50 Examples)", desc: "The 4-line formula recruiters expect, plus 50 role-specific examples.", tag: "Resume Writing", readingTime: 9 },
    { slug: "resume-skills-by-industry", title: "Resume Skills: 200+ Skills by Industry", desc: "The skills recruiters look for in 2026, organized by industry and ATS-validated.", tag: "Resume Skills", readingTime: 11 },
    { slug: "resume-mistakes-to-avoid", title: "15 Resume Mistakes That Cost You The Interview", desc: "The 15 highest-cost resume mistakes ranked by impact, with fixes for each.", tag: "Resume Basics", readingTime: 9 },
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
        keywords={["action verbs resume", "resume verbs", "strong action verbs", "resume power words", "action words for resume"]}
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
                Two resumes can describe the exact same job, with the exact same achievements, and produce completely different reactions from the recruiter. The variable is almost never the content — it is the verbs at the front of each bullet. A bullet that opens with &quot;Spearheaded&quot; lands harder than one that opens with &quot;Was responsible for,&quot; even when the next 12 words are identical.
              </p>
              <p>
                This guide gives you {TOTAL_VERB_COUNT}+ resume action verbs organized into {ACTION_VERB_CATEGORIES.length} categories, plus a 4-step framework for choosing the right one per bullet, the verbs to drop in 2026, and five before/after rewrites that show the rule in action.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="why">Why action verbs matter</h2>
              <p>
                Recruiters scan, they do not read. The eye lands first on the left edge of each bullet — which means your verb is the single highest-leverage word on your entire resume. A strong verb signals ownership, scope and outcome before the recruiter processes any of the metric or context that follows.
              </p>

              <h2 id="science">The science behind the 6-second scan</h2>
              <p>
                Eye-tracking studies of recruiter behavior consistently put first-pass reading time between 6 and 11 seconds per resume. In that window, the recruiter scans <strong>names, titles, dates, employers — and the first word of each bullet</strong>. Everything else is processed only if the first pass earns the second.
              </p>

              <h2 id="framework">How to choose the right verb (4 steps)</h2>
              <ol>
                <li><strong>Identify the action.</strong> What did you actually do — design, deliver, analyze, lead, sell, build? Choose the category first.</li>
                <li><strong>Match the verb to the scope.</strong> &quot;Led a 2-person team&quot; uses different verbs than &quot;Led a 40-person org.&quot; Verb intensity should track real scope.</li>
                <li><strong>Avoid the AI defaults.</strong> &quot;Leveraged,&quot; &quot;spearheaded,&quot; and &quot;streamlined&quot; are saturated. Pick the second-best option in the category.</li>
                <li><strong>Pair with a number.</strong> A strong verb without a metric reads as bluster. &quot;Drove revenue&quot; means nothing; &quot;Drove revenue +38% YoY&quot; means everything.</li>
              </ol>

              {ACTION_VERB_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <h2 id={cat.id}>{cat.title} ({cat.verbs.length} verbs)</h2>
                  <p>{cat.description}</p>
                  <div className="not-prose my-6 rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <div className="flex flex-wrap gap-2">
                      {cat.verbs.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-br from-[#00D4FF]/10 to-[#1a2e4a]/5 text-[#1a2e4a] text-xs font-medium border border-[#00D4FF]/15 hover:border-[#00D4FF]/40 hover:shadow-sm transition-all"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <h2 id="by-level">Action verbs by experience level</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Level</th>
                      <th className="px-4 py-3 text-left font-semibold">Verb intensity</th>
                      <th className="px-4 py-3 text-left font-semibold">Good fits</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Entry / junior", "Action-oriented, no overclaim", "Built, Designed, Analyzed, Contributed, Supported, Delivered"],
                      ["Mid-level", "Scope-bearing, outcome-oriented", "Led, Owned, Drove, Optimized, Architected, Launched"],
                      ["Senior / IC", "Strategic + technical depth", "Spearheaded, Architected, Pioneered, Instituted, Reframed"],
                      ["Manager / Director", "Organizational scale", "Directed, Orchestrated, Galvanized, Transformed, Mobilized"],
                      ["Executive", "Vision + outcome at scale", "Steered, Championed, Catalyzed, Restructured, Established"],
                    ].map(([lvl, intensity, fits], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{lvl}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{intensity}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{fits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="overused">Overused verbs and stronger replacements</h2>
              <p>
                These verbs appear on virtually every resume in 2026 — including AI-generated ones. Drop them and pick from the replacement list. The recruiter sees fewer of these per day, which means your bullet stands out by absence as much as by content.
              </p>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Drop this</th>
                      <th className="px-4 py-3 text-left font-semibold">Use one of these instead</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {OVERUSED_VERBS.map(({ weak, strong }, i) => (
                      <tr key={weak} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-rose-600 line-through">{weak}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{strong.join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="rewrites">Before/after rewrites</h2>
              <div className="not-prose space-y-4 my-8">
                {BEFORE_AFTER_EXAMPLES.map(({ before, after, verb }, i) => (
                  <div key={i} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-3 flex items-center gap-2">
                      <Wand2 className="h-3.5 w-3.5" />
                      Rewrite using &quot;{verb}&quot;
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-1">Before</p>
                        <p className="text-sm text-[#1a2e4a]/85 italic">{before}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">After</p>
                        <p className="text-sm text-[#1a2e4a]/85">{after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="ats">ATS-friendly verb usage</h2>
              <ul>
                <li><strong>Lead every bullet with a verb.</strong> Never with a noun, date, or prepositional phrase. ATS parsers expect the verb-first structure.</li>
                <li><strong>Vary the verbs.</strong> Repetition signals an unedited document — and some ATS dashboards flag duplicate verb counts as a quality metric.</li>
                <li><strong>Match verb to keyword density.</strong> If the JD says &quot;built,&quot; &quot;developed,&quot; &quot;launched&quot; — use the same verbs verbatim in at least one bullet to anchor keyword matching.</li>
                <li><strong>Avoid passive constructions.</strong> &quot;Was tasked with&quot; or &quot;Was given the responsibility of&quot; both fail the ATS&apos;s verb-first heuristic and read as evasive.</li>
              </ul>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Pair strong verbs with ATS validation</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    See how <Link href={`/${locale}/tools/ats-checker`}>ReadyCV PRO&apos;s ATS score</Link> reads your rewritten bullets against the actual JD: it shows which of the posting's requirements your resume does not mention yet — so you can decide what to add before you apply, instead of guessing. Start from a <Link href={`/${locale}/templates`}>parser-clean template</Link> so the verbs are not undone by layout problems.
                  </p>
                </div>
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Verb-first, always", text: "Every bullet starts with a verb. No exceptions." },
                  { icon: Sparkles, title: "Pair with a number", text: "Strong verbs without metrics read as bluster. Always pair." },
                  { icon: XCircle, title: "Drop the defaults", text: "&apos;Managed,&apos; &apos;responsible for,&apos; &apos;worked on&apos; — gone in 2026." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className={`h-5 w-5 mb-3 ${i === 2 ? "text-rose-600" : "text-emerald-600"}`} />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                  </div>
                ))}
              </div>

              <p>
                Action verbs are the smallest unit of resume optimization that produces the largest gain. Five minutes per bullet, the right verb, the right metric — and the recruiter&apos;s six-second scan becomes a sixteen-second read. That is the difference between the rejection email and the screening call.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Let AI pick the right verb for every bullet."
                description="ReadyCV PRO&apos;s AI bullet editor rewrites your experience with verb-first structure, scope-matched intensity and embedded metrics — in seconds, across 128 ATS-verified templates."
                buttonLabel="Start with ReadyCV PRO"
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
