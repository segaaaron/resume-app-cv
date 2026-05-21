import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"

export default function Footer() {
  const t = useTranslations("footer")
  const locale = useLocale()

  const productLinks = [
    { label: t("templates"), href: `/${locale}/templates` },
    { label: t("pricing"), href: `/${locale}/pricing` },
    { label: t("blog"), href: `/${locale}/blog` },
  ]

  const legalLinks = [
    { label: t("privacy"), href: `/${locale}/privacy` },
    { label: t("terms"), href: `/${locale}/terms` },
    { label: t("cookies"), href: `/${locale}/cookie-policy` },
  ]

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-foreground mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="ReadyCVV" width={28} height={28} className="rounded-lg shrink-0" />
              ReadyCVV
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("tagline")}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">{t("product")}</h4>
            <ul className="space-y-3">
              {productLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">{t("legal")}</h4>
            <ul className="space-y-3">
              {legalLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <p className="text-xs text-muted-foreground">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
