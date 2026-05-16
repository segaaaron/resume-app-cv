"use client"

import { Pen, Download, MoreHorizontal, Loader2, Copy, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"
import { ResumeThumbnail } from "@/components/editor/template-switcher/thumbnails"
import { TEMPLATES } from "@/types/resume"
import { formatInTimezone } from "@/hooks/useUserTimezone"
import type { Locale } from "date-fns"

export interface ResumeCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  thumbnailUrl: string | null
  updatedAt: Date
  createdAt: Date
}

interface CVCardProps {
  resume: ResumeCard
  locale: string
  userTimezone: string
  dateLocale: Locale
  isDownloading: boolean
  index: number
  onEdit: () => void
  onRename: () => void
  onDuplicate: () => void
  onDownload: () => void
  onDelete: () => void
}

export default function CVCard({
  resume,
  locale: _locale,
  userTimezone,
  dateLocale,
  isDownloading,
  index,
  onEdit,
  onRename,
  onDuplicate,
  onDownload,
  onDelete,
}: CVCardProps) {
  const t = useTranslations("dashboard.resumes")

  const templateName =
    TEMPLATES.find((tmpl) => tmpl.id === resume.templateId)?.name ?? t("default_template")

  return (
    <div
      className="group relative flex flex-col animate-card-in opacity-0"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border
                   hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5
                   transition-all duration-200 bg-white cursor-pointer"
        onClick={onEdit}
      >
        {resume.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resume.thumbnailUrl}
            alt={resume.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <ResumeThumbnail id={resume.templateId} color={resume.colorScheme} />
        )}

        {/* Template badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium
                        bg-black/40 text-white backdrop-blur-sm">
          {templateName}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-neutral-900/30 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-center justify-center">
          <span className="bg-white text-neutral-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
            {t("edit")}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{resume.title || t("default_template")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatInTimezone(resume.updatedAt, userTimezone, dateLocale)}
          </p>
        </div>

        {/* Quick actions — always visible */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            title={t("edit")}
            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Pen className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            title={t("download_pdf")}
            disabled={isDownloading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onRename}>
                <Pen className="h-3.5 w-3.5" /> {t("rename")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" /> {t("duplicate")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
