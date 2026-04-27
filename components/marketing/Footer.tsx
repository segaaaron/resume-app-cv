import Link from "next/link"
import { FileText } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function Footer() {
  const t = await getTranslations("footer")

  const links = {
    [t("tools")]: [
      { label: t("cv_builder"), href: "/dashboard/resumes" },
      { label: t("cover_letter"), href: "/dashboard/cover-letters" },
    ],
    [t("resources")]: [
      { label: t("cv_templates"), href: "/templates" },
    ],
    [t("support")]: [
      { label: "FAQ", href: "/#faq" },
      { label: t("pricing"), href: "/pricing" },
      { label: t("privacy"), href: "/privacy" },
      { label: t("terms"), href: "/terms" },
    ],
  }

  return (
    <footer className="bg-[#1d1d20] text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <FileText className="h-5 w-5 text-primary" />
              READY CV
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              {t("description")}
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© {new Date().getFullYear()} READY CV. {t("rights")}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">{t("privacy")}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
