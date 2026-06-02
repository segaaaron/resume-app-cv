import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, FileText, Scissors, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "resume-length-guide"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 8
const LOCALE_TARGET = "en"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_resume_length" })
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

export default async function ResumeLengthPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Resume Length: 1 or 2 Pages? Complete Guide for 2026"
  const SUBTITLE =
    "The one-page resume rule is partly myth, partly real. Here is the honest answer based on years of experience, target country and target industry — plus 8 tactics to land at the right length."
  const TAG = "Resume Basics"

  const toc = [
    { id: "quick-answer", label: "Quick answer (by experience level)" },
    { id: "one-page-myth", label: "The one-page myth — when it&apos;s true" },
    { id: "when-one", label: "When 1 page is right" },
    { id: "when-two", label: "When 2 pages is appropriate" },
    { id: "when-three", label: "When 3+ pages is acceptable" },
    { id: "by-country", label: "Length expectations by country" },
    { id: "by-industry", label: "Length expectations by industry" },
    { id: "cut-to-one", label: "8 tactics to cut to 1 page" },
    { id: "extend-to-two", label: "How to legitimately extend to 2 pages" },
    { id: "layout", label: "Layout tips per length" },
    { id: "mistakes", label: "Length mistakes to avoid" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "Is a 1.5-page resume acceptable?",
      a: "No. A resume should be either a clean 1 page or a fully used 2 pages. A 1.5-page resume — with a half-empty second page — signals you ran out of content or did not edit carefully. Either tighten down to 1 page or expand legitimately to fill 2.",
    },
    {
      q: "Does the second page need a header?",
      a: "Yes. Repeat your name and a shortened contact line (name, email, phone) at the top of page 2. Recruiters print pages separately and pages get misordered — without a header, page 2 is anonymous and easy to lose.",
    },
    {
      q: "Can I use smaller fonts to squeeze onto 1 page?",
      a: "Down to 10pt for body text and 11-12pt for section headers is acceptable. Below 10pt body text looks desperate and is hard for older recruiters to scan. If you need to go below 10pt to fit, you have a content problem, not a font problem — cut content instead.",
    },
    {
      q: "I have 15 years of experience but the job only wants 5 years — what length?",
      a: "Two pages, but compress everything older than 10 years into a single &apos;earlier career&apos; line. The recruiter cares about the most recent decade; older roles should appear only to show continuity, not as full bullet entries.",
    },
    {
      q: "Does the ATS care about resume length?",
      a: "No — the ATS parses whatever length you submit. The damage from over-length happens with the human reviewer who skims after the ATS shortlists. A 3-page resume for a marketing manager role gets skimmed less carefully than a 2-page version of the same content.",
    },
    {
      q: "What about a resume with portfolio links — does that change length?",
      a: "Portfolio links replace content, they do not add to length. Move detailed project descriptions to the portfolio and let the resume show 2-3 bullets per role plus a link. This is now the standard for designers, developers, writers and marketers in 2026.",
    },
  ]

  const relatedItems = [
    { slug: "chronological-vs-functional-resume", title: "Chronological vs Functional Resume", desc: "Which format wins in 2026, ATS compatibility per format and real candidate examples.", tag: "Resume Formats", readingTime: 10 },
    { slug: "cv-vs-resume-differences", title: "CV vs Resume: Complete Comparison", desc: "The 7 key differences and a country-by-country guide so you never send the wrong document.", tag: "Resume Basics", readingTime: 9 },
    { slug: "resume-skills-by-industry", title: "Resume Skills: 200+ Skills by Industry", desc: "200+ skills organized by industry and ATS-validated.", tag: "Resume Skills", readingTime: 11 },
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
        keywords={["resume length", "1 page resume", "2 page resume", "how long should a resume be", "resume page count"]}
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
                &quot;Keep it to one page&quot; is the most repeated piece of resume advice on the internet — and it is wrong for a substantial share of candidates. The real answer depends on three things: your experience level, your target country, and your target industry. Get those right and the page count answers itself.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="quick-answer">Quick answer (by experience level)</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Experience</th>
                      <th className="px-4 py-3 text-left font-semibold">Pages</th>
                      <th className="px-4 py-3 text-left font-semibold">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Student / recent grad", "1 page", "Limited paid experience; pad with projects, internships, coursework"],
                      ["0-3 years experience", "1 page", "Tight focus on relevant roles; cut high-school content"],
                      ["3-10 years experience", "1-2 pages", "1 page if early career, 2 once you have meaningful senior work"],
                      ["10-20 years experience", "2 pages", "Required to do justice to your career arc"],
                      ["20+ years executive", "2 pages (rarely 3)", "Compress earliest 10 years into &apos;earlier career&apos; line"],
                      ["Academic / medical CV", "5-20+ pages", "Different document — see CV vs Resume guide"],
                    ].map(([k, p, r], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{k}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80" dangerouslySetInnerHTML={{ __html: p.replace(/&apos;/g, "&#39;") }} />
                        <td className="px-4 py-3 text-[#1a2e4a]/80" dangerouslySetInnerHTML={{ __html: r.replace(/&apos;/g, "&#39;") }} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="one-page-myth">The one-page myth — when it&apos;s true and when it&apos;s not</h2>
              <p>
                The one-page rule originated in the 1980s when paper resumes were stapled and physically passed around offices. Recruiters wanted scannable single sheets. Today, resumes are digital, parsed by ATS, and reviewed on monitors — the physical justification is gone. What remains is a recruiter habit: <strong>they will skim aggressively, but they will read a second page if the first earned it</strong>.
              </p>
              <p>
                The result is asymmetric: a strong 2-page resume from a 10-year veteran outperforms a forced 1-page version of the same content. But a thin 2-page resume from a 2-year candidate underperforms a tight 1-page version. Length should follow content, not the other way around.
              </p>

              <h2 id="when-one">When 1 page is right</h2>
              <ul>
                <li>You have <strong>0-7 years of professional experience</strong> in a non-academic field.</li>
                <li>You are a <strong>student or recent graduate</strong> — even if you have many internships and projects, condense to one page.</li>
                <li>You are applying in the <strong>United States, Canada, or Latin America</strong> for an entry to mid-level corporate role.</li>
                <li>Your most relevant experience comfortably fits without compressing fonts below 10pt or shrinking margins below 0.5 inch.</li>
              </ul>

              <h2 id="when-two">When 2 pages is appropriate</h2>
              <ul>
                <li><strong>10+ years of relevant experience</strong> across multiple roles or employers.</li>
                <li><strong>Technical specialists</strong> (senior engineers, scientists, architects) whose tech stack and project list legitimately requires the space.</li>
                <li><strong>Executive and senior leadership</strong> roles where board service, P&amp;L responsibility and major achievements need detail.</li>
                <li>You are applying in the <strong>UK, Germany, France, or most of Europe</strong>, where 2 pages is the default expectation regardless of experience level.</li>
              </ul>

              <h2 id="when-three">When 3+ pages is acceptable</h2>
              <p>
                Three pages or more is reserved for academic CVs, medical CVs (for physicians, residency applications), government federal resumes (USAJOBS allows long-form), and certain consultancy &quot;practice profiles.&quot; In ordinary private-sector applications, 3 pages is a length problem — cut.
              </p>

              <h2 id="by-country">Length expectations by country</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Country</th>
                      <th className="px-4 py-3 text-left font-semibold">Standard length</th>
                      <th className="px-4 py-3 text-left font-semibold">Local notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["USA", "1-2 pages", "Prefer 1 for early career, 2 for 10+ years."],
                      ["Canada", "1-2 pages", "Same as US."],
                      ["UK", "2 pages", "1 page reads as inexperienced even for early career."],
                      ["Germany", "2-3 pages", "Lebenslauf format, photo and DOB customary."],
                      ["France", "1-2 pages", "Concision valued; 2 pages once experienced."],
                      ["Spain", "1-2 pages", "1 page common for early career; 2 with experience."],
                      ["Mexico", "1-2 pages", "Closer to US conventions; photo more common."],
                      ["Australia", "2-3 pages", "Detail expected; selection criteria addenda common in gov roles."],
                    ].map(([c, l, n], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{c}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{l}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="by-industry">Length expectations by industry</h2>
              <ul>
                <li><strong>Tech / Software:</strong> 1-2 pages. Portfolio + GitHub links offload detail.</li>
                <li><strong>Finance / Investment Banking:</strong> 1 page strict for analysts and associates; 2 pages from VP up.</li>
                <li><strong>Consulting (MBB):</strong> 1 page strict at all levels except partner.</li>
                <li><strong>Marketing / Sales:</strong> 1-2 pages; portfolio or campaign deck links allowed.</li>
                <li><strong>Engineering (mechanical, civil, EE):</strong> 2 pages standard; license and certification list justifies space.</li>
                <li><strong>Healthcare (clinical):</strong> 2-3 pages — licenses, certifications, clinical rotations require detail.</li>
                <li><strong>Academia / Research:</strong> CV format, 5-20+ pages.</li>
              </ul>

              <h2 id="cut-to-one">8 tactics to cut a resume to 1 page</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "1. Drop the &apos;References available on request&apos; line", text: "It is assumed. Removing it saves 2 lines instantly." },
                  { title: "2. Remove jobs older than 10 years", text: "Or compress them into a single &apos;Earlier experience&apos; line with employer + dates only." },
                  { title: "3. Tighten margins to 0.5-0.75 inch", text: "Below 0.5 inch is too tight and prints badly. 0.6-0.75 is the sweet spot." },
                  { title: "4. Drop bullets from 12pt to 10-11pt", text: "Headers can stay 11-12pt for hierarchy. 10pt body text is professional and standard." },
                  { title: "5. Merge skills list onto fewer lines", text: "Use bullet separators (Python · JavaScript · Go) instead of one skill per line." },
                  { title: "6. Cut bullets from 5 to 3 per role", text: "Keep the top 3 most quantified achievements per role. Drop &apos;responsible for&apos; throwaway lines." },
                  { title: "7. Eliminate the objective if you have a summary", text: "Pick one or the other — never both. Summary wins in 2026." },
                  { title: "8. Use ReadyCV one-column templates", text: "Single-column ATS templates pack tighter than two-column without sacrificing readability." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 sm:p-5">
                    <Scissors className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1" dangerouslySetInnerHTML={{ __html: title.replace(/&apos;/g, "&#39;") }} />
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="extend-to-two">How to legitimately extend to 2 pages</h2>
              <p>
                If your content needs 2 pages, fill them with substance — not padding. Add a focused projects section, a certifications block, professional memberships, language proficiency with CEFR levels, or a brief publications/talks list. <strong>Do not</strong> pad with generic soft-skill phrases (&quot;team player,&quot; &quot;hard worker&quot;) or rephrase old bullets to take up more space.
              </p>

              <h2 id="layout">Layout tips per length</h2>
              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="font-semibold text-[#1a2e4a] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00D4FF]" />
                    1-page layout
                  </p>
                  <ul className="space-y-1.5 text-sm text-[#1a2e4a]/85 list-disc pl-5">
                    <li>Single-column ATS template</li>
                    <li>0.6-0.75 inch margins</li>
                    <li>10pt body, 11-12pt headers</li>
                    <li>Skills inline (separators)</li>
                    <li>3 bullets per role max</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="font-semibold text-[#1a2e4a] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00D4FF]" />
                    2-page layout
                  </p>
                  <ul className="space-y-1.5 text-sm text-[#1a2e4a]/85 list-disc pl-5">
                    <li>Single or two-column template</li>
                    <li>0.75-1 inch margins</li>
                    <li>11pt body, 12-13pt headers</li>
                    <li>Skills section in clusters</li>
                    <li>4-6 bullets per recent role</li>
                    <li>Repeat name + contact on page 2</li>
                  </ul>
                </div>
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Validate length and ATS parsing together</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Use <Link href={`/${locale}/tools/ats-checker`}>ReadyCV&apos;s ATS Checker</Link> to confirm both length and parser cleanliness on the same draft. Start with a <Link href={`/${locale}/templates`}>length-optimized template</Link> built to land at exactly 1 or 2 pages without manual tuning.
                  </p>
                </div>
              </div>

              <h2 id="mistakes">Length mistakes to avoid</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Forcing a senior candidate onto 1 page", text: "Twelve years of impact compressed to a single page reads as &apos;nothing distinctive happened.&apos; Use the second page." },
                  { title: "Submitting a 1.5-page resume", text: "Half-empty second page signals lack of editing. Commit to 1 or 2." },
                  { title: "Padding to fill 2 pages", text: "Filler bullets get noticed and tank credibility faster than a short resume ever would." },
                  { title: "Using 8pt font to fit content", text: "If you need 8pt, you have a content problem. Cut content instead of shrinking type." },
                  { title: "Forgetting to repeat name/contact on page 2", text: "Page 2 must stand alone with at least name + email + phone in the header." },
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
                  { icon: CheckCircle2, title: "Length follows content", text: "Decide what must be in, then pick the length that fits — never the reverse." },
                  { icon: CheckCircle2, title: "Country matters", text: "US/Canada 1-2 pages, UK/Europe defaults to 2, Australia 2-3." },
                  { icon: CheckCircle2, title: "Commit to a count", text: "1 clean page or 2 full pages. Anything in between looks unfinished." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                The right resume length is not the length you read about in a blog post — it is the length your content earns. If you have 8 years of senior work and a roster of quantified outcomes, claim the second page. If you are two years into your career, edit to one. The recruiter judges what they see, not what you left out.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Hit the right length on the first draft."
                description="ReadyCV PRO templates are tuned for 1-page or 2-page layouts with automatic font/margin balancing. The AI editor trims bullets when you go over, expands when you go under — so the page count answers itself."
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
