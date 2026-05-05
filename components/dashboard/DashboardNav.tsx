"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { FileText, Mail, LogOut, ChevronDown, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
}

export default function DashboardNav({ user }: Props) {
  const pathname = usePathname()
  const t = useTranslations("dashboard.nav")
  const locale = useLocale()

  const tabs = [
    { label: t("cvs"),    href: `/${locale}/dashboard/resumes`,       icon: FileText },
    { label: t("letters"), href: `/${locale}/dashboard/cover-letters`, icon: Mail },
    ...(user.role === "SUPER_ADMIN" ? [{ label: t("admin"), href: `/${locale}/dashboard/admin`, icon: Shield }] : []),
  ]

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center min-w-0 flex-1">
          <Link href={`/${locale}`} className="flex items-center gap-1.5 font-bold text-primary mr-3 sm:mr-4 shrink-0">
            <FileText className="h-5 w-5" />
            <span className="hidden sm:block">READY CV</span>
          </Link>

          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                  pathname.startsWith(`/${locale}/dashboard/${href.split("/dashboard/")[1]}`)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden xs:block sm:block">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <LocaleSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 h-9 px-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden md:block max-w-[120px] truncate">{user.name ?? user.email}</span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => window.location.href = `/${locale}/dashboard/settings`}>
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/${locale}/pricing`}>
              {t("upgrade")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={async () => {
                await signOut({ redirect: false })
                window.location.href = `/${locale}`
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
