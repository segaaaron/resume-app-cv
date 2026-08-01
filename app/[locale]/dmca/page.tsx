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
  const t = await getTranslations({ locale, namespace: "dmca" })
  return {
    title: t("meta_title"),
    alternates: {
      canonical: `https://valhallaresume.com/${locale}/dmca`,
      languages: {
        es: "https://valhallaresume.com/es/dmca",
        en: "https://valhallaresume.com/en/dmca",
        "x-default": "https://valhallaresume.com/en/dmca",
      },
    },
  }
}

export default async function DmcaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "dmca" })

  const copyrightEmail = "techstackmssaravia@gmail.com"

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1>{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("last_updated")}</p>

          <p>{t("intro")}</p>

          <h2>{t("s1_title")}</h2>
          <p>
            {t("s1_intro_pre")}
            <a href={`mailto:${copyrightEmail}`}>{copyrightEmail}</a>
            {t("s1_intro_post")}
          </p>
          <ol>
            <li>
              <strong>{t("s1_i1_label")}</strong> {t("s1_i1")}
            </li>
            <li>
              <strong>{t("s1_i2_label")}</strong> {t("s1_i2")}
            </li>
            <li>
              <strong>{t("s1_i3_label")}</strong> {t("s1_i3")}
            </li>
            <li>
              <strong>{t("s1_i4_label")}</strong> {t("s1_i4")}
            </li>
            <li>
              <strong>{t("s1_i5_label")}</strong> {t("s1_i5")}
            </li>
            <li>
              <strong>{t("s1_i6_label")}</strong> {t("s1_i6")}
            </li>
          </ol>
          <p>{t("s1_outro")}</p>

          <h2>{t("s2_title")}</h2>
          <p>
            {t("s2_intro_pre")}
            <a href={`mailto:${copyrightEmail}`}>{copyrightEmail}</a>
            {t("s2_intro_post")}
          </p>
          <ol>
            <li>{t("s2_i1")}</li>
            <li>{t("s2_i2")}</li>
            <li>{t("s2_i3")}</li>
            <li>{t("s2_i4")}</li>
          </ol>
          <p>{t("s2_outro")}</p>

          <h2>{t("s3_title")}</h2>
          <p>{t("s3_body")}</p>

          <h2>{t("s4_title")}</h2>
          <p>
            {t("s4_pre")}
            <a href={`mailto:${copyrightEmail}`}>{copyrightEmail}</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
