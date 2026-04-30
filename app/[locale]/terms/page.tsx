import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.terms" })
  return { title: t("title") }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("terms_page")

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero header */}
        <div className="border-b bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              {locale === "en" ? "Legal" : "Legal"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("last_updated")} · MS Saravia Tech Stack LLC</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex gap-12 items-start">

          {/* Sticky sidebar TOC — desktop only */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-8 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {locale === "en" ? "Contents" : "Contenido"}
              </p>
              {(locale === "en" ? [
                [1, "Acceptance"],
                [2, "Service"],
                [3, "Accounts"],
                [4, "Payments"],
                [5, "AI Disclaimer"],
                [6, "Employment"],
                [7, "IP"],
                [8, "Privacy"],
                [9, "Acceptable Use"],
                [10, "Availability"],
                [11, "Liability"],
                [12, "Indemnification"],
                [13, "Third Parties"],
                [14, "Modifications"],
                [15, "Termination"],
                [16, "Governing Law"],
                [17, "General"],
                [18, "Contact"],
              ] : [
                [1, "Aceptación"],
                [2, "Servicio"],
                [3, "Cuentas"],
                [4, "Pagos"],
                [5, "Disclaimer IA"],
                [6, "Empleo"],
                [7, "Propiedad Int."],
                [8, "Privacidad"],
                [9, "Uso Aceptable"],
                [10, "Disponibilidad"],
                [11, "Responsabilidad"],
                [12, "Indemnización"],
                [13, "Terceros"],
                [14, "Modificaciones"],
                [15, "Rescisión"],
                [16, "Ley Aplicable"],
                [17, "General"],
                [18, "Contacto"],
              ]).map(([num, label]) => (
                <a
                  key={num}
                  href={`#terms-${num}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 pl-2 rounded hover:bg-muted/50"
                >
                  <span className="w-4 text-right shrink-0 text-primary/60 font-medium">{num}.</span>
                  <span className="truncate">{label}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-[680px] space-y-2">

          {locale === "en" ? (
            <>
              {/* Intro */}
              <div className="rounded-xl border bg-card p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  These Terms and Conditions govern the use of <strong className="text-foreground">ReadyCV</strong>, available at{" "}
                  <strong className="text-foreground">www.readycvv.com</strong> (the &quot;Platform&quot; or &quot;Service&quot;), operated by{" "}
                  <strong className="text-foreground">MS Saravia Tech Stack LLC</strong> (&quot;the Company&quot;, &quot;we&quot; or &quot;our&quot;).
                  By accessing or using the Platform, you (&quot;User&quot;) agree to be legally bound by these Terms.
                </p>
              </div>

              {/* Section */}
              <section id="terms-1" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using ReadyCV you agree to these Terms and Conditions, our Privacy Policy, and any
                  other policy published on the Platform. If you do not agree, you must stop using the Service.{" "}
                  <strong className="text-foreground">Continued use after any updates constitutes acceptance of the revised Terms.</strong>
                </p>
              </section>

              <section id="terms-2" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  Description of Service
                </h2>
                <p className="text-muted-foreground">ReadyCV allows users to:</p>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    "Create, edit and manage resumes using pre-designed templates.",
                    "Generate personalized cover letters.",
                    "Export documents in PDF and Word (.docx) formats.",
                    "Obtain ATS compatibility analysis against job descriptions.",
                    "Share resumes publicly via a unique link.",
                    "Access AI-powered features to improve resume content.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground pt-1">
                  The Service is offered via a <strong className="text-foreground">Pro Plan</strong> subscription (advanced and AI features).
                </p>
              </section>

              <section id="terms-3" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  User Accounts
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users must be <strong className="text-foreground">at least 16 years old</strong> to register. You are solely responsible for maintaining the
                  confidentiality of your credentials and all activity under your account. Notify us immediately of any
                  unauthorized access at <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.{" "}
                  MS Saravia Tech Stack LLC reserves the right to suspend or terminate accounts that violate these Terms.
                </p>
              </section>

              <section id="terms-4" className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                  Plans, Payments &amp; Subscriptions
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 border p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Monthly</p>
                    <p className="text-2xl font-bold">$15.00<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <p className="text-xs text-primary uppercase tracking-wide font-medium mb-1">Annual · Save 20%</p>
                    <p className="text-2xl font-bold">$144.00<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">≈ $12.00/month</p>
                  </div>
                </div>

                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>
                    Payments are processed by <strong className="text-foreground">Stripe</strong>. MS Saravia Tech Stack LLC does not store credit or
                    debit card data. Subscriptions renew <strong className="text-foreground">automatically</strong> at the end of each billing period
                    unless cancelled beforehand. A renewal reminder will be sent at least 48 hours in advance.
                  </p>
                  <div className="rounded-lg bg-muted/40 border p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">Cancellation:</strong> You may cancel at any time from your account settings. Pro access continues until the end of the current billing period.</p>
                    <p>
                      <strong className="text-foreground">Refund Policy:</strong> ReadyCV does not offer refunds for partial billing periods, except in
                      these exceptional cases: (a) verified double-charge due to technical error; (b) charge processed after
                      a confirmed cancellation; (c) material service failure preventing use of contracted features for more
                      than 72 consecutive hours. Refund requests must be submitted to{" "}
                      <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a> within 7 calendar days of the charge.
                    </p>
                    <p><strong className="text-foreground">Price changes</strong> will be notified at least 30 days in advance by email.</p>
                  </div>
                </div>
              </section>

              {/* AI Disclaimer — highlighted */}
              <section id="terms-5" className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">5</span>
                  Artificial Intelligence — Disclaimer
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV integrates third-party AI models (including, without limitation, OpenAI and Anthropic models)
                  to power features such as bullet improvement, professional summary generation, ATS scoring, cover
                  letter generation, and skill suggestions.
                </p>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-background p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">The User expressly acknowledges and agrees that:</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      AI-generated results are <strong className="text-foreground">automatic suggestions only</strong> and do not constitute professional advice of any kind.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      AI models may produce <strong className="text-foreground">inaccurate, incomplete, outdated or contextually inappropriate</strong> results,
                      including <strong className="text-foreground">&quot;hallucinations&quot;</strong> — content entirely fabricated by the model with no basis in reality.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      The User is <strong className="text-foreground">solely responsible</strong> for reviewing, validating and correcting all AI-generated content before use.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <strong className="text-foreground">MS Saravia Tech Stack LLC does not guarantee that using AI features will improve the chances of
                      obtaining interviews, passing ATS filters, receiving job offers, or achieving any other employment outcome.</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      The ATS score is an <strong className="text-foreground">orientative estimate</strong> based on text analysis and does not replicate the proprietary criteria of real ATS systems.
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  The User is the <strong className="text-foreground">sole and exclusive owner of the final content</strong> of any document created
                  via ReadyCV and bears full responsibility for its accuracy, truthfulness and legality.
                </p>
              </section>

              {/* Employment disclaimer — highlighted */}
              <section id="terms-6" className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">6</span>
                  No Guarantee of Employment Outcomes
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">MS Saravia Tech Stack LLC does not guarantee, expressly or implicitly, that use of the Platform will
                  lead to employment, job interviews, promotions, salary increases or any other favorable career outcome.</strong>{" "}
                  Hiring decisions depend on factors entirely outside ReadyCV&apos;s control, including employer
                  discretion, labor market conditions, candidate qualifications, and the proprietary evaluation criteria
                  of each organization. The User accepts that MS Saravia Tech Stack LLC shall not be held liable for
                  any negative result arising directly or indirectly from a job search, regardless of Platform use.
                </p>
              </section>

              <section id="terms-7" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
                  Intellectual Property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Content entered by the User (personal data, work history, education, skills, texts) remains the
                  <strong className="text-foreground"> exclusive property of the User</strong>. By using the Service, the User grants MS Saravia
                  Tech Stack LLC a <strong className="text-foreground">non-exclusive, worldwide, royalty-free, revocable license</strong> to store,
                  process and transmit that content solely for the purpose of providing the Service, including sending
                  relevant text to third-party AI providers to generate requested suggestions. This license terminates
                  when the User deletes their account, subject to a maximum 90-day backup retention period.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The Platform, its design, source code, templates, algorithms, trademarks and logos are the exclusive
                  property of MS Saravia Tech Stack LLC or its licensors. <strong className="text-foreground">Reverse engineering, decompilation or
                  unauthorized reproduction is strictly prohibited.</strong>
                </p>
              </section>

              <section id="terms-8" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">8</span>
                  Personal Data &amp; Privacy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV collects and processes personal data in accordance with our{" "}
                  <a href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</a>. When AI features are used, the relevant CV text is sent to
                  third-party AI provider servers. ReadyCV does not transmit additional identity data beyond the text
                  required to generate the requested suggestion.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  When the User enables the public resume link, the resume content becomes publicly accessible to anyone
                  with that link. The User is responsible for deciding what personal information to include in a public
                  resume. <strong className="text-foreground">The public link can be disabled at any time from the editor.</strong>
                </p>
              </section>

              <section id="terms-9" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">9</span>
                  Acceptable Use Policy
                </h2>
                <p className="text-muted-foreground">The User agrees not to use ReadyCV to:</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {[
                    "Create documents containing false, fraudulent or misleading information to deceive employers or third parties.",
                    "Impersonate another person.",
                    "Upload, transmit or store illegal, defamatory, obscene, threatening content or content that infringes third-party rights.",
                    "Attempt unauthorized access to ReadyCV systems, servers or other users' data.",
                    "Reverse-engineer, decompile or extract the Platform's source code.",
                    "Use bots, scrapers or other automated means to access the Service without express consent.",
                    "Resell, sublicense or commercialize the Service without written authorization from MS Saravia Tech Stack LLC.",
                    "Deliberately overload the Service infrastructure.",
                    "Use AI features to generate content that promotes discrimination, violence, or illegal activities.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground pt-1">
                  Violations may result in <strong className="text-foreground">immediate account suspension or termination without refund</strong>.
                </p>
              </section>

              <section id="terms-10" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">10</span>
                  Service Availability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  MS Saravia Tech Stack LLC does not guarantee uninterrupted or error-free service availability. Maintenance,
                  updates or modifications may be performed at any time. The Company shall not be liable for losses
                  caused by service interruptions, provided these are not the result of gross negligence or willful misconduct.
                </p>
              </section>

              <section id="terms-11" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">11</span>
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground text-sm">To the maximum extent permitted by applicable law:</p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    ReadyCV is provided <strong className="text-foreground">&quot;as is&quot;</strong> and <strong className="text-foreground">&quot;as available&quot;</strong>,
                    without warranties of any kind.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    MS Saravia Tech Stack LLC shall not be liable for any indirect, incidental, special, consequential or
                    punitive damages, including loss of data, revenue, employment opportunities or reputational harm.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Total maximum liability shall not exceed the <strong className="text-foreground">total amount paid by the User in the 3 months prior</strong> to
                    the claim, or <strong className="text-foreground">USD $45.00</strong>, whichever is greater.
                  </li>
                </ul>
              </section>

              <section id="terms-12" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">12</span>
                  Indemnification
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The User agrees to defend, indemnify and hold harmless MS Saravia Tech Stack LLC, its directors,
                  employees, agents and licensors from any claims, damages, losses, costs and expenses (including
                  reasonable legal fees) arising from: (a) use of the Service in violation of these Terms; (b) User
                  content uploaded or shared via the Platform; (c) infringement of third-party rights; (d) false or
                  misleading statements made through the Service.
                </p>
              </section>

              <section id="terms-13" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">13</span>
                  Third-Party Services
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV integrates with <strong className="text-foreground">Stripe</strong> (payments), <strong className="text-foreground">OpenAI</strong> and <strong className="text-foreground">Anthropic</strong> (AI), and cloud infrastructure
                  providers. MS Saravia Tech Stack LLC is not responsible for the practices, policies, interruptions or
                  errors of these third parties. Use of integrated services is subject to each provider&apos;s own terms.
                </p>
              </section>

              <section id="terms-14" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">14</span>
                  Modifications to Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  MS Saravia Tech Stack LLC may modify these Terms at any time. Material changes will be notified by
                  email at least <strong className="text-foreground">15 days in advance</strong> and via a notice on the Platform. Continued use
                  after the effective date constitutes acceptance.
                </p>
              </section>

              <section id="terms-15" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">15</span>
                  Termination
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users may cancel their account at any time from profile settings. MS Saravia Tech Stack LLC may suspend
                  or terminate access for violations of these Terms, abusive conduct, non-payment or operational/legal
                  reasons. Upon cancellation, the User will lose access to stored data. All data will be deleted within{" "}
                  <strong className="text-foreground">90 days</strong> of account cancellation, subject to legal retention obligations.
                </p>
              </section>

              <section id="terms-16" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">16</span>
                  Governing Law &amp; Dispute Resolution
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of the State of <strong className="text-foreground">Florida, United States</strong>. The
                  parties agree to first attempt amicable resolution by contacting{" "}
                  <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>. If not resolved within 30 days,
                  disputes shall be submitted to the exclusive jurisdiction of the competent courts of{" "}
                  <strong className="text-foreground">Florida, United States</strong>. To the extent permitted by law, the User waives the right to
                  participate in class-action lawsuits against MS Saravia Tech Stack LLC.
                </p>
              </section>

              <section id="terms-17" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">17</span>
                  General Provisions
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms, together with the Privacy Policy and any additional policies published on the Platform,
                  constitute the entire agreement between the User and MS Saravia Tech Stack LLC regarding the Service.
                  If any provision is found invalid or unenforceable, the remaining provisions continue in full force.
                  Failure to exercise any right does not constitute a waiver. In case of discrepancy between language
                  versions, the <strong className="text-foreground">Spanish version prevails</strong>.
                </p>
              </section>

              {/* Contact card */}
              <section id="terms-18" className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">18</span>
                  Contact
                </h2>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">MS Saravia Tech Stack LLC</strong> — ReadyCV</p>
                  <p>Website: <a href="https://www.readycvv.com" className="text-primary underline underline-offset-4">www.readycvv.com</a></p>
                  <p>Email: <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a></p>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Intro ES */}
              <div className="rounded-xl border bg-card p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Los presentes Términos y Condiciones rigen el uso de <strong className="text-foreground">ReadyCV</strong>, disponible en{" "}
                  <strong className="text-foreground">www.readycvv.com</strong> (la &quot;Plataforma&quot; o el &quot;Servicio&quot;), operado por{" "}
                  <strong className="text-foreground">MS Saravia Tech Stack LLC</strong> (&quot;la Empresa&quot;, &quot;nosotros&quot; o
                  &quot;nuestro&quot;). Al acceder o utilizar la Plataforma, usted (&quot;el Usuario&quot;) acepta quedar
                  legalmente vinculado por estos Términos.
                </p>
              </div>

              <section id="terms-1" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  Aceptación de los Términos
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Al acceder o utilizar ReadyCV, usted acepta estos Términos y Condiciones, nuestra Política de
                  Privacidad y cualquier otra política publicada en la Plataforma. Si no está de acuerdo, debe dejar de
                  utilizar el Servicio.{" "}
                  <strong className="text-foreground">El uso continuado tras cualquier actualización constituye aceptación de los Términos revisados.</strong>
                </p>
              </section>

              <section id="terms-2" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  Descripción del Servicio
                </h2>
                <p className="text-muted-foreground">ReadyCV permite a los Usuarios:</p>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    "Crear, editar y gestionar currículums vitae (CVs) utilizando plantillas prediseñadas.",
                    "Generar cartas de presentación personalizadas.",
                    "Exportar documentos en formato PDF y Word (.docx).",
                    "Obtener análisis de compatibilidad ATS comparando el CV con descripciones de puestos de trabajo.",
                    "Compartir CVs de forma pública mediante un enlace único.",
                    "Acceder a funcionalidades potenciadas por inteligencia artificial para mejorar el contenido del CV.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground pt-1">
                  El Servicio se ofrece mediante una suscripción <strong className="text-foreground">Plan Pro</strong> (funcionalidades avanzadas e IA).
                </p>
              </section>

              <section id="terms-3" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  Cuentas de Usuario
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para registrarse debe ser <strong className="text-foreground">mayor de 16 años</strong>. El Usuario es el único responsable de mantener la
                  confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.
                  Notifique de inmediato cualquier uso no autorizado a{" "}
                  <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a>.{" "}
                  MS Saravia Tech Stack LLC se reserva el derecho de suspender o cancelar cuentas que violen estos Términos.
                </p>
              </section>

              <section id="terms-4" className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                  Planes, Pagos y Suscripciones
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 border p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Mensual</p>
                    <p className="text-2xl font-bold">$15,00<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <p className="text-xs text-primary uppercase tracking-wide font-medium mb-1">Anual · Ahorra 20%</p>
                    <p className="text-2xl font-bold">$144,00<span className="text-sm font-normal text-muted-foreground">/año</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">≈ $12,00/mes</p>
                  </div>
                </div>

                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>
                    Los pagos se procesan a través de <strong className="text-foreground">Stripe</strong>. MS Saravia Tech Stack LLC no almacena datos
                    de tarjetas de crédito o débito. Las suscripciones se renuevan <strong className="text-foreground">automáticamente</strong> al
                    final de cada período facturado salvo que el Usuario cancele antes. Se enviará un recordatorio de
                    renovación con al menos 48 horas de anticipación.
                  </p>
                  <div className="rounded-lg bg-muted/40 border p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">Cancelación:</strong> El Usuario puede cancelar en cualquier momento desde la configuración de su cuenta. El acceso Pro se mantiene hasta el fin del período de facturación vigente.</p>
                    <p>
                      <strong className="text-foreground">Política de reembolsos:</strong> ReadyCV no ofrece reembolsos por períodos parciales ya
                      facturados, salvo en los siguientes casos excepcionales: (a) doble cobro por error técnico
                      comprobable; (b) cobro realizado después de una cancelación debidamente procesada; (c) incumplimiento
                      material del Servicio que impida utilizar las funcionalidades contratadas durante más de 72 horas
                      consecutivas. Las solicitudes deben enviarse a{" "}
                      <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a> dentro de los 7 días calendario siguientes al cargo.
                    </p>
                    <p><strong className="text-foreground">Cambios de precio</strong> se notificarán con al menos 30 días de anticipación por correo electrónico.</p>
                  </div>
                </div>
              </section>

              {/* IA Disclaimer ES */}
              <section id="terms-5" className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">5</span>
                  Inteligencia Artificial — Descargo de Responsabilidad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV integra modelos de inteligencia artificial de terceros (incluyendo, sin limitación, modelos de
                  OpenAI y Anthropic) para ofrecer funcionalidades como mejora de bullets de experiencia, generación de
                  resúmenes profesionales, análisis ATS, generación de cartas de presentación y sugerencias de habilidades.
                </p>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-background p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">El Usuario reconoce y acepta expresamente que:</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      Los resultados generados por las funciones de IA son <strong className="text-foreground">sugerencias automáticas</strong> y no constituyen asesoría profesional de ningún tipo.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      Los modelos de IA pueden producir resultados <strong className="text-foreground">inexactos, incompletos, desactualizados o inadecuados</strong>,
                      incluyendo <strong className="text-foreground">&quot;alucinaciones&quot;</strong> — contenido completamente inventado por el modelo sin base en la realidad.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      Es <strong className="text-foreground">responsabilidad exclusiva del Usuario</strong> revisar, validar y corregir todo contenido generado por IA antes de utilizarlo.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <strong className="text-foreground">MS Saravia Tech Stack LLC no garantiza que el uso de las funciones de IA mejore las probabilidades
                      de obtener entrevistas, pasar filtros ATS, recibir ofertas laborales o alcanzar cualquier otro resultado en el proceso de búsqueda de empleo.</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      La puntuación ATS es una <strong className="text-foreground">estimación orientativa</strong> basada en el análisis del texto y no replica los criterios propietarios de sistemas ATS reales.
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  El Usuario es el <strong className="text-foreground">único y exclusivo responsable del contenido final</strong> de su CV, carta de
                  presentación y cualquier otro documento creado mediante ReadyCV.
                </p>
              </section>

              {/* Resultados laborales ES */}
              <section id="terms-6" className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">6</span>
                  Exoneración de Responsabilidad por Resultados Laborales
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">MS Saravia Tech Stack LLC no garantiza, ni implícita ni explícitamente, que el uso de la Plataforma
                  conduzca a la obtención de empleo, entrevistas de trabajo, promociones, aumentos salariales u otros
                  resultados laborales favorables.</strong>{" "}
                  El proceso de selección laboral depende de múltiples factores fuera del control de ReadyCV, incluyendo
                  las decisiones autónomas de empleadores y reclutadores, las condiciones del mercado laboral, el perfil
                  del candidato y los criterios propietarios de los sistemas de evaluación de cada empresa. El Usuario
                  acepta que MS Saravia Tech Stack LLC no podrá ser considerado responsable por ningún resultado negativo
                  derivado de la búsqueda de empleo.
                </p>
              </section>

              <section id="terms-7" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
                  Propiedad Intelectual
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El contenido que el Usuario ingresa en ReadyCV (datos personales, experiencia laboral, formación,
                  habilidades, textos) es y permanece de <strong className="text-foreground">propiedad exclusiva del Usuario</strong>. Al usar el
                  Servicio, el Usuario otorga a MS Saravia Tech Stack LLC una{" "}
                  <strong className="text-foreground">licencia no exclusiva, mundial, libre de regalías y revocable</strong> para almacenar,
                  procesar y transmitir dicho contenido únicamente para prestar el Servicio. Esta licencia se
                  extingue al eliminar la cuenta, sujeto a un período de retención de máximo 90 días.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La Plataforma, su diseño, código fuente, plantillas, algoritmos, marcas y logotipos son propiedad
                  exclusiva de MS Saravia Tech Stack LLC o sus licenciantes. <strong className="text-foreground">Queda prohibida su reproducción,
                  distribución o ingeniería inversa sin autorización expresa y por escrito.</strong>
                </p>
              </section>

              <section id="terms-8" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">8</span>
                  Datos Personales y Privacidad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV recopila y trata datos personales conforme a nuestra{" "}
                  <a href="/privacy" className="text-primary underline underline-offset-4">Política de Privacidad</a>. Cuando el Usuario utiliza las funciones de IA, el texto
                  relevante del CV es enviado a los servidores de los proveedores de IA. ReadyCV no transmite
                  información de identidad adicional más allá del texto necesario para generar la sugerencia solicitada.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando el Usuario activa el enlace de CV público, el contenido queda accesible para cualquier persona
                  con dicho enlace. El Usuario es responsable de decidir qué información personal incluir.{" "}
                  <strong className="text-foreground">El enlace puede desactivarse en cualquier momento desde el editor.</strong>
                </p>
              </section>

              <section id="terms-9" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">9</span>
                  Política de Uso Aceptable
                </h2>
                <p className="text-muted-foreground text-sm">El Usuario se compromete a no utilizar ReadyCV para:</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {[
                    "Crear documentos con información falsa, fraudulenta o engañosa para defraudar a empleadores o terceros.",
                    "Suplantar la identidad de otra persona.",
                    "Cargar, transmitir o almacenar contenido ilegal, difamatorio, obsceno, amenazante o que infrinja derechos de terceros.",
                    "Intentar acceder sin autorización a los sistemas, servidores o datos de ReadyCV o de otros usuarios.",
                    "Realizar ingeniería inversa, descompilar o extraer el código fuente de la Plataforma.",
                    "Utilizar bots, scrapers u otros medios automatizados sin consentimiento expreso.",
                    "Revender, sublicenciar o comercializar el Servicio sin autorización escrita de MS Saravia Tech Stack LLC.",
                    "Sobrecargar deliberadamente la infraestructura del Servicio.",
                    "Usar las funciones de IA para generar contenido que promueva discriminación, violencia o actividades ilegales.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground pt-1">
                  El incumplimiento podrá resultar en la <strong className="text-foreground">suspensión o cancelación inmediata de la cuenta sin reembolso</strong>.
                </p>
              </section>

              <section id="terms-10" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">10</span>
                  Disponibilidad del Servicio
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  MS Saravia Tech Stack LLC no garantiza que el Servicio esté disponible de forma ininterrumpida o libre
                  de errores. Podemos realizar tareas de mantenimiento o actualizaciones en cualquier momento. La
                  Empresa no será responsable por pérdidas causadas por interrupciones del servicio, salvo que sean
                  resultado de negligencia grave o dolo.
                </p>
              </section>

              <section id="terms-11" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">11</span>
                  Limitación de Responsabilidad
                </h2>
                <p className="text-muted-foreground text-sm">En la máxima medida permitida por la ley aplicable:</p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    ReadyCV se proporciona <strong className="text-foreground">&quot;tal cual&quot; (as is)</strong> y <strong className="text-foreground">&quot;según disponibilidad&quot;</strong>, sin garantías de ningún tipo.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    MS Saravia Tech Stack LLC no será responsable por daños indirectos, incidentales, especiales,
                    consecuentes o punitivos, incluyendo pérdida de datos, ingresos, oportunidades laborales o daño reputacional.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    La responsabilidad total máxima no excederá el <strong className="text-foreground">monto total pagado en los 3 meses anteriores</strong> al evento,
                    o <strong className="text-foreground">USD $45,00</strong>, lo que resulte mayor.
                  </li>
                </ul>
              </section>

              <section id="terms-12" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">12</span>
                  Indemnización
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El Usuario se compromete a defender, indemnizar y mantener indemne a MS Saravia Tech Stack LLC, sus
                  directores, empleados, agentes y licenciantes frente a cualquier reclamación, daño, costo y gasto
                  (incluyendo honorarios legales razonables) que surjan de: (a) uso del Servicio en violación de estos
                  Términos; (b) contenido cargado o compartido mediante la Plataforma; (c) violación de derechos de
                  terceros; (d) declaraciones falsas o engañosas realizadas a través del Servicio.
                </p>
              </section>

              <section id="terms-13" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">13</span>
                  Servicios de Terceros
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ReadyCV se integra con <strong className="text-foreground">Stripe</strong> (pagos), <strong className="text-foreground">OpenAI</strong> y <strong className="text-foreground">Anthropic</strong> (IA) y proveedores de infraestructura en la
                  nube. MS Saravia Tech Stack LLC no controla ni se hace responsable por las prácticas, políticas,
                  interrupciones o errores de dichos terceros. El uso de estos servicios está sujeto a los propios
                  términos de cada proveedor.
                </p>
              </section>

              <section id="terms-14" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">14</span>
                  Modificaciones a los Términos
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  MS Saravia Tech Stack LLC se reserva el derecho de modificar estos Términos en cualquier momento.
                  Los cambios materiales serán notificados por correo electrónico con al menos{" "}
                  <strong className="text-foreground">15 días de anticipación</strong> y mediante aviso en la Plataforma. El uso continuado tras la
                  fecha efectiva constituye aceptación de los cambios.
                </p>
              </section>

              <section id="terms-15" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">15</span>
                  Terminación
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El Usuario puede cancelar su cuenta en cualquier momento desde la configuración de su perfil.
                  MS Saravia Tech Stack LLC puede suspender o cancelar el acceso por violación de estos Términos,
                  conducta abusiva, impago o razones operativas o legales. Tras la cancelación, el Usuario perderá
                  acceso a todos sus datos almacenados. ReadyCV eliminará los datos en un plazo máximo de{" "}
                  <strong className="text-foreground">90 días</strong> desde la cancelación, salvo obligación legal de retención.
                </p>
              </section>

              <section id="terms-16" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">16</span>
                  Ley Aplicable y Resolución de Disputas
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estos Términos se rigen por las leyes del Estado de <strong className="text-foreground">Florida, Estados Unidos</strong>. Las
                  partes se comprometen a intentar resolver cualquier disputa de forma amigable contactando a{" "}
                  <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a> en primera instancia. Si no se alcanza
                  solución en 30 días, la disputa se someterá a la jurisdicción exclusiva de los tribunales competentes
                  de <strong className="text-foreground">Florida, Estados Unidos</strong>. En la medida permitida por la ley, el Usuario renuncia a
                  participar como demandante o miembro en acciones colectivas contra MS Saravia Tech Stack LLC.
                </p>
              </section>

              <section id="terms-17" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">17</span>
                  Disposiciones Generales
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estos Términos, junto con la Política de Privacidad y cualquier política adicional publicada en la
                  Plataforma, constituyen el acuerdo completo entre el Usuario y MS Saravia Tech Stack LLC respecto al
                  Servicio. Si alguna disposición fuera declarada inválida, las restantes continuarán en plena vigencia.
                  El hecho de no ejercer algún derecho no constituye renuncia al mismo. En caso de discrepancia entre
                  versiones de idioma, <strong className="text-foreground">prevalecerá la versión en español</strong>.
                </p>
              </section>

              {/* Contacto ES */}
              <section id="terms-18" className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">18</span>
                  Contacto
                </h2>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">MS Saravia Tech Stack LLC</strong> — ReadyCV</p>
                  <p>Sitio web: <a href="https://www.readycvv.com" className="text-primary underline underline-offset-4">www.readycvv.com</a></p>
                  <p>Correo: <a href="mailto:soporte@readycvv.com" className="text-primary underline underline-offset-4">soporte@readycvv.com</a></p>
                </div>
              </section>
            </>
          )}
          </div>{/* end content column */}
          </div>{/* end flex */}
        </div>
      </main>
      <Footer />
    </div>
  )
}
