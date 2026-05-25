import { getTranslations } from "next-intl/server"
import GuideStepsGrid from "./GuideStepsGrid"

export default async function GuideSteps({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.steps" })

  const steps = [
    { num: "01", title: t("step1_title"), desc: t("step1_desc") },
    { num: "02", title: t("step2_title"), desc: t("step2_desc") },
    { num: "03", title: t("step3_title"), desc: t("step3_desc") },
    { num: "04", title: t("step4_title"), desc: t("step4_desc") },
  ]

  return <GuideStepsGrid steps={steps} title={t("title")} />
}
