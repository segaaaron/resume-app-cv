"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { FileText, Mail, Briefcase, Settings, LogOut, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
}

export default function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const t = useTranslations("dashboard.nav")
  const locale = useLocale()

  const tabs = [
    { label: t("cvs"),     href: `/${locale}/dashboard/resumes`,       icon: FileText },
    { label: t("letters"), href: `/${locale}/dashboard/cover-letters`, icon: Mail },
    { label: t("jobs"),    href: `/${locale}/dashboard/applications`,  icon: Briefcase },
    ...(user.role === "SUPER_ADMIN"
      ? [{ label: t("admin"), href: `/${locale}/dashboard/admin`, icon: Shield }]
      : []),
  ]

  const isActive = (href: string) => {
    const segment = href.split("/dashboard/")[1]
    return pathname.includes(`/dashboard/${segment}`)
  }

  return (
    <aside className="w-56 shrink-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <Link href={`/${locale}`} className="font-bold text-foreground">ReadyCV</Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-50 text-primary"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-neutral-100 p-3 space-y-1">
        <Link
          href={`/${locale}/dashboard/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          {t("settings")}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
        <div className="flex items-center gap-2.5 px-3 pt-2 mt-1 border-t border-neutral-100">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs bg-primary text-white">{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
