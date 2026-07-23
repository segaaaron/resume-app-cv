// In-article preview of the ATS Score PRO delivers. Reuses the marketing mockup
// so a reader of any post SEES how the feature looks — a much stronger nudge
// than a text link — then routes to the tool page / PRO. Self-contained server
// component: it fetches its own copy from the tools.atsChecker namespace, so a
// post only needs `<BlogAtsPreview locale={locale} variant="frontend" />`.

import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import AtsFeatureShowcase from "@/components/tools/ats-checker/AtsFeatureShowcase"

export type AtsPreviewVariant = "frontend" | "data"

// Illustrative sample data — the same two profiles the landing shows. Keyword
// labels are language-neutral; the role/window strings come from i18n.
const EXAMPLES: Record<AtsPreviewVariant, {
  score: number
  deltaAfter: number
  subScores: { hardSkills: number; mustHaves: number; title: number; sections: number }
  matched: string[]
  missing: string[]
}> = {
  frontend: {
    score: 87,
    deltaAfter: 8,
    subScores: { hardSkills: 92, mustHaves: 80, title: 100, sections: 100 },
    matched: ["React", "TypeScript", "Node.js", "REST APIs", "CI/CD"],
    missing: ["GraphQL", "AWS"],
  },
  data: {
    score: 71,
    deltaAfter: 19,
    subScores: { hardSkills: 74, mustHaves: 60, title: 80, sections: 100 },
    matched: ["Python", "SQL", "Tableau", "Pandas"],
    missing: ["dbt", "Snowflake", "A/B testing"],
  },
}

export default async function BlogAtsPreview({
  locale,
  variant = "frontend",
}: {
  locale: string
  variant?: AtsPreviewVariant
}) {
  const t = await getTranslations({ locale, namespace: "tools.atsChecker" })

  const labels = {
    scoreCaption: t("showcase.scoreCaption"),
    matched: t("showcase.matched"),
    missing: t("showcase.missing"),
    demonstratedNote: t("showcase.demonstratedNote"),
    templateNote: t("showcase.templateNote"),
    afterFix: t("showcase.afterFix"),
    subScores: {
      hardSkills: t("showcase.subScores.hardSkills"),
      mustHaves: t("showcase.subScores.mustHaves"),
      title: t("showcase.subScores.title"),
      sections: t("showcase.subScores.sections"),
    },
  }

  const data = EXAMPLES[variant] ?? EXAMPLES.frontend
  const example = {
    window: t(`examples.${variant}.window`),
    role: t(`examples.${variant}.role`),
    ...data,
  }

  return (
    <div className="not-prose my-10">
      <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a2e4a]/55">
        {t("examples.badge")}
      </p>
      <AtsFeatureShowcase labels={labels} example={example} />
      <div className="mt-5 text-center">
        <Link
          href={`/${locale}/tools/ats-checker`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f6f8f] underline-offset-4 hover:underline"
        >
          {t("primaryCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
