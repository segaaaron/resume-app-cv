"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { clearSessionToken } from "@/lib/actions/logout"
import { toast } from "sonner"
import { FileText, Mail, Briefcase, Settings, LogOut, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
  isPro?: boolean
}

export default function DashboardNav({ user, isPro = false }: Props) {
  const pathname = usePathname()
  const t = useTranslations("dashboard.nav")
  const locale = useLocale()

  const tabs = [
    { label: t("cvs"),     href: `/${locale}/dashboard/resumes`,       icon: FileText,  proOnly: false },
    { label: t("letters"), href: `/${locale}/dashboard/cover-letters`, icon: Mail,      proOnly: false },
    { label: t("jobs"),    href: `/${locale}/dashboard/applications`,  icon: Briefcase, proOnly: true  },
    ...(user.role === "SUPER_ADMIN"
      ? [{ label: t("admin"), href: `/${locale}/dashboard/admin`, icon: Shield, proOnly: false }]
      : []),
  ]

  const isActive = (href: string) => {
    const segment = href.split("/dashboard/")[1]
    return pathname.includes(`/dashboard/${segment}`)
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U"

  return (
    <aside className="hidden md:flex md:w-16 lg:w-56 shrink-0 h-full flex-col bg-gradient-to-b from-blue-700 to-indigo-800 transition-all duration-200">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-3 lg:px-4 border-b border-white/10 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <Link href={`/${locale}`} className="font-bold text-white hidden lg:block truncate">
          ReadyCV
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {tabs.map(({ label, href, icon: Icon, proOnly }) => {
          const locked = proOnly && !isPro
          if (locked) {
            return (
              <span
                key={href}
                title={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 opacity-40 cursor-not-allowed select-none"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:block">{label}</span>
              </span>
            )
          }
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-2 lg:p-3 space-y-1 shrink-0">
        <Link
          href={`/${locale}/dashboard/settings`}
          title={t("settings")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="hidden lg:block">{t("settings")}</span>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger
            title={t("logout")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">{t("logout")}</span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logout_confirm_title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logout_confirm_desc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("logout_cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                const result = await clearSessionToken()
                if (!result.ok) toast.error(t("logout_error"))
                signOut({ callbackUrl: `/${locale}` })
              }}>
                {t("logout_confirm_action")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Avatar + name */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name ?? user.email}</p>
            {isPro && (
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">
                PRO
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
