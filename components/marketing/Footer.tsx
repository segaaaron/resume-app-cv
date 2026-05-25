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
    <footer className="bg-[#0d1b2e]">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-7">

          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-3 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="ReadyCVV"
                width={26}
                height={26}
                className="rounded-lg shrink-0"
                style={{ boxShadow: "0 2px 10px rgba(0,212,255,0.3)" }}
              />
              <span className="text-white text-[15px] font-extrabold tracking-[-0.01em]">
                ReadyCVV
              </span>
            </Link>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-[.1em] mb-3.5">
              {t("product")}
            </h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {productLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[#94A3B8] text-[13px] no-underline hover:!text-white transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-[.1em] mb-3.5">
              {t("legal")}
            </h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {legalLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[#94A3B8] text-[13px] no-underline hover:!text-white transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between py-3.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[#94A3B8] text-xs">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  )
}
