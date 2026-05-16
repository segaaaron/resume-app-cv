"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, Mail, Briefcase, User } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  isPro?: boolean
}

export default function BottomTabBar({ isPro = false }: Props) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("dashboard.nav")
  const tResumes = useTranslations("dashboard.resumes")
  const router = useRouter()

  const isActive = (segment: string) => pathname.includes(`/dashboard/${segment}`)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* CVs */}
      <Link
        href={`/${locale}/dashboard/resumes`}
        className={cn(
          "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
          isActive("resumes") ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FileText className="h-5 w-5" />
        {t("cvs")}
      </Link>

      {/* Letters */}
      <Link
        href={`/${locale}/dashboard/cover-letters`}
        className={cn(
          "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
          isActive("cover-letters") ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Mail className="h-5 w-5" />
        {t("letters")}
      </Link>

      {/* Jobs — locked if no pro */}
      {isPro ? (
        <Link
          href={`/${locale}/dashboard/applications`}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
            isActive("applications") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Briefcase className="h-5 w-5" />
          {t("jobs")}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            router.push(`/${locale}/pricing`)
            toast.info(tResumes("require_pro_toast"))
          }}
          className="flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium text-muted-foreground opacity-50"
        >
          <Briefcase className="h-5 w-5" />
          {t("jobs")}
        </button>
      )}

      {/* Profile → Settings */}
      <Link
        href={`/${locale}/dashboard/settings`}
        className={cn(
          "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
          isActive("settings") ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="h-5 w-5" />
        {t("profile")}
      </Link>
    </nav>
  )
}
