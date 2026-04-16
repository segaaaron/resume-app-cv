"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { FileText, Mail, Briefcase, Kanban, LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "CVs", href: "/dashboard/resumes", icon: FileText },
  { label: "Cartas", href: "/dashboard/cover-letters", icon: Mail },
  { label: "Empleos", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Candidaturas", href: "/dashboard/applications", icon: Kanban },
]

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export default function DashboardNav({ user }: Props) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-primary mr-2">
            <FileText className="h-5 w-5" />
            CVV Pro
          </Link>

          <nav className="flex">
            {tabs.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                  pathname.startsWith(href)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden sm:block max-w-[120px] truncate">{user.name ?? user.email}</span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => window.location.href = "/dashboard/settings"}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/pricing"}>
              Mejorar plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
