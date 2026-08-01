import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Target, Clock, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "how-to-tailor-resume"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_tailor_resume" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://valhallaresume.com/en/blog/${SLUG}`,
        es: `https://valhallaresume.com/es/blog/adaptar-cv-oferta-trabajo`,
        "x-default": `https://valhallaresume.com/en/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://valhallaresume.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://valhallaresume.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["Valhalla Resume Team"],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://valhallaresume.com/og-image.png"],
    },
  }
}

export default async function TailorResumePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "How to Tailor Your Resume for Each Job (Step-by-Step Guide 2026)"
  const SUBTITLE =
    "Tailored resumes get roughly 40% more interview callbacks than generic ones. Here is the 6-step process to adapt your resume per job in 15-30 minutes — with a worked example showing 3 versions from a single base."
  const TAG = "Resume Strategy"

  const toc = [
    { id: "why", label: "Why tailoring matters" },
    { id: "generic-vs-tailored", label: "Generic vs tailored — side by side" },
    { id: "step1", label: "Step 1: Decode the job description" },
    { id: "step2", label: "Step 2: Map JD keywords to your resume" },
    { id: "step3", label: "Step 3: Rewrite the summary per job" },
    { id: "step4", label: "Step 4: Reorder experience bullets" },
    { id: "step5", label: "Step 5: Adjust the skills section" },
    { id: "step6", label: "Step 6: Embed company-fit signals" },
    { id: "example", label: "Example: one resume, 3 tailored versions" },
    { id: "time", label: "How long should this take?" },
    { id: "tools", label: "Tools that accelerate tailoring" },
    { id: "mistakes", label: "Tailoring mistakes to avoid" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "Do I really need to tailor my resume for every single application?",
      a: "For roles you genuinely want, yes. For high-volume applications (50+ per week as a job seeker switching industries), tailor heavily for your top 10 targets and use a strong base resume for the rest. The hit rate difference is large enough that a 20-minute tailor consistently beats sending 5 generic versions.",
    },
    {
      q: "Can I just change the summary and keep everything else identical?",
      a: "No. The summary is the most visible change but the least impactful for ATS scoring. The skills section and the top 3 bullets of your most recent role drive most of the keyword density — tailor those before anything else.",
    },
    {
      q: "Is it dishonest to rewrite the same achievement different ways for different jobs?",
      a: "Not at all. The underlying achievement is unchanged — you are highlighting the facet most relevant to each role. A bullet about &apos;optimized onboarding flow&apos; can frame the same project as user research for a UX role and as data analysis for an analytics role. Both are true.",
    },
    {
      q: "How do I tailor for a role where the JD is vague or short?",
      a: "Look at 3-5 similar JDs from other companies for the same title. Extract the common vocabulary across all of them — that is the real keyword set for the role, regardless of what one company wrote. The vague JD is an outlier, not a signal.",
    },
    {
      q: "What if the JD asks for skills I do not have?",
      a: "Include the skills you do have that are adjacent or transferable, and address the gap in the cover letter, not on the resume. The resume is positioning; the cover letter is where you handle the &quot;but you do not have X&quot; objection proactively.",
    },
    {
      q: "Can AI tailor my resume for me without losing my voice?",
      a: "Good AI tools can keyword-tailor, reorder and tighten — but you should always do the final read for tone. AI-generated bullets often default to &apos;leveraged&apos; and &apos;spearheaded&apos; on every bullet, which becomes a tell. Have the AI propose, then you edit for voice.",
    },
  ]

  const relatedItems = [
    { slug: "resume-skills-by-industry", title: "Resume Skills: 200+ Skills by Industry", desc: "The skills recruiters look for in 2026, organized by industry — the source for your tailored skills section.", tag: "Resume Skills", readingTime: 11 },
    { slug: "action-verbs-resume", title: "300+ Action Verbs for Your Resume", desc: "The verbs to swap in when rewriting bullets per job — organized by category.", tag: "Resume Writing", readingTime: 9 },
    { slug: "resume-mistakes-to-avoid", title: "15 Resume Mistakes That Cost You The Interview", desc: "The 15 highest-cost mistakes, with fixes for each — &apos;generic resume&apos; ranks #2.", tag: "Resume Basics", readingTime: 9 },
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
        keywords={["tailor resume", "customize resume", "tailor cv to job", "resume tailoring", "personalize resume"]}
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
                Sending the same resume to every role is a bet that the recruiter will do the translating for you. They will not. A single role can draw 2,000+ applications in days, and most recruiters review them in the order they arrive and stop once they have strong candidates — so when yours is opened, it has seconds to show it fits this posting, not resumes in general.
              </p>
              <p>
                This guide walks the six-step tailoring process used by professional resume writers, condensed to a routine you can run in 15-30 minutes per job. By the end you will have a base resume plus a repeatable workflow for adapting it per role — without rewriting from scratch.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="why">Why tailoring matters</h2>
              <p>
                Industry data from major ATS vendors (Workday, Greenhouse, Lever) consistently shows that resumes with keyword match above 70% receive recruiter outreach at roughly 2.5x the rate of those below 50%. The math is not subtle. Tailoring is the single highest-ROI activity in the job search — higher than picking the right template, higher than the cover letter, higher than networking outreach in most cases.
              </p>

              <h2 id="generic-vs-tailored">Generic vs tailored — side by side</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Dimension</th>
                      <th className="px-4 py-3 text-left font-semibold">Generic resume</th>
                      <th className="px-4 py-3 text-left font-semibold">Tailored resume</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Words the posting used", "Whatever your resume happened to say", "The posting's own terms, where they are true"],
                      ["Summary", "Same paragraph for every job", "Rewritten per role focus"],
                      ["Skills section", "Same list every time", "Top 8-10 prioritized to match JD"],
                      ["Top bullets", "Static order", "Reordered to lead with relevant achievements"],
                      ["Recruiter time to relevance", "8-12 seconds (often misses)", "3-5 seconds (clear fit)"],
                      ["Interview rate (industry avg)", "~3-5% of applications", "~10-15% of applications"],
                      ["Time per application", "2 minutes (send and forget)", "15-30 minutes (real engagement)"],
                    ].map(([k, g, t], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{k}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{g}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="step1">Step 1: Decode the job description</h2>
              <p>
                Open the JD and create a 4-column note: <strong>hard requirements</strong> (must-have skills, years, certifications), <strong>nice-to-haves</strong> (preferred but not required), <strong>soft skills</strong> (communication, leadership, ownership), and <strong>company values / culture signals</strong>. Most JDs telegraph these in distinct sections — &quot;Requirements,&quot; &quot;Bonus,&quot; &quot;What you bring,&quot; &quot;About us.&quot;
              </p>
              <p>
                Spend 5 minutes on this step. It defines everything that follows.
              </p>

              <h2 id="step2">Step 2: Map JD keywords to your resume</h2>
              <p>
                Pull the top 10-15 most repeated nouns and verbs from the JD — these are your keyword targets. Compare against your current resume:
              </p>
              <ul>
                <li><strong>Already present.</strong> Confirm they appear at least once verbatim. Bold them only if the JD itself bolds them in the description.</li>
                <li><strong>Missing but applicable.</strong> Add to your skills section first, then weave into at least one bullet.</li>
                <li><strong>Missing and not applicable.</strong> Leave out — never fabricate.</li>
              </ul>
              <p>
                There is no target percentage, and anyone quoting one made it up. Use the posting&apos;s words where they describe work you actually did, and stop there. A recruiter spots a stuffed resume instantly, and a list of keywords with no achievement behind them fails the only test that matters — the human reading it.
              </p>

              <h2 id="step3">Step 3: Rewrite the summary per job</h2>
              <p>
                The professional summary is your highest-visibility tailoring opportunity. Update three things every time:
              </p>
              <ol>
                <li><strong>The role label.</strong> &quot;Senior Product Designer&quot; vs &quot;Lead UX Designer&quot; — match the exact title language of the role.</li>
                <li><strong>The top 2 differentiators.</strong> Pick the achievements most relevant to <em>this</em> role, not your career highlight reel.</li>
                <li><strong>The vocabulary.</strong> Use the JD&apos;s specific terms: if they say &quot;design systems,&quot; not &quot;component libraries,&quot; mirror them.</li>
              </ol>

              <h2 id="step4">Step 4: Reorder experience bullets</h2>
              <p>
                Within each role, the order of bullets matters more than recruiters admit. The first bullet of your most recent role is the second-highest-attention area on the page (after the summary). Put your <strong>most JD-relevant achievement first</strong> in every role, even if it is chronologically out of order within the role.
              </p>
              <p>
                You do not need to rewrite the bullets — just reorder them. Save full rewrites for the top 3 bullets where reordering alone is not enough.
              </p>

              <h2 id="step5">Step 5: Adjust the skills section</h2>
              <p>
                Your skills section is the single highest-impact ATS-scoring zone on the entire resume. ATS parsers weigh this section heavily because it is structurally easy to extract. Two rules:
              </p>
              <ul>
                <li><strong>Top 8-10 skills prioritized to the JD.</strong> If the JD opens with &quot;Python, SQL, Tableau&quot; — those are your first three, even if you would normally lead with something else.</li>
                <li><strong>Match the wording exactly.</strong> If the JD says &quot;JavaScript (ES6+),&quot; do not write &quot;JS&quot; or &quot;ES6.&quot; Verbatim match.</li>
              </ul>

              <h2 id="step6">Step 6: Embed company-fit signals</h2>
              <p>
                The last 10% of tailoring is the cultural layer — the signals that say &quot;I read the &lsquo;About us&rsquo; section.&quot; Drop one or two specific references into your summary or your strongest bullet:
              </p>
              <ul>
                <li><strong>Mission alignment.</strong> If they emphasize accessibility, your relevant accessibility work belongs in the top half.</li>
                <li><strong>Industry context.</strong> If you have worked in their vertical (fintech, healthcare, edtech), name it explicitly.</li>
                <li><strong>Scale signals.</strong> Match the company stage — startups want builder vocabulary, enterprises want governance vocabulary.</li>
              </ul>

              <h2 id="example">Example: one resume, 3 tailored versions</h2>
              <p>
                Same candidate — a product designer with 6 years of experience — three different applications, three different tailored summaries. Notice how the achievements are the same but the framing shifts.
              </p>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Target role</th>
                      <th className="px-4 py-3 text-left font-semibold">Summary opener</th>
                      <th className="px-4 py-3 text-left font-semibold">Top 3 skills</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Senior UX Designer at fintech startup", "Product designer with 6 years building consumer-facing fintech products, led 3 zero-to-one launches and a 38% lift in activation.", "User research · Figma · Design systems"],
                      ["Lead Product Designer at healthcare scale-up", "Product designer with 6 years scaling regulated-industry interfaces, led HIPAA-compliant design system used by 4 product teams.", "Design systems · Accessibility (WCAG 2.2) · Cross-functional leadership"],
                      ["UX Researcher at enterprise SaaS", "Product designer with 6 years embedding research into product decisions, ran 80+ moderated studies driving roadmap reprioritization.", "User research · Qualitative analysis · Stakeholder communication"],
                    ].map(([t, s, k], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{t}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80 italic">{s}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{k}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="time">How long should this take?</h2>
              <div className="not-prose my-6 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Clock, title: "15 minutes (minimum)", text: "Summary rewrite + skills reorder + JD keyword pass on the top 3 bullets of your most recent role." },
                  { icon: Clock, title: "20-25 minutes (recommended)", text: "Full keyword mapping + bullet reorder across the top 2 roles + 1 cultural reference." },
                  { icon: Clock, title: "30 minutes (high-stakes role)", text: "Above plus 2-3 bullet rewrites, ATS Checker validation, and a polish read for voice." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <Icon className="h-5 w-5 mb-3 text-[#00D4FF]" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <h2 id="tools">Tools that accelerate tailoring</h2>
              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Cut tailoring time in half with the right tools</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    See how <Link href={`/${locale}/tools/ats-checker`}>Valhalla Resume PRO&apos;s ATS score</Link> surfaces missing keywords and density gaps against the job. Valhalla Resume PRO&apos;s <strong>tailor-cv</strong> feature reads the JD, suggests skill reordering and bullet rewrites, and produces a tailored version on top of any of the <Link href={`/${locale}/templates`}>143 ATS-verified templates</Link> — all in under three minutes per job.
                  </p>
                </div>
              </div>

              <h2 id="mistakes">Tailoring mistakes to avoid</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Overfitting to a single JD", text: "Some candidates rewrite so heavily that the resume only works for one role. Keep a solid base — tailor on top, do not replace." },
                  { title: "Keyword stuffing", text: "Repeating the same keyword 6 times to game the ATS triggers both human suspicion and modern ATS deduplication. Use each keyword 1-3 times in natural placement." },
                  { title: "Losing your voice", text: "Mirroring JD vocabulary is good; sounding like the JD wrote your resume is bad. Keep your achievement framing, your verbs, your tone." },
                  { title: "Skipping the cover letter", text: "Tailoring the resume is necessary but not sufficient. The cover letter handles the gaps and the &apos;why this company.&apos; Tailor both or you waste the lift." },
                  { title: "Forgetting to save versions", text: "After 20 applications, you will lose track of what went where. Save each tailored version as &quot;FirstnameLastname_CompanyName_Resume.pdf&quot; for interview prep." },
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
                  { icon: Target, title: "Decode before you edit", text: "The first 5 minutes on the JD set up the next 25." },
                  { icon: CheckCircle2, title: "Skills section is highest leverage", text: "Reorder your skills first — it is the ATS&apos;s favorite section." },
                  { icon: Clock, title: "Time-box per role", text: "20-30 minutes per high-stakes application. Cap it." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                  </div>
                ))}
              </div>

              <p>
                Tailoring is the highest-ROI hour you will spend in your job search. Twenty minutes per application, six steps, repeated as a habit — and the recruiter callbacks compound. Pick five roles you actually want, run the process for each, and you will out-perform candidates who sent five hundred generic resumes the same week.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Tailor your resume in 3 minutes, not 30."
                description="Valhalla Resume PRO&apos;s tailor-cv feature reads the job description, reorders your skills and bullets, runs the ATS check and produces a tailored resume on any of 143 ATS-verified templates — all in under three minutes per application."
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
