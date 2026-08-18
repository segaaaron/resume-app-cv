import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Globe2, FileText, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "cv-vs-resume-differences"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_cv_vs_resume" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        en: `https://www.valhallaresume.com/en/blog/${SLUG}`,
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

export default async function CVvsResumePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "US Resume vs International Resume: Which to Send in 2026 (By Country)"
  const SUBTITLE =
    "A short US resume and a long-form international resume are not interchangeable. Using the wrong one for the wrong country is the silent reason countless qualified candidates never hear back. Here is the exact difference, when to use each, and what to send country by country."
  const TAG = "Resume Basics"

  const toc = [
    { id: "quick-answer", label: "Quick answer (the 30-second version)" },
    { id: "what-is-resume", label: "What is a resume?" },
    { id: "what-is-cv", label: "What is a long-form / academic resume?" },
    { id: "key-differences", label: "7 key differences (side by side)" },
    { id: "when-resume", label: "When to use a resume" },
    { id: "when-cv", label: "When to use a long-form resume" },
    { id: "by-country", label: "Country-by-country: which to send" },
    { id: "sections", label: "Typical sections of each format" },
    { id: "common-mistakes", label: "Common confusion points" },
    { id: "faq", label: "Frequently asked questions" },
  ]

  const faqs = [
    {
      q: "If I am applying from outside the US to a US job, do I send a short resume or a long-form one?",
      a: "A short 1-2 page resume. Adapt to the country of the employer, not your country of origin. The rule works the other way too: a US candidate applying to an academic position in Europe should send a long-form academic resume.",
    },
    {
      q: "Can I just rename my long-form resume file and send the same document to a US role?",
      a: "No. The file name is the smallest difference between the two — length, content depth, and structure are completely different. Sending a 4-page European long-form resume to a US recruiter renamed as 'resume.pdf' is one of the fastest ways to get auto-rejected.",
    },
    {
      q: "What about LinkedIn — does it replace a resume?",
      a: "Neither the short nor the long-form kind. LinkedIn is a complementary profile, not a substitute. Recruiters expect a tailored resume attachment in addition to your LinkedIn URL. Treat LinkedIn as your perpetual public profile and your resume as the targeted document for a specific role.",
    },
    {
      q: "Is a long-form resume always longer than a US resume?",
      a: "Generally yes. A standard US resume is 1-2 pages; an academic long-form resume can be 5, 10, or 20+ pages because it lists every publication, conference, grant and teaching role. But a UK application resume (used for any job) is typically 2 pages — closer in length to a US resume than to an academic one.",
    },
    {
      q: "Should I send both the short and long-form versions to be safe?",
      a: "No — it signals you do not know the conventions of the role's market. Pick the right document for the country and audience. If you are uncertain, the application portal itself usually tells you: a field labeled 'Upload resume' in the UK expects a 2-page document; the same field in the US expects a tight 1-2 page one.",
    },
    {
      q: "Does the ATS treat long-form and short resumes differently?",
      a: "The ATS treats them identically — both as plain documents to be parsed for keywords. The difference is in the human reviewer who reads after the ATS shortlists. A US recruiter expecting a 1-page resume will deprioritize a 4-page long-form one, even if the ATS scored both equally. Format to the audience after the ATS gate.",
    },
  ]

  const relatedItems = [
    {
      slug: "how-to-write-resume-summary",
      title: "How to Write a Resume Summary (50 Examples)",
      desc: "The 4-line formula that gets you the interview, plus 50 role-specific examples that actually work.",
      tag: "Resume Writing",
      readingTime: 9,
    },
    {
      slug: "resume-skills-by-industry",
      title: "Resume Skills: 200+ Skills by Industry",
      desc: "The exact skills recruiters look for in 2026, organized by industry and ATS-validated.",
      tag: "Resume Skills",
      readingTime: 11,
    },
    {
      slug: "resume-length-guide",
      title: "Resume Length: 1 or 2 Pages? Complete Guide",
      desc: "When to go one page, when two is required, and what to cut to land at the right length.",
      tag: "Resume Basics",
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
        keywords={["us resume vs international resume", "resume format by country", "resume length by country", "short vs long-form resume", "international resume format"]}
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
                The word &quot;resume&quot; means very different things depending on where you apply. In the US it is a tight 1-2 page pitch tailored to one job; in the UK, Europe and academia it is a long-form document — sometimes 20+ pages — that records your entire career. Same person, same role, two genuinely different documents with different lengths, audiences and conventions. Get them confused and you are sending a 4-page academic dossier to a US recruiter who expected a 1-page summary, or worse, mailing a 1-page American resume to a European academic committee that expected your full bibliography.
              </p>
              <p>
                This guide covers the real differences (not just the surface label), the seven things that actually change between the two formats, when to use each, and a country-by-country breakdown so you never have to guess which document to send.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="On this page" />
              </div>

              <h2 id="quick-answer">Quick answer (the 30-second version)</h2>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold"></th>
                      <th className="px-4 py-3 text-left font-semibold">US resume (short)</th>
                      <th className="px-4 py-3 text-left font-semibold">International / academic resume (long-form)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Length", "1-2 pages", "2-20+ pages (academic)"],
                      ["Primary audience", "Corporate / private-sector recruiters", "Academic, research, medical, international"],
                      ["Used in", "USA, Canada", "UK, Ireland, Europe, academia globally"],
                      ["Purpose", "Concise summary, tailored per role", "Comprehensive career record"],
                      ["Updated", "Per application", "Periodically, kept exhaustive"],
                      ["Photo", "Never", "Common in continental Europe; never in UK/US"],
                      ["Tailoring", "Heavily tailored per role", "Less tailored, more cumulative"],
                    ].map(([k, r, c], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{k}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{r}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="what-is-resume">What is a resume?</h2>
              <p>
                A resume is a short, tailored document — typically <strong>one page for early-career candidates and two pages for senior roles</strong> — designed for a specific job application. It summarizes only the experience, skills and accomplishments most relevant to the role at hand. The French verb &quot;résumer&quot; means &quot;to summarize,&quot; and that is exactly what the document does.
              </p>
              <p>
                Resumes dominate in the United States and Canada, and have become the de facto global standard for any corporate, tech, or private-sector role. They are aggressively tailored per application: keywords swapped, bullets reordered, skills section adjusted to match the posting.
              </p>

              <h2 id="what-is-cv">What is a long-form (international / academic) resume?</h2>
              <p>
                A long-form resume — the format used in academia and much of the world outside the US — is a comprehensive record of your full academic and professional career. In an academic version, that means every publication, every grant, every conference, every teaching role, every committee. There is no length cap because completeness is the point.
              </p>
              <p>
                Confusingly, in the UK, Ireland, Australia, and most of Europe, this long-form document is simply the everyday application document — closer to a 2-page US resume than to a 20-page academic one. Same word, different length. This is the single biggest source of confusion in international job applications.
              </p>

              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Academic Resume
                  </p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    5-20+ pages. Comprehensive list of publications, grants, conferences, teaching, service. Used for tenure-track jobs, postdocs, research positions, medical residencies.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#1a2e4a]/70 mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#1a2e4a]" />
                    European/UK Resume
                  </p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    2 pages. Functionally equivalent to a US resume — tailored per job application, structured around experience and skills. The word &quot;Resume&quot; is used generically for any application document.
                  </p>
                </div>
              </div>

              <h2 id="key-differences">7 key differences (side by side)</h2>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Dimension</th>
                      <th className="px-4 py-3 text-left font-semibold">Resume (US)</th>
                      <th className="px-4 py-3 text-left font-semibold">Resume (academic / international)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["1. Length", "1-2 pages, strictly", "2-20+ pages, comprehensive"],
                      ["2. Audience", "Corporate hiring managers, ATS", "Academic committees, search committees"],
                      ["3. Structure", "Targeted summary → experience → skills → education", "Education → publications → research → teaching → service"],
                      ["4. Detail per role", "3-5 quantified bullets per role", "Full project descriptions, methodologies, outcomes"],
                      ["5. Tailoring", "Heavy: every application gets a custom version", "Light: same document, updated periodically"],
                      ["6. Personal info", "Name, phone, email, city, LinkedIn", "Same + sometimes nationality, languages, certifications in detail"],
                      ["7. Photo", "Never (US, UK, Canada, Australia)", "Common in Germany, France, parts of Latin America; never in US/UK"],
                    ].map(([dim, r, c], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{dim}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{r}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="when-resume">When to use a resume</h2>
              <ul>
                <li><strong>Applying to a job in the United States or Canada</strong> in private-sector, tech, finance, marketing, sales, healthcare administration, design, or operations.</li>
                <li><strong>Most multinational companies headquartered in the US</strong>, even if the role is based elsewhere (Google EU, Microsoft LATAM, etc.).</li>
                <li><strong>Startup applications globally</strong> — the resume format is now the global standard in tech regardless of country.</li>
                <li><strong>Roles where you need to position for one specific job</strong> and need the freedom to omit anything not relevant.</li>
              </ul>

              <h2 id="when-cv">When to use a long-form / international resume</h2>
              <ul>
                <li><strong>Any job application in the UK, Ireland, or most of continental Europe</strong> — here the resume is simply the &quot;application document,&quot; usually 2 pages.</li>
                <li><strong>Academic positions globally</strong>: tenure-track faculty, postdocs, lectureships, research scientist roles.</li>
                <li><strong>Medical residencies, fellowships, and physician applications</strong> — these expect a full academic-style long-form resume with publications, presentations, certifications.</li>
                <li><strong>Federal government and international organization roles</strong> (UN, World Bank, EU institutions) — they often require comprehensive long-form resumes and sometimes their own structured forms.</li>
                <li><strong>Grant applications and research funding</strong>: NIH biosketch, ERC academic profile, NSF biosketches are all long-form academic documents.</li>
              </ul>

              <h2 id="by-country">Country-by-country: which to send</h2>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Country</th>
                      <th className="px-4 py-3 text-left font-semibold">What to send</th>
                      <th className="px-4 py-3 text-left font-semibold">Local notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["USA", "Resume (1-2 pages)", "No photo. No personal data. Tailored per role."],
                      ["Canada", "Resume (1-2 pages)", "Same as US. Bilingual EN/FR for Quebec roles."],
                      ["United Kingdom", "Resume (2 pages)", "No photo. The everyday 2-page application document."],
                      ["Ireland", "Resume (2 pages)", "Same UK conventions. No photo, no DOB."],
                      ["Germany", "Lebenslauf (local term)", "Photo expected (passport-style). DOB common. 2-3 pages."],
                      ["France", "Resume (1-2 pages)", "Photo optional, increasingly omitted. Concise."],
                      ["Spain", "Resume (1-2 pages)", "Photo common. DOB common. Less tailored than US resume."],
                      ["Mexico", "Resume (1-2 pages)", "Photo common. Personal data often expected."],
                      ["Argentina / Chile / Colombia", "Resume (1-2 pages)", "Photo and personal data conventional."],
                      ["Australia / New Zealand", "Resume (2 pages)", "No photo. Standard professional format."],
                      ["Japan", "Rirekisho (rigid form) + resume", "Standardized form with photo + Western-style resume."],
                      ["UAE / Saudi Arabia", "Resume (2-3 pages)", "Photo common, personal data expected. Bilingual EN/AR for local roles."],
                    ].map(([country, doc, notes], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{country}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{doc}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="sections">Typical sections of each format</h2>

              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="font-semibold text-[#1a2e4a] mb-3 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#00D4FF]" />
                    Resume (US format)
                  </p>
                  <ol className="space-y-1.5 text-sm text-[#1a2e4a]/85 list-decimal pl-5">
                    <li>Contact header</li>
                    <li>Professional summary (3-5 lines)</li>
                    <li>Skills (categorized)</li>
                    <li>Work experience (reverse chronological)</li>
                    <li>Education</li>
                    <li>Certifications (optional)</li>
                    <li>Projects / volunteer (optional)</li>
                    <li>Languages (optional)</li>
                  </ol>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="font-semibold text-[#1a2e4a] mb-3 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#00D4FF]" />
                    Academic Resume
                  </p>
                  <ol className="space-y-1.5 text-sm text-[#1a2e4a]/85 list-decimal pl-5">
                    <li>Contact header</li>
                    <li>Education (with thesis titles, advisors)</li>
                    <li>Academic appointments</li>
                    <li>Publications (peer-reviewed, then other)</li>
                    <li>Grants & fellowships</li>
                    <li>Invited talks & conference presentations</li>
                    <li>Teaching experience</li>
                    <li>Service (committees, peer review, editing)</li>
                    <li>Awards & honors</li>
                    <li>Professional memberships</li>
                  </ol>
                </div>
              </div>

              <h2 id="common-mistakes">Common confusion points</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { icon: XCircle, title: "Sending a 4-page long-form resume to a US recruiter", text: "The single fastest way to get auto-rejected for a US private-sector role. Length signals lack of awareness of the market." },
                  { icon: XCircle, title: "Sending a 1-page resume for an academic position", text: "Equally damaging the other way. A 1-page resume signals you have nothing to put on a long-form academic one — devastating in an academic search." },
                  { icon: XCircle, title: "Putting a photo on a US resume", text: "Some ATS systems reject files with embedded images. US recruiters trained against bias actively discard photos. Eliminate." },
                  { icon: XCircle, title: "Listing every job you have ever had on a US resume", text: "If a role is more than 10-15 years old or not relevant, cut it. Resumes are about positioning, not history." },
                  { icon: XCircle, title: "Confusing a UK 'resume' request for an academic long-form one", text: "When a UK job listing says 'send your resume,' they want a 2-page document. Not a 10-page academic dossier." },
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

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Not sure which to send? Default to resume + ATS Checker</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    For any private-sector role outside of academia, the safe default in 2026 is a 1-2 page resume tailored to the posting. Then see how <Link href={`/${locale}/tools/ats-checker`}>Valhalla Resume PRO&apos;s ATS score</Link> reads it to confirm your keyword match. Browse <Link href={`/${locale}/templates`}>ATS-verified templates</Link> to start from a format that works.
                  </p>
                </div>
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Adapt to the country", text: "Country of the employer, not your country of origin." },
                  { icon: CheckCircle2, title: "Match the field's convention", text: "Academia = Resume. Industry = resume. Even cross-border." },
                  { icon: CheckCircle2, title: "Keep both versions ready", text: "If you apply across markets, maintain a short US resume and a long-form one in parallel." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                The short-vs-long-form resume distinction is not pedantic — it is one of the highest-impact, lowest-effort optimizations you can make to your job search. Spend the five minutes to verify what the target market expects, send the right format, and you immediately move ahead of the substantial number of candidates who never checked.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Frequently asked questions" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="data" />

              <BlogCTA
                locale={locale}
                title="Build the right document for the right market — short or long-form resume."
                description="Valhalla Resume PRO includes 132 ATS-verified templates covering both short US and long-form international resume formats, with AI suggestions tailored to your target country. Start in under two minutes."
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
