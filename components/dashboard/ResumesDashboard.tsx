"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { Plus, FileText, Pencil, Trash2, Download, Copy, MoreHorizontal, PartyPopper, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ImportResumeButton from "./ImportResumeButton"
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
import { TEMPLATES } from "@/types/resume"

interface ResumeCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  updatedAt: Date
  createdAt: Date
}

export default function ResumesDashboard({ initialResumes }: { initialResumes: ResumeCard[] }) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const router = useRouter()
  const searchParams = useSearchParams()
  const [resumes, setResumes] = useState(initialResumes)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradeBanner(true)
      // Clean URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete("upgraded")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  async function createResume() {
    setCreating(true)
    try {
      const res = await fetch("/api/resumes", { method: "POST" })
      if (!res.ok) { toast.error(t("create_error")); return }
      const data = await res.json()
      router.push(`/${locale}/editor/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
    }
  }

  async function deleteResume(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" })
    setResumes((prev) => prev.filter((r) => r.id !== id))
    setDeleteId(null)
    toast.success(t("delete_success"))
  }

  async function duplicateResume(id: string) {
    const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" })
    if (res.ok) {
      const copy = await res.json()
      setResumes((prev) => [copy, ...prev])
      toast.success(t("duplicate_success"))
    }
  }

  async function downloadPdf(resume: ResumeCard) {
    try {
      const res = await fetch(`/api/resumes/${resume.id}/pdf?locale=${locale}`)
      if (!res.ok) { toast.error(t("pdf_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${resume.title || "resume"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("pdf_error"))
    }
  }

  const templateName = (id: string) =>
    TEMPLATES.find((tmpl) => tmpl.id === id)?.name ?? t("default_template")

  return (
    <div>
      {showUpgradeBanner && (
        <div className="flex items-center justify-between bg-primary text-white rounded-2xl px-5 py-4 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{t("welcome_pro_title")}</p>
              <p className="text-xs text-white/80">{t("welcome_pro_subtitle")}</p>
            </div>
          </div>
          <button onClick={() => setShowUpgradeBanner(false)} className="p-1 rounded hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {resumes.length} {resumes.length === 1 ? t("count_one") : t("count_other")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportResumeButton />
          <Button onClick={createResume} disabled={creating} className="gap-2 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-[#eaf3fc] flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("empty_title")}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{t("empty_subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={createResume} disabled={creating} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("create_from_scratch")}
            </Button>
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <ImportResumeButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <button
            onClick={createResume}
            disabled={creating}
            className="aspect-[3/4] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors group"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{t("new")}</span>
          </button>

          {resumes.map((resume) => (
            <div key={resume.id} className="group relative">
              <Link href={`/${locale}/editor/${resume.id}`} className="block">
                <div className="aspect-[3/4] bg-white border-2 border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="h-10 w-full" style={{ backgroundColor: resume.colorScheme }} />
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2 mb-4" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1.5 bg-gray-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                    ))}
                  </div>
                </div>
              </Link>

              <div className="mt-2 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{resume.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {templateName(resume.templateId)} · {format(new Date(resume.updatedAt), "d MMM yyyy", { locale: dateLocale })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="gap-2" onClick={() => router.push(`/${locale}/editor/${resume.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => duplicateResume(resume.id)}>
                      <Copy className="h-3.5 w-3.5" /> {t("duplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => downloadPdf(resume)}>
                      <Download className="h-3.5 w-3.5" /> {t("download_pdf")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                      onClick={() => setDeleteId(resume.id)}
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
              onClick={() => deleteId && deleteResume(deleteId)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
