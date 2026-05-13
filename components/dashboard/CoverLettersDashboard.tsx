"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { es, enUS } from "date-fns/locale"
import { useUserTimezone, formatInTimezone } from "@/hooks/useUserTimezone"
import { Plus, Mail, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import UpgradeCTACard from "./UpgradeCTACard"
import { isActive } from "@/lib/plans"
import { CoverLetterThumbnail } from "@/components/cover-letter/thumbnails"

interface LetterCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  updatedAt: Date
  createdAt: Date
}

export default function CoverLettersDashboard({ initialLetters }: { initialLetters: LetterCard[] }) {
  const t = useTranslations("dashboard.cover_letters")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const userTimezone = useUserTimezone()
  const router = useRouter()
  const { data: session } = useSession()
  const isPro = isActive(
    session?.user?.plan ?? "UNSUBSCRIBED",
    session?.user?.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session?.user?.subscriptionStatus,
  )
  const [letters, setLetters] = useState(initialLetters)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  function requirePro() {
    router.push(`/${locale}/pricing`)
    toast.info(t("require_pro_toast"))
  }

  async function createLetter() {
    if (!isPro) { requirePro(); return }
    setCreating(true)
    try {
      const res = await fetch("/api/cover-letters", { method: "POST" })
      const data = await res.json()
      router.push(`/${locale}/cover-letter/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
    }
  }

  async function deleteLetter(id: string) {
    const res = await fetch(`/api/cover-letters/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error(t("delete_error"))
      setDeleteId(null)
      return
    }
    setLetters((prev) => prev.filter((l) => l.id !== id))
    setDeleteId(null)
    toast.success(t("delete_success"))
  }

  return (
    <div>
      <UpgradeCTACard />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {letters.length} {letters.length === 1 ? t("count_one") : t("count_other")}
          </p>
        </div>
        <Button onClick={createLetter} disabled={creating || !isPro} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {letters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-[var(--brand-50)] flex items-center justify-center mb-4">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("empty_title")}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{t("empty_subtitle")}</p>
          <Button onClick={createLetter} disabled={creating || !isPro} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <button
            onClick={createLetter}
            disabled={creating || !isPro}
            className="aspect-[3/4] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{t("new")}</span>
          </button>

          {letters.map((letter) => (
            <div key={letter.id} className="group relative">
              <button
                className="aspect-[3/4] w-full bg-white border-2 border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-brand-sm transition-all text-left cursor-pointer flex flex-col relative"
                onClick={() => router.push(`/${locale}/cover-letter/${letter.id}`)}
              >
                <div className="flex-1 overflow-hidden">
                  <CoverLetterThumbnail id={letter.templateId} color={letter.colorScheme} />
                </div>
                <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span className="bg-white text-neutral-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                    {t("edit")}
                  </span>
                </div>
              </button>

              <div className="mt-2 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{letter.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatInTimezone(letter.updatedAt, userTimezone, dateLocale)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="gap-2" onClick={() => router.push(`/${locale}/cover-letter/${letter.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                      onClick={() => setDeleteId(letter.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteLetter(deleteId)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
